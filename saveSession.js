const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://www.facebook.com/");

  console.log("👉 LOGIN MANUALLY NOW");

  // WAIT for you to log in manually
  await page.waitForTimeout(60000);

  await context.storageState({ path: "storageState.json" });

  console.log("✅ Session saved!");

  await browser.close();
})();
