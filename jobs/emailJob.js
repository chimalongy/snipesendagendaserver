import nodemailer from "nodemailer";
import UploadSendingResult from "../utils/UploadSendingResult.js";

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
      thread_id,
      password,
    } = job.attrs.data;


    console.log(job.attrs.data)
    try {
      // Setup SMTP transport
      let smtp_settings = {
        host: "smtp.gmail.com", // <-- replace if not Gmail
        port: 465,
        secure: true,
        auth: {
          user: sender_email,
          pass: password,
        },
      };

      console.log("smtp_settings")
      console.log(smtp_settings)

      const transporter = nodemailer.createTransport(smtp_settings);

      // Format body and signature as HTML
      const formattedBody = task_body
        .replace(/\n/g, "<br>")
        .replace(/\s\s+/g, " ");

      const formattedSignature = signature
        .replace(/\n/g, "<br>")
        .replace(/\s\s+/g, " ");

      let mailOptions;

      if (task_type !== "followup") {
        // ===== FIRST EMAIL =====
        console.log("this is a first outbound");

        mailOptions = {
          from: `"${sender_name}" <${sender_email}>`,
          to: recipient,
          subject: task_subject,
          html: `<!DOCTYPE html>
            <html>
              <body>
                ${formattedBody}
                <br><br>
                ${formattedSignature || ""}
              </body>
            </html>`,
        };
      } else {
        // ===== FOLLOW-UP EMAIL =====
        console.log("this is a follow up outbound");

        // Fallback subject (since SMTP can’t fetch headers)
        let followupSubject = task_subject;
        if (!/^Re:/i.test(followupSubject)) {
          followupSubject = `Re: ${followupSubject}`;
        }

        mailOptions = {
          from: `"${sender_name}" <${sender_email}>`,
          to: recipient,
          subject: followupSubject,
          inReplyTo: message_id || undefined,
          references: message_id ? [message_id] : undefined,
          html: `<!DOCTYPE html>
            <html>
              <body>
                ${formattedBody}
                <br><br>
                ${formattedSignature || ""}
              </body>
            </html>`,
        };
      }

      // Send email
      const response = await transporter.sendMail(mailOptions);

      if (task_type === "followup") {
        console.log(
          `Followup sent to ${recipient}: ${response.messageId} in thread ${thread_id}`
        );
      } else {
        console.log(
          `Email sent to ${recipient}: ${response.messageId}`
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
        message_id: response.messageId,
        thread_id: thread_id || null,
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
        message_id: "NULL: " + (message_id || "unknown"),
        thread_id: thread_id || null,
        send_result: "Failed: " + error.message,
        send_time: new Date(),
      });
    }
  });
};
