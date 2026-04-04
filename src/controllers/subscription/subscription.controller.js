import { client } from "../../lib/sanity.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import { sanitizeInput } from "../../lib/sanitizeInput.js";
import { validateFields } from "../../lib/validateFields.js";
import { sendSubscriptionEmail } from "../../lib/mailer.js";

export const createSubscriptionHandler = asyncHandler(async (req, res) => {
  const { email } = sanitizeInput(req.body || {});

  // Validate required fields
  const validationError = validateFields(["email"], { email });
  if (validationError) {
    return sendResponse(res, false, validationError, 400);
  }

  // Basic email format validation
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isValidEmail) {
    return sendResponse(res, false, "Invalid email format", 400);
  }

  // Check if already subscribed
  const existingSubscriber = await client.fetch(
    `*[_type == "subscriber" && email == $email][0]`,
    { email }
  );

  if (existingSubscriber) {
    return sendResponse(res, false, "Email already subscribed", 400);
  }

  // Create subscriber
  const newSubscriber = await client.create({
    _type: "subscriber",
    email,
    subscribedAt: new Date().toISOString(),
  });

sendSubscriptionEmail({ email }).catch(err => {
  console.error("MAIL_ERROR:", err);
});


  return sendResponse(res, true, "Subscription successful", 201, {
    subscriberId: newSubscriber._id,
    email: newSubscriber.email,
    subscribedAt: newSubscriber.subscribedAt,
  });
});
