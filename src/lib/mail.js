// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   host: "smtp.zoho.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.ZOHO_USER,
//     pass: process.env.ZOHO_PASS
//   }
// });

// // --- Generic email sending function ---
// export async function sendEmail({ to, subject, html }) {
//   const mailOptions = {
//     from: `"Prime Chain" <${process.env.ZOHO_USER}>`,
//     to,
//     subject,
//     html,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log("Email sent successfully:", info.messageId);
//     return { success: true };
//   } catch (error) {
//     console.error("Email send error:", error);
//     return { success: false, error };
//   }
// }

// // --- DRY email template ---
// export function emailTemplate(content) {
//   return `
//   <div style="max-width:600px; margin:auto; font-family:Arial,sans-serif; border:1px solid #e5e5e5; border-radius:10px; overflow:hidden; background-color:#ffffff;">
//     <div style="background-color:#0b132b; padding:20px; text-align:center; display:flex; align-items:center; justify-content:center; gap:10px;">
//       <img src="https://yourdomain.com/images/prime_chain_logo.svg" alt="Prime Chain Logo" style="width:35px; height:35px; object-fit:contain;">
//       <h2 style="color:#ffffff; margin:0; font-size:20px;">Prime Chain</h2>
//     </div>

//     <div style="padding-right:30px; padding-left:30px; padding-bottom:10px;">
//       ${content}
//     </div>

//     <div style="background-color:#f9f9f9; padding:15px; text-align:center; font-size:12px; color:#888888;">
//       <p style="margin:0;">&copy; ${new Date().getFullYear()} Prime Chain. All rights reserved.</p>
//     </div>
//   </div>
//   `;
// }

// export async function sendPasswordResetEmail(email, name, otp) {
//   const subject = "Your OTP Code - Prime Chain";
//   const content = `
//     <p>Hi <strong>${name}</strong>,</p>
//     <p>You recently requested to reset your password. Use the OTP code below:</p>
//     <h2 style="background:#0d9488; color:#fff; display:inline-block; padding:6px 28px; border-radius:8px; letter-spacing:6px;">
//       ${otp}
//     </h2>
//     <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
//   `;
//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }

// export async function sendPasswordChangeConfirmationEmail(email, name) {
//   const subject = "Your Password Has Been Updated";
//   const content = `
//     <p>Hi <strong>${name}</strong>,</p>
//     <p>Your password has been <strong>successfully changed</strong>.</p>
//     <p>If you did not perform this action, contact our support immediately at <a href="mailto:support@primechain.com">support@primechain.com</a>.</p>
//     <div style="text-align:center; margin-top:30px;">
//       <a href="https://primechain.com/auth/sign-in" style="background:#0b132b; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none;">Go to Login</a>
//     </div>
//   `;
//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }

// export async function sendPasswordResetConfirmationEmail(email, name) {
//   const subject = "Your Password Has Been Reset";
//   const content = `
//     <p>Hi <strong>${name}</strong>,</p>
//     <p>Your password has been <strong>successfully reset</strong>.</p>
//     <p>If you did not perform this action, contact our support immediately at <a href="mailto:support@primechain.com">support@primechain.com</a>.</p>
//     <div style="text-align:center; margin-top:30px;">
//       <a href="https://primechain.com/auth/sign-in" style="background:#0b132b; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none;">Go to Login</a>
//     </div>
//   `;
//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }

// export async function sendVerificationEmail({ email, name, token }) {
//   const subject = "Verify Your Email - Prime Chain";
//   const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
//   const content = `
//     <h2>You're Almost There, ${name}!</h2>
//     <p>Welcome to <strong>Prime Chain</strong> – your gateway to secure investing. Verify your email to activate your account.</p>
//     <div style="text-align:center; margin:20px 0;">
//       <a href="${verificationLink}" style="background:#1e90ff; color:#fff; padding:14px 28px; border-radius:6px; text-decoration:none; font-weight:bold;">Verify My Email</a>
//     </div>
//     <p style="font-size:13px; color:#888;">This link will expire in <strong>10 minutes</strong>.</p>
//   `;
//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }

