import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendAdminNotification(subject, text) {
  if (!process.env.ADMIN_NOTIFY_EMAIL) return;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "hello@digibro.agency",
    to: process.env.ADMIN_NOTIFY_EMAIL,
    subject,
    text,
  });
}