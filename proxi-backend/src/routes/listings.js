const express = require('express');
const router = express.Router();
const { createListing, getListings, getListing, getMyListings } = require('../controllers/listingsController');
const { protect } = require('../middleware/auth');

router.get('/', getListings);
router.post('/', protect, createListing);
router.get('/my/listings', protect, getMyListings);
router.get('/:id', getListing);

module.exports = router;
