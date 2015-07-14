var fs = require('fs');
var express = require('express');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();

var bcrypt = require('bcrypt');
var https = require('https');

//jwts
var jwt = require('jwt-simple');
var moment = require('moment');
var userInfo = require('./userinfo.js')
var jwtKey = userInfo.jwt
var password = userInfo.password;
var userName = userInfo.username;

//upload
var busboy = require('connect-busboy');

//database
var mongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/fransite';
var ObjectID = require('mongodb').ObjectID;
mongoClient.connect(url, function(err, db){
  if (err) throw err;
  app.set('mongo', db); 
});

//email
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

// view engine setup
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
app.use(busboy()); 

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

app.get('/', function(req, res) {
  
  res.render('index');
});

app.get('/main', function(req, res) {
  res.render('main');
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.post('/login', function(req, res) {
  console.log('req.body.user: '+ req.body.user);
  console.log('userName: '+ userName);
  if (req.body.user === userName && req.body.password === password) {
      res.cookie('token', authenticate(userName, password));
      res.redirect('/');
  } else {
      res.end('invalid username/password combo');
  }
});

app.post('/authenticate', [jwtAuth], function(req, res){
  if(req.userStatus === 'loggedIn'){
    res.status(200).end();
  } else {
    res.status(500).end();
  }
})

app.post('/uploads', [jwtAuth], function(req, res){
  if(req.userStatus === 'loggedIn') {
    fs.readdir('public/images/blogpost', function(err, files){
      if(err) throw err;
      var fileString = files.toString();
      res.end(fileString);
    });  
  } else {
    res.end('jwt error');
  }
});

app.post('/imageupload', [jwtAuth], function(req, res){
  var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        fstream = fs.createWriteStream('public/images/blogpost/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
            res.end('success');
        });
    });
});

app.post('/blogsave', [jwtAuth], function(req, res){
  if (req.userStatus === 'loggedIn') {
    var db = app.get('mongo');
    var posts = db.collection('posts');
    posts.insert({images: req.body.images, video: req.body.video, body: req.body.body}, function(err, reply){
    })
    res.redirect('/main');
  }
});

app.post('/blogdelete', [jwtAuth], function(req, res) {
  if (req.userStatus === 'loggedIn') {
    var db = app.get('mongo');
    var posts = db.collection('posts');
    posts.remove({_id: ObjectID(req.body.id)}, function(err, result) {
      res.end(err + result);
    });
  }
});

app.post('/blogupdate', [jwtAuth], function(req, res) {
  if(req.userStatus === 'loggedIn') {
    var db = app.get('mongo');
    var posts = db.collection('posts');
    posts.findAndModify({_id: ObjectID(req.body.id)}, ['_id'], {$set: {body: req.body.text}}, function(err, result) {
      res.end(err + result);
    })
  }
});

app.get('/posts', function(req, res){
  var db = app.get('mongo');
  var posts = db.collection('posts');
  posts.find().sort({'_id': -1}).toArray(function(err, response){
    res.json(response);
  }); 
});

function jwtAuth (req, res, next){
  var token = (req.cookies.token)
  if (token) {  
    try {
      var decoded = jwt.decode(token, jwtKey);
      if (decoded.exp <= Date.now()){
        res.end('Access token expired', 400);
      }
      if (decoded.iss === userName && decoded.pass === password) {
        req.userStatus = 'loggedIn';
        next();
      }
    } catch (err) {
      return next();
    }
  } else {
    next();
  }

};

function authenticate (userId, pass){
  var expires = moment().add(7, 'days').valueOf();
  var token = jwt.encode({
    iss: userId,
    exp: expires,
    pass: pass 
  }, jwtKey);
  return token;
}
module.exports = app;
