const express = require('express');
const router = express.Router();
const { body } = require('express-validator'); // Import express-validator

const pagesController = require('../controllers/pagesController');
const gameController = require('../controllers/gameController');

const { isAuth } = gameController;

// Define validation chain for review submission
const reviewValidation = [
    body('rating', 'A rating of 1-5 is required').isInt({ min: 1, max: 5 }),
    body('review_text').trim().escape() // Sanitize review text to prevent XSS
];

// Static & Core Pages
router.get('/', pagesController.root);
router.get('/about', pagesController.aboutPage);
router.get('/home', isAuth, pagesController.homePage);

// External Game Search
router.get('/search', isAuth, gameController.searchPage);
router.post('/search', isAuth, gameController.searchGames);

// Add game from search to our DB and redirect to review page
router.post('/library/add', isAuth, gameController.addGameToLibrary);

// Library & Review Management
router.get('/library', isAuth, gameController.viewLibrary);
router.get('/review/:gameId', isAuth, gameController.reviewPage);
// Apply the validation chain to the review submission route
router.post('/review/:gameId', isAuth, reviewValidation, gameController.submitReview); // <-- Validation added
router.post('/review/delete/:reviewId', isAuth, gameController.deleteReview);

module.exports = router;