// export async function sendSubscriptionEmail({ email }) {
//   const subject = "Welcome to Prime Chain!";
//   const content = `
//     <h2>Thank you for subscribing to Prime Chain!</h2>
//     <p>We're excited to have you on board. As a subscriber, you'll be the first to know about:</p>
//     <ul>
//       <li>🚀 Investment updates</li>
//       <li>📈 New features</li>
//       <li>💰 Special offers</li>
//     </ul>
//     <p>Stay tuned for more!</p>
//     <p>Best regards,<br/>The Prime Chain Team</p>
//     <small style="color:#888;">You’re receiving this email because you subscribed on our website.</small>
//   `;
//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }

// export async function sendDepositNotificationEmail({ email, name, crypto, amount, status, date, isAdmin = false, userName, userEmail }) {
//   const subject = isAdmin ? "New Deposit Request - Action Required" : "Deposit Request Received - Prime Chain";
//   const message = isAdmin
//     ? `<p>A new deposit has been submitted by <strong>${userName}</strong> (<a href="mailto:${userEmail}">${userEmail}</a>).</p><p>Please review and verify the transaction in the admin dashboard.</p>`
//     : `<p>Your <strong>${crypto}</strong> deposit request of <strong>$${amount}</strong> is currently <strong>${status}</strong>.</p><p>Once verified, your deposit will be credited to your account.</p>`;
//   const buttonLink = isAdmin ? "https://primechain.com/admin/deposits" : "https://primechain.com/dashboard";
//   const buttonLabel = isAdmin ? "Review Deposit" : "View Deposit Status";

//   const content = `
//     <p>Hi <strong>${name}</strong>,</p>
//     ${message}
//     <table style="width:100%; border-collapse: collapse; margin:20px 0;">
//       <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Crypto</td><td style="padding:10px; border:1px solid #e5e7eb;">${crypto}</td></tr>
//       <tr><td style="padding:10px; border:1px solid #e5e7eb;">Amount (USD)</td><td style="padding:10px; border:1px solid #e5e7eb;">$${amount}</td></tr>
//       <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Status</td><td style="padding:10px; border:1px solid #e5e7eb;">${status.charAt(0).toUpperCase() + status.slice(1)}</td></tr>
//       <tr><td style="padding:10px; border:1px solid #e5e7eb;">Date</td><td style="padding:10px; border:1px solid #e5e7eb;">${new Date(date).toLocaleString()}</td></tr>
//     </table>
//     <div style="text-align:center; margin:30px 0;">
//       <a href="${buttonLink}" style="background:#0b132b; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">${buttonLabel}</a>
//     </div>
//   `;
//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }

// export async function sendWithdrawalNotificationEmail({ email, name, crypto, amount, walletAddress, status, date, isAdmin = false, userName, userEmail }) {
//   const subject = isAdmin ? "New Withdrawal Request - Action Required" : "Withdrawal Request Received - Prime Chain";
//   const message = isAdmin
//     ? `<p>A new withdrawal has been submitted by <strong>${userName}</strong> (<a href="mailto:${userEmail}">${userEmail}</a>).</p><p>Please review and process this request in the admin dashboard.</p>`
//     : `<p>Your <strong>${crypto}</strong> withdrawal request of <strong>$${amount}</strong> to wallet <strong>${walletAddress}</strong> is currently <strong>${status}</strong>.</p><p>Once processed, you will receive confirmation.</p>`;
//   const buttonLink = isAdmin ? "https://primechain.com/admin/withdrawals" : "https://primechain.com/dashboard";
//   const buttonLabel = isAdmin ? "Review Withdrawal" : "View Withdrawal Status";

//   const content = `
//     <p>Hi <strong>${name}</strong>,</p>
//     ${message}
//     <table style="width:100%; border-collapse: collapse; margin:20px 0;">
//       <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Crypto</td><td style="padding:10px; border:1px solid #e5e7eb;">${crypto}</td></tr>
//       <tr><td style="padding:10px; border:1px solid #e5e7eb;">Amount (USD)</td><td style="padding:10px; border:1px solid #e5e7eb;">$${amount}</td></tr>
//       <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Wallet Address</td><td style="padding:10px; border:1px solid #e5e7eb; word-break: break-word;">${walletAddress}</td></tr>
//       <tr><td style="padding:10px; border:1px solid #e5e7eb;">Status</td><td style="padding:10px; border:1px solid #e5e7eb;">${status.charAt(0).toUpperCase() + status.slice(1)}</td></tr>
//       <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Date</td><td style="padding:10px; border:1px solid #e5e7eb;">${new Date(date).toLocaleString()}</td></tr>
//     </table>
//     <div style="text-align:center; margin:30px 0;">
//       <a href="${buttonLink}" style="background:#0b132b; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">${buttonLabel}</a>
//     </div>
//   `;
//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }

