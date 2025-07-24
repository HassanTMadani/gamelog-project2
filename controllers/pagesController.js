exports.root = (req, res) => {
    if (req.session.isLoggedIn) {
        res.redirect('/home');
    } else {
        res.redirect('/login');
    }
};

exports.homePage = (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    res.render('home');
};

exports.aboutPage = (req, res) => {
    res.render('about');
};
