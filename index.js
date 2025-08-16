import express from "express";
import { SETTINGS } from "./utils/globals.js";
import dotenv from "dotenv";
import scheduleRouter from "./routes/schedule.js";
import getoutboundtasksroute from "./routes/getoutboundtasks.js";
import deleteoutboundtasksroute from "./routes/deteleteoutboundtasks.js";
import agenda from "./agenda.js";
import { defineEmailJob } from "./jobs/emailJob.js";
import { defineMasterJob } from "./jobs/masterTrigger.js";
import morgan from "morgan";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));

// app.use(morgan('combined')); // or 'dev', 'tiny', etc.
app.use(express.json());

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("Server running");
});

app.use("/schedule", scheduleRouter);
app.use("/get-outbound-tasks", getoutboundtasksroute);
app.use("/delete-outbound-tasks", deleteoutboundtasksroute);

// Initialize Agenda
defineEmailJob(agenda);
defineMasterJob(agenda);

(async function () {
  try {
    await agenda.start(); // Start agenda before listening
    const PORT = SETTINGS.PORT || 4000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Worker API running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start Agenda:", err);
    process.exit(1);
  }
})();

["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down...`);
    await agenda.stop();
    process.exit(0);
  });
});
