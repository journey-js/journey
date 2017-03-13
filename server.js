var express = require("express");
var open = require('open');
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var session = require('express-session')

var app = express();
app.use(cookieParser());

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

app.use(session({
	secret: '1234567890QWERTY',
	resave: true,
	saveUninitialized: true
}));

app.get("/a", function (req, res, next) {
	res.sendFile(__dirname + "/src/index.html"); 
});

app.get("/b", function (req, res, next) {
	res.sendFile(__dirname + "/src/index.html"); 
});
app.get("/c", function (req, res, next) {
	res.sendFile(__dirname + "/src/index.html"); 
});

app.get("index.html", function (req, res) {
	//res.redirect("/index.html");
	res.sendFile(__dirname + "/src/index.html"); 
});

app.get("/data/hello.json", function (req, res) {
	var sleep =  req.query.delay || 0;	
 setTimeout(function() {
	 res.sendFile(__dirname + "/src" + req.path); 
 }, sleep);
});

app.get('/js/app/views/home/home.js', function(req, res) {
 //var sleep = 2000;
 var sleep = 0;
 setTimeout(function() {
 res.sendFile(__dirname + "/src" + req.path);
 //res.sendFile(__dirname + "/src/" + req.path);	
 
 }, sleep);
 });

/*
 app.get("/", checkAuth, function (req, res) {
	res.redirect("/index.html");
});
 
 app.get('/data/customer:id.json', checkAuth, function(req, res) {
 var sleep = 0;
 setTimeout(function() {
 res.sendfile("." + req.path);
 
 }, sleep);
 });
 
 
 app.get('/data/product:id.json', checkAuth, function(req, res) {
 var sleep = 0;
 setTimeout(function() {
 res.sendfile("." + req.path);
 
 }, sleep);
 });
 
 
 app.get('/data/person.json', checkAuth, function(req, res) {
 //var body = "hello";
 //res.setHeader('Content-Type', 'application/json');
 var sleep = 0;
 setTimeout(function() {
 res.sendfile("." + req.path);
 
 }, sleep);
 //res.setHeader('Content-Length', Buffer.byteLength(body));
 //res.end(body);
 });
 
 function checkAuth(req, res, next) {
 if (!req.session.user_id) {
 res.redirect("/login.html");
 } else {
 next();
 }
 }
 
 app.post('/login', function(req, res) {
 var post = req.body;
 if (post.user == 'test' && post.password == 'test') {
 req.session.user_id = 'test';
 res.redirect('/index.html');
 // Simulate J2EE server continuing orig request
 //res.redirect('/data/person.json');
 } else {
 console.log(post.user, post.password)
 res.send('Bad user/pass');
 }
 });
 
 app.get('/logout', function(req, res) {
 delete req.session.user_id;
 res.redirect('/login.html');
 });*/

app.use(express.static(__dirname + "/src"));

app.listen(9988);
open('http://localhost:9988/');