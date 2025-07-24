const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// API endpoint to get a user's game library/reviews
// GET /api/user/:userId/library
router.get('/user/:userId/library', gameController.getLibraryApi);

module.exports = router;