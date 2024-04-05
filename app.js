const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
// Set up session middleware
app.use(session({
    secret: 'This is my secret key for learn it tech web application',
    resave: false,
    saveUninitialized: false
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

//Configure passport
passport.use(new GoogleStrategy({
    clientID: 'your_client_id',
    clientSecret: 'your_client_secret',
    callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    // Here, you can handle user authentication logic
    // For simplicity, we'll just return the user profile
    return done(null, profile);
}));


// Set up EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Define routes...
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication, redirect to profile page
        res.redirect('/profile');
    });

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

//Protected routes
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.get('/', (req, res) => {
    res.render('login');
});

app.get('/profile', ensureAuthenticated, (req, res) => {
    res.render('profile');
});

//middleware to handle error while authentication
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});


//Listening to PORT
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


