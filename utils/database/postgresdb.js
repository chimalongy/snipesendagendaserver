import { Pool } from 'pg';

// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'snipesend',
//   password: '1',
//   port: 5432, // default PostgreSQL port
// })



const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required by Supabase
  },
});

export default pool;
