// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const flash = 'connect-flash';

const app = express();
const PORT = process.env.PORT || 8000; // Ensure port is 8000

// ✅ Cleanly define the base path for URL prefixing.
const BASE_PATH = process.env.BASE_PATH ? '/' + process.env.BASE_PATH.replace(/^\/|\/$/g, '') : '';

// --- Middleware Setup ---

// To parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS (View Engine) Setup
app.set('view engine', 'ejs');

// ✅ CORRECT STATIC FILE HANDLING
// This must come BEFORE your dynamic route handlers.
// Express will serve files from the 'public' folder directly.
app.use(express.static(path.join(__dirname, 'public')));


// Session Management
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS in production
}));

// Flash messages
app.use(flash());

// --- Custom Global Middleware ---
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.BASE_PATH = BASE_PATH;

    // ✅ Robust helper function for creating correct URLs
    res.locals.url = (route) => {
        const newRoute = route.startsWith('/') ? route : '/' + route;
        const fullPath = (BASE_PATH + newRoute).replace(/\/+/g, '/');
        return fullPath || '/';
    };

    res.locals.successMessage = req.flash('success');
    res.locals.errorMessage = req.flash('error');
    res.locals.errors = [];
    res.locals.oldInput = {};

    next();
});

// --- Route Handlers ---
// Correctly mount all routes with the BASE_PATH prefix.
app.use(BASE_PATH, require('./routes/index'));
app.use(BASE_PATH, require('./routes/auth'));
app.use(`${BASE_PATH}/api`, require('./routes/api'));

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (BASE_PATH) {
        console.log(`Application available under the base path: ${BASE_PATH}`);
    }
});
