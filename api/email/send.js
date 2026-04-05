import nodemailer from "nodemailer";

let cachedTransporter = null;

function parseSecureFlag(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return null;
  return s === "1" || s === "true" || s === "yes";
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "Email credentials not configured (SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS)."
    );
  }

  const port = Number(SMTP_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("Invalid SMTP_PORT. Use a valid integer like 465 or 587.");
  }

  const envSecure = parseSecureFlag(process.env.SMTP_SECURE);
  const secure = envSecure == null ? port === 465 : envSecure;

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return cachedTransporter;
}

async function sendViaSmtp(to, subject, message) {
  const { EMAIL_FROM, SMTP_USER } = process.env;
  const fromAddress = String(EMAIL_FROM || SMTP_USER || "").trim();
  if (!fromAddress) {
    throw new Error("Sender not configured (EMAIL_FROM or SMTP_USER required).");
  }

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text: message,
  });

  return info?.messageId || null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { to, subject, message } = req.body || {};
    const toEmail = String(to || "").trim();
    const msg = String(message || "").trim();
    const subj = String(subject || "Scholarship Application Update").trim();

    if (!toEmail || !msg) {
      return res.status(400).json({ error: "to and message required" });
    }

    const emailId = await sendViaSmtp(toEmail, subj, msg);
    return res.status(200).json({ ok: true, email_id: emailId });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: String(err) });
  }
}
