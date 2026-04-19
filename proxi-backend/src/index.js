const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const pool = require('./config/database');
const authRoutes = require('./routes/auth');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});
app.use(limiter);

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Proxi API is running',
    version: '1.0.0'
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;

pool.query('SELECT 1')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Proxi server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to Proxi database:', err);
    process.exit(1);
  });
