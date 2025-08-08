import express from 'express';
import dotenv from 'dotenv';
import scheduleRouter from './routes/schedule.js';
import getoutboundtasksroute from "./routes/getoutboundtasks.js"
import deleteoutboundtasksroute from "./routes/deteleteoutboundtasks.js"
import agenda from './agenda.js';
import { defineEmailJob } from './jobs/emailJob.js';
import { defineMasterJob } from './jobs/masterTrigger.js';
import cors from "cors"

dotenv.config();
 
const app = express();
app.use(cors({
  origin: [process.env.MAIN_APP_DEV, process.env.MAIN_APP_PROD],        // or a function for dynamic origin checking
  // methods: ["GET", "POST", "PUT"],      // Allowed HTTP methods
  // allowedHeaders: ["Content-Type"],     // Allowed headers in request
  // exposedHeaders: ["X-Token"],          // Headers to expose in response
  // credentials: true,                    // Allow cookies/auth headers
  // maxAge: 86400,                        // Preflight cache duration (in seconds)
  // optionsSuccessStatus: 204             // Response status for successful OPTIONS requests (default is 204)
}));
app.use(morgan('combined')); // or 'dev', 'tiny', etc.
app.use(express.json());
app.use('/schedule', scheduleRouter);
app.use('/get-outbound-tasks', getoutboundtasksroute);
app.use('/delete-outbound-tasks', deleteoutboundtasksroute);

// Initialize Agenda
defineEmailJob(agenda);
defineMasterJob(agenda);

(async function () {
  await agenda.start(); // Start agenda before listening
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Worker API running on port ${PORT}`);
  });
})();

process.on('SIGTERM', async () => {
  await agenda.stop();
  process.exit(0);
});

