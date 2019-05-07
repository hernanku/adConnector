const express           = require('express');
const path              = require('path');
const cookieParser      = require('cookie-parser');
const logger            = require('morgan');
const bodyParser        = require("body-parser");
const nocache           = require('nocache');
const expressValidator  = require('express-validator');

const app = express();


app.use(nocache());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressValidator());

/*-- API-KEY validation: validate api-key passed in header before executing each request --*/
app.use(require('./middlewares/keyValidator'));

const indexRouter       = require('./routes/index');
const connectAd         = require('./routes/adConnector');
const adUtilityRouter   = require('./routes/adUtilityRoutes');
const adUserRouter      = require('./routes/adUserRoutes');
const adGroupRouter     = require('./routes/adGroupRoutes');
const adOuRouter        = require('./routes/adOuRoutes');
const adOffice365       = require('./routes/adOffice365');

app.use('/', indexRouter);
app.use('/connect-ad', connectAd);
app.use('/utility', adUtilityRouter);
app.use('/', adGroupRouter);
app.use('/', adOuRouter);
app.use('/', adUserRouter);
app.use('/office365', adOffice365);

app.use((err, req, res, next) => {
    console.log('Internal Error:',err);
    return res.status(500).send({code:500, errorCode:'Internal Server Error', errorDescription:'The server has encountered a situation it does not know how to handle.'});
});

app.use((req, res, next) => {
    return res.status(500).send({code:500, errorCode:'Invalid API Request', errorDescription:'The requested URL is not found.'}); 
});
module.exports = app;
