
import { emailTemplate } from "../../template.js";
import { sendEmail } from "../../zohoMailer.js";


export async function sendVerificationEmail({ email, name, token }) {
  const subject = "Verify Your Email - STAKEWISEAI";

  const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
  

  const content = `
    <div style="text-align:center; padding:10px 0;">
      <h2 style="color:#1e3a8a; margin-bottom:12px; font-size: 22px;">
        You're Almost There, ${name}!
      </h2>

      <p style="color:#4b5563; font-size:16px; line-height:1.7;">
        Welcome to <strong>STAKEWISEAI</strong> — your gateway to secure and smarter computing power.
        To activate your account, please verify your email address.
      </p>

      <div style="margin:35px 0;">
        <a href="${verificationLink}"
          style="background: linear-gradient(90deg, #4f8cff, #6ee7ff); color:#ffffff; padding:16px 40px;
                 border-radius:50px; text-decoration:none; font-weight:700;
                 display:inline-block; box-shadow: 0 4px 12px rgba(79, 140, 255, 0.3);">
          Verify My Email
        </a>
      </div>

      <p style="margin-top: 25px; color: #6b7280; font-size: 14px;">
        Join <strong>120,000+ active users</strong> already optimizing their digital infrastructure with STAKEWISEAI.
      </p>
      
      <p style="font-size:14px; color:#ef4444; font-weight: 500;">
        This link will expire in <strong>10 minutes</strong>.
      </p>

      <p style="font-size:12px; color:#9ca3af; margin-top:30px; border-top: 1px solid #f3f4f6; pt-15px;">
        If you did not create a STAKEWISEAI account, please ignore this email.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: emailTemplate(content)
  });
}

export async function sendPasswordResetEmail(email, name, otp) {
  const subject = "Your OTP Code - STAKEWISEAI";

  const content = `
    <p>Hi <strong>${name}</strong>,</p>

    <p>
      You recently requested to reset your password for your
      <strong>STAKEWISEAI</strong> account. Please use the OTP code below
      to complete the process:
    </p>

    <div style="margin:24px 0; text-align:center;">
      <span style="
        background: #f0f9ff;
        color: #4f8cff;
        padding: 12px 35px;
        font-size: 24px;
        font-weight: 800;
        letter-spacing: 8px;
        border: 2px dashed #4f8cff;
        border-radius: 12px;
        display: inline-block;
      ">
        ${otp}
      </span>
    </div>

    <p>
      This OTP is valid for <strong>10 minutes</strong>.
      For your security, do not share this code with anyone.
    </p>

    <p style="font-size:13px; color:#666;">
      If you didn’t request a password reset, you can safely ignore this email.
      Your account will remain secure.
    </p>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: emailTemplate(content),
  });
}


export async function sendPasswordChangeConfirmationEmail(email, name) {
  const subject = "Your Password Has Been Updated";

  const content = `
    <div style="padding:30px 0; text-align:center;">
      <p style="font-size:16px; color:#333; margin-bottom:16px;">
        Hi <strong>${name}</strong>,
      </p>

      <p style="font-size:15px; color:#555; line-height:1.6; margin-bottom:20px;">
        Your password has been <strong>successfully changed</strong>.
      </p>

      <p style="font-size:15px; color:#555; line-height:1.6; margin-bottom:24px;">
        If you did not perform this action, please contact our support team
        <a href="mailto:support@stakewiseai.com"
           style="color:#4f8cff; font-weight:bold; text-decoration:none;">
          immediately
        </a>.
      </p>

      <div style="margin:30px 0;">
        <a href="${process.env.FRONTEND_URL}/auth/sign-in"
           style="background: linear-gradient(90deg, #4f8cff, #3b82f6); color:#ffffff; padding:14px 30px;
                  border-radius:50px; text-decoration:none; font-weight:bold;
                  display:inline-block; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);">
          Go to Login
        </a>
      </div>

      <p style="font-size:13px; color:#888; margin-top:20px;">
        If this was you, no further action is required.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: emailTemplate(content),
  });
}


export async function sendPasswordResetConfirmationEmail(email, name) {
  const subject = "Your Password Has Been Reset";

  const content = `
    <div style="padding:30px 0; text-align:center;">
      <p style="font-size:16px; color:#333; margin-bottom:16px;">
        Hi <strong>${name}</strong>,
      </p>

      <p style="font-size:15px; color:#555; line-height:1.6; margin-bottom:20px;">
        Your password has been <strong>successfully reset</strong>.
      </p>

      <p style="font-size:15px; color:#555; line-height:1.6; margin-bottom:24px;">
        If you did not perform this action, please contact our support team
        <a href="mailto:support@stakewiseai.com"
           style="color:#4f8cff; font-weight:bold; text-decoration:none;">
          immediately
        </a>.
      </p>

      <div style="margin:30px 0;">
        <a href="${process.env.FRONTEND_URL}/auth/sign-in"
           style="background: linear-gradient(90deg, #4f8cff, #3b82f6); color:#ffffff; padding:14px 30px;
                  border-radius:50px; text-decoration:none; font-weight:bold;
                  display:inline-block; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);">
          Go to Login
        </a>
      </div>

      <p style="font-size:13px; color:#888; margin-top:20px;">
        If this was you, no further action is required.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: emailTemplate(content),
  });
}