// export async function sendContactEmail({ name, email, question, comment }) {
//   const subject = `New Contact Message - ${name}`;
//   const content = `
//     <h3>New Contact Submission</h3>
//     <p><strong>Name:</strong> ${name}</p>
//     <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
//     <p><strong>Question:</strong> ${question}</p>
//     <div style="white-space: pre-line; padding: 10px; background:#f5f5f5; border-radius:5px; margin:10px 0;">${comment}</div>
//     <p style="font-size:13px; color:#666;">Received on ${new Date().toLocaleString()}</p>
//   `;
//   return await sendEmail({ to: process.env.SUPPORT_EMAIL || "support@primechain.com", subject, html: emailTemplate(content) });
// }

// export async function sendContactAcknowledgementEmail({ name, email, question, comment }) {
//   const subject = "We’ve received your message - Prime Chain";
//   const content = `
//     <p>Hi <strong>${name}</strong>,</p>
//     <p>Thank you for reaching out. We've received your message and will respond within 24 hours.</p>
//     <div style="margin:20px 0; background:#f9fafb; padding:15px; border-radius:8px; border:1px solid #e5e7eb;">
//       <p><strong>Question:</strong> ${question}</p>
//       <p><strong>Message:</strong></p>
//       <p style="white-space: pre-line; margin-top:8px;">${comment}</p>
//     </div>
//     <p style="font-size:13px; color:#666;">We appreciate your patience and will get back to you soon.</p>
//   `;
//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }

// export async function sendLoanApplicationEmail({ email, name, plan, amount, repaymentDetails }) {
//   const { interestRate, totalRepayable, repaymentDate } = repaymentDetails;

//   const subject = "Loan Application Received - Prime Chain";

//   const content = `
//     <p style="margin-bottom:0;">Hi <strong>${name}</strong>,</p>
//     <p style="margin-top:3px;">Your loan request for the <strong>${plan.title}</strong> has been submitted. Here are the details:</p>

//     <table style="width:100%; border-collapse: collapse; margin:20px 0; font-family:Arial, sans-serif;">
//       <tr style="background-color:#f9fafb;">
//         <td style="padding:10px; border:1px solid #e5e7eb;"><b>Amount (USD)</b></td>
//         <td style="padding:10px; border:1px solid #e5e7eb;">$${amount}</td>
//       </tr>
//       <tr>
//         <td style="padding:10px; border:1px solid #e5e7eb;"><b>Duration</b></td>
//         <td style="padding:10px; border:1px solid #e5e7eb;">${plan.duration} days</td>
//       </tr>
//       <tr style="background-color:#f9fafb;">
//         <td style="padding:10px; border:1px solid #e5e7eb;"><b>Interest Rate</b></td>
//         <td style="padding:10px; border:1px solid #e5e7eb;">${interestRate}%</td>
//       </tr>
//       <tr>
//         <td style="padding:10px; border:1px solid #e5e7eb;"><b>Total Repayable</b></td>
//         <td style="padding:10px; border:1px solid #e5e7eb;">$${totalRepayable}</td>
//       </tr>
//       <tr style="background-color:#f9fafb;">
//         <td style="padding:10px; border:1px solid #e5e7eb;"><b>Repayment Date</b></td>
//         <td style="padding:10px; border:1px solid #e5e7eb;">${new Date(repaymentDate).toDateString()}</td>
//       </tr>
//     </table>

//     <p>Please fund your account with the required security deposit of <strong>$3000</strong> and contact support for loan approval.</p>

//     <div style="text-align:center; margin:30px 0;">
//       <a href="#" style="background:#0b132b; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Contact Support</a>
//     </div>

//     <p>Best regards,<br/>Prime Chain Loan Team</p>
//   `;

//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }




























// import nodemailer from "nodemailer";

import { emailTemplate } from "../../template.js";
import { sendEmail } from "../../zohoMailer.js";
// const transporter = nodemailer.createTransport({
//   host: "smtp.zoho.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.ZOHO_USER,
//     pass: process.env.ZOHO_PASS,
//   },
//   tls: {
//     rejectUnauthorized: true,
//   },
// });

// const transporter = nodemailer.createTransport({
//   host: "smtp.zoho.com",
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.ZOHO_USER,
//     pass: process.env.ZOHO_PASS,
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// });



