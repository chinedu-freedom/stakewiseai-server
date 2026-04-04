  import { uploadImage } from "../../uploadImage.js";
  import { sendResponse } from "../../response.js";
  import { logUserActivity } from "../../logUserActivity.js";
  import { client } from "../../sanity.js";

  const MIN_AMOUNT = 100;
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
        fullName,
        accountStatus
      }`,
      { userId }
    );

    if (!userData) {
      sendResponse(res, false, "User not found", 404);
      return null;
    }

    if (userData.accountStatus !== "active") {
      await logUserActivity(userId, "Deposit", "Account not active", "failed");
      sendResponse(res, false, "Your account must be active to fund.", 403);
      return null;
    }

    const proofOfPayment = req.file;
    const { crypto, amount: amountRaw } = req.body;

    if (!crypto) {
      await logUserActivity(userId, "Deposit", "Crypto type missing", "failed");
      sendResponse(res, false, "Crypto type is required", 400);
      return null;
    }

    if (!amountRaw) {
      await logUserActivity(userId, "Deposit", "Amount missing", "failed");
      sendResponse(res, false, "Amount is required", 400);
      return null;
    }

    const amount = Number(amountRaw);
    if (isNaN(amount)) {
      await logUserActivity(userId, "Deposit", "Invalid amount format", "failed");
      sendResponse(res, false, "Amount must be a valid number", 400);
      return null;
    }

    if (amount < MIN_AMOUNT) {
      await logUserActivity(userId, "Deposit", "Amount below minimum", "failed");
      sendResponse(res, false, `Minimum deposit is $${MIN_AMOUNT}`, 400);
      return null;
    }

    if (amount > MAX_AMOUNT) {
      await logUserActivity(userId, "Deposit", "Amount above maximum", "failed");
      sendResponse(res, false, `Maximum deposit is $${MAX_AMOUNT}`, 400);
      return null;
    }

    const allowedCryptos = ["USDT", "BTC", "ETH", "BNB", "TRX"];
    if (!allowedCryptos.includes(crypto)) {
      await logUserActivity(userId, "Deposit", "Invalid crypto type", "failed");
      sendResponse(
        res,
        false,
        "Invalid crypto type. Allowed: USDT, BTC, ETH, BNB, TRX.",
        400
      );
      return null;
    }

    if (!proofOfPayment) {
      await logUserActivity(userId, "Deposit", "Proof of payment missing", "failed");
      sendResponse(res, false, "Proof of funding is required", 400);
      return null;
    }

    const proofImageRef = await uploadImage(proofOfPayment);
    if (!proofImageRef) {
      await logUserActivity(userId, "Deposit", "Proof upload failed", "failed");
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
