import { client } from "../lib/sanity.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sendResponse } from "../lib/response.js";
import { sanitizeInput } from "../lib/sanitizeInput.js";
import { validateFields } from "../lib/validateFields.js";

const MAX_WALLETS_PER_USER = 5;

const ALLOWED_CRYPTOS = [
  "BTC_BITCOIN",
  "BNB_BEP20",
  "ETH_ERC20",
  "USDT_TRC20",
  "USDT_ERC20",
];

export const addWalletController = asyncHandler(async (req, res) => {
  const { user } = req;

  if (!user?.userId) {
    return sendResponse(res, false, "Unauthorized", 401);
  }

  const sanitized = sanitizeInput(req.body);
  const { crypto, walletAddress, label } = sanitized;

  const validationError = validateFields(
    ["crypto", "walletAddress"],
    { crypto, walletAddress }
  );

  if (validationError) {
    return sendResponse(res, false, validationError, 400);
  }

  const wallet = walletAddress.trim();
  const cryptoType = crypto.toUpperCase();

  if (!ALLOWED_CRYPTOS.includes(cryptoType)) {
    return sendResponse(res, false, "Invalid cryptocurrency", 400);
  }

  const walletCount = await client.fetch(
    `count(*[_type=="wallet" && user._ref==$userId])`,
    { userId: user.userId }
  );

  if (walletCount >= MAX_WALLETS_PER_USER) {
    return sendResponse(
      res,
      false,
      `Maximum of ${MAX_WALLETS_PER_USER} wallets allowed`,
      400
    );
  }

  const existingWallet = await client.fetch(
    `*[_type=="wallet" && user._ref==$userId && crypto==$crypto && walletAddress==$wallet][0]`,
    {
      userId: user.userId,
      crypto: cryptoType,
      wallet,
    }
  );

  if (existingWallet) {
    return sendResponse(
      res,
      false,
      "This wallet already exists for this network",
      400
    );
  }

  const now = new Date().toISOString();

  const newWallet = await client.create({
    _type: "wallet",
    user: { _type: "reference", _ref: user.userId },
    crypto: cryptoType,
    walletAddress: wallet,
    label: label || "",
    createdAt: now,
    updatedAt: now,
  });

  return sendResponse(res, true, "Wallet added successfully", 201, newWallet);
});


export const getUserWalletsController = asyncHandler(async (req, res) => {
  const { user } = req;

  if (!user?.userId) {
    return sendResponse(res, false, "Unauthorized", 401);
  }

  const wallets = await client.fetch(
    `*[_type=="wallet" && user._ref==$userId] | order(createdAt desc)`,
    { userId: user.userId }
  );

  return sendResponse(res, true, "Wallets fetched successfully", 200, wallets);
});


export const updateWalletController = asyncHandler(async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  if (!user?.userId) {
    return sendResponse(res, false, "Unauthorized", 401);
  }

  if (!id) {
    return sendResponse(res, false, "Wallet ID is required", 400);
  }

  const sanitized = sanitizeInput(req.body);
  const { crypto, walletAddress, label } = sanitized;

  const existingWallet = await client.fetch(
    `*[_type=="wallet" && _id==$id && user._ref==$userId][0]`,
    { id, userId: user.userId }
  );

  if (!existingWallet) {
    return sendResponse(res, false, "Wallet not found", 404);
  }

  const updateFields = {};

  if (crypto) {
    const cryptoType = crypto.toUpperCase();

    if (!ALLOWED_CRYPTOS.includes(cryptoType)) {
      return sendResponse(res, false, "Invalid cryptocurrency", 400);
    }

    updateFields.crypto = cryptoType;
  }

  if (walletAddress) {
    updateFields.walletAddress = walletAddress.trim();
  }

  if (typeof label !== "undefined") {
    updateFields.label = label;
  }

  if (updateFields.crypto || updateFields.walletAddress) {
    const finalCrypto = updateFields.crypto || existingWallet.crypto;
    const finalWallet =
      updateFields.walletAddress || existingWallet.walletAddress;

    const duplicate = await client.fetch(
      `*[_type=="wallet" && user._ref==$userId && crypto==$crypto && walletAddress==$wallet && _id != $id][0]`,
      {
        userId: user.userId,
        crypto: finalCrypto,
        wallet: finalWallet,
        id,
      }
    );

    if (duplicate) {
      return sendResponse(
        res,
        false,
        "Another wallet with same address & network already exists",
        400
      );
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return sendResponse(res, false, "No changes detected", 400);
  }

  updateFields.updatedAt = new Date().toISOString();

  const updatedWallet = await client
    .patch(id)
    .set(updateFields)
    .commit();

  return sendResponse(res, true, "Wallet updated successfully", 200, updatedWallet);
});


export const deleteWalletController = asyncHandler(async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  if (!user?.userId) {
    return sendResponse(res, false, "Unauthorized", 401);
  }

  if (!id) {
    return sendResponse(res, false, "Wallet ID is required", 400);
  }

  const wallet = await client.fetch(
    `*[_type=="wallet" && _id==$id && user._ref==$userId][0]`,
    { id, userId: user.userId }
  );

  if (!wallet) {
    return sendResponse(res, false, "Wallet not found", 404);
  }

  await client.delete(id);

  return sendResponse(res, true, "Wallet deleted successfully", 200);
});