// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const flash = require('connect-flash');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Cleanly define the base path for URL prefixing
const BASE_PATH = process.env.BASE_PATH ? ('/' + process.env.BASE_PATH.replace(/^\/|\/$/g, '')) : '';

// Middleware
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

// EJS Setup
app.set('view engine', 'ejs');

// ✅ Correctly serve static files from the public directory, without the base path prefix
app.use(express.static(path.join(__dirname, 'public')));

// Session Management
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS in production
}));
app.use(flash());

// Custom middleware to make session, base path, and a URL helper available to all templates
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.BASE_PATH = BASE_PATH;

    // ✅ A robust helper function for creating correct URLs
    res.locals.url = (route) => {
        const newRoute = route.startsWith('/') ? route : '/' + route;
        // Combine base path and route, then replace multiple slashes with a single one
        return (BASE_PATH + newRoute).replace(/\/+/g, '/');
    };

    // Make flash messages and form state available to all templates
    res.locals.successMessage = req.flash('success');
    res.locals.errorMessage = req.flash('error');
    res.locals.errors = [];
    res.locals.oldInput = {};

    next();
});

// --- Route Handlers ---
// ✅ Correctly mount all routes with the BASE_PATH prefix
app.use(BASE_PATH, require('./routes/index'));
app.use(BASE_PATH, require('./routes/auth'));
app.use(`${BASE_PATH}/api`, require('./routes/api'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        message: 'Something went wrong on our end.',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (BASE_PATH) {
        console.log(`Application available under the base path: ${BASE_PATH}`);
    }
});