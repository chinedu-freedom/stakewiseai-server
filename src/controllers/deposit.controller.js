import { sendResponse } from "../lib/response.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { client } from "../lib/sanity.js";
import { getPaginationParams, buildPaginationMeta } from "../lib/pagination.js";
import { v4 as uuidv4 } from "uuid";
import { sendDepositNotificationEmail } from "../lib/mailer.js";
import { logUserActivity } from "../lib/logUserActivity.js";
import crypto from "crypto";

// ─── OxaPay configuration ────────────────────────────────────────────────────
const OXAPAY_STATIC_ADDRESS = process.env.OXAPAY_STATIC_ADDRESS || "TFoPJE6H5uHWV7X69EMavqyUxF9B1HnmwY";
const OXAPAY_MERCHANT_KEY   = process.env.OXAPAY_MERCHANT_KEY   || "";

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
  const { currency = "USDT", network = "TRC20", amount } = req.body;

  // If a merchant API key is configured, create a dynamic OxaPay invoice
  if (OXAPAY_MERCHANT_KEY) {
    let oxapayNetwork = network.toLowerCase();
    if (oxapayNetwork === 'bitcoin') oxapayNetwork = 'btc';
    if (oxapayNetwork === 'litecoin') oxapayNetwork = 'ltc';

    try {
      const { userId } = req.user;
      const invoiceRes = await fetch("https://api.oxapay.com/merchants/request/whitelabel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: OXAPAY_MERCHANT_KEY,
          amount: Number(amount),
          payCurrency: currency.toUpperCase(),
          network: oxapayNetwork,
          feePaidByPayer: 0,
          callbackUrl: `${process.env.BACKEND_URL || "https://stakewiseai-server.onrender.com"}/api/deposits/oxapay-webhook`,
          description: `GlobalStakeAI Deposit - ${currency.toUpperCase()} ${network}`,
        }),
      });
      const json = await invoiceRes.json();
      
      const returnedAddress = json.payAddress || json.address;

      if (json.result === 100 && returnedAddress) {
        // CREATE PENDING DEPOSIT RECORD IMMEDIATELY
        const depositId = uuidv4();
        const now = new Date().toISOString();
        
        await client.create({
          _id: depositId,
          _type: "deposit",
          user: { _type: "reference", _ref: userId },
          crypto: currency.toUpperCase(),
          network: network,
          amount: Number(amount) || 0,
          status: "pending",
          fundedAt: now,
          notes: "Awaiting payment",
          trackId: String(json.trackId),
        });

        return sendResponse(res, true, "OxaPay address generated", 200, {
          address: returnedAddress,
          trackId: json.trackId,
          dynamic: true,
        });
      } else {
        console.error("OXAPAY_API_REJECTED:", json);
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

  const { amount: amountRaw, crypto: cryptoRaw = "USDT", network = "TRC20", trackId } = req.body;
  const amount = Number(amountRaw);

  if (!amount || isNaN(amount) || amount < 2) {
    return sendResponse(res, false, "Minimum deposit is $2", 400);
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

  const now = new Date().toISOString();
  const crypto = cryptoRaw.toUpperCase();
  const cryptoLabel = `${crypto} (${network})`;

  // UPDATE the existing pending deposit record (created in getOxapayAddressHandler)
  // instead of creating a duplicate
  let depositId = null;

  if (trackId) {
    const existing = await client.fetch(
      `*[_type == "deposit" && trackId == $trackId && status == "pending" && user._ref == $userId][0]{ _id }`,
      { trackId: String(trackId), userId }
    );

    if (existing) {
      // Update the existing record with the confirmed amount and notes
      await client.patch(existing._id)
        .set({
          amount,
          notes: "User confirmed payment sent — awaiting blockchain confirmation",
          updatedAt: now,
        })
        .commit();
      depositId = existing._id;
    }
  }

  // If no existing record found (e.g. static address fallback), create a new one
  if (!depositId) {
    depositId = uuidv4();
    await client.create({
      _id: depositId,
      _type: "deposit",
      user: { _type: "reference", _ref: userId },
      crypto,
      network,
      amount,
      status: "pending",
      fundedAt: now,
      notes: "User confirmed payment sent — awaiting blockchain confirmation",
      trackId: trackId || null,
    });
  }

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

  logUserActivity(
    userId,
    "Deposit Notification",
    `Notified deposit of $${amount} via ${cryptoLabel}`,
    "info"
  ).catch(console.error);

  return sendResponse(res, true, "Payment notification recorded. Your balance will be credited after confirmation.", 201, { depositId });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/deposits/oxapay-webhook
// Called by OxaPay when a payment is confirmed on the blockchain.
// Updates deposit status to 'successful' and credits the user's accountBalance.
// ─────────────────────────────────────────────────────────────────────────────
export const oxapayWebhookHandler = asyncHandler(async (req, res) => {
  const payload = req.body;
  const signature = req.headers["x-oxapay-signature"];

  console.log("OXAPAY_WEBHOOK_RECEIVED:", JSON.stringify(payload));

  // OPTIONAL: Verify signature if merchant key is available
  if (OXAPAY_MERCHANT_KEY && signature) {
    const hmac = crypto.createHmac("sha512", OXAPAY_MERCHANT_KEY);
    const expectedSignature = hmac.update(JSON.stringify(payload)).digest("hex");
    if (signature !== expectedSignature) {
      console.error("OXAPAY_WEBHOOK_INVALID_SIGNATURE");
      // Still return 200 to OxaPay to stop retries, but don't process
      return res.status(200).json({ ok: false, error: "Invalid signature" });
    }
  }

  // OxaPay sends status: 1 = waiting, 2 = confirmed, 3 = expired (for invoices)
  // For White-label/Static it sends strings: "Confirming", "Paid", "Expired"
  const rawStatus = payload?.status;
  
  if (rawStatus === 3 || rawStatus === "Expired") {
    console.warn(`OXAPAY_WEBHOOK: Payment expired/failed for TrackId: ${payload.trackId}`);
    return res.status(200).json({ ok: true });
  }

  if (rawStatus !== 2 && rawStatus !== "Paid") {
    console.log(`OXAPAY_WEBHOOK: Ignoring status ${rawStatus}`);
    return res.status(200).json({ ok: true });
  }

  const paidAmount = Number(payload.amount) || 0;
  const trackId   = payload.trackId ? String(payload.trackId) : "";
  const currency  = payload.currency || "USDT";

  console.log(`OXAPAY_WEBHOOK: Processing confirmed payment: $${paidAmount} ${currency} (TrackId: ${trackId})`);

  // Find the pending deposit by trackId or amount (best effort matching)
  let pendingDeposit = null;

  if (trackId) {
    pendingDeposit = await client.fetch(
      `*[_type == "deposit" && status == "pending" && trackId == $trackId] | order(_createdAt desc) [0]{ _id, user, amount }`,
      { trackId }
    );
  }

  // Fallback if trackId is missing or no deposit is found (e.g., static address deposits)
  if (!pendingDeposit) {
    console.log(`OXAPAY_WEBHOOK: No deposit found by trackId, trying amount match: ${paidAmount}`);
    pendingDeposit = await client.fetch(
      `*[_type == "deposit" && status == "pending" && amount == $amount] | order(_createdAt desc) [0]{ _id, user, amount }`,
      { amount: paidAmount }
    );
  }

  if (!pendingDeposit) {
    console.warn("OXAPAY_WEBHOOK_ERROR: No matching pending deposit found for amount", paidAmount, "and TrackID", trackId);
    return res.status(200).json({ ok: true });
  }

  if (!pendingDeposit.user || !pendingDeposit.user._ref) {
    console.error("OXAPAY_WEBHOOK_ERROR: Deposit found but user reference is missing", pendingDeposit);
    return res.status(200).json({ ok: true });
  }

  // Approve the deposit and credit the user's accountBalance
  try {
    // Use the actual paid amount from OxaPay (may differ slightly from requested)
    const creditAmount = paidAmount || pendingDeposit.amount || 0;

    const tx = client.transaction()
      .patch(pendingDeposit._id, (p) => p.set({ 
        status: "successful",
        amount: creditAmount,
        updatedAt: new Date().toISOString(),
        notes: `Confirmed via OxaPay Webhook (TrackId: ${trackId})`
      }))
      .patch(pendingDeposit.user._ref, (p) => 
        p.setIfMissing({ accountBalance: 0 }).inc({ accountBalance: creditAmount })
      );

    await tx.commit();

    // Send success email to user
    const userData = await client.fetch(`*[_id == $userId][0]{ email, username }`, { userId: pendingDeposit.user._ref });
    if (userData) {
      sendDepositNotificationEmail({
        email: userData.email,
        name: userData.username || "User",
        crypto: currency,
        amount: paidAmount,
        status: "successful",
        date: new Date().toISOString()
      }).catch(console.error);
    }

    logUserActivity(
      pendingDeposit.user._ref,
      "Deposit Confirmed",
      `Deposit of $${paidAmount} ${currency} confirmed and credited to account balance`,
      "success"
    ).catch(console.error);

    console.log(`OXAPAY_WEBHOOK_SUCCESS: Credited $${paidAmount} to user ${pendingDeposit.user._ref}`);
  } catch (err) {
    console.error("OXAPAY_WEBHOOK_TRANSACTION_ERROR:", err);
    throw err; 
  }

  return res.status(200).json({ ok: true });
});
