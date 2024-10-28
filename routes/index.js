const express = require('express');
const router = express.Router();

// Route to render the home page
router.get('/', (req, res) => {
    res.render('index', { 
        title: 'Home', 
        sitename: 'ASLSTEAMHUB', 
        loginUrl: '/users/login', 
        heading: 'Welcome' 
    });
});

// Route to render the FAQ page
router.get('/faq', (req, res) => {
    res.render('faq', { 
        title: 'Frequently Asked Questions' 
    });
});

module.exports = router;