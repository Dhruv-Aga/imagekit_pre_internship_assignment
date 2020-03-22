var http = require('http'),
    path = require('path'),
    methods = require('methods'),
    express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    cors = require('cors'),
    passport = require('passport'),
    errorhandler = require('errorhandler'),
    mongoose = require('mongoose');
    expressip = require('express-ip');
var isProduction = process.env.NODE_ENV === 'production';

// Create global app object
const app = express();


app.use(cors());

// Normal express config defaults
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(expressip().getIpInfoMiddleware);

app.use(require('method-override')());
app.use(express.static('public'));
app.use(session({ secret: 'conduit', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false  }));

if (!isProduction) {
  app.use(errorhandler());
}

if(isProduction){
  mongoose.connect('mongodb://dhruv_agarwal:dhruvaga11@ds121203.mlab.com:21203/nutabay');
} else {
  mongoose.connect('mongodb://dhruv_agarwal:dhruvaga11@ds121203.mlab.com:21203/nutabay');
  mongoose.set('debug', true);
}

require('./models/User');
require('./models/Login');
require('./config/passport');
require('./api/users')(app);

// app.use(require('./routes'));
 
// 
/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  // alert();
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (!isProduction) {
  app.use(function(err, req, res, next) {
    // console.log(err.stack);

    res.status(err.status || 500);

    res.json({'errors': {
      message: err.message,
      error: err
    }});
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({'errors': {
    message: err.message,
    error: {}
  }});
});

// var server = app.listen(3000, '192.168.1.2', () => console.log(`Listening on `));

// finally, let's start our server...
var server = app.listen(3020, '127.0.0.1', function(){
  console.log('Listening on port ' + server.address().address+":"+server.address().port);
});
