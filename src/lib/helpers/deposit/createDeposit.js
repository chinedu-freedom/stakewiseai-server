import { client } from "../../sanity.js";
import { v4 as uuidv4 } from "uuid";
import { sendDepositNotificationEmail } from "../../mailer.js";
import { logUserActivity } from "../../logUserActivity.js";

export async function createDeposit({ userId, userData, crypto, amount, proofImageRef }) {
  if (!userData) throw new Error("User data missing for deposit creation");

  const depositId = uuidv4();

  const newFund = {
    _id: depositId,
    _type: "deposit",
    user: { _type: "reference", _ref: userId },
    crypto,
    amount,
    status: "pending",
    fundedAt: new Date().toISOString(),
    proofOfPayment: proofImageRef,
  };

  const createdFund = await client.create(newFund);

  // Log user activity
  await logUserActivity(
    userId,
    "Deposit request",
    `Deposit of ${amount} ${crypto} (Deposit ID: ${depositId}) created successfully`,
    "pending"
  );

  // Notify admin
  sendDepositNotificationEmail({
    email: process.env.ADMIN_EMAIL,
    name: "Admin",
    crypto,
    amount,
    status: "pending",
    date: new Date().toISOString(),
    isAdmin: true,
    userName: userData.fullName,
    userEmail: userData.email,
  }).catch(err => {
    console.error("ADMIN_DEPOSIT_NOTIFICATION_ERROR:", err);
  });

  // Notify user
  sendDepositNotificationEmail({
    email: userData.email,
    name: userData.fullName,
    crypto,
    amount,
    status: "pending",
    date: new Date().toISOString(),
  }).catch(err => {
    console.error("USER_DEPOSIT_NOTIFICATION_ERROR:", err);
  });

  return createdFund;
}
