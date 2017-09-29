/**
 * Created by xgharibyan on 1/12/17.
 */
const APIError = require('../../../../common/APIError');
const httpStatus = require('../../../../common/httpStatus');
const fs = require('fs');
const _ = require('lodash');
const config = require('../../../../config/env');
const request = require('request-promise');
const HookSecretKey = 'K7rd6FzEZwzcc6dQr3cv9kz4tTTZzAc9hdXYJpukvEnxmbdB42V4b6HePs5ZDTYLW_4000dram_module';
const APIURL = config.API;


function validate(req, res, next) {
    if (_.isUndefined(req.query.projectId)) {
        const err = new APIError('Provide project Id', httpStatus.BAD_REQUEST, true);
        return next(err);
    }

    const options = {
        method: 'GET',
        uri: `${APIURL}/modules/hook/validate`,
        qs:{
           'projectId':req.query.projectId
        },
        headers: {
            'x-access-token': HookSecretKey,
            'referer':req.headers.referer
        },
        json: true,
    };


    request(options)
        .then((response) => {
           req.module = true;
           return next();
        })
        .catch((err)  => {
            req.error  = err.error.error ? err.error.error.message : 'Please contact with support';
            return next();
        });


}

function serverFile(req) {
   return new Promise((resolve, reject)=>{
       if (!req.modules) {
           return resolve(`var error = '${req.error}';\n throw new Error(error);`);
       }
       const socketIO = fs.readFileSync(`${__dirname}/../../../../node_modules/socket.io-client/dist/socket.io.js`, 'utf8');
       let clinetJS = fs.readFileSync(`${__dirname}/client.js`, 'utf8');
       clinetJS = clinetJS.replace(`{socketURL}`, config.socketURL).replace(`{subscriptionURL}`, config.host);
       return resolve(socketIO+clinetJS);
   })
}

module.exports = {validate, serverFile};