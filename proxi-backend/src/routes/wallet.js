const express = require('express');
const router = express.Router();
const { getWallet, fundEscrow, releaseEscrow, getTransactions, addFunds } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getWallet);
router.post('/fund', protect, addFunds);
router.post('/escrow', protect, fundEscrow);
router.post('/escrow/release', protect, releaseEscrow);
router.get('/transactions', protect, getTransactions);

module.exports = router;
