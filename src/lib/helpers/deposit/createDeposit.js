import { client } from "../../sanity.js";
import { v4 as uuidv4 } from "uuid";
import { sendDepositNotificationEmail } from "../../mailer.js";

export async function createDeposit({
  userId,
  userData,
  crypto,
  amount,
  proofImageRef,
}) {
  if (!userData) {
    throw new Error("User data missing for deposit creation");
  }

  const depositId = uuidv4();
  const now = new Date().toISOString();

  const newFund = {
    _id: depositId,
    _type: "deposit",
    user: { _type: "reference", _ref: userId },
    crypto,
    amount,
    status: "pending",
    fundedAt: now,
    proofOfPayment: proofImageRef,
  };

  const createdFund = await client.create(newFund);

  // Notify admin (non-blocking)
  sendDepositNotificationEmail({
    email: process.env.ADMIN_EMAIL,
    name: "Admin",
    crypto,
    amount,
    status: "pending",
    date: now,
    isAdmin: true,
    userName: userData.username,
    userEmail: userData.email,
  }).catch((err) => {
    console.error("ADMIN_DEPOSIT_NOTIFICATION_ERROR:", err);
  });

  // Notify user (non-blocking)
  sendDepositNotificationEmail({
    email: userData.email,
    name: userData.username || "User",
    crypto,
    amount,
    status: "pending",
    date: now,
  }).catch((err) => {
    console.error("USER_DEPOSIT_NOTIFICATION_ERROR:", err);
  });

  return createdFund;
}