import express from 'express';
import dotenv from 'dotenv';
import scheduleRouter from './routes/schedule.js';
import getoutboundtasksroute from "./routes/getoutboundtasks.js";
import deleteoutboundtasksroute from "./routes/deteleteoutboundtasks.js";
import agenda from './agenda.js';
import { defineEmailJob } from './jobs/emailJob.js';
import { defineMasterJob } from './jobs/masterTrigger.js';
import morgan from 'morgan';
import cors from 'cors';

dotenv.config();

const app = express();

// ✅ CORS Configuration
app.use(cors({
  origin: 'https://snipesend.vercel.app', // ✅ your frontend domain
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// ✅ Explicitly handle preflight requests
app.options('*', cors());

// ✅ Middleware
// app.use(morgan('combined')); // Uncomment if you want logging
app.use(express.json());

// ✅ Routes
app.use('/schedule', scheduleRouter);
app.use('/get-outbound-tasks', getoutboundtasksroute);
app.use('/delete-outbound-tasks', deleteoutboundtasksroute);

// ✅ Agenda Jobs
defineEmailJob(agenda);
defineMasterJob(agenda);

// ✅ Start Server
(async function () {
  await agenda.start(); // Start agenda before listening
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Worker API running on port ${PORT}`);
  });
})();

// ✅ Graceful Shutdown
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down...`);
    await agenda.stop(); 
    process.exit(0); 
  });
});
