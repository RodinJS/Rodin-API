/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const bodyParser = require('body-parser');
const compress = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const expressValidation = require('express-validation');
const APIError = require('../common/APIError');
const httpStatus = require('../common/httpStatus');
const apiRoutes = require('./routes');

const app = express();
const server = require('http').Server(app);

app.use(bodyParser.json({limit: '20mb'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compress());
app.use(cors());


app.all('*', function(req, res, next) {
    //console.log(req.method, req.url);
    next();
});

app.use('/api', apiRoutes);

app.use((err, req, res, next) => {
    if (err instanceof expressValidation.ValidationError) {
        // validation error contains errors which is an array of error each containing message[]
        const unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
        const error = new APIError(unifiedErrorMessage, err.status, true);
        return next(error);
    } else if (!(err instanceof APIError)) {
        const apiError = new APIError(err.message, err.status, err.isPublic);
        return next(apiError);
    }
    return next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status).json({
        success: false,
        error: {
            message: err.isPublic ? err.message : httpStatus[err.status],
            status: err.status,
            type: httpStatus[err.status],
            timestamp: Date.now()
        }
    });
});


server.listen(7000);

module.exports = app;
