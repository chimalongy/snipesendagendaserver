import express from 'express';
import dotenv from 'dotenv';
import scheduleRouter from './routes/schedule.js';
import getoutboundtasksroute from "./routes/getoutboundtasks.js"
import deleteoutboundtasksroute from "./routes/deteleteoutboundtasks.js"
import agenda from './agenda.js';
import { defineEmailJob } from './jobs/emailJob.js';
import { defineMasterJob } from './jobs/masterTrigger.js';
import morgan from 'morgan';
import cors from "cors"

dotenv.config();
 
const app = express();
console.log(process.env.MAIN_APP_DEV) 
// app.use(cors({
//   origin: [process.env.MAIN_APP_DEV, process.env.MAIN_APP_PROD, process.env.MAIN_APP_PROD_DOMAIN_2,"127.0.0.1"],        // or a function for dynamic origin checking
// }));
app.use(cors({
  origin: "*",        // or a function for dynamic origin checking
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

['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down...`);
    await agenda.stop(); 
    process.exit(0); 
  });
});

