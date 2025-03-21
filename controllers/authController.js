const bcrypt = require('bcrypt');
const passport = require('passport');
const pool = require('../config/db');

exports.getLogin = (req, res) => {
    res.render('login', { title: 'Login', error: req.query.error || null });
};


exports.postLogin = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login?error=invalid_credentials',
});

exports.getSignup = (req, res) => {
    res.render('signup', { title: 'Sign Up', error: req.query.error || null });
};

exports.postSignup = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.redirect('/signup?error=missing_fields');

    try {
        const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUsers.length > 0) return res.redirect('/signup?error=email_exists');

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword]);
        res.redirect('/login');
    } catch (err) {
        res.redirect('/signup?error=server_error');
    }
};

exports.logout = (req, res) => {
    req.logout(() => res.redirect('/'));
};
