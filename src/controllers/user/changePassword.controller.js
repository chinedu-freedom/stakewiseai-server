import { client } from "../../lib/sanity.js";
import { comparePasswords, hashPassword } from "../../lib/auth.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { sanitizeInput } from "../../lib/sanitizeInput.js";
import { sendResponse } from "../../lib/response.js";
import { sendPasswordChangeConfirmationEmail } from "../../lib/mailer.js";
import { validateFields } from "../../lib/validateFields.js";
import { logUserActivity } from "../../lib/logUserActivity.js";

// Helper: find active user by ID
const findUserById = async (userId) => {
  if (!userId) return null;
  const user = await client.fetch(
    `*[_type == "user" && _id == $userId && isDeleted != true][0]`,
    { userId }
  );
  return user || null;
};

// POST /change-password
export const changePasswordController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return sendResponse(res, false, "Unauthorized", 401);

  const body = req.body; // <-- FIXED
  const { currentPassword, newPassword } = sanitizeInput(body);

  if (!currentPassword || !newPassword) {
    return sendResponse(res, false, "Both current and new passwords are required", 400);
  }

  const validationError = validateFields(["password"], { password: newPassword });
  if (validationError) return sendResponse(res, false, validationError, 400);

  const dbUser = await findUserById(userId);
  if (!dbUser) return sendResponse(res, false, "User not found", 404);

  const isCurrentValid = await comparePasswords(currentPassword, dbUser.password);
  if (!isCurrentValid) {
    logUserActivity(userId, "Password Change", "Failed attempt — incorrect current password", "error").catch(console.error);
    return sendResponse(res, false, "Incorrect current password", 401);
  }

  const isSameAsOld = await comparePasswords(newPassword, dbUser.password);
  if (isSameAsOld) {
    logUserActivity(userId, "Password Change", "Failed attempt — new password same as old password", "error").catch(console.error);
    return sendResponse(res, false, "New password must be different from the old password", 400);
  }

  const hashedNewPassword = await hashPassword(newPassword);
  await client.patch(dbUser._id).set({
    password: hashedNewPassword,
    _updatedAt: new Date().toISOString(),
  }).commit();

    sendPasswordChangeConfirmationEmail(
      dbUser.email,
      dbUser.userName?.split(" ")[0] || "dear"
    ).catch(err => {
    console.error("Failed to send password change email:", err);
  });

  logUserActivity(userId, "Password Change", "Password updated successfully", "success").catch(console.error);

  return sendResponse(res, true, "Password updated successfully");
});