// Email sending function 
// export async function sendEmail({ to, subject, html }) {
//   const mailOptions = {
//     from: `"Prime Chain" <${process.env.ZOHO_USER}>`,
//     to,
//     subject,
//     html,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log("Email sent successfully:", info.messageId);
//     return { success: true };
//   } catch (error) {
//   console.error("Email send error:", {
//     message: error.message,
//     code: error.code,
//     response: error.response,
//   });
//   return { success: false, error: error.message };
// }
// }

// Email template 
// export function emailTemplate(content) {
//   return `
//   <div style="max-width:600px; margin:auto; font-family:Arial,sans-serif; border:1px solid #e5e5e5; border-radius:10px; overflow:hidden; background-color:#ffffff;">
//     <div style="background-color:#0b132b; padding:20px; text-align:center; display:flex; align-items:center; justify-content:center; gap:10px;">
//       <h2 style="color:#ffffff; margin:0; font-size:20px;">Prime Chain</h2>
//       Simple. Secure. Smart Investing.
//     </div>

//     <div style="padding-right:30px; padding-left:30px; padding-bottom:10px;">
//       ${content}
//     </div>

//     <div style="background-color:#f9f9f9; padding:15px; text-align:center; font-size:12px; color:#888888;">
//       <p style="margin:0;">&copy; ${new Date().getFullYear()} Prime Chain. All rights reserved.</p>
//             <p style="margin:4px 0 0;">Your trusted investment partner.</p>

//     </div>
//   </div>
//   `;
// }

// export function emailTemplate(content) {
//   return `
//   <div style="
//     max-width: 600px;
//     margin: auto;
//     font-family: Arial, sans-serif;
//     border: 1px solid #e5e5e5;
//     border-radius: 10px;
//     overflow: hidden;
//     background-color: #ffffff;
//   ">
  
//     <div style="
//       background-color: #0b132b;
//       padding: 20px;
//       text-align: center;
//     ">
//       <h2 style="color: #ffffff; margin: 0; font-size: 24px;">Prime Chain</h2>
//       <p style="color: #ffffff; margin: 5px 0 0; font-size: 14px;">Simple. Secure. Smart Investing.</p>
//     </div>

//     <div style="
//       padding: 20px 30px 10px 30px;
//       font-size: 14px;
//       line-height: 1.5;
//       color: #333333;
//     ">
//       ${content}
//     </div>

//     <div style="
//       background-color: #f9f9f9;
//       padding: 15px;
//       text-align: center;
//       font-size: 12px;
//       color: #888888;
//     ">
//       <p style="margin: 0;">&copy; ${new Date().getFullYear()} Prime Chain. All rights reserved.</p>
//       <p style="margin: 4px 0 0;">Your trusted investment partner.</p>
//     </div>

//   </div>
//   `;
// }

// export async function sendVerificationEmail({ email, name, token }) {
//   const subject = "Verify Your Email - Prime Chain";

//   const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
  

//   const content = `
//     <div style="text-align:center; padding:30px 0;">
//       <h2 style="color:#0b132b; margin-bottom:10px;">
//         You're Almost There, ${name}!
//       </h2>

//       <p style="color:#444; font-size:16px; line-height:1.6;">
//         Welcome to <strong>Prime Chain</strong> — your gateway to secure and smarter investing.
//         To activate your account, please verify your email. It only takes a few seconds!

//       </p>

//       <div style="margin:30px 0;">
//         <a href="${verificationLink}"
//           style="background:#1e90ff; color:#ffffff; padding:14px 32px;
//                  border-radius:6px; text-decoration:none; font-weight:bold;
//                  display:inline-block;">
//           Verify My Email
//         </a>
//       </div>
//   <p style="margin-top: 20px; color: #666; font-size: 14px;">
//         By verifying, you’ll join <strong>120,000+ active investors</strong> already diversifying with Prime Chain.  
//         Don’t miss out on smarter opportunities.
//       </p>
//       <p style="font-size:14px; color:#666;">
//         This verification link will expire in <strong>10 minutes</strong>.
//       </p>

//       <p style="font-size:13px; color:#888; margin-top:20px;">
//         If you did not create a Prime Chain account, you can safely ignore this email.
//       </p>
//     </div>
//   `;

//   return await sendEmail({
//     to: email,
//     subject,
//     html: emailTemplate(content)
//   });
// }

