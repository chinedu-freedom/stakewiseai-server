
import { emailTemplate } from "../../template.js";
import { sendEmail } from "../../zohoMailer.js";


export async function sendVerificationEmail({ email, name, token }) {
  const subject = "Verify Your Email - Prime Chain";

  const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
  

  const content = `
    <div style="text-align:center; padding:30px 0;">
      <h2 style="color:#0b132b; margin-bottom:10px;">
        You're Almost There, ${name}!
      </h2>

      <p style="color:#444; font-size:16px; line-height:1.6;">
        Welcome to <strong>Prime Chain</strong> — your gateway to secure and smarter investing.
        To activate your account, please verify your email. It only takes a few seconds!

      </p>

      <div style="margin:30px 0;">
        <a href="${verificationLink}"
          style="background:#1e90ff; color:#ffffff; padding:14px 32px;
                 border-radius:6px; text-decoration:none; font-weight:bold;
                 display:inline-block;">
          Verify My Email
        </a>
      </div>
  <p style="margin-top: 20px; color: #666; font-size: 14px;">
        By verifying, you’ll join <strong>120,000+ active investors</strong> already diversifying with Prime Chain.  
        Don’t miss out on smarter opportunities.
      </p>
      <p style="font-size:14px; color:#666;">
        This verification link will expire in <strong>10 minutes</strong>.
      </p>

      <p style="font-size:13px; color:#888; margin-top:20px;">
        If you did not create a Prime Chain account, you can safely ignore this email.
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
  const subject = "Your OTP Code - Prime Chain";

  const content = `
    <p>Hi <strong>${name}</strong>,</p>

    <p>
      You recently requested to reset your password for your
      <strong>Prime Chain</strong> account. Please use the OTP code below
      to complete the process:
    </p>

    <div style="margin:24px 0; text-align:center;">
      <span style="
        background:#0d9488;
        color:#ffffff;
        padding:10px 32px;
        font-size:20px;
        font-weight:700;
        letter-spacing:6px;
        border-radius:8px;
        display:inline-block;
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
        <a href="mailto:support@primechainpro.com"
           style="color:#0b132b; font-weight:bold; text-decoration:none;">
          immediately
        </a>.
      </p>

      <div style="margin:30px 0;">
        <a href="${process.env.FRONTEND_URL}/auth/sign-in"
           style="background:#0b132b; color:#ffffff; padding:12px 26px;
                  border-radius:6px; text-decoration:none; font-weight:bold;
                  display:inline-block;">
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
        <a href="mailto:support@primechainpro.com"
           style="color:#0b132b; font-weight:bold; text-decoration:none;">
          immediately
        </a>.
      </p>

      <div style="margin:30px 0;">
        <a href="${process.env.FRONTEND_URL}/auth/sign-in"
           style="background:#0b132b; color:#ffffff; padding:12px 26px;
                  border-radius:6px; text-decoration:none; font-weight:bold;
                  display:inline-block;">
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
  const subject = isAdmin ? "New Deposit Request - Action Required" : "Deposit Request Received - Prime Chain";
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
    <table style="width:100%; border-collapse: collapse; margin:20px 0;">
      <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Crypto</td><td style="padding:10px; border:1px solid #e5e7eb;">${crypto}</td></tr>
      <tr><td style="padding:10px; border:1px solid #e5e7eb;">Amount (USD)</td><td style="padding:10px; border:1px solid #e5e7eb;">$${amount}</td></tr>
      <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Status</td><td style="padding:10px; border:1px solid #e5e7eb;">${status.charAt(0).toUpperCase() + status.slice(1)}</td></tr>
      <tr><td style="padding:10px; border:1px solid #e5e7eb;">Date</td><td style="padding:10px; border:1px solid #e5e7eb;">${new Date(date).toLocaleString()}</td></tr>
    </table>
    `;
  return await sendEmail({ to: email, subject, html: emailTemplate(content) });
}

export async function sendWithdrawalNotificationEmail({ email, name, crypto, amount, walletAddress, status, date, isAdmin = false, userName, userEmail }) {
  const subject = isAdmin ? "New Withdrawal Request - Action Required" : "Withdrawal Request Received - Prime Chain";
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
    <table style="width:100%; border-collapse: collapse; margin:20px 0;">
      <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Crypto</td><td style="padding:10px; border:1px solid #e5e7eb;">${crypto}</td></tr>
      <tr><td style="padding:10px; border:1px solid #e5e7eb;">Amount (USD)</td><td style="padding:10px; border:1px solid #e5e7eb;">$${amount}</td></tr>
      <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Wallet Address</td><td style="padding:10px; border:1px solid #e5e7eb; word-break: break-word;">${walletAddress}</td></tr>
      <tr><td style="padding:10px; border:1px solid #e5e7eb;">Status</td><td style="padding:10px; border:1px solid #e5e7eb;">${status.charAt(0).toUpperCase() + status.slice(1)}</td></tr>
      <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Date</td><td style="padding:10px; border:1px solid #e5e7eb;">${new Date(date).toLocaleString()}</td></tr>
    </table>
  `;
  return await sendEmail({ to: email, subject, html: emailTemplate(content) });
}
