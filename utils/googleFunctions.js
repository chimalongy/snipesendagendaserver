import { updateEmailSettings } from "./UpdateEmailSettings.js";

import { google } from "googleapis";




export function createOAuth2Client(accessToken, refreshToken) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oAuth2Client;
}




export async function refreshAccessToken(oAuth2Client, user_id, email) {
  try {
    // Get current token info
    const credentials = oAuth2Client.credentials;

    // Check if token is expired (expiry_date is in milliseconds)
    const now = Date.now();
    if (credentials.expiry_date && credentials.expiry_date > now) {
      // Token still valid
      return credentials.access_token;
    }

    // Token expired → get new token
    const tokenInfo = await oAuth2Client.getAccessToken();
    if (!tokenInfo?.token) {
      throw new Error("Unable to refresh access token");
    }

    const newToken = tokenInfo.token;

    // Update in DB
    

    await updateEmailSettings(user_id, email,"access_token", newToken)

    return newToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
}