// export async function sendPasswordResetEmail(email, name, otp) {
//   const subject = "Your OTP Code - Prime Chain";

//   const content = `
//     <p>Hi <strong>${name}</strong>,</p>

//     <p>
//       You recently requested to reset your password for your
//       <strong>Prime Chain</strong> account. Please use the OTP code below
//       to complete the process:
//     </p>

//     <div style="margin:24px 0; text-align:center;">
//       <span style="
//         background:#0d9488;
//         color:#ffffff;
//         padding:10px 32px;
//         font-size:20px;
//         font-weight:700;
//         letter-spacing:6px;
//         border-radius:8px;
//         display:inline-block;
//       ">
//         ${otp}
//       </span>
//     </div>

//     <p>
//       This OTP is valid for <strong>10 minutes</strong>.
//       For your security, do not share this code with anyone.
//     </p>

//     <p style="font-size:13px; color:#666;">
//       If you didn’t request a password reset, you can safely ignore this email.
//       Your account will remain secure.
//     </p>
//   `;

//   return await sendEmail({
//     to: email,
//     subject,
//     html: emailTemplate(content),
//   });
// }


// export async function sendPasswordChangeConfirmationEmail(email, name) {
//   const subject = "Your Password Has Been Updated";

//   const content = `
//     <div style="padding:30px 0; text-align:center;">
//       <p style="font-size:16px; color:#333; margin-bottom:16px;">
//         Hi <strong>${name}</strong>,
//       </p>

//       <p style="font-size:15px; color:#555; line-height:1.6; margin-bottom:20px;">
//         Your password has been <strong>successfully changed</strong>.
//       </p>

//       <p style="font-size:15px; color:#555; line-height:1.6; margin-bottom:24px;">
//         If you did not perform this action, please contact our support team
//         <a href="mailto:support@primechainpro.com"
//            style="color:#0b132b; font-weight:bold; text-decoration:none;">
//           immediately
//         </a>.
//       </p>

//       <div style="margin:30px 0;">
//         <a href="${process.env.FRONTEND_URL}/auth/sign-in"
//            style="background:#0b132b; color:#ffffff; padding:12px 26px;
//                   border-radius:6px; text-decoration:none; font-weight:bold;
//                   display:inline-block;">
//           Go to Login
//         </a>
//       </div>

//       <p style="font-size:13px; color:#888; margin-top:20px;">
//         If this was you, no further action is required.
//       </p>
//     </div>
//   `;

//   return await sendEmail({
//     to: email,
//     subject,
//     html: emailTemplate(content),
//   });
// }


// export async function sendPasswordResetConfirmationEmail(email, name) {
//   const subject = "Your Password Has Been Reset";

//   const content = `
//     <div style="padding:30px 0; text-align:center;">
//       <p style="font-size:16px; color:#333; margin-bottom:16px;">
//         Hi <strong>${name}</strong>,
//       </p>

//       <p style="font-size:15px; color:#555; line-height:1.6; margin-bottom:20px;">
//         Your password has been <strong>successfully reset</strong>.
//       </p>

//       <p style="font-size:15px; color:#555; line-height:1.6; margin-bottom:24px;">
//         If you did not perform this action, please contact our support team
//         <a href="mailto:support@primechainpro.com"
//            style="color:#0b132b; font-weight:bold; text-decoration:none;">
//           immediately
//         </a>.
//       </p>

//       <div style="margin:30px 0;">
//         <a href="${process.env.FRONTEND_URL}/auth/sign-in"
//            style="background:#0b132b; color:#ffffff; padding:12px 26px;
//                   border-radius:6px; text-decoration:none; font-weight:bold;
//                   display:inline-block;">
//           Go to Login
//         </a>
//       </div>

//       <p style="font-size:13px; color:#888; margin-top:20px;">
//         If this was you, no further action is required.
//       </p>
//     </div>
//   `;

//   return await sendEmail({
//     to: email,
//     subject,
//     html: emailTemplate(content),
//   });
// }



// export async function sendSubscriptionEmail({ email }) {
//   const subject = "Welcome to Prime Chain!";
//   const content = `
//     <h2>Thank you for subscribing to Prime Chain!</h2>
//     <p>We're excited to have you on board. As a subscriber, you'll be the first to know about:</p>
//     <ul>
//       <li>🚀 Investment updates</li>
//       <li>📈 New features</li>
//       <li>💰 Special offers</li>
//     </ul>
//     <p>Stay tuned for more!</p>
//     <p>Best regards,<br/>The Prime Chain Team</p>
//     <small style="color:#888;">You’re receiving this email because you subscribed on our website.</small>
//   `;
//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }

