// middleware/auth.js
function redirectIfAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/users/dashboard');
    }
    next();
}

module.exports = redirectIfAuthenticated;