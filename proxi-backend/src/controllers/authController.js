const pool = require('../config/database');
const jwt = require('jsonwebtoken');

const generateReferralCode = () => {
  return 'PRX' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const register = async (req, res) => {
  const { phone_number, full_name, role, area_description } = req.body;

  try {
    if (!phone_number) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const validRoles = ['trader', 'skilled_worker', 'earner'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be trader, skilled_worker or earner'
      });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE phone_number = $1',
      [phone_number]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    let referralCode;
    let isUnique = false;
    while (!isUnique) {
      referralCode = generateReferralCode();
      const existing = await pool.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referralCode]
      );
      if (existing.rows.length === 0) isUnique = true;
    }

    const newUser = await pool.query(
      `INSERT INTO users 
        (phone_number, full_name, role, area_description, referral_code) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, phone_number, full_name, role, proxi_score, score_tier, referral_code, created_at`,
      [
        phone_number,
        full_name || null,
        role || 'earner',
        area_description || null,
        referralCode
      ]
    );

    const user = newUser.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, phone_number, full_name, role, proxi_score, score_tier, area_description, referral_code, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.rows[0]
    });

  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = { register, getMe };