// export async function sendDepositNotificationEmail({ email, name, crypto, amount, status, date, isAdmin = false, userName, userEmail }) {
//   const subject = isAdmin ? "New Deposit Request - Action Required" : "Deposit Request Received - Prime Chain";
//   const message = isAdmin
//     ? `<p style="font-size: 15px; color: #333;">A new deposit has been submitted by <strong>${userName}</strong> || <a href="mailto:${userEmail}">${userEmail}</a> </p>
//     <p style="font-size: 15px; color: #333;">Please review and verify the transaction in the admin dashboard.</p>`
//     : `<p style="font-size: 15px; color: #555;">Your <strong>${crypto}</strong> deposit request of <strong>$${amount}</strong> is currently <strong>${status}</strong>.</p>
//       <p style="font-size: 15px; color: #555;">
//         Once our team verifies your payment, your deposit will be credited to your account. You’ll receive another confirmation when this happens.
//       </p>
//     `;
//   // const buttonLink = isAdmin
//   //  ?
//   //  `${process.env.ADMIN_FRONTEND_URL}/admin/transactions/deposits`
//   //  : 
//   //  `${process.env.FRONTEND_URL}/user/fund-account`;

//   // const buttonLabel = isAdmin
//   //  ?
//   //  "Review Deposit" : "View Deposit Status";

//   const content = `
//      <p style="font-size: 16px; color: #333333; margin-bottom: 15px;">
//         Hi <strong>${name}</strong>,
//       </p>
//     ${message}
//     <table style="width:100%; border-collapse: collapse; margin:20px 0;">
//       <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Crypto</td><td style="padding:10px; border:1px solid #e5e7eb;">${crypto}</td></tr>
//       <tr><td style="padding:10px; border:1px solid #e5e7eb;">Amount (USD)</td><td style="padding:10px; border:1px solid #e5e7eb;">$${amount}</td></tr>
//       <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Status</td><td style="padding:10px; border:1px solid #e5e7eb;">${status.charAt(0).toUpperCase() + status.slice(1)}</td></tr>
//       <tr><td style="padding:10px; border:1px solid #e5e7eb;">Date</td><td style="padding:10px; border:1px solid #e5e7eb;">${new Date(date).toLocaleString()}</td></tr>
//     </table>
//     `;
//     // <div style="text-align: center; margin: 30px 0;">
//     //     <a href="${buttonLink}" style="background-color: #0b132b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 15px; font-weight: bold; display: inline-block;">
//     //       ${buttonLabel}
//     //     </a>
//     //   </div>
//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }

// export async function sendWithdrawalNotificationEmail({ email, name, crypto, amount, walletAddress, status, date, isAdmin = false, userName, userEmail }) {
//   const subject = isAdmin ? "New Withdrawal Request - Action Required" : "Withdrawal Request Received - Prime Chain";
//   const message = isAdmin
//     ? `<p  style="font-size: 15px; color: #333;">A new withdrawal has been submitted by <strong>${userName}</strong>  <a href="mailto:${userEmail}">${userEmail}</a>
//     </p><p  style="font-size: 15px; color: #333;">Please review and process this request in the admin dashboard.</p>`
//     : `<p  style="font-size: 15px; color: #555;">Your <strong>${crypto}</strong> withdrawal request of <strong>$${amount}</strong> to wallet <strong>${walletAddress}</strong> is currently <strong>${status}</strong>.</p>
//     <p style="font-size: 15px; color: #555;">
//     Once our team reviews and processes your request, you will receive a confirmation email.
//     </p>
//     `;

//   const content = `
//        <p style="font-size: 16px; color: #333333; margin-bottom: 15px;">
//         Hi <strong>${name}</strong>,
//       </p>

