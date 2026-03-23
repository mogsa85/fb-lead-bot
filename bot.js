const { chromium } = require("playwright");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const sendEmail = require("./mailer");

let replyIndex = 0;

function resolveLocalPath(p) {
  if (!p) return p;
  return path.isAbsolute(p) ? p : path.join(__dirname, p);
}

function loadData() {
  try {
    const dataPath = path.join(__dirname, "data.json");
    return JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch {
    return { groups: [], keywords: [], replies: [] };
  }
}

function loadSeenPosts() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "seenPosts.json"), "utf8");
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSeenPosts(seenPosts) {
  try {
    fs.writeFileSync(
      path.join(__dirname, "seenPosts.json"),
      JSON.stringify(Array.from(seenPosts), null, 2)
    );
  } catch (e) {
    console.log("⚠️ Failed saving seenPosts:", e.message);
  }
}

function normalizeFacebookLink(href) {
  if (!href) return null;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("/")) return `https://facebook.com${href}`;
  return null;
}

function getNextReply(replies) {
  if (!replies.length) return "Hi! I can help 🙂";
  const reply = replies[replyIndex];
  replyIndex = (replyIndex + 1) % replies.length;
  return reply;
}

async function verifyLoggedIn(page) {
  // Best-effort check: if we land on a login page, treat as logged out.
  const url = (page.url() || "").toLowerCase();
  if (url.includes("/login") || url.includes("login.php")) return false;

  const content = (await page.content()).toLowerCase();
  // These strings vary a bit; this is only a heuristic.
  if (content.includes("log in") && content.includes("facebook")) return false;

  return true;
}

async function runBot({ updateStatus, storageStatePath, scanOnce, seenPostsSet } = {}) {
  console.log("🔍 Scanning...");
  const data = loadData();

  const STORAGE = resolveLocalPath(storageStatePath || "storageState.json");
  if (!fs.existsSync(STORAGE)) {
    updateStatus({
      running: false,
      loggedIn: false,
      lastScan: new Date().toLocaleTimeString(),
      postsChecked: 0,
      matchesFound: 0,
      lastError: `Missing ${STORAGE}. Create storageState.json via saveSession.js and upload it to Railway.`
    });
    return { ok: false };
  }

  updateStatus({
    running: true,
    loggedIn: false,
    lastScan: new Date().toLocaleTimeString(),
    groupPostsFound: 0,
    postsChecked: 0,
    matchesFound: 0,
    lastError: null
  });

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });
  } catch (err) {
    updateStatus({ running: false, lastError: `Browser failed: ${err.message}` });
    return { ok: false };
  }

  const context = await browser.newContext({
    storageState: STORAGE
  });

  const page = await context.newPage();

  // Heuristic login verification by landing on Facebook home.
  try {
    await page.goto("https://www.facebook.com/", { waitUntil: "domcontentloaded" });
    const loggedIn = await verifyLoggedIn(page);
    updateStatus({ loggedIn });
    if (!loggedIn) {
      await browser.close();
      updateStatus({ running: false, lastError: "Not logged in. storageState may be expired." });
      return { ok: false };
    }
  } catch (err) {
    await browser.close();
    updateStatus({ running: false, lastError: `Login check failed: ${err.message}` });
    return { ok: false };
  }

  const seenPosts = seenPostsSet || loadSeenPosts();
  let postsChecked = 0;
  let matchesFound = 0;

  try {
    for (const group of data.groups) {
      if (!group) continue;

      updateStatus({ currentGroup: group });
      console.log("📂 Checking:", group);

      let groupUrl = String(group).trim();
      if (!groupUrl.startsWith("http://") && !groupUrl.startsWith("https://")) {
        groupUrl = `https://www.facebook.com/${groupUrl.replace(/^\/+/, "")}`;
      }

      await page.goto(groupUrl, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5000);

      // Scroll a bit so more posts load.
      for (let i = 0; i < 3; i++) {
        await page.mouse.wheel(0, 5000);
        await page.waitForTimeout(1500);
      }

      const posts = await page.$$("[role='article']");
      updateStatus({ groupPostsFound: posts.length });

      for (const post of posts) {
        const text = await post.innerText();
        if (!text) continue;

        postsChecked++;
        updateStatus({ postsChecked });

        const lower = text.toLowerCase();
        const matched = data.keywords.some((k) => lower.includes(String(k).toLowerCase()));
        if (!matched) continue;

        matchesFound++;
        updateStatus({ matchesFound });

        const linkEl = await post.$("a[href*='/posts/']");
        if (!linkEl) continue;

        const href = await linkEl.getAttribute("href");
        const link = normalizeFacebookLink(href);
        if (!link || seenPosts.has(link)) continue;

        seenPosts.add(link);
        saveSeenPosts(seenPosts);

        const reply = getNextReply(data.replies);
        const message = `
🔥 New Lead

"${text.slice(0, 200)}"

Reply:
"${reply}"

${link}
`;

        await sendEmail("🔥 Lead Found", message);
        console.log("📧 Email sent");

        if (scanOnce) break;
      }

      if (scanOnce) break;
    }
  } catch (err) {
    console.log("❌ Bot error:", err.message);
    updateStatus({ lastError: `Bot error: ${err.message}` });
  }

  try {
    await browser.close();
  } catch {}

  updateStatus({ running: false });
  return { ok: true, postsChecked, matchesFound };
}

let cronJob = null;

function startBot({ updateStatus, storageStatePath } = {}) {
  const scanCron = process.env.SCAN_CRON || "*/10 * * * *";
  if (cronJob) return;

  cronJob = cron.schedule(scanCron, async () => {
    try {
      await runBot({ updateStatus, storageStatePath });
    } catch (e) {
      updateStatus({ lastError: `Scheduled scan failed: ${e.message}` });
    }
  });

  // Run once immediately on start.
  runBot({ updateStatus, storageStatePath }).catch((e) => {
    updateStatus({ lastError: `Initial scan failed: ${e.message}`, running: false });
  });
}

module.exports = { startBot, runBot };
