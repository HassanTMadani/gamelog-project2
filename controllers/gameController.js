const axios = require('axios');
const Game = require('../models/Game');
require('dotenv').config();
const { validationResult } = require('express-validator'); // [FIX] This line was previously missing

const RAWG_API_KEY = process.env.RAWG_API_KEY;
const RAWG_API_URL = 'https://api.rawg.io/api';

// Middleware to protect routes that require authentication
exports.isAuth = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    next();
};

// --- External Search --- //
exports.searchPage = (req, res) => {
    res.render('search', { games: [], query: '', error: null });
};

exports.searchGames = async (req, res) => {
    const query = req.body.query;
    if (!query) {
        return res.render('search', { games: [], query: '' });
    }
    try {
        const response = await axios.get(`${RAWG_API_URL}/games`, {
            params: { key: RAWG_API_KEY, search: query }
        });
        res.render('search', { games: response.data.results, query: query, error: null });
    } catch (error) {
        console.error('Error searching RAWG API:', error.message);
        res.render('search', { games: [], query: query, error: 'Could not fetch games from RAWG.' });
    }
};

// --- Library & Reviews --- //
exports.viewLibrary = async (req, res) => {
    const userId = req.session.user.id;
    const query = req.query.search || '';
    try {
        let library;
        if (query) {
            library = await Game.searchUserLibrary(userId, query);
        } else {
            library = await Game.getUserLibrary(userId);
        }
        res.render('library', { library, query, error: null });
    } catch (error) {
        console.error('Error fetching user library:', error);
        res.render('library', { library: [], query, error: 'Could not fetch your library.' });
    }
};

exports.reviewPage = async (req, res) => {
    try {
        const { gameId } = req.params; // This is the local DB game ID
        const userId = req.session.user.id;
        
        const game = await Game.getGameDetails(gameId);
        if (!game) return res.status(404).send('Game not found.');

        const existingReview = await Game.getReview(userId, gameId); // [FIX] This now works correctly

        res.render('review', { game, review: existingReview || {}, errors: [] });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading review page.');
    }
};

exports.submitReview = async (req, res) => {
    const { gameId } = req.params;
    const { rating, review_text } = req.body;
    const userId = req.session.user.id;
    const errors = validationResult(req);

    const game = await Game.getGameDetails(gameId);

    if (!errors.isEmpty()) {
        const review = { rating, review_text };
        return res.status(422).render('review', {
            game,
            review,
            errors: errors.array()
        });
    }

    try {
        await Game.saveReview(userId, gameId, rating, review_text);
        req.flash('success', 'Review saved successfully!');
        res.redirect('/library');
    } catch (error) {
        console.error('Error submitting review:', error);
        const review = { rating, review_text };
        res.status(500).render('review', {
            game,
            review,
            errors: [{ msg: 'An error occurred while saving your review.' }]
        });
    }
};

exports.addGameToLibrary = async (req, res) => {
    try {
        const gameDataFromApi = {
            id: req.body.rawg_id,
            name: req.body.name,
            released: req.body.released,
            background_image: req.body.background_image,
            rating: req.body.rating
        };

        const localGameId = await Game.findOrCreate(gameDataFromApi);
        
        res.redirect(`/review/${localGameId}`);

    } catch (error) {
        console.error('Error adding game to library:', error);
        res.redirect('/search');
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.session.user.id;
        await Game.removeReview(reviewId, userId);
        req.flash('success', 'Review has been deleted.');
        res.redirect('/library');
    } catch (error) {
        console.error('Error deleting review:', error);
        res.redirect('/library');
    }
};

// --- API Function --- //
exports.getLibraryApi = async (req, res) => {
    try {
        const { userId } = req.params;
        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }
        const library = await Game.getUserLibrary(userId);
        if (library.length > 0) {
            res.status(200).json(library);
        } else {
            res.status(404).json({ message: 'No library found for this user or user does not exist.' });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};