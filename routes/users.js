const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const passport = require('passport');
const authController = require('../auth/authContoller.js');

dbPath = path.join(__dirname, '../db.json');
// Route to render the register page
router.get('/register', (req, res) => {
    res.render('register', { 
        title: 'Sign Up', 
        sitename: 'ASLSTEAMHUB', 
        loginUrl: '/users/login', 
        heading: 'Sign Up For Free' 
    });
});

// Route for register form submission
router.post('/register', (req, res) => {
    console.log(req.body);

    // Check if password and confirmPassword match
    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).send('Passwords do not match. Please try again.');
    }

    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading db.json:', err);
            return res.status(500).send('Internal Server Error');
        }
        const db = JSON.parse(data);

        const newUser = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
        };
        db.users.push(newUser);

        fs.writeFile(dbPath, JSON.stringify(db, null, 2), (err) => {
            if (err) {
                console.error('Error writing to db.json:', err);
                return res.status(500).send('Internal Server Error');
            }

            res.redirect('/users/login');
        });
    });
});

// Route to render the login page
router.get('/login', (req, res) => {
    res.render('login', { 
        title: 'Login', 
        sitename: 'ASLSTEAMHUB', 
        heading: 'Login to Your Account' 
    });
});

// Route to handle login form submission
router.post('/login', passport.authenticate('local', {
    successRedirect: '/users/dashboard',
    failureRedirect: '/users/login',
}));


// Logout route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }
            res.clearCookie('connect.sid');
            res.redirect('/users/login');
        });
    });
});

// Route to render the dashboard page
router.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('user_dashboard', { 
            title: 'Dashboard', 
            user: req.user, 
            userName: req.user.username // Pass userName to the view
        });
    } else {
        res.redirect('/users/login');
    }
});

// Settings route
router.get('/settings', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('settings', { 
            title: 'User Settings', 
            user: req.user 
        });
    } else {
        res.redirect('/users/login');
    }
});


// Wordlist route
router.get('/wordlist', (req, res) => {
    if (req.isAuthenticated()) {
        // JUST TESTING HEREREREREREE
        const wordList = [
            { letter: 'A', name: 'Atom', definition: 'The basic unit of a chemical element, consisting of a nucleus surrounded by electrons.' },
            { letter: 'B', name: 'Bond', definition: 'A connection between atoms in a molecule.'}
        ];

        res.render('wordlist', { title: 'Word List', wordList: wordList });
    } else {
        res.redirect('/users/login');
    }
});


// Route to display the forgot password page
router.get('/forgot-password', authController.displayForgotPasswordPage);
// Route to handle forgot password form submission
router.post('/forgot-password', authController.resetPassword);
// Route to handle password reset verification
router.get('/forgot-password/:token', authController.verifyEmailForResetPassword);
// Route to handle password change
router.post('/change-password', authController.changePassword);

module.exports = router;