//     ${message}
//     <table style="width:100%; border-collapse: collapse; margin:20px 0;">
//       <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Crypto</td><td style="padding:10px; border:1px solid #e5e7eb;">${crypto}</td></tr>
//       <tr><td style="padding:10px; border:1px solid #e5e7eb;">Amount (USD)</td><td style="padding:10px; border:1px solid #e5e7eb;">$${amount}</td></tr>
//       <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Wallet Address</td><td style="padding:10px; border:1px solid #e5e7eb; word-break: break-word;">${walletAddress}</td></tr>
//       <tr><td style="padding:10px; border:1px solid #e5e7eb;">Status</td><td style="padding:10px; border:1px solid #e5e7eb;">${status.charAt(0).toUpperCase() + status.slice(1)}</td></tr>
//       <tr style="background-color:#f9fafb;"><td style="padding:10px; border:1px solid #e5e7eb;">Date</td><td style="padding:10px; border:1px solid #e5e7eb;">${new Date(date).toLocaleString()}</td></tr>
//     </table>
//   `;
//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }

// export async function sendContactEmail({ name, email, question, comment }) {
//   const subject = `New Contact Message - ${name}`;
//   const content = `
//     <h3>New Contact Submission</h3>
//     <p><strong>Name:</strong> ${name}</p>
//     <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
//     <p><strong>Question:</strong> ${question}</p>
//     <div style="white-space: pre-line; padding: 10px; background:#f5f5f5; border-radius:5px; margin:10px 0;">${comment}</div>
//     <p style="font-size:13px; color:#666;">Received on ${new Date().toLocaleString()}</p>
//   `;
//   return await sendEmail({ to: process.env.SUPPORT_EMAIL || "support@primechain.com", subject, html: emailTemplate(content) });
// }

// export async function sendContactAcknowledgementEmail({ name, email, question, comment }) {
//   const subject = "We’ve received your message - Prime Chain";
//   const content = `
//     <p>Hi <strong>${name}</strong>,</p>
//     <p>Thank you for reaching out. We've received your message and will respond within 24 hours.</p>
//     <div style="margin:20px 0; background:#f9fafb; padding:15px; border-radius:8px; border:1px solid #e5e7eb;">
//       <p><strong>Question:</strong> ${question}</p>
//       <p><strong>Message:</strong></p>
//       <p style="white-space: pre-line; margin-top:8px;">${comment}</p>
//     </div>
//     <p style="font-size:13px; color:#666;">We appreciate your patience and will get back to you soon.</p>
//   `;
//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }

// export async function sendLoanApplicationEmail({ email, name, plan, amount, repaymentDetails }) {
//   const { interestRate, totalRepayable, repaymentDate } = repaymentDetails;

//   const subject = "Loan Application Received - Prime Chain";

//   const content = `
//     <p style="margin-bottom:0;">Hi <strong>${name}</strong>,</p>
//     <p style="margin-top:3px;">Your loan request for the <strong>${plan.title}</strong> has been submitted. Here are the details:</p>

//     <table style="width:100%; border-collapse: collapse; margin:20px 0; font-family:Arial, sans-serif;">
//       <tr style="background-color:#f9fafb;">
//         <td style="padding:10px; border:1px solid #e5e7eb;"><b>Amount (USD)</b></td>
//         <td style="padding:10px; border:1px solid #e5e7eb;">$${amount}</td>
//       </tr>
//       <tr>
//         <td style="padding:10px; border:1px solid #e5e7eb;"><b>Duration</b></td>
//         <td style="padding:10px; border:1px solid #e5e7eb;">${plan.duration} days</td>
//       </tr>
//       <tr style="background-color:#f9fafb;">
//         <td style="padding:10px; border:1px solid #e5e7eb;"><b>Interest Rate</b></td>
//         <td style="padding:10px; border:1px solid #e5e7eb;">${interestRate}%</td>
//       </tr>
//       <tr>
//         <td style="padding:10px; border:1px solid #e5e7eb;"><b>Total Repayable</b></td>
//         <td style="padding:10px; border:1px solid #e5e7eb;">$${totalRepayable}</td>
//       </tr>
//       <tr style="background-color:#f9fafb;">
//         <td style="padding:10px; border:1px solid #e5e7eb;"><b>Repayment Date</b></td>
//         <td style="padding:10px; border:1px solid #e5e7eb;">${new Date(repaymentDate).toDateString()}</td>
//       </tr>
//     </table>

//     <p>Please fund your account with the required security deposit of <strong>$3000</strong> and contact support for loan approval.</p>

//     <div style="text-align:center; margin:30px 0;">
//       <a href="#" style="background:#0b132b; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Contact Support</a>
//     </div>

//     <p>Best regards,<br/>Prime Chain Loan Team</p>
//   `;

//   return await sendEmail({ to: email, subject, html: emailTemplate(content) });
// }




