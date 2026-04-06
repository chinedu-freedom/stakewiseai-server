import { v4 as uuidv4 } from "uuid";
import { client } from "../../sanity.js";
import { sendWithdrawalNotificationEmail } from "../../mailer.js";

export async function createWithdrawal({
  userId,
  userData,
  amount,
  wallet,
}) {
  const withdrawalId = uuidv4();
  const now = new Date().toISOString();

  const newWithdrawal = {
    _id: withdrawalId,
    _type: "withdrawal",
    user: { _type: "reference", _ref: userId },
    crypto: "USDT",
    amount,
    walletAddress: wallet,
    status: "pending",
    requestedAt: now,
  };

  // 🔒 Atomic transaction
  await client
    .transaction()
    // 1️⃣ Reserve profit safely
    .patch(userId, {
      setIfMissing: { reservedProfit: 0 },
      inc: { reservedProfit: amount },
    })
    // 2️⃣ Create withdrawal record
    .create(newWithdrawal)
    .commit();

  // Notify user (non-blocking)
  sendWithdrawalNotificationEmail({
    email: userData.email,
    name: userData.username || "User",
    crypto,
    amount,
    walletAddress: wallet,
    status: "Pending",
    date: now,
    isAdmin: false,
  }).catch((err) => {
    console.error("USER_WITHDRAWAL_NOTIFICATION_ERROR:", err);
  });

  // Notify admin (non-blocking)
  sendWithdrawalNotificationEmail({
    email: process.env.ADMIN_EMAIL,
    name: "Admin",
    crypto,
    amount,
    walletAddress: wallet,
    status: "Pending",
    date: now,
    isAdmin: true,
    userName: userData.username,
    userEmail: userData.email,
  }).catch((err) => {
    console.error("ADMIN_WITHDRAWAL_NOTIFICATION_ERROR:", err);
  });

  return {
    _id: withdrawalId,
    amount,
    walletAddress: wallet,
    status: "pending",
    requestedAt: now,
  };
}