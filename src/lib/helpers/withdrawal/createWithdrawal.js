import { v4 as uuidv4 } from "uuid";
import { client } from "../../sanity.js";
import { sendWithdrawalNotificationEmail } from "../../mailer.js";

export async function createWithdrawal({
  userId,
  userData,
  amount,
  fee,
  netAmount,
  wallet,
  crypto,
}) {
  const withdrawalId = uuidv4();
  const now = new Date().toISOString();

  const newWithdrawal = {
    _id: withdrawalId,
    _type: "withdrawal",
    user: { _type: "reference", _ref: userId },
    crypto: crypto,
    amount,
    fee,
    netAmount,
    walletAddress: wallet,
    status: "pending",
    requestedAt: now,
    updatedAt: now,
  };

  await client
    .transaction()
    .patch(userId, (patch) =>
      patch
        .setIfMissing({ reservedProfit: 0, availableProfit: 0 })
        .inc({ reservedProfit: amount, availableProfit: -amount })
    )
    .create(newWithdrawal)
    .commit();

  sendWithdrawalNotificationEmail({
    email: userData.email,
    name: userData.username || "User",
    crypto,
    amount,
    fee,
    netAmount,
    walletAddress: wallet,
    status: "Pending",
    date: now,
    isAdmin: false,
  }).catch(console.error);

  sendWithdrawalNotificationEmail({
    email: process.env.ADMIN_EMAIL,
    name: "Admin",
    crypto,
    amount,
    fee,
    netAmount,
    walletAddress: wallet,
    status: "Pending",
    date: now,
    isAdmin: true,
    userName: userData.username,
    userEmail: userData.email,
  }).catch(console.error);

  return {
    _id: withdrawalId,
    amount,
    fee,
    netAmount,
    crypto,
    walletAddress: wallet,
    status: "pending",
    requestedAt: now,
  };
}