const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "jarshortbreaks@gmail.com",
    pass: "clyegpzmnmvjvzgw" // ← no spaces
  }
});

async function sendEmail(subject, message) {
  try {
    console.log("📧 Trying to send email...");

    const info = await transporter.sendMail({
      from: '"Jar Holidays Leads" <yourgmail@gmail.com>',
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
