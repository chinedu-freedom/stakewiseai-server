import { emailTemplate } from "../../template.js";
import { sendEmail } from "../../zohoMailer.js";

export async function sendWelcomeEmail({ email, name }) {
  const subject = "Welcome to Blockvextrade - Let's Start Growing!";

  const content = `
    <div style="text-align:center; padding:10px 0;">
      <h2 style="color:#00ff00; margin-bottom:15px; font-size: 24px; font-weight: 800;">
        Welcome Aboard, ${name}! 🚀
      </h2>

      <p style="color:#d1d5db; font-size:15px; line-height:1.7; margin-bottom: 25px;">
        We're thrilled to have you join <strong style="color:#ffffff;">Blockvextrade</strong>. You've just taken a major step toward optimizing your digital infrastructure and maximizing your computing power potential.
      </p>

      <div style="background: #080c09; border-radius: 14px; padding: 22px; margin: 25px 0; border: 1px solid #14241a; text-align: left;">
        <h3 style="color:#00ff00; margin-top:0; font-size: 16px; font-weight: 700;">What's Next?</h3>
        <ul style="color:#9ca3af; font-size:14px; padding-left: 20px; margin-bottom: 0; line-height: 1.8;">
          <li style="margin-bottom: 8px;"><strong style="color:#ffffff;">Explore Staking Plans:</strong> Choose from our highly optimized computing power plans.</li>
          <li style="margin-bottom: 8px;"><strong style="color:#ffffff;">Set Up Your Wallet:</strong> Connect your crypto wallet to start earning profits.</li>
          <li><strong style="color:#ffffff;">Invite Friends:</strong> Share the future of computing and earn referral rewards.</li>
        </ul>
      </div>

      <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
        Our team is here to support you 24/7. If you have any questions, simply reply to this email or reach out via our Help Line.
      </p>
      
      <p style="margin-top: 25px; font-weight: 700; color: #00ff00;">
        Happy Investing,<br>
        <span style="color:#ffffff;">The Blockvextrade Team</span>
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
  const subject = "Your Password Reset OTP - Blockvextrade";

  const content = `
    <div style="text-align:center; padding:10px 0;">
      <h2 style="color:#ffffff; margin-bottom:12px; font-size: 22px; font-weight: 700;">
        Password Reset Request
      </h2>
      <p style="color:#9ca3af; font-size:15px; line-height:1.6; margin-bottom: 20px;">
        Hi <strong style="color:#ffffff;">${name}</strong>, you recently requested to reset your password for your <strong style="color:#ffffff;">Blockvextrade</strong> account. Use the code below to complete the process:
      </p>

      <div style="margin:26px 0; text-align:center;">
        <span style="
          background: #000000;
          color: #00ff00;
          padding: 16px 40px;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: 8px;
          border: 2px solid #00ff00;
          border-radius: 14px;
          display: inline-block;
          font-family: 'Courier New', Courier, monospace;
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.25);
        ">
          ${otp}
        </span>
      </div>

      <p style="color:#9ca3af; font-size:13px;">
        This OTP is valid for <strong style="color:#00ff00;">10 minutes</strong>. For your security, do not share this code with anyone.
      </p>

      <p style="font-size:12px; color:#6b7280; margin-top:22px;">
        If you didn't request a password reset, you can safely ignore this email. Your account will remain secure.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: emailTemplate(content),
  });
}

