const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppleStrategy = require('passport-apple');
const bcrypt = require('bcrypt');
const pool = require('./db');

// Local Strategy (Email & Password)
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) return done(null, false, { message: "User not found" });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return done(null, false, { message: "Incorrect password" });

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const [users] = await pool.query("SELECT * FROM users WHERE google_id = ?", [profile.id]);
        if (users.length > 0) return done(null, users[0]);

        const [result] = await pool.query(
            "INSERT INTO users (name, email, google_id) VALUES (?, ?, ?)", 
            [profile.displayName, profile.emails[0].value, profile.id]
        );
        return done(null, { id: result.insertId, name: profile.displayName, email: profile.emails[0].value });
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    done(null, users[0] || null);
});
