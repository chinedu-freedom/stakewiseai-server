import { sendResponse } from "./response.js";

export const asyncHandler = (fn) => async (req, res, ...args) => {
  try {
    return await fn(req, res, ...args);
  } catch (error) {
    console.error("Error caught in asyncHandler:", error);

    const message =
      error.message && !error.message.includes("Unexpected")
        ? error.message
        : "Something went wrong, please try again later";

    const status = error.status || 500;

    // Correctly send response with res
    return sendResponse(res, false, message, status);
  }
};
