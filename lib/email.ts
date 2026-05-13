import nodemailer from "nodemailer";
import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
  SendSmtpEmail,
} from "@getbrevo/brevo";

const brevoClient = new TransactionalEmailsApi();

function buildOtpEmailContent(
  type: "login" | "reset",
  otp: string
): { subject: string; html: string } {
  const subject =
    type === "login"
      ? "🌦 WeatherApp — Your Login OTP"
      : "🔑 WeatherApp — Password Reset OTP";

  const heading = type === "login" ? "Your Login Code" : "Reset Your Password";
  const message =
    type === "login"
      ? "Use this OTP to complete your login. It expires in 10 minutes."
      : "Use this OTP to reset your password. It expires in 10 minutes.";

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#0f0c29;font-family:'Helvetica Neue',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%);min-height:100vh;">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table width="520" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.05);border-radius:24px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#6366f1,#00d4aa);padding:40px;text-align:center;">
                <div style="font-size:48px;margin-bottom:12px;">🌤</div>
                <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">WeatherApp</h1>
                <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Your Personal Weather Intelligence</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;text-align:center;">
                <h2 style="color:#fff;margin:0 0 12px;font-size:22px;">${heading}</h2>
                <p style="color:rgba(255,255,255,0.6);margin:0 0 32px;font-size:15px;line-height:1.6;">${message}</p>
                <div style="background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(0,212,170,0.2));border:1px solid rgba(99,102,241,0.4);border-radius:16px;padding:32px;margin:0 0 32px;">
                  <p style="color:rgba(255,255,255,0.5);margin:0 0 16px;font-size:12px;letter-spacing:3px;text-transform:uppercase;">One-Time Password</p>
                  <span style="font-size:48px;font-weight:700;color:#fff;letter-spacing:12px;font-family:'Courier New',monospace;">${otp}</span>
                </div>
                <div style="background:rgba(255,107,53,0.1);border:1px solid rgba(255,107,53,0.3);border-radius:12px;padding:16px;margin-bottom:32px;">
                  <p style="color:#ff6b35;margin:0;font-size:13px;">⏰ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
                </div>
                <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;">If you didn't request this, please ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid rgba(255,255,255,0.1);padding:24px;text-align:center;">
                <p style="color:rgba(255,255,255,0.3);margin:0;font-size:12px;">© 2025 WeatherApp · Built with ❤️ for weather lovers</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  return { subject, html };
}

async function sendViaBrevo(to: string, subject: string, html: string) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  if (!apiKey || !senderEmail) return false;

  brevoClient.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);

  const message_obj = new SendSmtpEmail();
  message_obj.subject = subject;
  message_obj.htmlContent = html;
  message_obj.sender = { name: "WeatherApp", email: senderEmail };
  message_obj.to = [{ email: to }];

  await brevoClient.sendTransacEmail(message_obj);
  return true;
}

async function sendViaGmail(to: string, subject: string, html: string) {
  const user = process.env.EMAIL_USER?.trim();
  const passRaw = process.env.EMAIL_PASS;
  if (!user || !passRaw) return false;

  const pass = passRaw.replace(/\s/g, "");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"WeatherApp" <${user}>`,
    to,
    subject,
    html,
  });
  return true;
}

export async function sendOTPEmail(
  email: string,
  otp: string,
  type: "login" | "reset" = "login"
) {
  const { subject, html } = buildOtpEmailContent(type, otp);

  if (await sendViaBrevo(email, subject, html)) return;
  if (await sendViaGmail(email, subject, html)) return;

  throw new Error(
    "No email transport configured. Add either BREVO_API_KEY + BREVO_SENDER_EMAIL, or EMAIL_USER + EMAIL_PASS (Gmail app password) to .env.local"
  );
}
