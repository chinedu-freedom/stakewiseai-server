import { validateAndPrepareDeposit } from "../lib/helpers/deposit/validateAndPrepareDeposit.js";
import { createDeposit } from "../lib/helpers/deposit/createDeposit.js";
import { sendResponse } from "../lib/response.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { client } from "../lib/sanity.js";
import { getPaginationParams, buildPaginationMeta } from "../lib/pagination.js";
import { v4 as uuidv4 } from "uuid";
import { sendDepositNotificationEmail } from "../lib/mailer.js";

// ─── OxaPay merchant static USDT TRC20 address ───────────────────────────────
// Replace with your actual OxaPay merchant address or upgrade to dynamic invoices
// via the OxaPay Invoice API: POST https://api.oxapay.com/merchants/request/invoice
const OXAPAY_STATIC_ADDRESS = process.env.OXAPAY_STATIC_ADDRESS || "TFoPJE6H5uHWV7X69EMavqyUxF9B1HnmwY";
const OXAPAY_MERCHANT_KEY   = process.env.OXAPAY_MERCHANT_KEY   || "";

export const createDepositHandler = async (req, res, next) => {
  try {
    const { user } = req;

    const prep = await validateAndPrepareDeposit(req, user, res);
    if (!prep) return; // response already sent

    const createdFund = await createDeposit(prep);

    return sendResponse(res, true, "Deposit created successfully", 201, createdFund);
  } catch (error) {
    next(error);
  }
};

