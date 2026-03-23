// Prefer env vars so secrets aren't hard-coded in the repo.
const API_KEY = process.env.RESEND_API_KEY || "re_FDH2VNzu_Fdwqz5BQW16f3XsJNq6HMqin";
const DEFAULT_TO = ["robertmogsa85@gmail.com"];

function getToList() {
  const raw = process.env.EMAIL_TO;
  if (!raw) return DEFAULT_TO;
  // Allow comma-separated list: "a@b.com,c@d.com"
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const nodeFetch = require("node-fetch");
const fetchFn = global.fetch || nodeFetch;

async function sendEmail(subject, message) {
  try {
    console.log("📧 Sending via Resend...");

    const res = await fetchFn("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: getToList(),
        subject: subject,
        text: message
      })
    });

    const data = await res.json();
    console.log("✅ Email sent:", data);

  } catch (err) {
    console.error("❌ Email failed:", err.message);
  }
}

module.exports = sendEmail;
