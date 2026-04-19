require('dotenv').config();
const { Pool } = require('pg');

console.log('DATABASE_URL', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('pool.options', pool.options);

pool.query('SELECT 1')
  .then(() => {
    console.log('Connected successfully');
    return pool.end();
  })
  .catch((err) => {
    console.error('Connection failed:', err);
    return pool.end();
  });