var express = require('express');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var jwt = require('jwt-simple');
var moment = require('moment');
var bcrypt = require('bcrypt');
var https = require('https');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
// var mailgunLogin = require('./mailgunlogin.js');
// var transporter = nodemailer.createTransport(smtpTransport({
//   host: 'smtp.mailgun.org',
//   auth: {
//     user: mailgunLogin.user,
//     pass: mailgunLogin.pass
//   }
// }));

var jwtKey = 'S2F7JF6ltWX4cgC5VDcQ';
var password = 'dirtshouldcakehowever';
var userName = 'Franchfry';

// view engine setup
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.get('/', function(req, res) {
    res.render('index', {title: 'Francesca DuBrock'});
})

app.get('/login', function(req, res) {
    res.render('login');
})

app.post('/login', function(req, res) {
 
  if (req.body.user === userName && req.body.password === password) {
      res.cookie('token', authenticate(userName));
      res.redirect('/');
  } else {
      res.end('invalid username/password combo');
  }
});

function authenticate (userId){
  var expires = moment().add(7, 'days').valueOf();
  var token = jwt.encode({
    iss: userId,
    exp: expires,
  }, jwtKey);
  return token;
}
module.exports = app;
