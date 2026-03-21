const { chromium } = require("playwright");
const cron = require("node-cron");
const fs = require("fs");
const sendEmail = require("./mailer");

let replyIndex = 0;
const seenPosts = new Set();

// 🔥 CHANGE THIS TO YOUR REAL URL
const API_URL = "https://fb-lead-bot-production.up.railway.app/api/status";

// STATUS UPDATE
async function updateStatus(update) {
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(update)
    });
  } catch {}
}

function loadData() {
  try {
    return JSON.parse(fs.readFileSync("./data.json"));
  } catch {
    return { groups: [], keywords: [], replies: [] };
  }
}

function getNextReply(replies) {
  if (!replies.length) return "Hi! I can help 🙂";
  const reply = replies[replyIndex];
  replyIndex = (replyIndex + 1) % replies.length;
  return reply;
}

async function runBot() {
  console.log("🔍 Scanning...");

  const data = loadData();

  await updateStatus({
    running: true,
    loggedIn: true,
    lastScan: new Date().toLocaleTimeString(),
    postsChecked: 0,
    matchesFound: 0
  });

  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });
  } catch (err) {
    console.log("❌ Browser failed:", err.message);
    return;
  }

  const context = await browser.newContext({
    storageState: "storageState.json" // 🔥 USE SAVED LOGIN
  });

  const page = await context.newPage();

  let postsChecked = 0;
  let matchesFound = 0;

  try {
    for (const group of data.groups) {
      console.log("📂 Checking:", group);

      await page.goto(group);
      await page.waitForTimeout(5000);

      const posts = await page.$$("[role='article']");

      for (const post of posts) {
        const text = await post.innerText();
        if (!text) continue;

        postsChecked++;
        await updateStatus({ postsChecked });

        const lower = text.toLowerCase();

        const matched = data.keywords.some(k =>
          lower.includes(k.toLowerCase())
        );

        if (!matched) continue;

        matchesFound++;
        await updateStatus({ matchesFound });

        const linkEl = await post.$("a[href*='/posts/']");
        if (!linkEl) continue;

        const link = await linkEl.getAttribute("href");
        if (!link || seenPosts.has(link)) continue;

        seenPosts.add(link);

        const reply = getNextReply(data.replies);

        const message = `
🔥 New Lead

"${text.slice(0, 200)}"

Reply:
"${reply}"

https://facebook.com${link}
`;

        await sendEmail("🔥 Lead Found", message);
        console.log("📧 Email sent");
      }
    }

  } catch (err) {
    console.log("❌ Bot error:", err.message);
  }

  await browser.close();
}

// RUN EVERY 10 MINUTES
cron.schedule("*/10 * * * *", runBot);

// RUN ON START
runBot();
