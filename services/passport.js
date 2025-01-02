

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../model/userSchema');

passport.use(new GoogleStrategy({
  clientID: '1095042996703-inohst6l75viuroi9e67nd2ms49523pg.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'http://localhost:1233/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // First, check if the user already exists by email
    let user = await User.findOne({ email: profile._json.email });

    if (!user) {
      // If user doesn't exist, create a new user
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile._json.email,
        authMethod: 'google',  // Indicating this account was created via Google
        is_verified: 1 // Set as verified when created through Google
      });
    }

    // User already exists, return the existing user
    return done(null, user);
  } catch (err) {
    console.error("Error in Google OAuth callback:", err);
    return done(err);
  }
}));

// Serialize and deserialize user to manage sessions
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});



