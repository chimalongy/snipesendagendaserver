import express from "express";
import agenda from "../agenda.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const {
    user_id,
    outbound_name,
    outbound_id,
    task_name,
    task_id,
    task_type,
    task_subject,
    task_body,
    triggerAt,
    recipients,
    interval,
    sender_name,
    signature,
    threads,
    sender_email,
    access_token,
    refresh_token,
  } = req.body;

  if (
    !triggerAt ||
    !recipients ||
    !interval ||
    !outbound_name ||
    !outbound_id ||
    !task_body ||
    !task_subject ||
    !task_name ||
    !sender_name ||
    !access_token ||
    !refresh_token ||
    !signature ||
    !task_type ||
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
  console.log(
    "🕒 Parsed triggerAt:",
    new Date(triggerAt).toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );
  console.log(
    "🕒 Current time:    ",
    new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );
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
    await agenda.schedule(triggerDate, "trigger-email-batch", {
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
      access_token,
      refresh_token,
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
