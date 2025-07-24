const express = require('express');
const router = express.Router();
const { body } = require('express-validator'); // Import express-validator

const authController = require('../controllers/authController');
const gameController = require('../controllers/gameController');

// Define validation chain for registration
const registerValidation = [
    body('username', 'Username is required').not().isEmpty().trim(),
    body('email', 'Please enter a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be at least 8 characters long').isLength({ min: 8 })
];

// Define validation chain for login
const loginValidation = [
    body('email', 'Please enter a valid email').isEmail().normalizeEmail(),
    body('password', 'Password cannot be empty').not().isEmpty()
];

// Apply the validation chains to the routes
router.get('/register', authController.registerPage);
router.post('/register', registerValidation, authController.register); // <-- Validation added

router.get('/login', authController.loginPage);
router.post('/login', loginValidation, authController.login); // <-- Validation added

router.get('/logout', gameController.isAuth, authController.logout);

module.exports = router;