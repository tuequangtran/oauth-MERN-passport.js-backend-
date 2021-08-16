//codes in this project not refactored for educational purposes

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import User from './User';
import { IUser, IMongoDBUser } from './types';
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const GitHubStrategy = require('passport-github').Strategy;

dotenv.config();

const app = express();

// database connection
mongoose.connect(
	process.env.MONGODB_URI,
	{ useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
	() => console.log('connected to mongoDB')
);
// .then((result) => app.listen(3000))
// .catch((err) => console.log(err));

//Middleware
app.use(express.json());
app.use(cors({ origin: 'https://oauth-mern-passportjs-frontend.netlify.app', credentials: true }));

app.set('trust proxy', 1);

app.use(
	session({
		secret: 'secretcode',
		resave: true,
		saveUninitialized: true,
		cookie: {
			sameSite: 'none',
			secure: true,
			maxAge: 1000 * 60 * 60 * 24 * 7 // One Week
		}
	})
);

//app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

//serialize user
passport.serializeUser((user: IMongoDBUser, done: any) => {
	return done(null, user._id);
});
passport.deserializeUser((id: string, done: any) => {
	User.findById(id, (err: Error, doc: IMongoDBUser) => {
		// Whatever returned goes to the client and binds to the req.user property
		return done(null, doc);
	});
});

//Google strategy
passport.use(
	new GoogleStrategy(
		{
			clientID: `${process.env.GOOGLE_CLIENT_ID}`,
			clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
			callbackURL: '/auth/google/callback'
		},
		function(accessToken: any, refreshToken: any, profile: any, cb: any) {
			//called on successful authentication
			//insert into database
			User.findOne({ googleId: profile.id }, async (err: Error, doc: IMongoDBUser) => {
				if (err) {
					return cb(err, null);
				}

				if (!doc) {
					//create a new user in database
					const newUser = new User({
						googleId: profile.id,
						username: profile.name.givenName
					});

					await newUser.save();
					cb(null, newUser);
				}
				cb(null, doc);
			});
		}
	)
);

//twitter strategy
passport.use(
	new TwitterStrategy(
		{
			consumerKey: `${process.env.TWITTER_CONSUMER_KEY}`,
			consumerSecret: `${process.env.TWITTER_CONSUMER_SECRET}`,
			callbackURL: '/auth/twitter/callback'
		},
		function(_: any, __: any, profile: any, cb: any) {
			User.findOne({ twitterId: profile.id }, async (err: Error, doc: IMongoDBUser) => {
				if (err) {
					return cb(err, null);
				}

				if (!doc) {
					const newUser = new User({
						twitterId: profile.id,
						username: profile.username
					});

					await newUser.save();
					cb(null, newUser);
				}
				cb(null, doc);
			});
		}
	)
);

//github strategy
passport.use(
	new GitHubStrategy(
		{
			clientID: `${process.env.GITHUB_CLIENT_ID}`,
			clientSecret: `${process.env.GITHUB_CLIENT_SECRET}`,
			callbackURL: '/auth/github/callback'
		},
		function(accessToken: any, refreshToken: any, profile: any, cb: any) {
			//called on successful authentication
			//insert into database
			User.findOne({ githubId: profile.id }, async (err: Error, doc: IMongoDBUser) => {
				if (err) {
					return cb(err, null);
				}

				if (!doc) {
					//create a new user in database
					const newUser = new User({
						githubId: profile.id,
						username: profile.username
					});

					await newUser.save();
					cb(null, newUser);
				}
				cb(null, doc);
			});
		}
	)
);

//google strat middleware
app.get('/auth/google', passport.authenticate('google', { scope: [ 'profile' ] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
	// Successful authentication, redirect home.
	res.redirect('https://oauth-mern-passportjs-frontend.netlify.app');
});
//twitter strat routes
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get(
	'/auth/twitter/callback',
	passport.authenticate('twitter', { failureRedirect: '/login', session: true }),
	function(req, res) {
		res.redirect('https://oauth-mern-passportjs-frontend.netlify.app');
	}
);

//github strat routes
app.get('/auth/github', passport.authenticate('github'));

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
	// Successful authentication, redirect home.
	res.redirect('https://oauth-mern-passportjs-frontend.netlify.app');
});

app.get('/', (req, res) => {
	res.send('hello world');
});

app.get('/getuser', (req, res) => {
	res.send(req.user);
});

app.get('/auth/logout', (req, res) => {
	if (req.user) {
		req.logout();
		res.send('done');
	}
});

app.listen(process.env.PORT || 4000, () => {
	console.log('Server Started');
});
