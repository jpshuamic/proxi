const pool = require('../config/database');

const createDispute = async (req, res) => {
  const { against_id, reference_id, reference_type, reason, description, evidence_urls } = req.body;
  try {
    if (!against_id || !reference_id || !reference_type || !reason || !description) {
      return res.status(400).json({ success: false, message: 'against_id, reference_id, reference_type, reason and description are required' });
    }
    if (against_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot raise a dispute against yourself' });
    }
    const existing = await pool.query(
      'SELECT id FROM disputes WHERE raised_by = $1 AND reference_id = $2 AND status = $3',
      [req.user.id, reference_id, 'open']
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'You already have an open dispute for this transaction' });
    }
    const escrow = await pool.query(
      'SELECT * FROM escrow_accounts WHERE reference_id = $1 AND status = $2',
      [reference_id, 'holding']
    );
    if (escrow.rows.length > 0) {
      await pool.query(
        'UPDATE escrow_accounts SET status = $1 WHERE reference_id = $2',
        ['disputed', reference_id]
      );
    }
    const dispute = await pool.query(
      'INSERT INTO disputes (raised_by, against_id, reference_id, reference_type, reason, description, evidence_urls) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, against_id, reference_id, reference_type, reason, description, evidence_urls || null]
    );
    res.status(201).json({ success: true, message: 'Dispute raised successfully. Our team will review within 24 hours.', dispute: dispute.rows[0] });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ success: false, message: 'Server error creating dispute' });
  }
};

const getMyDisputes = async (req, res) => {
  try {
    const disputes = await pool.query(
      `SELECT d.*, 
        u1.full_name as raised_by_name,
        u2.full_name as against_name
       FROM disputes d
       JOIN users u1 ON d.raised_by = u1.id
       JOIN users u2 ON d.against_id = u2.id
       WHERE d.raised_by = $1 OR d.against_id = $1
       ORDER BY d.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, count: disputes.rows.length, disputes: disputes.rows });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching disputes' });
  }
};

const getDispute = async (req, res) => {
  try {
    const dispute = await pool.query(
      `SELECT d.*,
        u1.full_name as raised_by_name,
        u2.full_name as against_name
       FROM disputes d
       JOIN users u1 ON d.raised_by = u1.id
       JOIN users u2 ON d.against_id = u2.id
       WHERE d.id = $1 AND (d.raised_by = $2 OR d.against_id = $2)`,
      [req.params.id, req.user.id]
    );
    if (dispute.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }
    res.json({ success: true, dispute: dispute.rows[0] });
  } catch (error) {
    console.error('Get dispute error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dispute' });
  }
};

const resolveDispute = async (req, res) => {
  const { resolution, winner_id } = req.body;
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can resolve disputes' });
    }
    if (!resolution || !winner_id) {
      return res.status(400).json({ success: false, message: 'resolution and winner_id are required' });
    }
    const dispute = await pool.query('SELECT * FROM disputes WHERE id = $1', [req.params.id]);
    if (dispute.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }
    if (dispute.rows[0].status !== 'open') {
      return res.status(400).json({ success: false, message: 'Dispute is already resolved' });
    }
    const d = dispute.rows[0];
    const escrow = await pool.query(
      'SELECT * FROM escrow_accounts WHERE reference_id = $1 AND status = $2',
      [d.reference_id, 'disputed']
    );
    if (escrow.rows.length > 0) {
      const e = escrow.rows[0];
      const sellerAmount = parseFloat(e.amount_held) - parseFloat(e.proxi_fee);
      if (winner_id === e.buyer_id) {
        await pool.query('UPDATE wallets SET escrow_balance = escrow_balance - $1, balance = balance + $1, updated_at = NOW() WHERE user_id = $2', [e.amount_held, e.buyer_id]);
        await pool.query('UPDATE escrow_accounts SET status = $1, released_at = NOW() WHERE id = $2', ['refunded', e.id]);
      } else {
        await pool.query('UPDATE wallets SET escrow_balance = escrow_balance - $1, updated_at = NOW() WHERE user_id = $2', [e.amount_held, e.buyer_id]);
        await pool.query('UPDATE wallets SET balance = balance + $1, total_earned = total_earned + $1, updated_at = NOW() WHERE user_id = $2', [sellerAmount, e.seller_id]);
        await pool.query('UPDATE escrow_accounts SET status = $1, released_at = NOW() WHERE id = $2', ['released', e.id]);
      }
    }
    await pool.query(
      'UPDATE disputes SET status = $1, resolution = $2, resolved_by = $3, resolved_at = NOW(), updated_at = NOW() WHERE id = $4',
      ['resolved', resolution, req.user.id, req.params.id]
    );
    res.json({ success: true, message: 'Dispute resolved successfully', resolution, winner_id });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ success: false, message: 'Server error resolving dispute' });
  }
};

module.exports = { createDispute, getMyDisputes, getDispute, resolveDispute };
