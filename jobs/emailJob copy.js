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
      message_id,
      access_token,
      refresh_token,
      thread_id,
      // thread_id, // optional: pass this if replying to an existing thread
    } = job.attrs.data;

    try {
      // Create OAuth2 client
      const oAuth2Client = createOAuth2Client(access_token, refresh_token);

      // Refresh token if needed
      await oAuth2Client.getAccessToken();

      // Create Gmail API instance
      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

      // Format email body with HTML tags
      const formattedBody = task_body
        .replace(/\n/g, "<br>") // replace newlines with HTML line breaks
        .replace(/\s\s+/g, " "); // collapse multiple spaces if needed

      const formattedSignature = signature
        .replace(/\n/g, "<br>") // replace newlines with HTML line breaks
        .replace(/\s\s+/g, " "); // collapse multiple spaces if needed

      let emailContent;

      if (task_type !== "followup") {
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
        console.log("this is a follow up outbound");
        emailContent = [
          `From: ${sender_name} <${sender_email}>`,
          `To: ${recipient}`,
          `Subject: ${task_subject}`, // add "Re:" if replying
          `In-Reply-To: <${message_id}>`,
          `References: <${message_id}>`,
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

      // Send email via Gmail API (threadId included if replying)
      const requestBody = { raw: rawMessage };
      if (task_type == "followup") {
        console.log("FOLLOWUP THREAD ID=: " + thread_id);
        requestBody.threadId = thread_id;
      }

      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody,
      });

      if (task_type == "followup") {
        console.log(
          `Followup sent to ${recipient}: ${response.data.id} in thread ${thread_id}`
        );
      } else {
        console.log(
          `Email sent to ${recipient}: ${response.data.id} in thread ${response.data.threadId}`
        );
      }
      // Save success result with thread info
      await UploadSendingResult({
        user_id,
        outbound_id,
        task_id,
        task_name,
        sent_from: sender_email,
        receiver: recipient,
        message_id: response.data.id,
        thread_id: response.data.threadId, // store for future replies
        send_result: "SENT",
        send_time: new Date(), // Corrected
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
