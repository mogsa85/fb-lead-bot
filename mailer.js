const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.ionos.co.uk",
  port: 587,
  secure: false,
  auth: {
    user: "info@jarholidays.co.uk",
    pass: "Safety99?!?"
  },
  connectionTimeout: 5000, // 5 seconds
  greetingTimeout: 5000,
  socketTimeout: 5000
});

async function sendEmail(subject, message) {
  try {
    console.log("📧 Trying to send email...");

    const info = await transporter.sendMail({
      from: '"Jar Holidays Leads" <info@jarholidays.co.uk>',
      to: "info@jarholidays.co.uk",
      subject: subject,
      text: message
    });

    console.log("✅ Email sent:", info.response);
  } catch (err) {
    console.error("❌ Email failed:", err.message);
  }
}

module.exports = sendEmail;