export async function sendPasswordChangeConfirmationEmail(email, name) {
  const subject = "Your Password Has Been Updated - Blockvextrade";

  const content = `
    <div style="padding:20px 0; text-align:center;">
      <h2 style="color:#00ff00; margin-bottom:12px; font-size: 22px; font-weight: 700;">
        Password Changed Successfully
      </h2>
      <p style="font-size:15px; color:#d1d5db; line-height:1.6; margin-bottom:16px;">
        Hi <strong style="color:#ffffff;">${name}</strong>, your account password has been <strong>successfully updated</strong>.
      </p>

      <p style="font-size:14px; color:#9ca3af; line-height:1.6; margin-bottom:24px;">
        If you did not perform this action, please contact our support team
        <a href="mailto:info@blockvextrade.com"
           style="color:#00ff00; font-weight:bold; text-decoration:none;">
          immediately
        </a>.
      </p>

      <p style="font-size:12px; color:#6b7280; margin-top:20px;">
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
  const subject = "Your Password Has Been Reset - Blockvextrade";

  const content = `
    <div style="padding:20px 0; text-align:center;">
      <h2 style="color:#00ff00; margin-bottom:12px; font-size: 22px; font-weight: 700;">
        Password Reset Completed
      </h2>
      <p style="font-size:15px; color:#d1d5db; line-height:1.6; margin-bottom:16px;">
        Hi <strong style="color:#ffffff;">${name}</strong>, your password has been <strong>successfully reset</strong>.
      </p>

      <p style="font-size:14px; color:#9ca3af; line-height:1.6; margin-bottom:24px;">
        If you did not perform this action, please contact our support team
        <a href="mailto:info@blockvextrade.com"
           style="color:#00ff00; font-weight:bold; text-decoration:none;">
          immediately
        </a>.
      </p>

      <p style="font-size:12px; color:#6b7280; margin-top:20px;">
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
  const subject = isAdmin ? "New Deposit Request - Action Required" : "Deposit Request Received - Blockvextrade";
  
  const heading = isAdmin 
    ? "" 
    : `<h2 style="color:#00ff00; margin-bottom:12px; text-align:center;">Deposit Pending</h2>`;

  const message = isAdmin
    ? `<p style="font-size: 15px; color: #d1d5db;">A new deposit has been submitted by <strong style="color:#ffffff;">${userName}</strong> (<a href="mailto:${userEmail}" style="color:#00ff00;">${userEmail}</a>)</p>
       <p style="font-size: 15px; color: #9ca3af;">Please review and verify the transaction in the admin dashboard.</p>`
    : `<p style="font-size: 15px; color: #d1d5db; line-height: 1.6; margin-bottom: 12px;">
        Your deposit request of <strong style="color:#00ff00;">$${amount}</strong> has been received successfully. You will be notified once your deposit has been confirmed on our end, and it will be automatically credited to your account.
      </p>
      <p style="font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 24px;">
        Thank you for choosing Blockvextrade.
      </p>`;
 
  const content = `
    <div style="padding: 10px 0;">
      ${heading}
      <p style="font-size: 15px; color: #d1d5db; line-height: 1.6; margin-bottom: 12px;">
        Hi <strong style="color:#ffffff;">${name}</strong>,
      </p>
      ${message}
    </div>
    <table style="width:100%; border-collapse: collapse; margin:20px 0; border: 1px solid #14241a; border-radius: 8px; overflow: hidden; background: #000000;">
      <tr style="background-color:#080c09;"><td style="padding:12px; border:1px solid #14241a; font-weight: 600; color:#9ca3af;">Crypto</td><td style="padding:12px; border:1px solid #14241a; color:#ffffff;">${crypto}</td></tr>
      <tr><td style="padding:12px; border:1px solid #14241a; font-weight: 600; color:#9ca3af;">Amount (USD)</td><td style="padding:12px; border:1px solid #14241a; color:#00ff00; font-weight:700;">$${amount}</td></tr>
      <tr style="background-color:#080c09;"><td style="padding:12px; border:1px solid #14241a; font-weight: 600; color:#9ca3af;">Status</td><td style="padding:12px; border:1px solid #14241a; color: #00ff00; font-weight: 700;">${status.charAt(0).toUpperCase() + status.slice(1)}</td></tr>
      <tr><td style="padding:12px; border:1px solid #14241a; font-weight: 600; color:#9ca3af;">Date</td><td style="padding:12px; border:1px solid #14241a; color:#ffffff;">${new Date(date).toLocaleString()}</td></tr>
    </table>
  `;
  return await sendEmail({ to: email, subject, html: emailTemplate(content) });
}

