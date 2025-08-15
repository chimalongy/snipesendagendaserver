import { google } from "googleapis";
import UploadSendingResult from "../utils/UploadSendingResult.js";
import { createOAuth2Client } from "../utils/googleFunctions.js";

export const defineEmailJob = (agenda) => {
  agenda.define("send-email", async (job) => {
    const {
      recipient,
      outbound_id,
      task_subject,
      task_body,
      task_name,
      sender_name,
      signature,
      task_type,
      user_id,
      task_id,
      sender_email,
      message_id, // Gmail API internal ID of the original email (not header Message-Id)
      access_token,
      refresh_token,
      thread_id,
    } = job.attrs.data;

    try {
      // Create OAuth2 client
      const oAuth2Client = createOAuth2Client(access_token, refresh_token);

      // Refresh token if needed and update credentials
      const { token: newToken } = await oAuth2Client.getAccessToken();
      if (newToken) {
        oAuth2Client.setCredentials({
          access_token: newToken,
          refresh_token,
        });
      }

      // Create Gmail API instance
      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

      // Format body and signature as HTML
      const formattedBody = task_body
        .replace(/\n/g, "<br>")
        .replace(/\s\s+/g, " ");

      const formattedSignature = signature
        .replace(/\n/g, "<br>")
        .replace(/\s\s+/g, " ");

      let emailContent;

      if (task_type !== "followup") {
        // ===== FIRST EMAIL =====
        console.log("this is a first outbound");

        emailContent = [
          `From: ${sender_name} <${sender_email}>`,
          `To: ${recipient}`,
          `Subject: ${task_subject}`,
          "MIME-Version: 1.0",
          "Content-Type: text/html; charset=UTF-8",
          "",
          `<!DOCTYPE html>
<html>
  <body>
    ${formattedBody}
    <br><br>
     ${formattedSignature || ""}
  </body>
</html>`,
        ].join("\n");

      } else {
        // ===== FOLLOW-UP EMAIL =====
        console.log("this is a follow up outbound");

        // 1. Fetch original email headers to get real Message-Id and Subject
        const original = await gmail.users.messages.get({
          userId: "me",
          id: message_id, // Gmail API internal message ID
          format: "metadata",
          metadataHeaders: ["Message-Id", "Subject"],
        });

        const headers = original.data.payload.headers;
        console.log(headers)
        const messageIdHeader = headers.find(h => h.name === "Message-Id")?.value;
        let originalSubject = headers.find(h => h.name === "Subject")?.value || task_subject;

        // Ensure subject starts with "Re:"
        if (!/^Re:/i.test(originalSubject)) {
          originalSubject = `Re: ${originalSubject}`;
        }

        if (!messageIdHeader) {
          throw new Error("Could not find Message-Id header from original email");
        }

        emailContent = [
          `From: ${sender_name} <${sender_email}>`,
          `To: ${recipient}`,
          `Subject: ${originalSubject}`,
          `In-Reply-To: ${messageIdHeader}`,
          `References: ${messageIdHeader}`,
          "MIME-Version: 1.0",
          "Content-Type: text/html; charset=UTF-8",
          "",
          `<!DOCTYPE html>
<html>
  <body>
    ${formattedBody}
    <br><br>
     ${formattedSignature || ""}
  </body>
</html>`,
        ].join("\n");
      }

      // Encode in Base64 (URL-safe)
      const rawMessage = Buffer.from(emailContent, "utf-8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      // Build request body
      const requestBody = { raw: rawMessage };
      if (task_type === "followup") {
        requestBody.threadId = thread_id;
      }

      // Send email
      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody,
      });

      if (task_type === "followup") {
        console.log(
          `Followup sent to ${recipient}: ${response.data.id} in thread ${thread_id}`
        );
      } else {
        console.log(
          `Email sent to ${recipient}: ${response.data.id} in thread ${response.data.threadId}`
        );
      }

      // Save success result
      await UploadSendingResult({
        user_id,
        outbound_id,
        task_id,
        task_name,
        sent_from: sender_email,
        receiver: recipient,
        message_id: response.data.id,
        thread_id: response.data.threadId,
        send_result: "SENT",
        send_time: new Date(),
      });

    } catch (error) {
      console.error(`Failed to send email to ${recipient}:`, error);

      // Save failure result
      await UploadSendingResult({
        user_id,
        outbound_id,
        task_id,
        task_name,
        sent_from: sender_email,
        receiver: recipient,
        message_id: null,
        thread_id: thread_id || null,
        send_result: "Failed: " + error.message,
        send_time: new Date(),
      });
    }
  });
};
