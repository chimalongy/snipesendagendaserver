import { Pool } from 'pg';
import { SETTINGS } from '../globals';

// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'snipesend',
//   password: '1',
//   port: 5432, // default PostgreSQL port
// })



const pool = new Pool({
  // connectionString: process.env.DATABASE_URL,
  connectionString: SETTINGS.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required by Supabase
  },
});

export default pool;
