/** 
*   @fileOverview Contains function to generate error.
*   @author VMWare
*   @requires     ./../utils/errorGenerator
*/

/**
* Instance of errorCode json
* @constant
*
* @type {object}
*/
const errorCodes    = require("./../config/errorCode.json");

/**
* Instance of errorLogger class
* @constant
*
* @type {object}
*/
const errorLogger   = require('./../utils/errorLogger');

/**
* @description Generate error code from errorCode.json and log errors
* @param   {object} errorObj     request error object with type and key
* 
* @returns {object} response object
*/
module.exports.generateErrorCode = (errorObj) => {
    let response = errorCodes[errorObj.type][errorObj.key];
    if(!response) {
        response = errorCodes['unknown_error']['unknown_error'];
        errorLogger.generateErrorLog(response);
        return response;
    }else {
        errorLogger.generateErrorLog(response);
        return response;
    }
}
