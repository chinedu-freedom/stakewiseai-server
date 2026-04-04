import { v4 as uuidv4 } from "uuid";
import { logUserActivity } from "../../logUserActivity.js";
import { client } from "../../sanity.js";
import { sendWithdrawalNotificationEmail } from "../../mailer.js";

export async function createWithdrawal({
  userId,
  userData,
  cryptoType,
  amount,
  wallet,
}) {
  const withdrawalId = uuidv4();
  const now = new Date().toISOString();

  const newWithdrawal = {
    _id: withdrawalId,
    _type: "withdrawal",
    user: { _type: "reference", _ref: userId },
    crypto: cryptoType,
    amount,
    walletAddress: wallet,
    status: "pending",
    requestedAt: now,
  };

  // 🔒 ATOMIC TRANSACTION — NULL SAFE
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

  // Log withdrawal request
  await logUserActivity(
    userId,
    "Withdrawal",
    `Withdrawal request submitted — ${amount} ${cryptoType} to ${wallet} (ID: ${withdrawalId})`,
    "pending"
  );

  // Notify user
  sendWithdrawalNotificationEmail({
    email: userData.email,
    name: userData.fullName,
    crypto: cryptoType,
    amount,
    walletAddress: wallet,
    status: "Pending",
    date: now,
    isAdmin: false,
  }).catch(err => {
    console.error("USER_WITHDRAWAL_NOTIFICATION_ERROR:", err);
  });

  // Notify admin
  sendWithdrawalNotificationEmail({
    email: process.env.ADMIN_EMAIL,
    name: "Admin",
    crypto: cryptoType,
    amount,
    walletAddress: wallet,
    status: "Pending",
    date: now,
    isAdmin: true,
    userName: userData.fullName,
    userEmail: userData.email,
  }).catch(err => {
    console.error("ADMIN_WITHDRAWAL_NOTIFICATION_ERROR:", err);
  });

  return {
    _id: withdrawalId,
    crypto: cryptoType,
    amount,
    walletAddress: wallet,
    status: "pending",
    requestedAt: now,
  };
}