export async function sendDepositNotificationEmail({ email, name, crypto, amount, status, date, isAdmin = false, userName, userEmail }) {
  const subject = isAdmin ? "New Deposit Request - Action Required" : "Deposit Request Received - STAKEWISEAI";
  const message = isAdmin
    ? `<p style="font-size: 15px; color: #333;">A new deposit has been submitted by <strong>${userName}</strong> || <a href="mailto:${userEmail}">${userEmail}</a> </p>
    <p style="font-size: 15px; color: #333;">Please review and verify the transaction in the admin dashboard.</p>`
    : `<p style="font-size: 15px; color: #555;">Your <strong>${crypto}</strong> deposit request of <strong>$${amount}</strong> is currently <strong>${status}</strong>.</p>
      <p style="font-size: 15px; color: #555;">
        Once our team verifies your payment, your deposit will be credited to your account. You’ll receive another confirmation when this happens.
      </p>
    `;
 
  const content = `
     <p style="font-size: 16px; color: #333333; margin-bottom: 15px;">
        Hi <strong>${name}</strong>,
      </p>
    ${message}
    <table style="width:100%; border-collapse: collapse; margin:20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <tr style="background-color:#f0f4f8;"><td style="padding:12px; border:1px solid #e5e7eb; font-weight: 600;">Crypto</td><td style="padding:12px; border:1px solid #e5e7eb;">${crypto}</td></tr>
      <tr><td style="padding:12px; border:1px solid #e5e7eb; font-weight: 600;">Amount (USD)</td><td style="padding:12px; border:1px solid #e5e7eb;">$${amount}</td></tr>
      <tr style="background-color:#f0f4f8;"><td style="padding:12px; border:1px solid #e5e7eb; font-weight: 600;">Status</td><td style="padding:12px; border:1px solid #e5e7eb; color: #4f8cff; font-weight: 700;">${status.charAt(0).toUpperCase() + status.slice(1)}</td></tr>
      <tr><td style="padding:12px; border:1px solid #e5e7eb; font-weight: 600;">Date</td><td style="padding:12px; border:1px solid #e5e7eb;">${new Date(date).toLocaleString()}</td></tr>
    </table>
    `;
  return await sendEmail({ to: email, subject, html: emailTemplate(content) });
}

export async function sendWithdrawalNotificationEmail({ email, name, crypto, amount, walletAddress, status, date, isAdmin = false, userName, userEmail }) {
  const subject = isAdmin ? "New Withdrawal Request - Action Required" : "Withdrawal Request Received - STAKEWISEAI";
  const message = isAdmin
    ? `<p  style="font-size: 15px; color: #333;">A new withdrawal has been submitted by <strong>${userName}</strong>  <a href="mailto:${userEmail}">${userEmail}</a>
    </p><p  style="font-size: 15px; color: #333;">Please review and process this request in the admin dashboard.</p>`
    : `<p  style="font-size: 15px; color: #555;">Your <strong>${crypto}</strong> withdrawal request of <strong>$${amount}</strong> to wallet <strong>${walletAddress}</strong> is currently <strong>${status}</strong>.</p>
    <p style="font-size: 15px; color: #555;">
    Once our team reviews and processes your request, you will receive a confirmation email.
    </p>
    `;

  const content = `
       <p style="font-size: 16px; color: #333333; margin-bottom: 15px;">
        Hi <strong>${name}</strong>,
      </p>

    ${message}
    <table style="width:100%; border-collapse: collapse; margin:20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <tr style="background-color:#f0f4f8;"><td style="padding:12px; border:1px solid #e5e7eb; font-weight: 600;">Crypto</td><td style="padding:12px; border:1px solid #e5e7eb;">${crypto}</td></tr>
      <tr><td style="padding:12px; border:1px solid #e5e7eb; font-weight: 600;">Amount (USD)</td><td style="padding:12px; border:1px solid #e5e7eb;">$${amount}</td></tr>
      <tr style="background-color:#f0f4f8;"><td style="padding:12px; border:1px solid #e5e7eb; font-weight: 600;">Wallet Address</td><td style="padding:12px; border:1px solid #e5e7eb; word-break: break-word; font-size: 13px;">${walletAddress}</td></tr>
      <tr><td style="padding:12px; border:1px solid #e5e7eb; font-weight: 600;">Status</td><td style="padding:12px; border:1px solid #e5e7eb; color: #4f8cff; font-weight: 700;">${status.charAt(0).toUpperCase() + status.slice(1)}</td></tr>
      <tr style="background-color:#f0f4f8;"><td style="padding:12px; border:1px solid #e5e7eb; font-weight: 600;">Date</td><td style="padding:12px; border:1px solid #e5e7eb;">${new Date(date).toLocaleString()}</td></tr>
    </table>
  `;
  return await sendEmail({ to: email, subject, html: emailTemplate(content) });
}
