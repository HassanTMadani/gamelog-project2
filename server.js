// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const flash = require('connect-flash');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

// EJS Setup
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Session Management
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Set dynamically
}));
app.use(flash()); 
// Custom middleware to make user session available to all templates
app.use((req, res, next) => {
    res.locals.session = req.session;
    
    // [FIX] Initialize flash message variables on every request
    // This ensures they are always defined as arrays, even if empty.
    res.locals.successMessage = req.flash('success');
    res.locals.errorMessage = req.flash('error');
    
    // This is for validation errors, ensuring it's always an array
    res.locals.errors = []; 
    // This is for preserving old input, ensuring it's always an object
    res.locals.oldInput = {};

    next();
});
// Route handlers
app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));
app.use('/api', require('./routes/api'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});