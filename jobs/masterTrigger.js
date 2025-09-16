export const defineMasterJob = (agenda) => {
  agenda.define("trigger-email-batch", async (job) => {
    const {
      user_id,
      outbound_name,
      outbound_id,
      task_name,
      task_id,
      task_type,
      task_subject,
      task_body,
      recipients,
      interval,
      sender_name,
      signature,
      threads,
      sender_email,
      password
    } = job.attrs.data;

    const intervalMs = Number(interval) * 1000; // assuming interval is in seconds

    let delay = 0; 

    for (const recipient of recipients) {
      const sendTime = new Date(Date.now() + delay);
      let replyto = "";
      let thread_id=""

      if (task_type.trim() == "followup") {
        let thread = threads.find(
          (saved_recipient) =>
            saved_recipient.receiver.toLowerCase() == recipient.toLowerCase()
        );
        if (thread && thread.message_ids.length > 0) {
          replyto = thread.message_ids[thread.message_ids.length-1];
          thread_id = thread.thread_ids[0]

        }
      } else {
      //  console.log(task_type);
      }
     // console.log(replyto);

      let payload = {
        recipient,
        outbound_name,
        outbound_id,
        task_subject,
        task_body,
        task_name,
        sender_name,
        signature,
        task_type,
        user_id,
        task_id,
        message_id: replyto,
        thread_id,
        sender_email,
        password
      }; 

     // console.log(payload);

 
 
      await agenda.schedule(sendTime, "send-email", payload);

      // console.log( 
      //   `📨 Scheduled email for ${recipient} at ${sendTime.toISOString()}`
      // );

      delay += intervalMs; // increase delay for next recipient
    }
  });
};
