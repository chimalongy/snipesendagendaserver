import express from "express";
import agenda from "../agenda.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const {
    triggerAt,
    recipients,
    smtp,
    interval,
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
    threads
  } = req.body;


  if (
    !triggerAt ||
    !recipients ||
    !smtp ||
    !interval ||
    !outboundname ||
    !outboundId ||
    !taskBody ||
    !taskSubject ||
    !taskname ||
    !sendername ||
    !signature||
    !taskType||
    !user_id ||
    !task_id ||
    !threads
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  const triggerDate = new Date(triggerAt);
  const triggerTimeMs = triggerDate.getTime();
  const nowMs = Date.now();
  const delay = triggerTimeMs - nowMs;

  const humanTime = triggerDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log("🛬 Received triggerAt:", triggerAt);
  console.log("🕒 Human-readable trigger time:", humanTime);
  console.log("🕒 Parsed triggerAt:",new Date(triggerAt).toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
  console.log("🕒 Current time:    ",new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
  console.log("⏱️  Computed delay (ms):", delay);
  console.log("⏱️  Computed delay (sec):", (delay / 1000).toFixed(2));
  console.log("✅ All required fields are available");


  if (delay < 1000) {
    return res.status(400).json({
      success: false,
      message: "Schedule time must be at least 1 second in the future",
    });
  }
    // console.log(threads)
    // console.log("TASK TYPE :"+ taskType)
  try {
    await agenda.schedule(triggerDate, 'trigger-email-batch', {
      recipients,
      smtp,
      interval,
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
      threads
    });

    console.log("✅ Task scheduled in Agenda");
    return res.json({ success: true, message: "Task scheduled in Agenda" });
  } catch (error) {
    console.error("❌ Error scheduling task:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to schedule task",
    });
  }
});

export default router;
