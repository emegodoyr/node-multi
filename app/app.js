var express = require('express');
var handlebars = require('express-handlebars');
var bodyParser = require('body-parser');
var formidable = require('formidable');
var credentials = require('./credentials.js');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var parseurl = require('parseurl');
var fs = require('fs');

var app = express();

app.disable('x-powered-by');

app.engine('handlebars', handlebars({
    defaultLayout: 'main'
}));

app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cookieParser(credentials.cookieSecret));

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('home');
});

app.use(function(req, res, next) {
    console.log("Looking for URL:" + req.url);
    next();
});

app.get('/junk', function(req, res, next) {
    console.log("Tried to access /junk");
    throw new Error('junk doesn\' exist');
});

app.use(function(err, req, res, next) {
    console.log('Error: ' + err.message);
    next();
});

app.get('/about', function(req, res) {
    res.render('about');
});

app.get('/contact', function(req, res) {
    res.render('contact', { csrf: 'CRSF token here'});
});

app.get('/thankyou', function(req, res) {
    res.render('thankyou');
});

app.post('/process', function(req, res) {
    console.log('Form: ' + req.query.form);
    console.log('CSRF token: ' + req.body._csrf);
    console.log('Email: ' + req.body.email);
    console.log('Question: ' + req.body.ques);

    res.redirect(303, '/thankyou');
});

app.get('/file-upload', function(req, res) {
    var date = new Date();
    res.render('file-upload', {
        year: date.getFullYear(),
        month: date.getMonth()
    });
});

app.post('/file-upload/:year/:month', function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, file) {
        if (err)
            return res.redirect(303, '/error');
        console.log('Received File');
        console.log(file);
        res.redirect(303, '/thankyou');
    });
});

app.get('/cookie', function(req, res) {
    res.cookie('username', 'Jon', { expire: new Date() + 9999 }).send('username has the value of Jon');
});

app.get('/listcookies', function(req, res) {
    console.log("Cookies: ", req.cookies);
    res.send('Look the console for cookies');
});

app.get('/deletecookie', function(req, res) {
    res.clearCookie('username');
    res.send('username Cookie Deleted');
});

app.get('/readfile', function(req, res, next) {
    fs.readFile('./public/randomfile.txt', function(err, data) {
        if (err)
            return console.error(err);
        res.send("the file: " + data.toString());
    });
});

app.get('/writefile', function(req, res, next) {
    fs.writeFile('./public/randomfile2.txt', 'More random text', function(err) {
        if(err)
            return console.error(err);
    });

    fs.readFile('./public/randomfile2.txt', function(err, data) {
        res.send("the file written has: " + data.toString());
    });
});

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: credentials.cookieSecret
}));

app.use(function(req, res, next) {
    var views = req.session.views;

    if (!views) {
        views = req.session.views = {};
    }

    var pathname = parseurl(req).pathname;

    views[pathname] = (views[pathname] || 0) + 1;

    next();
});

app.get('/viewcount', function(req, res, next) {
    res.send('You viewed this page ' + req.session.views['/viewcount'] + ' times');
});

app.use(function(req, res) {
    res.type('text/html');
    res.status(404);
    res.render('404');
});

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function() {
    console.log('Express started press Ctrl+C to Terminate');
});
