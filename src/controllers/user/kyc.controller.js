import { client } from "../../lib/sanity.js";
import { uploadImage } from "../../lib/uploadImage.js";
import { sendResponse } from "../../lib/response.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { validateKycFields } from "../../lib/helpers/kyc/validateKycFields.js";
import { checkExistingKyc } from "../../lib/helpers/kyc/checkExistingKyc.js";
import { logUserActivity } from "../../lib/logUserActivity.js";

export const submitKycHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  const existingKyc = await client.fetch(
    `*[_type == "kyc" && user._ref == $userId][0]`,
    { userId }
  );

  const existingMessage = checkExistingKyc(existingKyc);
  if (existingMessage && existingKyc.status !== "rejected") {
    await logUserActivity(
      userId,
      "KYC Duplicate Submission Attempt",
      "Attempted to submit KYC while another submission exists."
    );
    return sendResponse(res, false, existingMessage, 400);
  }

  const {
    fullName,
    email,
    address,
    maritalStatus,
    dob,
    idType,
    idNumber,
  } = req.body;

  const idFront = req.files?.idFront?.[0];
  const idBack = req.files?.idBack?.[0];

  const validationError = validateKycFields({
    fullName,
    email,
    address,
    maritalStatus,
    dob,
    idType,
    idNumber,
    idFront,
    idBack,
  });

  if (validationError) {
    await logUserActivity(userId, "KYC Validation Failed", validationError);
    return sendResponse(res, false, validationError, 400);
  }

  // Upload images using the SAME helper as deposits
  const uploadedFront = await uploadImage(idFront);
  const uploadedBack = idBack ? await uploadImage(idBack) : null;

  const newKyc = {
    _type: "kyc",
    user: { _type: "reference", _ref: userId },
    fullName: fullName.trim(),
    email: email.trim(),
    address: address.trim(),
    maritalStatus: maritalStatus.toLowerCase(),
    dob,
    idType: idType.toLowerCase(),
    idNumber: idNumber.trim(),
    idFront: uploadedFront,
    ...(uploadedBack && { idBack: uploadedBack }),
    status: "pending",
    _createdAt: new Date().toISOString(),
  };

  const createdKyc = await client.create(newKyc);

  await logUserActivity(
    userId,
    "KYC Submitted",
    "KYC submitted successfully"
  );

  return sendResponse(res, true, "KYC submitted successfully", 201, createdKyc);
});



export const getUserKycHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  const kyc = await client.fetch(
    `*[_type == "kyc" && user._ref == $userId][0]{
      _id,
      fullName,
      email,
      address,
      maritalStatus,
      dob,
      idType,
      idNumber,
      "idFront": idFront.asset->url,
      "idBack": idBack.asset->url,
      status,
      rejectionReasons,
      _createdAt,
      _updatedAt
    }`,
    { userId }
  );

  if (!kyc) {
    return sendResponse(res, true, "No KYC submitted yet", 200, {
      status: "not_submitted"
    });
  }

  return sendResponse(res, true, "KYC fetched successfully", 200, kyc);
});

export const resubmitKycHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return sendResponse(res, false, "Unauthorized: Please log in", 401);

  // Fetch existing KYC
  const existingKyc = await client.fetch(
    `*[_type == "kyc" && user._ref == $userId][0]`,
    { userId }
  );

  if (!existingKyc) {
    await logUserActivity(userId, "KYC Resubmission Failed", "No previous KYC record exists.");
    return sendResponse(res, false, "No KYC found to resubmit", 404);
  }

  if (existingKyc.status !== "rejected") {
    await logUserActivity(userId, "KYC Resubmission Not Allowed", "Previous KYC not rejected.");
    return sendResponse(res, false, "You can only resubmit after rejection", 400);
  }

  // Extract form fields from body
  const { fullName, email, address, maritalStatus, dob, idType, idNumber } = req.body;
  const idFront = req.files?.idFront?.[0];
  const idBack = req.files?.idBack?.[0];

  const kycData = {
    fullName,
    email,
    address,
    maritalStatus,
    dob,
    idType,
    idNumber,
    idFront,
    idBack,
  };

  // Validate
  const validationError = validateKycFields(kycData);
  if (validationError) {
    await logUserActivity(userId, "Invalid KYC Information", validationError);
    return sendResponse(res, false, validationError, 400);
  }

  // Upload images (use the same uploadImage helper as deposits/KYC submission)
  const uploadedFront = idFront ? await uploadImage(idFront) : existingKyc.idFront;
  const uploadedBack = idBack ? await uploadImage(idBack) : existingKyc.idBack;

  const updatedKyc = {
    fullName,
    email,
    address,
    maritalStatus: maritalStatus.toLowerCase(),
    dob,
    idType: idType.toLowerCase(),
    idNumber,
    status: "pending",
    rejectionReasons: [],
    idFront: uploadedFront,
    idBack: uploadedBack,
    _updatedAt: new Date().toISOString(),
  };

  try {
    const patchedKyc = await client
      .patch(existingKyc._id)
      .set(updatedKyc)
      .commit();

    await logUserActivity(userId, "KYC Resubmitted Successfully", "KYC resubmitted and pending review");

    return sendResponse(res, true, "KYC resubmitted successfully", 200, patchedKyc);
  } catch (error) {
    console.error("❌ KYC Resubmission Error:", error);
    await logUserActivity(userId, "KYC Resubmission Error", error.message);
    return sendResponse(res, false, "Failed to resubmit KYC", 500, { details: error.message });
  }
});
