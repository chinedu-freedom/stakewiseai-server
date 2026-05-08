import { asyncHandler } from "../../lib/asyncHandler.js";
import { sendResponse } from "../../lib/response.js";
import { client } from "../../lib/sanity.js";

export const getReferralConfigController = asyncHandler(async (req, res) => {
  const referralConfig = await client.fetch(`*[_type == "referralConfig"][0]`);
  
  const config = {
    level1: referralConfig?.level1 || 10,
    level2: referralConfig?.level2 || 5,
    level3: referralConfig?.level3 || 1,
  };

  return sendResponse(res, true, "Referral configuration fetched successfully", 200, config);
});
