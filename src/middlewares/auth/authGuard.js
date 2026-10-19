import { jwtVerify } from "jose";
import { client } from "../../lib/sanity.js";
import { sendResponse } from "../../lib/response.js";

export const withAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (token) {
      token = token.trim().replace(/^['"]+|['"]+$/g, "");
    }

    if (!token) {
      return sendResponse(res, false, "Unauthorized: Please log in", 401);
    }

    const secret = new TextEncoder().encode(String(process.env.JWT_SECRET || "").trim());

    const { payload } = await jwtVerify(token, secret);

    const currentUser = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{ accountStatus }`,
      { userId: payload.userId }
    );

    if (!currentUser) {
      return sendResponse(res, false, "User not found", 404);
    }

    if (currentUser.accountStatus !== "active") {
      return sendResponse(
        res,
        false,
        "Complete your account to access this feature.",
        403
      );
    }

    req.user = payload;
    next();
  } catch (err) {
    return sendResponse(res, false, "Invalid or expired token", 401);
  }
};
