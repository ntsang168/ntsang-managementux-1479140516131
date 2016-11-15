/**
 * Module dependencies.
 */
var express = require('express');
var handlebars = require('express-handlebars');
var csv = require('express-csv');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var cors = require('cors');


/**
 * App configuration
 */
var app = express();

//app.set('port', process.env.PORT || 5990);
app.set('views', path.join(__dirname, 'views'));
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.engine('hbs', handlebars({extname:'hbs', defaultLayout:'main.hbs'}));
app.set('view engine', 'hbs');
app.use(logger('dev'));
app.use(methodOverride());
//app.use(session({ resave: true,
//                  saveUninitialized: true,
//                  secret: 'uwotm8' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json({limit: '1000mb'}));
//app.use(bodyParser.urlencoded({limit: '1000mb', extended: true}));
app.use(multer());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/app-client', express.static(path.join(__dirname, 'src/app-client')));
app.use(cors())


/**
 * Site routes
 */
var routes = require('./routes/site')(app);


/**
 * API routes
 */
var api = require('./routes/api')(app);


/**
 * Jobs
 */
var jobs = require('./jobs');
app.get('/startjobs', jobs.executeStartJobs);
app.get('/stopjobs', jobs.executeStopJobs);


/**
 * Error routes
 */
var error = require('./routes/error')(app);



module.exports = app;