export async function sendWithdrawalNotificationEmail({ email, name, crypto, amount, walletAddress, status, date, isAdmin = false, userName, userEmail }) {
  const subject = isAdmin ? "New Withdrawal Request - Action Required" : "Withdrawal Request Received - Blockvextrade";
  const message = isAdmin
    ? `<p style="font-size: 15px; color: #d1d5db;">A new withdrawal has been submitted by <strong style="color:#ffffff;">${userName}</strong> (<a href="mailto:${userEmail}" style="color:#00ff00;">${userEmail}</a>)</p>
       <p style="font-size: 15px; color: #9ca3af;">Please review and process this request in the admin dashboard.</p>`
    : `<p style="font-size: 15px; color: #d1d5db;">Your <strong style="color:#00ff00;">${crypto}</strong> withdrawal request of <strong style="color:#00ff00;">$${amount}</strong> to wallet <strong style="color:#ffffff; word-break:break-all;">${walletAddress}</strong> is currently <strong style="color:#00ff00;">${status}</strong>.</p>
       <p style="font-size: 14px; color: #9ca3af;">
         Once our team reviews and processes your request, you will receive a confirmation email.
       </p>`;

  const content = `
    <p style="font-size: 15px; color: #d1d5db; margin-bottom: 15px;">
      Hi <strong style="color:#ffffff;">${name}</strong>,
    </p>

    ${message}
    <table style="width:100%; border-collapse: collapse; margin:20px 0; border: 1px solid #14241a; border-radius: 8px; overflow: hidden; background: #000000;">
      <tr style="background-color:#080c09;"><td style="padding:12px; border:1px solid #14241a; font-weight: 600; color:#9ca3af;">Crypto</td><td style="padding:12px; border:1px solid #14241a; color:#ffffff;">${crypto}</td></tr>
      <tr><td style="padding:12px; border:1px solid #14241a; font-weight: 600; color:#9ca3af;">Amount (USD)</td><td style="padding:12px; border:1px solid #14241a; color:#00ff00; font-weight:700;">$${amount}</td></tr>
      <tr style="background-color:#080c09;"><td style="padding:12px; border:1px solid #14241a; font-weight: 600; color:#9ca3af;">Wallet Address</td><td style="padding:12px; border:1px solid #14241a; word-break: break-all; font-size: 13px; color:#ffffff;">${walletAddress}</td></tr>
      <tr><td style="padding:12px; border:1px solid #14241a; font-weight: 600; color:#9ca3af;">Status</td><td style="padding:12px; border:1px solid #14241a; color: #00ff00; font-weight: 700;">${status.charAt(0).toUpperCase() + status.slice(1)}</td></tr>
      <tr style="background-color:#080c09;"><td style="padding:12px; border:1px solid #14241a; font-weight: 600; color:#9ca3af;">Date</td><td style="padding:12px; border:1px solid #14241a; color:#ffffff;">${new Date(date).toLocaleString()}</td></tr>
    </table>
  `;
  return await sendEmail({ to: email, subject, html: emailTemplate(content) });
}

export async function sendVerificationEmail({ email, name, otp }) {
  const subject = "Verify Your Email Address - Blockvextrade";

  const content = `
    <div style="padding:10px 0; text-align:center;">
      <h2 style="color:#ffffff; margin-bottom:12px; font-size: 22px; font-weight: 700;">
        Verify Your Identity, ${name}
      </h2>
      <p style="color:#9ca3af; font-size:15px; line-height:1.6; margin-bottom: 24px;">
        Thank you for joining <strong style="color:#ffffff;">Blockvextrade</strong>! To complete your registration and secure your account, please verify your email address using the 6-digit verification code below:
      </p>

      <div style="margin:28px 0; text-align:center;">
        <span style="
          background: #000000;
          color: #00ff00;
          padding: 16px 40px;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: 10px;
          border: 2px solid #00ff00;
          border-radius: 14px;
          display: inline-block;
          font-family: 'Courier New', Courier, monospace;
          box-shadow: 0 0 25px rgba(0, 255, 0, 0.25);
        ">
          ${otp}
        </span>
      </div>

      <p style="color:#9ca3af; font-size:13px; margin-top: 16px;">
        This code is valid for <strong style="color:#00ff00;">15 minutes</strong>. Do not share this code with anyone.
      </p>
      <p style="font-size:12px; color:#6b7280; margin-top:24px;">
        If you did not register on Blockvextrade, you can safely ignore this email.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: emailTemplate(content),
  });
}
