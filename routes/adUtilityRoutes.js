/** 
 *  @fileOverview HTTP routes and functions defined for utility API methods like replicate, createdir.
*
*  @author       VMWare
*
*  @requires     NPM:express
*  @requires     NPM:fs
*  @requires     ./../utils/parseData
*  @requires     ./../utils/repUtility
*  @requires     ./../utils/ad-config
*  @requires     ./../utils/errorLogger
*  @requires     ./../utils/errorGenerator
*  @requires     ../winston
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
const EXEC_ERR       = 'execution_error';

/**
* @description Replicate the changes in one AD across all ADs in the domain
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.get('/replicate', function (req, res, next) {
    try {
        cmd.runCmd(adConfig.repAdmin).then(function (response) {
            if(response.success) {
                logger.info("Replication initiated and completed on: " + Date.now());
                return res.status(200).json({success:true}).end();
            }else {
                logger.info("Replication initiated and failed on: " + Date.now());
                errType  = {type:EXEC_ERR, key:'execution_error'};
                response = errorGenerator.generateErrorCode(errType);
                return res.status(response.code).json(response).end();
            }
        });
    }catch(err) {
        errorLogger.generateErrorLog(err);
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        return res.status(response.code).json(response).end();
    }
});

/**
* @description Create a directory for a specific user in the specified location
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.post('/createdir', async function (req, res, next) {
    let errType, dirPath, dirPathSub, response, errors, userName, region;

    req.check('userName').exists().withMessage('userName is required.').notEmpty().withMessage('userName should not be empty.');
    req.check('region').exists().withMessage('region is required.').notEmpty().withMessage('region should not be empty.');
    errors = req.validationErrors();
    if(errors) {
        errType  = {type:REQUEST_ERR, key:"bad_request"};
        response = errorGenerator.generateErrorCode(errType);
        response.errorDecription = errors;
        return res.status(response.code).json(response).end();
    }
    userName = req.body.userName;
    region   = req.body.region;
    response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${userName}`});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }

    dirPath = `${process.env.DIR_PATH}-${region}`;
    if(! fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, '0777');
    }
    dirPathSub = `${dirPath}/${userName}`;
    if(fs.existsSync(dirPathSub)) {
        errType  = {type:DIR_ERR, key:"dir_exists"};
        response = errorGenerator.generateErrorCode(errType);
        return res.status(response.code).json(response).end();
    }else {
        fs.mkdirSync(dirPathSub, '0777');
        return res.status(201).json({success:true}).end();
    }
});

module.exports = router;