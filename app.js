const os = require('os');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const cors = require('cors'); // Import the CORS middleware
const { error } = require('console');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

let sessionData;
// CORS middleware

// Serialize user to store in session
passport.serializeUser(function (user, done) {
    done(null, user); // Serialize the entire user object
});

// Deserialize user from session
passport.deserializeUser(function (user, done) {
    done(null, user); // Deserialize the entire user object
});

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
    clientID: '1096220527316-apgu21nl03gbfa8c43tmdn53i2389o3k.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'http://localhost:3000/auth/google/callback',
    passReqToCallback: true // Add this option
}, (req, accessToken, refreshToken, profile, done) => {
    // Here, you can handle user authentication logic
    // For simplicity, we'll just return the user profile

    // Store user profile data in session
    if (profile) {
        req.session.user = profile;
    }

    // Call done to indicate successful authentication
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
    async (req, res) => {
        try {
            if (!req.session.passport) {
                // If session data is not available, redirect to login
                return res.redirect('/login');
            }
            const networkInterfaces = os.networkInterfaces();

            // Find the first non-internal IPv4 address
            const ipAddress = Object.values(networkInterfaces)
                .flat()
                .find((iface) => iface.family === 'IPv4' && !iface.internal);
            const myIp = ipAddress.address;
            // Extract user information from the authenticated request
            const { displayName } = req.session.passport.user;
            console.log(displayName);
            // Connect to MongoDB
            const client = new MongoClient('mongodb://localhost:27017');
            await client.connect();

            // Access the database and collection
            const db = client.db('SSO');
            const collection = db.collection('user');

            // Insert a new document for the user
            await collection.insertOne({ displayName, myIp });

            // Close the MongoDB connection
            await client.close();

            // Redirect to the profile page
            res.redirect('/profile');
        } catch (error) {
            console.error('Error saving user data:', error);
            // Handle error redirection or display error page
            res.redirect('/error');
        }
    });


app.get('/logout', (req, res) => {
    try {
        req.logout((err) => {
            if (err) {
                console.error('Error during logout:', err);
                res.status(500).send('Internal server error');
                return;
            }
            res.redirect('/');
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).send('Internal server error');
    }
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


// Profile route
app.get("/profile", ensureAuthenticated, (req, res) => {
    const user = req.user;
    const displayName = user.displayName;
    res.render('profile', { displayName });

});



//middleware to handle error while authentication
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});

app.get('/checkSession', (req, res) => {
    const sessionId = req.sessionID; // Retrieve the session ID from the request object
    res.send(`Session ID: ${sessionId}`);
});



//Listening to PORT
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
