const { chromium } = require("playwright");
const cron = require("node-cron");
const fs = require("fs");
const sendEmail = require("./mailer");

let replyIndex = 0;
const seenPosts = new Set();

// 🔥 STATUS OBJECT (local tracking)
let status = {
  running: false,
  loggedIn: false,
  lastScan: null,
  postsChecked: 0,
  matchesFound: 0
};

// 🔥 Send status to server
async function updateStatus(update) {
  try {
await fetch("https://fb-lead-bot-production.up.railway.app//api/status", {
  method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(update)
    });
  } catch (e) {
    console.log("Status update failed");
  }
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
  console.log("🔍 Scanning for leads...");

  const data = loadData();

  if (!data.groups.length) {
    console.log("❌ No groups added");
    return;
  }

  // 🔥 RESET STATUS EACH RUN
  status = {
    running: true,
    loggedIn: false,
    lastScan: new Date().toLocaleTimeString(),
    postsChecked: 0,
    matchesFound: 0
  };

  await updateStatus(status);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();

  try {
    console.log("🔐 Logging into Facebook...");

    await page.goto("https://www.facebook.com/");
    await page.fill("#email", "camplarry2024@jarholidays.co.uk");
    await page.fill("#pass", "Safety99!!");
    await page.click("button[name='login']");
    await page.waitForTimeout(8000);

    // 🔥 LOGIN SUCCESS
    status.loggedIn = true;
    await updateStatus({ loggedIn: true });

    for (const group of data.groups) {
      console.log("📂 Checking group:", group);

      await page.goto(group);
      await page.waitForTimeout(5000);

      const posts = await page.$$("[role='article']");
      console.log(`📝 Found ${posts.length} posts`);

      for (const post of posts) {
        const text = await post.innerText();
        if (!text) continue;

        status.postsChecked++;
        await updateStatus({ postsChecked: status.postsChecked });

        console.log("📝 Post:", text.slice(0, 80));

        const lower = text.toLowerCase();

        const matched = data.keywords.some(k =>
          lower.includes(k.toLowerCase())
        );

        if (!matched) continue;

        console.log("✅ MATCH FOUND!");

        status.matchesFound++;
        await updateStatus({ matchesFound: status.matchesFound });

        const linkEl = await post.$("a[href*='/posts/']");
        if (!linkEl) continue;

        const link = await linkEl.getAttribute("href");
        if (!link || seenPosts.has(link)) {
          console.log("⚠️ Already seen post");
          continue;
        }

        seenPosts.add(link);

        const reply = getNextReply(data.replies);

        const message = `
🔥 New Caravan Lead

Post:
"${text.slice(0, 300)}..."

💬 Reply:
"${reply}"

👉 Open post:
https://facebook.com${link}
`;

        console.log("📧 Sending email...");
        await sendEmail("🔥 New Caravan Lead", message);
        console.log("✅ Email sent for lead");
      }
    }

  } catch (err) {
    console.error("❌ Bot error:", err.message);
  }

  await browser.close();
}

// RUN EVERY 10 MINUTES
cron.schedule("*/10 * * * *", () => {
  runBot();
});

// Run immediately
runBot();
