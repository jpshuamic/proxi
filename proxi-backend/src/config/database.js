const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = {};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
  poolConfig.ssl = { rejectUnauthorized: false };
} else {
  poolConfig.host = process.env.DB_HOST;
  poolConfig.port = Number(process.env.DB_PORT) || 5432;
  poolConfig.database = process.env.DB_NAME;
  poolConfig.user = process.env.DB_USER;
  poolConfig.password = process.env.DB_PASSWORD;
  poolConfig.ssl = { rejectUnauthorized: false };
}

console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
console.log('poolConfig:', poolConfig);

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('✅ Connected to Proxi database');
});

pool.on('error', (err) => {
  console.error('Database error:', err);
  process.exit(-1);
});

module.exports = pool;
