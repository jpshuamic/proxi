const pool = require('../config/database');

const createReview = async (req, res) => {
  const { reviewed_id, reference_id, reference_type, rating, comment } = req.body;
  try {
    if (!reviewed_id || !reference_id || !reference_type || !rating) {
      return res.status(400).json({ success: false, message: 'reviewed_id, reference_id, reference_type and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    if (reviewed_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself' });
    }
    const existing = await pool.query(
      'SELECT id FROM reviews WHERE reviewer_id = $1 AND reference_id = $2',
      [req.user.id, reference_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this transaction' });
    }
    const review = await pool.query(
      'INSERT INTO reviews (reviewer_id, reviewed_id, reference_id, reference_type, rating, comment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, reviewed_id, reference_id, reference_type, rating, comment || null]
    );
    const avgResult = await pool.query(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE reviewed_id = $1',
      [reviewed_id]
    );
    const avgRating = parseFloat(avgResult.rows[0].avg_rating).toFixed(2);
    let scoreTier = 'newcomer';
    if (avgRating >= 4.5) scoreTier = 'elite';
    else if (avgRating >= 4.0) scoreTier = 'verified_pro';
    else if (avgRating >= 3.5) scoreTier = 'trusted';
    await pool.query(
      'UPDATE users SET proxi_score = $1, score_tier = $2, updated_at = NOW() WHERE id = $3',
      [avgRating, scoreTier, reviewed_id]
    );
    res.status(201).json({ success: true, message: 'Review submitted successfully', review: review.rows[0], new_proxi_score: avgRating });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Server error creating review' });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const reviews = await pool.query(
      `SELECT r.*, u.full_name as reviewer_name, u.score_tier as reviewer_tier
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewed_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.userId]
    );
    const stats = await pool.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE reviewed_id = $1',
      [req.params.userId]
    );
    res.json({
      success: true,
      stats: {
        avg_rating: parseFloat(stats.rows[0].avg_rating || 0).toFixed(2),
        total_reviews: parseInt(stats.rows[0].total_reviews)
      },
      reviews: reviews.rows
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reviews' });
  }
};

module.exports = { createReview, getUserReviews };