export const getDepositHistoryHandler = asyncHandler(async (req, res) => {
  const { page, limit, start, end } = getPaginationParams(req);

  const totalItems = await client.fetch(
    `count(*[_type == "deposit"])`
  );

  const deposits = await client.fetch(
    `*[_type == "deposit"] | order(_createdAt desc) [${start}...${end}]{
      _id,
      amount,
      status,
      crypto,
      _createdAt
    }`
  );

  const pagination = buildPaginationMeta(totalItems, page, limit);

  return sendResponse(
    res,
    true,
    "Deposit history fetched successfully",
    200,
    {
      data: deposits,
      pagination,
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/deposits/oxapay-address
// Returns the deposit address for OxaPay automatic deposits.
// If OXAPAY_MERCHANT_KEY is set, creates a dynamic invoice via OxaPay API.
// Falls back to the merchant static addresses otherwise.
// ─────────────────────────────────────────────────────────────────────────────
export const getOxapayAddressHandler = asyncHandler(async (req, res) => {
  const { currency = "USDT", network = "TRC20" } = req.query;

  // If a merchant API key is configured, create a dynamic OxaPay invoice
  if (OXAPAY_MERCHANT_KEY) {
    let oxapayNetwork = network.toLowerCase();
    if (oxapayNetwork === 'bitcoin') oxapayNetwork = 'btc';
    if (oxapayNetwork === 'litecoin') oxapayNetwork = 'ltc';

    try {
      const invoiceRes = await fetch("https://api.oxapay.com/merchants/request/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: OXAPAY_MERCHANT_KEY,
          currency: currency.toUpperCase(),
          network: oxapayNetwork,
          // amount: null means 'open amount' — customer can send any value
          lifeTime: 60, // minutes
          feePaidByPayer: 0,
          underPaidCover: 2.5,
          callbackUrl: `${process.env.BACKEND_URL || "https://stakewiseai-server.onrender.com"}/api/deposits/oxapay-webhook`,
          returnUrl: `${process.env.FRONTEND_URL || ""}/index.html`,
          description: `GlobalStakeAI Deposit - ${currency.toUpperCase()} ${network}`,
        }),
      });
      const json = await invoiceRes.json();
      if (json.result === 100 && json.payAddress) {
        return sendResponse(res, true, "OxaPay address generated", 200, {
          address: json.payAddress,
          trackId: json.trackId,
          dynamic: true,
        });
      }
    } catch (err) {
      console.error("OXAPAY_INVOICE_ERROR:", err);
      // Fall through to static address
    }
  }

  // Fallback: merchant static addresses
  const STATIC_ADDRESSES = {
    'USDT_TRC20': process.env.OXAPAY_STATIC_ADDRESS || "TFoPJE6H5uHWV7X69EMavqyUxF9B1HnmwY",
    'USDT_BEP20': process.env.USDT_BEP20_ADDRESS || "0xYourBscFallbackAddressHere",
    'BTC_Bitcoin': process.env.BTC_ADDRESS || "bc1qYourBtcFallbackAddressHere",
    'LTC_Litecoin': process.env.LTC_ADDRESS || "ltc1qYourLtcFallbackAddressHere"
  };

  const key = `${currency}_${network}`;
  const address = STATIC_ADDRESSES[key] || STATIC_ADDRESSES['USDT_TRC20'];

  return sendResponse(res, true, "OxaPay static address", 200, {
    address,
    dynamic: false,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/deposits/oxapay-notify
// Called by the frontend when the user clicks "I've Sent the Payment".
// Creates a pending deposit record in Sanity and notifies admin.
// OxaPay will automatically confirm via webhook once the blockchain confirms.
// ─────────────────────────────────────────────────────────────────────────────
export const notifyOxapayPaymentHandler = asyncHandler(async (req, res) => {
  const { userId } = req.user || {};
  if (!userId) return sendResponse(res, false, "Unauthorized", 401);

  const { amount: amountRaw, crypto = "USDT", network = "TRC20", trackId } = req.body;
  const amount = Number(amountRaw);

  if (!amount || isNaN(amount) || amount < 100) {
    return sendResponse(res, false, "Minimum deposit is $100", 400);
  }

  // Fetch user info
  const userData = await client.fetch(
    `*[_type == "user" && _id == $userId][0]{ _id, email, username, accountStatus }`,
    { userId }
  );

  if (!userData) return sendResponse(res, false, "User not found", 404);
  if (userData.accountStatus !== "active") {
    return sendResponse(res, false, "Your account is not active", 403);
  }

  const depositId = uuidv4();
  const now = new Date().toISOString();
  const cryptoLabel = `${crypto} (${network})`;

  // Create a pending deposit record
  const newDeposit = {
    _id: depositId,
    _type: "deposit",
    user: { _type: "reference", _ref: userId },
    crypto: cryptoLabel,
    amount,
    status: "pending",
    fundedAt: now,
    method: "oxapay",
    notes: "Awaiting blockchain confirmation via OxaPay",
    trackId: trackId || null,
  };

  await client.create(newDeposit);

  // Non-blocking email notifications
  sendDepositNotificationEmail({
    email: process.env.ADMIN_EMAIL,
    name: "Admin",
    crypto: cryptoLabel,
    amount,
    status: "pending",
    date: now,
    isAdmin: true,
    userName: userData.username,
    userEmail: userData.email,
  }).catch((err) => console.error("OXAPAY_ADMIN_EMAIL_ERR:", err));

  sendDepositNotificationEmail({
    email: userData.email,
    name: userData.username || "User",
    crypto: cryptoLabel,
    amount,
    status: "pending",
    date: now,
  }).catch((err) => console.error("OXAPAY_USER_EMAIL_ERR:", err));

  return sendResponse(res, true, "Payment notification recorded. Your balance will be credited after confirmation.", 201, { depositId });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/deposits/oxapay-webhook
// Called by OxaPay when a payment is confirmed on the blockchain.
// Updates deposit status to 'approved' and credits the user's accountBalance.
// ─────────────────────────────────────────────────────────────────────────────
export const oxapayWebhookHandler = asyncHandler(async (req, res) => {
  const payload = req.body;

  // OxaPay sends status 1 = waiting, 2 = confirmed, 3 = expired
  if (payload?.status !== 2) {
    return res.status(200).json({ ok: true }); // acknowledge non-confirmed events
  }

  const paidAmount = Number(payload.amount) || 0;
  const trackId   = payload.trackId || "";

  // Find the pending deposit by trackId or amount (best effort matching)
  let pendingDeposit = null;

  if (trackId) {
    pendingDeposit = await client.fetch(
      `*[_type == "deposit" && status == "pending" && method == "oxapay" && trackId == $trackId] | order(_createdAt desc) [0]{ _id, user }`,
      { trackId }
    );
  }

  // Fallback if trackId is missing or no deposit is found (e.g., older static deposits)
  if (!pendingDeposit) {
    pendingDeposit = await client.fetch(
      `*[_type == "deposit" && status == "pending" && method == "oxapay" && amount == $amount] | order(_createdAt desc) [0]{ _id, user }`,
      { amount: paidAmount }
    );
  }

  if (!pendingDeposit) {
    console.warn("OXAPAY_WEBHOOK: No matching deposit found for amount", paidAmount);
    return res.status(200).json({ ok: true });
  }

  // Approve the deposit and credit the user's accountBalance
  await client
    .transaction()
    .patch(pendingDeposit._id, (p) => p.set({ status: "approved" }))
    .patch(pendingDeposit.user._ref, (p) => p.inc({ accountBalance: paidAmount }))
    .commit();

  console.log(`OXAPAY_WEBHOOK: Credited $${paidAmount} to user ${pendingDeposit.user._ref}`);
  return res.status(200).json({ ok: true });
});
