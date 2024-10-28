const fs = require('fs');


// Load the database ****LOCALTESTONLY*****
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

// passport-config.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// User serialization
passport.serializeUser((user, done) => {
    done(null, user.email);
});

passport.deserializeUser((email, done) => {
    // Fetch user from database using the id
    const user = getUserByEmail(email); 
    done(null, user);
});

// Local strategy for authentication
passport.use(new LocalStrategy(
    { usernameField: 'email' },
    (email, password, done) => {
        const user = getUserByEmail(email); 
        if (!user) {
            return done(null, false, { message: 'Incorrect email.' });
        }
        if (user.password !== password) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
    }
));


// Implement getUserByEmail function
function getUserByEmail(email) {
    return db.users.find(user => user.email === email);
}

// middleware/auth.js
function redirectIfAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/users/dashboard');
    }
    next();
}


module.exports = passport, redirectIfAuthenticated;