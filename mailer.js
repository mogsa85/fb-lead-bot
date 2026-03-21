const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.ionos.co.uk",
  port: 465,
  secure: false,
  auth: {
    user: "info@jarholidays.co.uk",
    pass: "Safety99?!?"
  }
});

async function sendEmail(subject, message) {
  try {
    await transporter.sendMail({
      from: '"Lead Bot" <info@jarholidays.co.uk>',
      to: "info@jarholidays.co.uk",
      subject: subject,
      text: message
    });

    console.log("📧 Email sent");
  } catch (err) {
    console.error("Email error:", err);
  }
}

module.exports = sendEmail;
