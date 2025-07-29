// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const flash = require('connect-flash'); // ✅ CORRECT: require the module

const app = express();
const PORT = process.env.PORT || 8000; // ✅ CORRECT: Port must be 8000

// ✅ CORRECT: Cleanly define the base path for URL prefixing
const BASE_PATH = process.env.BASE_PATH ? '/' + process.env.BASE_PATH.replace(/^\/|\/$/g, '') : '';

// --- Middleware Setup ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// ✅ CORRECT: Serve static files BEFORE dynamic routes
app.use(express.static(path.join(__dirname, 'public')));

// Session Management
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS in production
}));

// ✅ CORRECT: Use the flash function after requiring it
app.use(flash());

// --- Custom Global Middleware ---
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.BASE_PATH = BASE_PATH;

    // ✅ CORRECT: Robust helper function for creating URLs with the base path
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
// ✅ CORRECT: Mount all routes with the BASE_PATH prefix
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
