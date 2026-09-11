const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const nodemailer = require('nodemailer');

async function resolveGmailIpv4() {
  return new Promise((resolve) => {
    dns.resolve4('smtp.gmail.com', (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        return resolve(addresses[0]);
      }
      dns.lookup('smtp.gmail.com', { family: 4 }, (err2, address) => {
        if (!err2 && address) {
          return resolve(address);
        }
        resolve('smtp.gmail.com');
      });
    });
  });
}

async function getTransporter() {
  const user = process.env.EMAIL_USER || 'nknagaarjun7@gmail.com';
  const pass = process.env.EMAIL_PASS || 'vcqukzrxfmsvjtre';

  if (!user || !pass) {
    return null;
  }

  // Resolve direct IPv4 to completely prevent Render Linux from attempting IPv6 (which causes ENETUNREACH)
  const hostIp = await resolveGmailIpv4();

  return nodemailer.createTransport({
    host: hostIp,
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user,
      pass,
    },
    tls: {
      servername: 'smtp.gmail.com',
      rejectUnauthorized: false,
    },
  });
}

/**
 * Send password reset OTP email with professional branded HTML template
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email address
 * @param {string} params.studentName - Student name (optional)
 * @param {string} params.otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, messageId?: string, devMode?: boolean}>}
 */
async function sendOtpEmail({ toEmail, studentName, otp }) {
  const mailTransporter = await getTransporter();

  // If email credentials not yet provided in .env, throw explicit error
  if (!mailTransporter) {
    const errorMsg = 'SMTP email credentials (EMAIL_USER & EMAIL_PASS) are not configured in backend/.env. Real email could not be sent.';
    console.error(`[EMAIL SERVICE] ❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const user = process.env.EMAIL_USER || 'nknagaarjun7@gmail.com';
  const fromAddress = process.env.EMAIL_FROM || `"SLA SkillUp Portal" <${user}>`;
  const nameDisplay = studentName ? `Hello ${studentName},` : 'Hello,';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                🎓 SLA SkillUp Portal
              </h1>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">
                Aptitude & Skill Development Platform
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="color: #1e293b; margin: 0 0 12px; font-size: 18px; font-weight: 700;">
                Password Reset Verification Code
              </h2>
              
              <p style="color: #475569; font-size: 14px; line-height: 22px; margin: 0 0 20px;">
                ${nameDisplay}<br>
                We received a request to reset the password for your student account. Please use the 6-digit verification code below to verify your identity:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
                  Your One-Time Password (OTP)
                </span>
                <span style="display: inline-block; font-size: 36px; font-weight: 800; color: #4f46e5; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">
                  ${otp}
                </span>
                <span style="display: block; font-size: 12px; color: #ef4444; font-weight: 600; margin-top: 10px;">
                  ⏱ Valid for 15 minutes only
                </span>
              </div>

              <!-- Security Information -->
              <p style="color: #64748b; font-size: 13px; line-height: 20px; margin: 0 0 16px;">
                ⚠️ <strong>Security Notice:</strong> Never share this OTP with anyone, including staff or instructors. SLA SkillUp will never ask for your password or OTP.
              </p>

              <p style="color: #94a3b8; font-size: 12px; line-height: 18px; margin: 0;">
                If you did not request this password reset, you can safely ignore this email. Your current password remains unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0; line-height: 16px;">
                This is an automated security message from SLA SkillUp.<br>
                © ${new Date().getFullYear()} SLA SkillUp. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: `Your SLA SkillUp Password Reset OTP: ${otp}`,
    html: htmlContent,
    text: `Hello,\n\nYour SLA SkillUp password reset OTP is: ${otp}\n\nThis code is valid for 15 minutes.\nIf you did not request this code, please ignore this email.\n\n- SLA SkillUp Team`,
  };

  const info = await mailTransporter.sendMail(mailOptions);
  console.log(`[EMAIL SERVICE] ✅ OTP email sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
}

module.exports = {
  sendOtpEmail,
};

