const { chromium } = require("playwright");
const cron = require("node-cron");
const fs = require("fs");
const sendEmail = require("./mailer");

let replyIndex = 0;
const seenPosts = new Set();

function loadData() {
  return JSON.parse(fs.readFileSync("./data.json"));
}

function getNextReply(replies) {
  const reply = replies[replyIndex];
  replyIndex = (replyIndex + 1) % replies.length;
  return reply;
}

async function runBot() {
  console.log("🔍 Scanning for leads...");

  const data = loadData();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // LOGIN (first run may need manual session later)
  await page.goto("https://www.facebook.com/");
  await page.fill("#email", "YOUR_FACEBOOK_EMAIL");
  await page.fill("#pass", "YOUR_FACEBOOK_PASSWORD");
  await page.click("button[name='login']");
  await page.waitForTimeout(8000);

  for (const group of data.groups) {
    console.log("Checking group:", group);

    await page.goto(group);
    await page.waitForTimeout(5000);

    const posts = await page.$$("[role='article']");

    for (const post of posts) {
      const text = await post.innerText();
      if (!text) continue;

      const lower = text.toLowerCase();

      const matched = data.keywords.some(k =>
        lower.includes(k.toLowerCase())
      );

      if (!matched) continue;

      const linkEl = await post.$("a[href*='/posts/']");
      if (!linkEl) continue;

      const link = await linkEl.getAttribute("href");
      if (!link || seenPosts.has(link)) continue;

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

      await sendEmail("🔥 New Caravan Lead", message);
    }
  }

  await browser.close();
}

// RUN EVERY 10 MINUTES
cron.schedule("*/10 * * * *", () => {
  runBot();
});

// Run immediately on start
runBot();
