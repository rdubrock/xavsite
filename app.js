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
var jwtKey = 'S2F7JF6ltWX4cgC5VDcQ';
var password = 'dirtshouldcakehowever';
var userName = 'Franchfry';
//upload
var multipart = require('connect-multiparty');

//database
var redis = require('redis');
var client = redis.createClient(); 
client.on('connect', function() {
    console.log('connected');
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
app.use(multipart({
    uploadDir: 'public/images/blogpost'
}));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.get('/', function(req, res) {
  var blogTitle = '';
  var blogImg = '';
  var blogBody = '';
  client.mget(['blogTitle', 'blogImage', 'blogBody'], function(err, reply){
    console.log(reply);
    blogTitle = reply[0];
    blogImg = reply[1];
    blogBody = reply[2];
    res.render('index', {title: 'Francesca DuBrock', blogTitle: blogTitle, blogImg: blogImg, blogBody: blogBody});
  });  
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.post('/login', function(req, res) {
 
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

// exports.create = function (req, res, next) {
//     var data = _.pick(req.body, 'type')
//         , uploadPath = path.normalize(cfg.data + '/uploads')
//         , file = req.files.file;

//         console.log(file.name); //original name (ie: sunset.png)
//         console.log(file.path); //tmp path (ie: /tmp/12345-xyaz.png)
//     console.log(uploadPath); //uploads directory: (ie: /home/user/data/uploads)
// };

app.post('/uploads', [jwtAuth], function(req, res){
  console.log(req.file);
  fs.readdir('public/images/blogpost', function(err, files){
    if(err) throw err;
    var fileString = files.toString();
    res.end(fileString);
  })  
});

app.post('/blogsave', [jwtAuth], function(req, res){
  if (req.userStatus === 'loggedIn') {
    client.mset(['blogTitle', req.body.title, 'blogImage', 'images/blogpost/'+req.body.image, 'blogBody', req.body.body], function(err, reply){
      console.log('BLOG SAVE: '+reply);
    })
    res.redirect('/');
  }
})

app.post('/deleteimages', [jwtAuth], function(req, res){
  if (req.userStatus === 'loggedIn') {
    fs.readdirSync('public/images/blogpost').forEach(function(file,index){
      console.log(file);
      var curPath = 'public/images/blogpost/' + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
      res.end();
    });
  }
});

function jwtAuth (req, res, next){
  var token = (req.cookies.token)
  if (token) {  
    try {
      var decoded = jwt.decode(token, jwtKey); //check for decoded.email
      if (decoded.exp <= Date.now()){
        res.end('Access token expired', 400);
      }
      if (decoded.iss === "Franchfry" && decoded.pass === password) {
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
