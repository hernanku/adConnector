/** 
*   @fileOverview Contains validation function(validateProcess) for various APIs and integration of get and delete operation and dateConvertor.
*   @author VMWare
*   @requires     NPM:parser
*   @requires     NPM:child_process
*   @requires     ./../utils/ad-config
*   @requires     ./../utils/errorGenerator
    @requires     ./../utils/restClient
*   @requires     ../winston
*/

var logger              = require('../winston');
var config              = require('./ad-config');
const restClient        = require('./restClient');
const errorGenerator    = require('./../utils/errorGenerator');
const parser            = require('parse-error');



const ADDICT_ERR    = 'addict_error';
const OU_ERR        = 'ou_error';
const GRP_ERR       = 'group_error';
const USER_ERR      = 'user_error';
const UNKNOWN_ERR   = 'unknown_error';
const baseUrl       = config.baseUrl;

/**
 * send response according to the result of the promise data
 * @param {Promise} data - The response returned by the rest client
 * @param {Response} res - response object
 * @param {next} next 
 */
module.exports.parseData = (data,res,next) => {
    data.then(function (result) {
        res.result = result;
        res.send(result);
        next();
    }, function (err) {
        logger.info("error handler" + err);
        console.log("parseData-err", err);
        res.status(503).json(config.errorMessage).end();
    });
}

/**
 * @description validate the inputData for all API endpoints
 * @param {object} inputData - The input object {type:'ou/group/user', actionType : 'add', body : 'request body'}
 * @returns {object} response - response object
 */
module.exports.validateProcess = async(inputData) => {
    let errType, response, regex, new_path ;
    let arOU = [];
    let arGroup_ou = [];
    let arGroup_ad = [];

    //Begin: Get whole OU
    let [err,data] = await tryCatch(restClient.get(baseUrl, '/ou'));
    if(err) {
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        return response;
    }
    if(data.error) {
        if(data.code) {
            errType  = {type:ADDICT_ERR, key:data.code.toLowerCase()};
            response = errorGenerator.generateErrorCode(errType);
            return response;
        }else {
            errType  = {type:UNKNOWN_ERR, key:'unknown_error'};
            response = errorGenerator.generateErrorCode(errType);
            return response;
        }
    }
    if(data && data.length > 0) {
        arOU  = data.map(x => x.dn.split(',').filter(indexKey => indexKey.includes('OU=')));
        arOU = arOU.map(indexKey => indexKey.reverse());
        regex = /OU=/gi;
        arOU = arOU.map(indexKey => indexKey.join('/').replace(regex, ''));
        arOU = arOU.map(x => x.toLowerCase());
    }
    if(inputData.body.location && arOU.indexOf(inputData.body.location.toLowerCase()) === -1) {
        errType = {type:OU_ERR, key:'location_not_found'};
        response = errorGenerator.generateErrorCode(errType);
        return response;
    }
    //End: Get whole OU
    // Begin: Section - OU
    // check if ou exists
    if(inputData.type === 'ou') {
        if(inputData.actionType === 'add') {
            new_path = (inputData.body.location && inputData.body.location.length >0)? `${inputData.body.location}/${inputData.body.name}`:inputData.body.name;
            if(arOU.includes(new_path.toLowerCase())) {
                errType = {type:OU_ERR, key:'ou_exists'};
                response = errorGenerator.generateErrorCode(errType);
                return response;
            }else {
                return response;
            }
        }
    }
    // End: Section - OU
    // Begin: Section - GROUP
    // check if group exists
    if(inputData.type === 'group') {
        if(inputData.actionType === 'add') {
            let [err,data] = await tryCatch(restClient.get(baseUrl, '/group'));
            if(err) {
                errType  = {type:ADDICT_ERR, key:'econnrefused'};
                response = errorGenerator.generateErrorCode(errType);
                return response;
            }
            if(data.error) {
                if(data.code) {
                    errType  = {type:ADDICT_ERR, key:data.code.toLowerCase()};
                    response = errorGenerator.generateErrorCode(errType);
                    return response;
                }else {
                    errType  = {type:UNKNOWN_ERR, key:'unknown_error'};
                    response = errorGenerator.generateErrorCode(errType);
                    return response;
                }
            }
            let arGroup = data.map(x => x.cn);
            let arTemp = arGroup.filter(word => word.toLowerCase() === inputData.body.name.toLowerCase());
            if(arTemp.length > 0) {
                errType = {type:GRP_ERR, key:'group_exists'};
                response = errorGenerator.generateErrorCode(errType);
                return response;
            }else {
                return response;
            }
        }
    }
    // End: Section - GROUP
    // Begin: Section - USER
    // check if user exists
    if(inputData.type === 'user') {
        if(inputData.actionType === 'add') {
            let [err,data] = await tryCatch(restClient.get(baseUrl, '/user'));
            if(err) {
                errType  = {type:ADDICT_ERR, key:'econnrefused'};
                response = errorGenerator.generateErrorCode(errType);
                return response;
            }
            if(data.error) {
                if(data.code) {
                    errType  = {type:ADDICT_ERR, key:data.code.toLowerCase()};
                    response = errorGenerator.generateErrorCode(errType);
                    return response;
                }else {
                    errType  = {type:UNKNOWN_ERR, key:'unknown_error'};
                    response = errorGenerator.generateErrorCode(errType);
                    return response;
                }
            }
            arUser_uname = data.map(x => x.sAMAccountName);
            arUser_uname = arUser_uname.map(x => x.toLowerCase());
            if(arUser_uname.includes(inputData.body.userName.toLowerCase())) {
                errType = {type:USER_ERR, key:'user_exists'};
                response = errorGenerator.generateErrorCode(errType);
                return response;
            }
            return response;
        }
    }
    // End: Section - USER
};

