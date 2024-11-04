const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('./auth/passport');
const app = express();
const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex');
const redirectIfAuthenticated = require('./middleware/auth');
const userController = require('./controllers/userController');


// Set view engine to EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse request body
app.use(bodyParser.urlencoded({ extended: false }));

// Session management
app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: true
}));


app.use(passport.initialize());
app.use(passport.session());



// Include routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

app.get('/', redirectIfAuthenticated, (req, res) => {
    res.render('index', { title: 'Home' });
});

app.get('/users/login', redirectIfAuthenticated, (req, res) => {
    res.render('login', { title: 'Login',
                          sitename: 'ASLSTEAMHUB',
                          heading: 'Login to Your Account'
     });
});

app.use('/', indexRouter)
app.use('/users', usersRouter);

app.get('/users/personalized_wordlist', userController.getPersonalizedWordList);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});