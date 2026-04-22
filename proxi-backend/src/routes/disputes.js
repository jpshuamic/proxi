const express = require('express');
const router = express.Router();
const { createDispute, getMyDisputes, getDispute, resolveDispute } = require('../controllers/disputesController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createDispute);
router.get('/my', protect, getMyDisputes);
router.get('/:id', protect, getDispute);
router.post('/:id/resolve', protect, resolveDispute);

module.exports = router;
