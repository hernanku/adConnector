/** 
*   @fileOverview HTTP routes and functions defined for office365 API methods.
*   @description adOffice365
*   @author VMWare
*   @requires     NPM:express
*   @requires     NPM:fs
*   @requires     NPM:child_process
*   @requires     ./../utils/parseData
*   @requires     ./../utils/repUtility
*   @requires     ./../utils/ad-config
*   @requires     ./../utils/errorLogger
*   @requires     ./../utils/errorGenerator
*   @requires     ../winston
*/

/**
* Instance of express class
* @constant
*
* @type {object}
*/
const express       = require('express');

/**
* Instance of express router class
* @constant
*
* @type {object}
*/
const router        = express.Router();

/**
* Instance of node file system class
* @constant
*
* @type {object}
*/
const fs            = require('fs');

/**
* Instance of node child process class
* @constant
*
* @type {object}
*/
const { spawn }     = require('child_process');

/**
* Instance of parseData class
* @constant
*
* @type {object}
*/
const parseService  = require('./../utils/parseData');

/**
* Instance of repUtility class
* @constant
*
* @type {object}
*/
const cmd           = require('./../utils/repUtility');

/**
* Instance of ad-config class
* @constant
*
* @type {object}
*/
const adConfig      = require('./../utils/ad-config');

/**
* Instance of errorLogger class
* @constant
*
* @type {object}
*/
const errorLogger   = require('./../utils/errorLogger');

/**
* Instance of errorGenerator class
* @constant
*
* @type {object}
*/
const errorGenerator= require('./../utils/errorGenerator');

/**
* Instance of winston class
* @constant
*
* @type {instance}
*/
const logger        = require('../winston');

/**
* holds the string value for addict error constant
* @constant
*
* @type {string}
*/
const ADDICT_ERR    = 'addict_error';

/**
* holds the string value for user error constant
* @constant
*
* @type {string}
*/
const USER_ERR      = 'user_error';

/**
* holds the string value for unkown error constant
* @constant
*
* @type {string}
*/
const UNKNOWN_ERR   = 'unknown_error';

/**
* holds the string value for request error constant
* @constant
*
* @type {string}
*/
const REQUEST_ERR   = 'request_error';

/**
* holds the string value for directory error constant
* @constant
*
* @type {string}
*/
const DIR_ERR       = 'dir_error';

/**
* holds the string value for execution error constant
* @constant
*
* @type {string}
*/
const EXEC_ERR      = 'execution_error';

/**
* @description Sync a specific user - executing a shell script
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.post('/sync', async function (req, res, next) {
    let errType, dirPath, response, errors, userName, domain_suffix;

    req.check('userName').exists().withMessage('userName is required.').notEmpty().withMessage('userName should not be empty.');
    errors = req.validationErrors();
    if(errors) {
        errType  = {type:REQUEST_ERR, key:"bad_request"};
        response = errorGenerator.generateErrorCode(errType);
        response.errorDecription = errors;
        return res.status(response.code).json(response).end();
    }
    userName      = req.body.userName;
    domain_suffix = req.body.domain_suffix?req.body.domain_suffix:process.env.LDAP_DOMAIN;
    response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${userName}`});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }
    try {
        let ls = spawn("./office365_scripts/office365ActivateSingleUser.sh", [`${userName}@${domain_suffix}`]);
        ls.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        ls.stderr.on('data', (data) => {
            errorLogger.generateErrorLog(data);
            errType  = {type:EXEC_ERR, key:'execution_error'};
            response = errorGenerator.generateErrorCode(errType);
            return res.status(response.code).json(response).end();
        });

        ls.stderr.on('error', (data) => {
            errorLogger.generateErrorLog(data);
            errType  = {type:EXEC_ERR, key:'execution_error'};
            response = errorGenerator.generateErrorCode(errType);
            return res.status(response.code).json(response).end();
        });

        ls.on('exit', (code) => {
            console.log(`sync - child process exited with code ${code}`);
            return res.status(200).json({success:true}).end();
        });

        ls.on('close', (code) => {
            console.log(`sync - child process closed with code ${code}`);
        });
  
    }catch(err) {
        errorLogger.generateErrorLog(err);
        errType  = {type:UNKNOWN_ERR, key:'unknown_error'};
        response = errorGenerator.generateErrorCode(errType);
        return res.status(response.code).json(response).end();
    }
});

/**
* @description Sync all for whole user - executing a shell script
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.post('/sync/all', async function (req, res, next) {
    try {
        let ls = spawn("./office365_scripts/office365ActivateAllUsers.sh");
        ls.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        ls.stderr.on('data', (data) => {
            errorLogger.generateErrorLog(data);
            errType  = {type:EXEC_ERR, key:'execution_error'};
            response = errorGenerator.generateErrorCode(errType);
            return res.status(response.code).json(response).end();
        });

        ls.stderr.on('error', (data) => {
            errorLogger.generateErrorLog(data);
            errType  = {type:EXEC_ERR, key:'execution_error'};
            response = errorGenerator.generateErrorCode(errType);
            return res.status(response.code).json(response).end();
        });

        ls.on('exit', (code) => {
            console.log(`sync - child process exited with code ${code}`);
            return res.status(200).json({success:true}).end();
        });

        ls.on('close', (code) => {
            console.log(`sync - child process closed with code ${code}`);
        });
    }catch(err) {
        errorLogger.generateErrorLog(err);
        errType  = {type:UNKNOWN_ERR, key:'unknown_error'};
        response = errorGenerator.generateErrorCode(errType);
        return res.status(response.code).json(response).end();
    }
});

module.exports = router;