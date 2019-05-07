/** 
 *  @fileOverview HTTP routes and functions defined for OU(Organizational Unit) API methods like create, read, delete and exists. 
*
*  @author       VMWare
*
*  @requires     NPM:express
*  @requires     ./../utils/parseData
*  @requires     ./../utils/restClient
*  @requires     ./../utils/ad-config
*  @requires     ./../utils/errorLogger
*  @requires     ./../utils/errorGenerator
*/

/**
* Instance of express class
* @constant
*
* @type {object}
*/
const express         = require('express');

/**
* Instance of express router class
* @constant
*
* @type {object}
*/
const router          = express.Router();

/**
* Instance of restClient class
* @constant
*
* @type {object}
*/
const restClient      = require('../utils/restClient');

/**
* Instance of parseData class
* @constant
*
* @type {object}
*/
const parseService    = require('../utils/parseData');

/**
* Instance of adConfig class
* @constant
*
* @type {object}
*/
const adConfig        = require('../utils/ad-config');

/**
* Instance of errorGenerator class
* @constant
*
* @type {object}
*/
const errorGenerator = require('./../utils/errorGenerator');

/**
* Instance of errorLogger class
* @constant
*
* @type {object}
*/
const errorLogger    = require('./../utils/errorLogger');


/**
* holds the string value for base url constant
* @constant
*
* @type {string}
*/
const baseUrl = adConfig.baseUrl;

/**
* holds the string value for addict error constant
* @constant
*
* @type {string}
*/
const ADDICT_ERR    = 'addict_error';

/**
* holds the string value for ou error constant
* @constant
*
* @type {string}
*/
const OU_ERR        = 'ou_error';

/**
* holds the string value for group error constant
* @constant
*
* @type {string}
*/
const GRP_ERR       = 'group_error';

/**
* holds the string value for user error constant
* @constant
*
* @type {string}
*/
const USER_ERR      = 'user_error';

/**
* holds the string value for unknown error constant
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
* @description Get all Organisational Units in AD
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.get('/ou', async function (req, res, next) {
    let response = await parseService.processGetOperation({actionType:'all', actionParam:'/ou'});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }else {
        return res.status(200).json(response).end();
    }
});

/**
* @description Add or create new organisational group in AD
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.post('/ou', async function (req, res, next) {
    let errors, errType, data, response;
    req.check('name').exists().withMessage('name is required.').notEmpty().withMessage('name should not be empty.');
    errors = req.validationErrors();
    if(errors) {
        errType  = {type:REQUEST_ERR, key:"bad_request"};
        response = errorGenerator.generateErrorCode(errType);
        response.errorDecription = errors;
        return res.status(response.code).json(response).end();
    }

    response = await parseService.validateProcess({type:'ou', actionType:'add',body:req.body});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }
    try {
        data = await restClient.post(baseUrl, '/ou', req.body);
        if(data.error) {
            if(data.code) {
                errType  = {type:ADDICT_ERR, key:data.code.toLowerCase()};
                response = errorGenerator.generateErrorCode(errType);
                return res.status(response.code).json(response).end();
            }else {
                errorLogger.generateErrorLog(data);
                errType  = {type:UNKNOWN_ERR, key:'unknown_error'};
                response = errorGenerator.generateErrorCode(errType);
                return res.status(response.code).json(response).end();
            }
        }
        return res.status(201).json(data).end();
    } catch(err) {
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        errorLogger.generateErrorLog(err);
        return res.status(response.code).json(response).end();
    }
});

/**
* @description Get a specific organisational Unit in AD
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.get('/ou/:ou', async function (req, res, next) {
    let response = await parseService.processGetOperation({actionType:'single', actionParam:`/ou/${req.params.ou}`});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }else {
        return res.status(200).json(response).end();
    }
});

/**
* @description Check a specific organisational unit exists in AD
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.get('/ou/:ou/exists', async function (req, res, next) {
    let response = await parseService.processGetOperation({actionType:'exists', actionParam:`/ou/${req.params.ou}/exists/`});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }else {
        return res.status(200).json(response).end();
    }
});

/**
* @description Delete a specific organisational unit in AD
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.delete('/ou/:ou', async function (req, res, next) {
    let response = await parseService.processDeleteOperation({actionParam:`/ou/${req.params.ou}`});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    } else {
        return res.status(200).json(response).end();
    }
});

module.exports = router;