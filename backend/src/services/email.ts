import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'noreply@stockwise.app';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const subject = 'Reset your Stockwise password';
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#111">Reset your password</h2>
      <p>You requested a password reset for your Stockwise account.</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#f5c518;color:#111;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Reset Password</a></p>
      <p style="color:#666;font-size:14px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      <p style="color:#999;font-size:12px;word-break:break-all">${resetUrl}</p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log('\n📧 SMTP not configured — password reset link (dev mode):');
    console.log(`   ${resetUrl}\n`);
    return;
  }

  await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
  console.log(`📧 Password reset email sent to ${to}`);
}
