const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  // Nếu bạn chưa cấu hình SMTP thì log ra console để demo
  if (!process.env.SMTP_HOST) {
    console.log("==== EMAIL DEV MODE ====");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Content:", html);
    console.log("========================");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
};

module.exports = { sendEmail };
