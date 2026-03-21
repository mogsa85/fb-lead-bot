const API_KEY = "re_FDH2VNzu_Fdwqz5BQW16f3XsJNq6HMqin";

async function sendEmail(subject, message) {
  try {
    console.log("📧 Sending via Resend...");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
to: ["robertmogsa85@gmail.com"],
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
