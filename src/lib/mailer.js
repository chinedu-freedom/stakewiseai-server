
import { emailTemplate } from "../../template.js";
import { sendEmail } from "../../zohoMailer.js";


export async function sendWelcomeEmail({ email, name }) {
  const subject = "Welcome to SATRIXNOW - Let's Start Growing!";

  const content = `
    <div style="text-align:center; padding:10px 0;">
      <h2 style="color:#1e3a8a; margin-bottom:15px; font-size: 24px; font-weight: 800;">
        Welcome Aboard, ${name}! 🚀
      </h2>

      <p style="color:#4b5563; font-size:16px; line-height:1.7; margin-bottom: 25px;">
        We're thrilled to have you join <strong>SATRIXNOW</strong>. You've just taken a major step toward optimizing your digital infrastructure and maximizing your computing power potential.
      </p>

      <div style="background: #f0f9ff; border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px solid #e0f2fe; text-align: left;">
        <h3 style="color:#4f8cff; margin-top:0; font-size: 18px;">What's Next?</h3>
        <ul style="color:#4b5563; font-size:14px; padding-left: 20px; margin-bottom: 0;">
          <li style="margin-bottom: 10px;"><strong>Explore Staking Plans:</strong> Choose from our highly optimized computing power plans.</li>
          <li style="margin-bottom: 10px;"><strong>Set Up Your Wallet:</strong> Connect your crypto wallet to start earning profits.</li>
          <li><strong>Invite Friends:</strong> Share the future of computing and earn referral rewards.</li>
        </ul>
      </div>

      <div style="margin:35px 0;">
        <a href="${process.env.FRONTEND_URL}/account"
          style="background: linear-gradient(90deg, #4f8cff, #6ee7ff); color:#ffffff; padding:16px 40px;
                 border-radius:50px; text-decoration:none; font-weight:700;
                 display:inline-block; box-shadow: 0 4px 15px rgba(79, 140, 255, 0.4);">
          Go to My Dashboard
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Our team is here to support you 24/7. If you have any questions, simply reply to this email or reach out via our Help Line.
      </p>
      
      <p style="margin-top: 30px; font-weight: 700; color: #1e3a8a;">
        Happy Investing,<br>
        The SATRIXNOW Team
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
  const subject = "Your OTP Code - SATRIXNOW";

  const content = `
    <p>Hi <strong>${name}</strong>,</p>

    <p>
      You recently requested to reset your password for your
      <strong>SATRIXNOW</strong> account. Please use the OTP code below
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
        <a href="mailto:support@satrixnow.com"
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
        <a href="mailto:support@satrixnow.com"
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
  const subject = isAdmin ? "New Deposit Request - Action Required" : "Deposit Request Received - SATRIXNOW";
  
  const heading = isAdmin 
    ? "" 
    : `<h2 style="color:#0b132b; margin-bottom:12px; text-align:center;">Deposit Pending</h2>`;

  const message = isAdmin
    ? `<p style="font-size: 15px; color: #333;">A new deposit has been submitted by <strong>${userName}</strong> || <a href="mailto:${userEmail}">${userEmail}</a> </p>
    <p style="font-size: 15px; color: #333;">Please review and verify the transaction in the admin dashboard.</p>`
    : `<p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 12px;">
        Your deposit request of <strong>$${amount}</strong> has been received successfully. You will be notified once your deposit has been confirmed on our end, and it will be automatically credited to your account.
      </p>
      <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 24px;">
        Thank you for choosing Stake Wise AI Platform.
      </p>
    `;
 
  const content = `
    <div style="padding: 10px 0;">
      ${heading}
      <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 12px;">
        Hi <strong>${name}</strong>,
      </p>
      ${message}
    </div>
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
  const subject = isAdmin ? "New Withdrawal Request - Action Required" : "Withdrawal Request Received - SATRIXNOW";
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
