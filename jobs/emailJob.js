import nodemailer from "nodemailer";
import UploadSendingResult from "../utils/UploadSendingResult.js";
// jobs/emailJob.js
export const defineEmailJob = (agenda) => {
  agenda.define("send-email", async (job) => {
    const {
      recipient,
      smtp,
      outboundname,
      outboundId,
      taskSubject,
      taskBody,
      taskname,
      sendername,
      signature,
      taskType,
      user_id,
      task_id,
      message_id,
    } = job.attrs.data;

    // Send email here (mock/log for now)
    console.log(`📧 Sending email to ${recipient}`);
    // e.g., await sendEmail(recipient, taskSubject, taskBody, smtp, ...);

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.auth.user,
        pass: smtp.auth.pass,
      },
    });

    try {
      // if (taskType.trim() !== "followup") {
      //   let newbody = taskBody + "\n \n" + signature;
      //   const info = await transporter.sendMail({
      //     from: `"${sendername}" <${smtp.auth.user}>`,
      //     to: recipient,
      //     subject: taskSubject,
      //     text: newbody,
      //   });

      //   await UploadSendingResult({
      //     user_id: user_id,
      //     outbound_id: outboundId,
      //     task_id: task_id,
      //     task_name: taskname,
      //     sent_from: smtp.auth.user,
      //     receiver: recipient,
      //     message_id: info.messageId,
      //     send_result: "success",
      //   });
      // } else {
      //   let newbody = taskBody + "\n \n" + signature;
      //   const info = await transporter.sendMail({
      //     from: `"${sendername}" <${smtp.auth.user}>`,
      //     to: recipient,
      //     subject: taskSubject,
      //     text: newbody,
      //     inReplyTo: message_id,
      //     references:  [message_id]
      //   });

      //   await UploadSendingResult({
      //     user_id: user_id,
      //     outbound_id: outboundId,
      //     task_id: task_id,
      //     task_name: taskname,
      //     sent_from: smtp.auth.user,
      //     receiver: recipient,
      //     message_id: info.messageId,
      //     send_result: "success",
      //   });
      // }

      let newbody = taskBody + "\n \n" + signature;
      let sendMailOptions = {
        from: `"${sendername}" <${smtp.auth.user}>`,
        to: recipient,
        subject: taskSubject,
        text: newbody,
      };

      if (taskType.trim() === "followup") {
        sendMailOptions.inReplyTo = message_id;
        sendMailOptions.references = [message_id];
      }

      const info = await transporter.sendMail(sendMailOptions);

      await UploadSendingResult({
        user_id: user_id,
        outbound_id: outboundId,
        task_id: task_id,
        task_name: taskname,
        sent_from: smtp.auth.user,
        receiver: recipient,
        message_id: info.messageId,
        send_result: "success",
      });

      console.log(`✅ Email sent to ${to}, Message ID: ${info.messageId}`);
    } catch (error) {
      console.error(`❌ Failed to send to ${to}:`, error.message);

      await UploadSendingResult({
        user_id: user_id,
        outbound_id: outboundId,
        task_id: task_id,
        sent_from: smtp.auth.user,
        receiver: recipient,
        message_id: null,
        send_result: `fail: ${error.message}`,
      });
    }
  });
};
