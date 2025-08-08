export const defineMasterJob = (agenda) => {
  agenda.define("trigger-email-batch", async (job) => {
    const {
      recipients,
      smtp,
      outboundname,
      outboundId,
      taskSubject,
      taskBody,
      taskname,
      sendername,
      signature,
      interval,
      taskType,
      user_id,
      task_id,
      threads,
    } = job.attrs.data;

    const intervalMs = Number(interval) * 1000; // assuming interval is in seconds

    let delay = 0;

    for (const recipient of recipients) {
      const sendTime = new Date(Date.now() + delay);
      let replyto = "";

      if (taskType.trim() == "followup") {
        let thread = threads.find(
          (saved_recipient) =>
            saved_recipient.receiver.toLowerCase() == recipient.toLowerCase()
        );
        if (thread && thread.message_ids.length > 0) {
          replyto = thread.message_ids[0];
        }
      } else {
        console.log(taskType);
      }
      console.log(replyto)

      let payload = {
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
        message_id: replyto,
      };

      //console.log(payload);

      await agenda.schedule(sendTime, "send-email",payload );

      console.log(
        `📨 Scheduled email for ${recipient} at ${sendTime.toISOString()}`
      );

      delay += intervalMs; // increase delay for next recipient
    }
  });
};
