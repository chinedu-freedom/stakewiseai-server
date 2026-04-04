import { sendResponse } from "../../lib/response.js";
import { client } from "../../lib/sanity.js";

export const withKycAuth = async (req, res, next) => {
  try {
    const user = req.user; // set by withAuth

    if (!user || !user.userId) {
      return sendResponse(res, false, "User not authenticated", 401);
    }

    const userId = user.userId;

    const kyc = await client.fetch(
      `*[_type=="kyc" && user._ref == $userId][0]{ status }`,
      { userId }
    );

    if (!kyc) {
      return sendResponse(
        res,
        false,
        "KYC not submitted. Please complete KYC before investing.",
        403
      );
    }

    if (kyc.status !== "approved") {
      const messages = {
        pending: "Your KYC is still pending approval. Please check back later.",
        rejected: "Your KYC was rejected. Please resubmit.",
      };

      return sendResponse(
        res,
        false,
        messages[kyc.status] || "KYC not approved.",
        403
      );
    }

    next();
  } catch (err) {
    console.error("KYC auth error:", err);
    return sendResponse(res, false, "Server error during KYC validation", 500);
  }
};
