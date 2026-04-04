import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import {
  sendContactEmail,
  sendContactAcknowledgementEmail,
} from "../../lib/mailer.js";

export const contactHandler = asyncHandler(async (req, res) => {
  const { name, email, question, comment } = req.body || {};

  if (!name || !email || !question || !comment) {
    return sendResponse(res, false, "All fields are required", 400);
  }

  sendContactEmail({ name, email, question, comment }).catch(err => {
    console.error("CONTACT_EMAIL_ERROR:", err);
  });
  sendContactAcknowledgementEmail({ name, email, question, comment }).catch(err => {
    console.error("CONTACT_ACKNOWLEDGEMENT_EMAIL_ERROR:", err);
  });

  return sendResponse(res, true, "Thank you for contacting us!", 200);
});
