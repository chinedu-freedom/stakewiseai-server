// zohoMailer.js
import axios from "axios";
import { getZohoAccessToken } from "./zohoToken.js"; // STEP 7

export async function sendEmail({ to, subject, html }) {
  try {
    const accessToken = await getZohoAccessToken();

    const url = `https://mail.zoho.com/api/accounts/${process.env.ZOHO_MAIL_ACCOUNT_ID}/messages`;

    await axios.post(
      url,
      {
        fromAddress: process.env.ZOHO_FROM_EMAIL,
        toAddress: to,
        subject,
        content: html,
        mailFormat: "html",
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Email sent successfully to ${to}`);
    return { success: true };
  } catch (err) {
    console.error("Zoho Mail API error:", err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
}
