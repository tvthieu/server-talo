const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session  = require('express-session');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const mongoose = require('mongoose');
const passport = require('passport');
const FacebookStrategy  = require('passport-facebook').Strategy;
const config = require('./configuration/config');
const where = require('node-where');

const app = express();
mongoose.connect('mongodb://admin2:tlth97!!@ds159696.mlab.com:59696/talo');

mongoose.connection.on('open', () => {
  console.log(`MongoDB connected: ${mongoose.connection.db.databaseName}`);
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB error: ${err}`);
});

// Passport session setup. 
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Sử dụng FacebookStrategy cùng Passport.
passport.use(new FacebookStrategy({
    clientID: config.facebook_api_key,
    clientSecret:config.facebook_api_secret ,
    callbackURL: config.callback_url
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      console.log('ass',accessToken, 'ref', refreshToken, 'profile',profile, 'done',done);
      return done(null, profile);
    });
  }
));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'keyboard cat', key: 'sid'}));  //Save user login
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/', indexRouter);
app.use('/api/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

//error handler
app.use(function(err, req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', true);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
  next();

});
// app.use((req, res, next) => {
//     where.is(req.ip, (err, result) => {
//       res.setHeader('Access-Control-Allow-Origin', '*');
//       res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//       res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
//       res.setHeader('Access-Control-Allow-Credentials', true);
//         req.geoip = result;
//         next();
//     });
// });
module.exports = app;
