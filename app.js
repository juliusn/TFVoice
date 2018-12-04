const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const lessMiddleware = require('less-middleware');
const logger = require('morgan');
const mongoose = require('mongoose');
const indexRouter = require('./routes/index');
const uploadRouter = require('./routes/upload');
const resultsRouter = require('./routes/results');
const Server = require('socket.io');
const io = new Server();
const app = express();
app.io = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/d3', express.static(path.join(__dirname, '/node_modules/d3/dist/')));
app.use('/less',
    express.static(path.join(__dirname, '/node_modules/less/dist/')));
app.use('/popper',
    express.static(path.join(__dirname, '/node_modules/popper.js/dist/umd/')));

const sess = {
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
  cookie: {},
};
if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
  sess.cookie.secure = true;
}
const session = require('express-session')(sess);
const sharedSession = require('express-socket.io-session');
app.use(session);
io.use(sharedSession(session));
app.clients = new Map();
io.on('connect', (socket) => {
  app.clients.set(socket.handshake.sessionID, socket);
  socket.on('disconnect', () => {
    app.clients.delete(socket.handshake.sessionID);
  });
});
app.use('/', indexRouter);
app.use('/upload', uploadRouter);
app.use('/results', resultsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

mongoose.connect('mongodb://localhost/tfvoice', {useNewUrlParser: true});
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error'));
db.once('open', () => {
  console.log('Connected to database');
});
module.exports = app;
