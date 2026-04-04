import { client } from "../../sanity.js";

export async function getUserInfo(userId) {
  try {
    const userDoc = await client.fetch(
      `*[_type=="user" && _id == $userId][0]{ _id, fullName, email, accountBalance }`,
      { userId }
    );

    if (!userDoc) {
      return {
        success: false,
        message: "User not found",
        status: 404,
      };
    }

    return {
      success: true,
      message: "User fetched successfully",
      status: 200,
      data: userDoc,
    };
  } catch (error) {
    console.error("❌ getUserInfo error:", error);
    return {
      success: false,
      message: "Failed to fetch user info",
      status: 500,
      data: { details: error.message },
    };
  }
}
