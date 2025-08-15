import express from "express";
import agenda from "../agenda.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { outboundname } = req.body;
   //console.log(outboundname)
  if (!outboundname) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    const existingJobs = await agenda.jobs({ name: "trigger-email-batch" });
    const existingTasks = await agenda.jobs({ name: "send-email" });

    let deletedJobs = [];
    let deletedTasks = [];

    for (const job of existingJobs) {
      if (job.attrs.data?.outboundname === outboundname || job.attrs.data?.outbound_name === outboundname) {
        await job.remove();
        deletedJobs.push(job.attrs._id);
      }
    }

    for (const task of existingTasks) {
      if (task.attrs.data?.outboundname === outboundname || task.attrs.data?.outbound_name === outboundname) {
        await task.remove();
        deletedTasks.push(task.attrs._id);
      }
    }

    return res.json({
      success: true,
      message: `Deleted ${deletedJobs.length} 'trigger-email-batch' and ${deletedTasks.length} 'send-email' task(s) for outbound: ${outboundname}`,
      deletedTriggerBatchJobIds: deletedJobs,
      deletedSendEmailTaskIds: deletedTasks,
    });

  } catch (error) {
    console.error("❌ Error deleting outbound tasks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete outbound tasks.",
    });
  }
});

export default router;
