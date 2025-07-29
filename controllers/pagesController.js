exports.root = (req, res) => {
    if (req.session.isLoggedIn) {
        res.redirect(res.locals.url('/home')); // <-- FIX HERE
    } else {
        res.redirect(res.locals.url('/login')); // <-- FIX HERE
    }
};

exports.homePage = (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect(res.locals.url('/login')); // <-- FIX HERE
    }
    res.render('home');
};

exports.aboutPage = (req, res) => {
    res.render('about');
};