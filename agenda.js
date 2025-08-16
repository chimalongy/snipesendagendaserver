// agenda.js
import { Agenda } from 'agenda';
import dotenv from 'dotenv';
import { SETTINGS } from './utils/globals.js';

dotenv.config();

///const mongoConnectionString = process.env.MONGO_URI;
const mongoConnectionString = SETTINGS.MONGO_URI

const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'scheduledJobs' },
});

export default agenda;
 