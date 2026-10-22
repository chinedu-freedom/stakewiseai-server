import { uploadImage } from "../../uploadImage.js";
import { sendResponse } from "../../response.js";
import { client } from "../../sanity.js";

const MIN_AMOUNT = 50;
const MAX_AMOUNT = 1_000_000;

export async function validateAndPrepareDeposit(req, user, res) {
  const userId = user?.userId;

  if (!userId) {
    sendResponse(res, false, "Unauthorized", 401);
    return null;
  }

  const userData = await client.fetch(
    `*[_type == "user" && _id == $userId][0]{
      _id,
      email,
      username,
      accountStatus
    }`,
    { userId }
  );

  if (!userData) {
    sendResponse(res, false, "User not found", 404);
    return null;
  }

  if (userData.accountStatus !== "active") {
    sendResponse(res, false, "Your account must be active to fund.", 403);
    return null;
  }

  const proofOfPayment = req.file;
  const { crypto, amount: amountRaw } = req.body;

  // Validate crypto
  if (!crypto) {
    sendResponse(res, false, "Crypto type is required", 400);
    return null;
  }

  // Validate amount presence
  if (!amountRaw) {
    sendResponse(res, false, "Amount is required", 400);
    return null;
  }

  const amount = Number(amountRaw);

  if (isNaN(amount)) {
    sendResponse(res, false, "Amount must be a valid number", 400);
    return null;
  }

  if (amount < MIN_AMOUNT) {
    sendResponse(
      res,
      false,
      `Minimum deposit is $${MIN_AMOUNT}`,
      400
    );
    return null;
  }

  if (amount > MAX_AMOUNT) {
    sendResponse(
      res,
      false,
      `Maximum deposit is $${MAX_AMOUNT}`,
      400
    );
    return null;
  }

  // Validate crypto list
  const allowedCryptos = ["USDT", "BTC", "ETH", "BNB", "TRX"];

  if (!allowedCryptos.includes(crypto)) {
    sendResponse(
      res,
      false,
      "Invalid crypto type. Allowed: USDT, BTC, ETH, BNB, TRX.",
      400
    );
    return null;
  }

  // Validate proof
  if (!proofOfPayment) {
    sendResponse(res, false, "Proof of funding is required", 400);
    return null;
  }

  // Upload proof
  const proofImageRef = await uploadImage(proofOfPayment);

  if (!proofImageRef) {
    sendResponse(res, false, "Failed to upload proof of payment", 500);
    return null;
  }

  return {
    userId,
    userData,
    crypto,
    amount,
    proofImageRef,
  };
}