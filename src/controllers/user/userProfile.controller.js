import { client } from "../../lib/sanity.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import { uploadImage } from "../../lib/uploadImage.js";
import { logUserActivity } from "../../lib/logUserActivity.js";

// GET - Fetch logged-in user's details
export const getUserProfileController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) return sendResponse(res, false, "Unauthorized: Please log in", 401);

  const query = `*[_type == "user" && role == "user" && _id == $userId][0]{
    _id,
    username,
    email,
    country,
    image,
    "imageUrl": image.asset->url,
    state,
    city,
    countryCode,
    address,
    referralCode,
    referralCount,
    phoneNumber,
    accountStatus,
    accountBalance,
    totalProfit,
    reservedProfit,
    emailVerified,
    referralRewards,
    _createdAt
  }`;

  const currentUser = await client.fetch(query, { userId });

  if (!currentUser) return sendResponse(res, false, "User not found", 404);

  // Compute availableProfit dynamically
  const availableProfit = (currentUser.totalProfit || 0) - (currentUser.reservedProfit || 0);

  // Compute totalReferralEarnings
  const totalReferralEarnings = (currentUser.referralRewards || []).reduce(
    (sum, reward) => sum + (reward.amount || 0),
    0
  );

  return sendResponse(res, true, "User details fetched successfully", 200, {
    ...currentUser,
    availableProfit,
    totalReferralEarnings,
  });
});




export const updateUserProfileController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  const file = req.file;

  if (!file) {
    return sendResponse(res, false, "Image file is required", 400);
  }

  try {
    const image = await uploadImage(file);

    const updatedUser = await client
      .patch(userId)
      .set({
        image,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    const userWithUrl = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{
        image,
        "imageUrl": image.asset->url
      }`,
      { userId }
    );

    logUserActivity(
      userId,
      "Profile Updated",
      "Profile image updated successfully",
      "success"
    ).catch(console.error);

    return sendResponse(res, true, "Profile image updated successfully", 200, {
      image: updatedUser.image,
      imageUrl: userWithUrl?.imageUrl || null,
    });
  } catch (err) {
    return sendResponse(res, false, "Failed to update profile image", 500, {
      details: err.message,
    });
  }
});