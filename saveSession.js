const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://www.facebook.com/");

  console.log("👉 LOGIN MANUALLY NOW");

  const LOGIN_TIMEOUT_MS = Number(process.env.LOGIN_TIMEOUT_MS || 180000); // default 3 minutes
  const STORAGE_STATE_PATH = process.env.STORAGE_STATE_PATH || "storageState.json";

  // Wait until we detect you're logged in (heuristic), or until timeout.
  const startedAt = Date.now();
  while (Date.now() - startedAt < LOGIN_TIMEOUT_MS) {
    const url = (page.url() || "").toLowerCase();
    const content = (await page.content()).toLowerCase();

    const likelyLoggedIn =
      !url.includes("/login") &&
      !url.includes("login.php") &&
      !(content.includes("log in") && content.includes("facebook"));

    if (likelyLoggedIn) break;
    await page.waitForTimeout(2000);
  }

  await context.storageState({ path: STORAGE_STATE_PATH });

  console.log("✅ Session saved!");

  await browser.close();
})();
