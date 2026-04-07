import { client } from "../../lib/sanity.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import { sanitizeInput } from "../../lib/sanitizeInput.js";
// import { logUserActivity } from "../../lib/logUserActivity.js";

// GET - Fetch logged-in user's details
export const getUserProfileController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) return sendResponse(res, false, "Unauthorized: Please log in", 401);

  const query = `*[_type == "user" && role == "user" && _id == $userId][0]{
    _id,
    userName,
    email,
    country,
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
    _createdAt
  }`;

  const currentUser = await client.fetch(query, { userId });

  if (!currentUser) return sendResponse(res, false, "User not found", 404);

  // Compute availableProfit dynamically
  const availableProfit = (currentUser.totalProfit || 0) - (currentUser.reservedProfit || 0);

  return sendResponse(res, true, "User details fetched successfully", 200, {
    ...currentUser,
    availableProfit,
  });
});


// PATCH - Update user profile info (LOGGING REQUIRED)
export const updateUserProfileController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) return sendResponse(res, false, "Unauthorized: Please log in", 401);

  const body = req.body || {};
  const { country, state, city, address } = sanitizeInput(body);

  // await logUserActivity(
  //   userId,
  //   "Profile Update Attempt",
  //   "Attempt to update profile information",
  //   "pending"
  // );

  // if (!country && !state && !city && !address) {
  //   await logUserActivity(
  //     userId,
  //     "Profile Update Failed",
  //     "Profile update failed: No fields provided",
  //     "failed"
  //   );
  //   return sendResponse(res, false, "No fields provided to update", 400);
  // }

  try {
    await client
      .patch(userId)
      .set({
        ...(country && { country }),
        ...(state && { state }),
        ...(city && { city }),
        ...(address && { address }),
        _updatedAt: new Date().toISOString(),
      })
      .commit();

    // await logUserActivity(
    //   userId,
    //   "Profile Updated",
    //   "User profile updated successfully",
    //   "successful"
    // );

    return sendResponse(res, true, "Profile updated successfully", 200);
  } catch (err) {
    // await logUserActivity(
    //   userId,
    //   "Profile Update Failed",
    //   `Profile update error: ${err.message}`,
    //   "failed"
    // );

    return sendResponse(res, false, "Failed to update profile", 500, {
      details: err.message,
    });
  }
});