/**
 * @description process get operation for all API endpoints
 * @param {object} inputData -  The input object {actionParam :'the req url (/user,/group,/ou)',actionType : 'single'}
 * @returns {object} response - response object
 */
module.exports.processGetOperation = async(inputData) => {
    let errType, response, data;
    try {
        data = await restClient.get(baseUrl, inputData.actionParam);
        if(data.error) {
            if(data.code) {
                errType  = {type:ADDICT_ERR, key:data.code.toLowerCase()};
                response = errorGenerator.generateErrorCode(errType);             
                return response;
            }
            errType  = {type:UNKNOWN_ERR, key:'unknown_error'};
            response = errorGenerator.generateErrorCode(errType);
            return response;
        }else{
            if(inputData.actionType && inputData.actionType === 'single') {
                if(Object.keys(data).length === 0) {
                    let err_type, key_type;
                    if(inputData.actionParam.includes('/group')) {
                        err_type = GRP_ERR;
                        key_type = 'group_not_found';
                    }else if(inputData.actionParam.includes('/user')) {
                        err_type = USER_ERR;
                        key_type = 'user_not_found';
                    }else if(inputData.actionParam.includes('/ou')) {
                        err_type = OU_ERR;
                        key_type = 'ou_not_found';
                    }
                    errType = {type:err_type, key:key_type};
                    response = errorGenerator.generateErrorCode(errType);
                    return response;
                }
            }
            return data;
        }
    } catch(err) {
        console.log('catch-err',err);
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        return response;
    }
};

/**
 * @description process delete operation for all API endpoints
 * @param {object} inputData - The input object {actionParam :'the req url (/user,/group,/ou)',actionType : 'single'}
 * @returns {object} response - response object
 */
module.exports.processDeleteOperation = async(inputData) => {
    let errType, response, data;
    let err_type, key_not_found, key_more_than_one_exists;
    try {
        data = await restClient.delet(baseUrl, inputData.actionParam);
        if(inputData.actionParam.includes('/group')) {
            err_type = GRP_ERR;
            key_not_found = 'group_not_found';
            key_more_than_one_exists = 'more_than_one_group_exists';
        }else if(inputData.actionParam.includes('/user')) {
            err_type = USER_ERR;
            key_not_found = 'user_not_found';
            key_more_than_one_exists = 'more_than_one_user_exists';
        }else if(inputData.actionParam.includes('/ou')) {
            err_type = OU_ERR;
            key_not_found = 'ou_not_found';
            key_more_than_one_exists = 'more_than_one_ou_exists';
        }
        if(data.error) {
            if(data.code) {
                errType  = {type:ADDICT_ERR, key:data.code.toLowerCase()};
                response = errorGenerator.generateErrorCode(errType);
                return response;
            }
            if(data.message) {
                if(data.message.includes('does not exist')) {
                    errType  = {type:err_type, key:key_not_found};
                    response = errorGenerator.generateErrorCode(errType);
                    return response;
                }
                if(data.message.includes('More than 1 Object was returned')) {
                    errType  = {type:err_type, key:key_more_than_one_exists};
                    response = errorGenerator.generateErrorCode(errType);
                    return response;
                }
            }
            errType  = {type:UNKNOWN_ERR, key:'unknown_error'};
            response = errorGenerator.generateErrorCode(errType);
            return response;
        }else {
            if(inputData.actionType && inputData.actionType === 'single') {
                if(Object.keys(data).length === 0) {
                    errType = {type:err_type, key:key_not_found};
                    response = errorGenerator.generateErrorCode(errType);
                    return response;
                }
            }
            return data;
        }
    } catch(err) {
        console.log('catch-err',err);
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        return response;
    }
};

/**
 * @description converts promise response to [error,success] object
 * @param {Promise} promise - The promise
 * @returns {object} [error,success] object
 */
tryCatch = function(promise) {
    return promise.then(data => {
        return [null, data];
    }).catch(err =>
        [parser(err)]
    );
}

/**
 * @description convert unix timestamp to ticks
 * @param {object} timestamp - The unix timestamp
 * @returns {object} ticks - number of ticks for the unix timestamp
 */
module.exports.convertDateToTicks = (timestamp) => {
    let epochDate = new Date(1601, 00, 00);
    let epochTicks = (epochDate.getTime()*-1)*10000;
    // there are 10000 .net ticks per millisecond
    let ticksPerMillisecond = 10000;    
    // calculate the total number of .net ticks for our date
    let ticks = epochTicks + (timestamp * ticksPerMillisecond);
    return ticks;
}

