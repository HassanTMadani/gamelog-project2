const User = require('../models/User');
const { validationResult } = require('express-validator'); // Import validationResult

exports.registerPage = (req, res) => res.render('auth/register', { errors: [], oldInput: {} });

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    const errors = validationResult(req); // Get validation results

    if (!errors.isEmpty()) {
        // If there are errors, re-render the form with errors and old input
        return res.status(422).render('auth/register', {
            errors: errors.array(), // Pass errors array to the view
            oldInput: { username, email }
        });
    }

    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(422).render('auth/register', {
                errors: [{ msg: 'Email is already in use.' }],
                oldInput: { username, email }
            });
        }
        await User.create(username, email, password);
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect(res.locals.url('/login')); // <-- FIX HERE
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(422).render('auth/register', {
                errors: [{ msg: 'Username is already taken.' }],
                oldInput: { username, email }
             });
        }
        res.status(500).render('auth/register', {
            errors: [{ msg: 'An error occurred during registration.' }],
            oldInput: { username, email }
        });
    }
};

exports.loginPage = (req, res) => res.render('auth/login', { errors: [], oldInput: {} }); 

exports.login = async (req, res) => {
    const { email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            errors: errors.array(),
            oldInput: { email }
        });
    }

    try {
        const user = await User.findByEmail(email);
        if (!user || !(await User.comparePassword(password, user.password_hash))) {
             req.flash('error', 'Invalid email or password.');
            return res.status(422).render('auth/login', {
                errors: [{ msg: 'Invalid email or password.' }],
                oldInput: { email }
            });
        }
        
        req.session.isLoggedIn = true;
        req.session.user = { id: user.id, username: user.username };
        
        req.session.save(err => {
            if (err) throw err;
             req.flash('success', 'You are now logged in.');
            res.redirect(res.locals.url('/home')); // <-- FIX HERE
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('auth/login', {
            errors: [{ msg: 'An error occurred during login.' }],
            oldInput: { email }
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.redirect(res.locals.url('/home')); // <-- FIX HERE (for the error case)
        }
        // It's important to clear the cookie to prevent old session IDs from being sent
        res.clearCookie('connect.sid'); 
        res.redirect(res.locals.url('/login')); // <-- FIX HERE
    });
};