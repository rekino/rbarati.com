const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);

router.get('/logout', authController.logout);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }));

// Apple OAuth
router.get('/apple', passport.authenticate('apple', { scope: ['name', 'email'] }));
router.get('/apple/callback', passport.authenticate('apple', { successRedirect: '/', failureRedirect: '/login' }));

module.exports = router;
