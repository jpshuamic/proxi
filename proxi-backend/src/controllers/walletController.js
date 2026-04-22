const pool = require('../config/database');

const getOrCreateWallet = async (userId) => {
  let wallet = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
  if (wallet.rows.length === 0) {
    wallet = await pool.query(
      'INSERT INTO wallets (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
  }
  return wallet.rows[0];
};

const getWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);
    res.json({ success: true, wallet });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching wallet' });
  }
};

const fundEscrow = async (req, res) => {
  const { reference_id, reference_type, amount, seller_id } = req.body;
  try {
    if (!reference_id || !reference_type || !amount || !seller_id) {
      return res.status(400).json({ success: false, message: 'reference_id, reference_type, amount and seller_id are required' });
    }
    const buyerWallet = await getOrCreateWallet(req.user.id);
    if (parseFloat(buyerWallet.balance) < parseFloat(amount)) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }
    const proxiFee = parseFloat(amount) * 0.10;
    const autoRelease = new Date();
    autoRelease.setHours(autoRelease.getHours() + 24);
    await pool.query('UPDATE wallets SET balance = balance - $1, escrow_balance = escrow_balance + $1, updated_at = NOW() WHERE user_id = $2', [amount, req.user.id]);
    const escrow = await pool.query(
      'INSERT INTO escrow_accounts (buyer_id, seller_id, reference_id, reference_type, amount_held, proxi_fee, auto_release_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, seller_id, reference_id, reference_type, amount, proxiFee, autoRelease]
    );
    await pool.query(
      'INSERT INTO transactions (from_user_id, to_user_id, amount, proxi_fee, type, reference_id, reference_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [req.user.id, seller_id, amount, proxiFee, 'escrow_hold', reference_id, reference_type, 'completed']
    );
    res.status(201).json({ success: true, message: 'Funds locked in escrow', escrow: escrow.rows[0] });
  } catch (error) {
    console.error('Fund escrow error:', error);
    res.status(500).json({ success: false, message: 'Server error funding escrow' });
  }
};

const releaseEscrow = async (req, res) => {
  const { escrow_id } = req.body;
  try {
    const escrow = await pool.query('SELECT * FROM escrow_accounts WHERE id = $1', [escrow_id]);
    if (escrow.rows.length === 0) return res.status(404).json({ success: false, message: 'Escrow not found' });
    const e = escrow.rows[0];
    if (e.buyer_id !== req.user.id) return res.status(403).json({ success: false, message: 'Only the buyer can release escrow' });
    if (e.status !== 'holding') return res.status(400).json({ success: false, message: 'Escrow already released or refunded' });
    const sellerAmount = parseFloat(e.amount_held) - parseFloat(e.proxi_fee);
    await pool.query('UPDATE wallets SET escrow_balance = escrow_balance - $1, updated_at = NOW() WHERE user_id = $2', [e.amount_held, e.buyer_id]);
    await pool.query('UPDATE wallets SET balance = balance + $1, total_earned = total_earned + $1, updated_at = NOW() WHERE user_id = $2', [sellerAmount, e.seller_id]);
    await pool.query('UPDATE escrow_accounts SET status = $1, released_at = NOW() WHERE id = $2', ['released', escrow_id]);
    await pool.query(
      'INSERT INTO transactions (from_user_id, to_user_id, amount, proxi_fee, type, reference_id, reference_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [e.buyer_id, e.seller_id, sellerAmount, e.proxi_fee, 'escrow_release', e.reference_id, e.reference_type, 'completed']
    );
    res.json({ success: true, message: 'Payment released to seller', seller_received: sellerAmount, proxi_fee: e.proxi_fee });
  } catch (error) {
    console.error('Release escrow error:', error);
    res.status(500).json({ success: false, message: 'Server error releasing escrow' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await pool.query(
      'SELECT * FROM transactions WHERE from_user_id = $1 OR to_user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ success: true, count: transactions.rows.length, transactions: transactions.rows });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching transactions' });
  }
};

const addFunds = async (req, res) => {
  const { amount } = req.body;
  try {
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount required' });
    await getOrCreateWallet(req.user.id);
    await pool.query('UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2', [amount, req.user.id]);
    await pool.query(
      'INSERT INTO transactions (to_user_id, amount, type, status) VALUES ($1, $2, $3, $4)',
      [req.user.id, amount, 'wallet_topup', 'completed']
    );
    const wallet = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, message: 'Wallet funded successfully', wallet: wallet.rows[0] });
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(500).json({ success: false, message: 'Server error adding funds' });
  }
};

module.exports = { getWallet, fundEscrow, releaseEscrow, getTransactions, addFunds };
