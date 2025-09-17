import express from "express";
import agenda from "../agenda.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { outboundname } = req.body;

  if (!outboundname) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  console.log("FETCHING TASKS FOR "+outboundname)

  try {
    // Optional: Check for existing jobs
    const existingJobs = await agenda.jobs({ name: 'trigger-email-batch' });
      //console.log("Existing Jobs: "+existingJobs)

    let outboundjobs =[]

   for (let i=0; i<existingJobs.length;i++){
    let job = existingJobs[i]
     //console.log(job)
    if (job.attrs.data.outboundname===outboundname || job.attrs.data.outbound_name===outboundname){

      outboundjobs.push(job)
    }
   }

   //console.log(outboundjobs)

    console.log("SUCCESSFULLY FETCHed TASKS FOR "+outboundname)
    return res.json({ success: true, message: "outbounds retrieved", data:outboundjobs });
    
  } catch (error) {
    console.error("❌ Error sretrieving outbound tasks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrive outbound tasks.",
      data:[]
    });
  } 
});
 
export default router;
  