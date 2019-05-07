/** 
 *  @fileOverview HTTP routes and functions defined for User API methods like create, read, delete, update etc. 
*
*  @author       VMWare
*
*  @requires     NPM:express
*  @requires     NPM:moment-timezone
*  @requires     ./../utils/parseData
*  @requires     ./../utils/restClient
*  @requires     ./../utils/ad-config
*  @requires     ./../utils/errorLogger
*  @requires     ./../utils/errorGenerator
*  @requires     ./../utils/passwordValidator
*/

/**
* Instance of express class
* @constant
*
* @type {object}
*/
const express      = require('express');

/**
* Instance of express router class
* @constant
*
* @type {object}
*/
const router       = express.Router();

/**
* Instance of moment-timezone class
* @constant
*
* @type {object}
*/
const moment = require('moment-timezone');

/**
* Instance of restClient class
* @constant
*
* @type {object}
*/
const restClient   = require('../utils/restClient');

/**
* Instance of parseData class
* @constant
*
* @type {object}
*/
const parseService = require('../utils/parseData');

/**
* Instance of adConfig class
* @constant
*
* @type {object}
*/
const adConfig     = require('../utils/ad-config');

/**
* Instance of errorGenerator class
* @constant
*
* @type {object}
*/
const errorGenerator    = require('./../utils/errorGenerator');

/**
* Instance of errorLogger class
* @constant
*
* @type {object}
*/
const errorLogger       = require('./../utils/errorLogger');

/**
* Instance of passwordValidator class
* @constant
*
* @type {object}
*/
const passwordValidator = require('./../utils/passwordValidator');

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
* holds the string value for ou error constant
* @constant
*
* @type {string}
*/
const OU_ERR        = 'ou_error';

/**
* holds the string value for time zone error constant
* @constant
*
* @type {string}
*/
const TIME_ZONE     = 'Asia/Kolkata'

/**
* holds the string value for baseUrl constant
* @constant
*
* @type {string}
*/
const baseUrl = adConfig.baseUrl;

/**
* @description Get all users in AD
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.get('/user', async function (req, res, next) {
    let response = await parseService.processGetOperation({actionType:'all', actionParam:'/user'});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }else {
        return res.status(200).json(response).end();
    }
});

/**
* @description Add or create new user in AD
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.post('/user', async function (req, res, next) {
    let errType, data, response, passwordValidation, errors;
    req.check('commonName').exists().withMessage('commonName is required.').notEmpty().withMessage('commonName should not be empty.');
    req.check('userName').exists().withMessage('userName is required.').notEmpty().withMessage('userName should not be empty.');
    req.check('password').exists().withMessage('password is required.').notEmpty().withMessage('password should not be empty.');
    errors = req.validationErrors();
    if(errors) {
        errType  = {type:REQUEST_ERR, key:"bad_request"};
        response = errorGenerator.generateErrorCode(errType);
        response.errorDecription = errors;
        return res.status(response.code).json(response).end();
    }

    passwordValidation = passwordValidator.validatePassword(req.body.password,req.body.userName,req.body.commonName);
    if(!passwordValidation) {
        errType  = {type:USER_ERR, key:"password_validation_failed"};
        response = errorGenerator.generateErrorCode(errType);
        return res.status(response.code).json(response).end();
    }

    /*check if accountExpires is valid if account expires exists*/
    if(req.body.accountExpires) {
        req.check('accountExpires')
        .notEmpty().withMessage('accountExpires should not be empty.');
        errors = req.validationErrors();
        if(errors) {
            errType  = {type:REQUEST_ERR, key:"bad_request"};
            response = errorGenerator.generateErrorCode(errType);
            response.errorDecription = errors;
            return res.status(response.code).json(response).end();
        }
        if(!moment(req.body.accountExpires, "MM-DD-YYYY", true).isValid()) {
            errType  = {type:REQUEST_ERR, key:"invalid_date"};
            response = errorGenerator.generateErrorCode(errType);
            return res.status(response.code).json(response).end();
        }
    } 

    response = await parseService.validateProcess({type:'user', actionType:'add',body:req.body});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }
    try {
        data = await restClient.post(baseUrl, '/user', req.body);
        if(data.error) {
            if(data.code) {
                errType  = {type:ADDICT_ERR, key:data.code.toLowerCase()};
                response = errorGenerator.generateErrorCode(errType);
                return res.status(response.code).json(response).end();
            }
            if(data.message) {
                if(data.message.includes('0000052D')) {
                    errType  = {type:USER_ERR, key:'user_created_password_validation_failed'};
                    response = errorGenerator.generateErrorCode(errType);
                    return res.status(response.code).json(response).end();
                }
                if(data.message.includes('Error creating user') || data.message.includes('does not exist')) {
                    errType  = {type:USER_ERR, key:'common_name_exists'};
                    response = errorGenerator.generateErrorCode(errType);
                    return res.status(response.code).json(response).end();
                }
            }
            errorLogger.generateErrorLog(data);
            errType  = {type:UNKNOWN_ERR, key:'unknown_error'};
            response = errorGenerator.generateErrorCode(errType);
            return res.status(response.code).json(response).end();
        }
        /*set user expiration if accountExpires is provided*/
        let updateObj = {};
        if(req.body.accountExpires) {
            console.log("SET account expiry");
            let timestamp = moment(req.body.accountExpires, "MM-DD-YYYY").tz(TIME_ZONE).unix();            
            updateObj.accountExpires = parseService.convertDateToTicks(timestamp*1000);
            
        }
        if(req.body.description) {
            updateObj.description = req.body.description;
        }
        if(req.body.company) {
            updateObj.company = req.body.company;
        }
        if(req.body.passwordNeverExpires) {
			updateObj.userAccountControl = 66048; // User Control 66048 - means the user passowrd will never expire
        }
        
        if(req.body.displayName) {
            updateObj.displayName = req.body.displayName;
        } 

        if(req.body.accountExpires || req.body.description || req.body.passwordNeverExpires || req.body.displayName) {
            let userExtendData = await restClient.put(baseUrl, '/user/' + data.sAMAccountName + '/setproperty/', updateObj);
            if(userExtendData.error) {
                if(userExtendData.code) {
                    errType  = {type:ADDICT_ERR, key:userExtendData.code.toLowerCase()};
                    response = errorGenerator.generateErrorCode(errType);
                    return res.status(response.code).json(response).end();
                }
                errorLogger.generateErrorLog(userExtendData);
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
* @description Update a specific user in AD 
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.put('/user/:user', async function (req, res, next) {
    let errType, data, response;
    response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${req.params.user}`});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }
    try {
        data = await restClient.put(baseUrl, '/user/' + req.params.user, req.body);
        if(data.error) {
            if(data.code) {
                errType  = {type:ADDICT_ERR, key:data.code.toLowerCase()};
                response = errorGenerator.generateErrorCode(errType);
                return res.status(response.code).json(response).end();
            }
            if(data.message) {
                if(data.message.includes('0000052D')) {
                    errType  = {type:USER_ERR, key:'password_update_validation_failed'};
                    response = errorGenerator.generateErrorCode(errType);
                    return res.status(response.code).json(response).end();
                }else if(data.message.includes('00002071')) {
                    errType = {type:USER_ERR, key:'common_name_exists'};
                    response = errorGenerator.generateErrorCode(errType);
                    return res.status(response.code).json(response).end();
                }
            }
            if(data.lde_message) {
                if(data.lde_message.includes('000021C8')) {
                    errType  = {type:USER_ERR, key:'password_update_validation_failed'};
                    response = errorGenerator.generateErrorCode(errType);
                    return res.status(response.code).json(response).end();
                }
            }
            errorLogger.generateErrorLog(data);
            errType  = {type:UNKNOWN_ERR, key:'unknown_error'};
            response = errorGenerator.generateErrorCode(errType);
            return res.status(response.code).json(response).end();
        }
        return res.status(200).json(data).end();
    } catch(err) {
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        errorLogger.generateErrorLog(err);
        return res.status(response.code).json(response).end();
    }
});

/**
* @description Update the password of a specific user in AD
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.put('/user/:user/password', async function (req, res, next) {
    let errors, errType, data, response, passwordValidation;
    req.check('password').exists().withMessage('password is required.').notEmpty().withMessage('password should not be empty.');
    errors = req.validationErrors();
    if(errors) {
        errType  = {type:REQUEST_ERR, key:"bad_request"};
        response = errorGenerator.generateErrorCode(errType);
        response.errorDecription = errors;
        return res.status(response.code).json(response).end();
    }

    response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${req.params.user}`});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }

    passwordValidation = passwordValidator.validatePassword(req.body.password,response.sAMAccountName,response.cn);
    if(!passwordValidation) {
        errType  = {type:USER_ERR, key:"password_update_validation_failed"};
        response = errorGenerator.generateErrorCode(errType);
        return res.status(response.code).json(response).end();
    }

    try {
        data = await restClient.put(baseUrl, '/user/' + req.params.user + '/password', req.body);
        if(data.error) {
            if(data.code) {
                errType  = {type:ADDICT_ERR, key:data.code.toLowerCase()};
                response = errorGenerator.generateErrorCode(errType);
                return res.status(response.code).json(response).end();
            }
            if(data.message) {
                if(data.message.includes('0000052D')) {
                    errType  = {type:USER_ERR, key:'password_update_validation_failed'};
                    response = errorGenerator.generateErrorCode(errType);
                    return res.status(response.code).json(response).end();
                }
            }
            errorLogger.generateErrorLog(data);
            errType  = {type:UNKNOWN_ERR, key:'unknown_error'};
            response = errorGenerator.generateErrorCode(errType);
            return res.status(response.code).json(response).end();
        }
        console.log(`Password Change ${data}`);
        return res.status(200).json(data).end();
    } catch(err) {
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        errorLogger.generateErrorLog(err);
        return res.status(response.code).json(response).end();
    }
});

/**
* @description Delete a specific user in AD
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.delete('/user/:user', async function (req, res, next) {
    var response = await parseService.processDeleteOperation({actionParam:`/user/${req.params.user}`});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }else {
        return res.status(200).json(response).end();
    }
});

/**
* @description Get a specific user in AD
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.get('/user/:user', async function (req, res, next) {
    var response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${req.params.user}`});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }else {
        return res.status(200).json(response).end();
    }
});

/**
* @description Get if a specific user is a member of the specific group in AD
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.get('/user/:user/member-of/:group', async function (req, res, next) {
    let response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${req.params.user}`});
    let errType, data;
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }
    response = await parseService.processGetOperation({actionType:'single', actionParam:`/group/${req.params.group}`});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }

    try {
        data = await restClient.get(baseUrl, '/user/' + req.params.user + '/member-of/' + req.params.group);
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
        return res.status(200).json(data).end();
    } catch(err) {
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        errorLogger.generateErrorLog(err);
        return res.status(response.code).json(response).end();
    }
});

/**
* @description Check if the user with a specific username and given password exists in AD
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.post('/user/:user/authenticate', async function (req, res, next) {
    let errors;
    req.check('password').exists().withMessage('password is required.').notEmpty().withMessage('password should not be empty.');
    errors = req.validationErrors();
    if(errors) {
        errType  = {type:REQUEST_ERR, key:"bad_request"};
        response = errorGenerator.generateErrorCode(errType);
        response.errorDecription = errors;
        return res.status(response.code).json(response).end();
    }

    let response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${req.params.user}`});
    let errType, data;
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }

    try {
        data = await restClient.post(baseUrl, '/user/' + req.params.user + '/authenticate/', req.body);
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
        }else if(!data.data) {
            errType  = {type:USER_ERR, key:'user_auth_error'};
            response = errorGenerator.generateErrorCode(errType);
            return res.status(response.code).json(response).end();
        }
        return res.status(204).json({success:true}).end();
    } catch(err) {
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        errorLogger.generateErrorLog(err);
        return res.status(response.code).json(response).end();
    }
});

/**
* @description Set specific user's password to never expire
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.put('/user/:user/password-never-expires', async function (req, res, next) {
    let response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${req.params.user}`});
    let errType, data;
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }

    try {
        data = await restClient.put(baseUrl, '/user/' + req.params.user + '/password-never-expires/', req.body);
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
        return res.status(200).json(data).end();
    } catch(err) {
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        errorLogger.generateErrorLog(err);
        return res.status(response.code).json(response).end();
    }
});

/**
* @description Set specific user's password to expire at specified intervals.
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.put('/user/:user/password-expires', async function (req, res, next) {
    let response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${req.params.user}`});
    let errType, data;
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }

    try {
        data = await restClient.put(baseUrl, '/user/' + req.params.user + '/password-expires/', req.body);
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
        return res.status(200).json(data).end();
    } catch(err) {
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        errorLogger.generateErrorLog(err);
        return res.status(response.code).json(response).end();
    }
});

/**
* @description Enable a specific user
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.put('/user/:user/enable', async function (req, res, next) {
    let response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${req.params.user}`});
    let errType, data;
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }

    try {
        data = await restClient.put(baseUrl, '/user/' + req.params.user + '/enable/', req.body);
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
        return res.status(200).json(data).end();
    } catch(err) {
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        errorLogger.generateErrorLog(err);
        return res.status(response.code).json(response).end();
    }
});

/**
* @description Disable a specific user
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.put('/user/:user/disable', async function (req, res, next) {
    let response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${req.params.user}`});
    let errType, data;
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }

    try {
        data = await restClient.put(baseUrl, '/user/' + req.params.user + '/disable/', req.body);
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
        return res.status(200).json(data).end();
    } catch(err) {
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        errorLogger.generateErrorLog(err);
        return res.status(response.code).json(response).end();
    }
});

/**
* @description Move the specific user to a particular OU inside the AD
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.put('/user/:user/move', async function (req, res, next) {
    let errType, data, response, errors;
    req.check('location').exists().withMessage('location is required.').notEmpty().withMessage('location should not be empty.');
    errors = req.validationErrors();
    if(errors) {
        errType  = {type:REQUEST_ERR, key:"bad_request"};
        response = errorGenerator.generateErrorCode(errType);
        response.errorDecription = errors;
        return res.status(response.code).json(response).end();
    }

    response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${req.params.user}`});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }

    try {
        data = await restClient.put(baseUrl, '/user/' + req.params.user + '/move/', req.body);
        if(data.error) {
            if(data.code) {
                errType  = {type:ADDICT_ERR, key:data.code.toLowerCase()};
                response = errorGenerator.generateErrorCode(errType);
                return res.status(response.code).json(response).end();
            }
            if(data.message) {
                let tmpMessage = data.message.toLowerCase();
                if(tmpMessage.includes('00002089') || tmpMessage.includes('dir_error')) {
                    errType  = {type:OU_ERR, key:'ou_not_found'};
                    response = errorGenerator.generateErrorCode(errType);
                    return res.status(response.code).json(response).end();
                }
            }
            errorLogger.generateErrorLog(data);
            errType  = {type:UNKNOWN_ERR, key:'unknown_error'};
            response = errorGenerator.generateErrorCode(errType);
            return res.status(response.code).json(response).end();
        }
        return res.status(200).json(data).end();
    } catch(err) {
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        errorLogger.generateErrorLog(err);
        return res.status(response.code).json(response).end();
    }
});

/**
* @description Unlock the specific user
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.put('/user/:user/unlock', async function (req, res, next) {
    let errType, data, response;
    response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${req.params.user}`});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }

    try {
        data = await restClient.put(baseUrl, '/user/' + req.params.user + '/unlock/', req.body);
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
        return res.status(200).json(data).end();
    } catch(err) {
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        errorLogger.generateErrorLog(err);
        return res.status(response.code).json(response).end();
    }
});

/**
* Takes request and response object and optional next object
* @param   {object} req     request object
* @param   {object} res     response object
* @param   {object} next    the optional next object
*
* @returns {json} success or error object
*/
router.put('/user/:user/extend', async function (req, res, next) {
    
    let errType, data, response, errors;
    req.check('accountExpires')
        .exists().withMessage('accountExpires is a required parameter.')
        .notEmpty().withMessage('accountExpires should not be empty.');
    errors = req.validationErrors();
    
    if(errors) {
        errType  = {type:REQUEST_ERR, key:"bad_request"};
        response = errorGenerator.generateErrorCode(errType);
        response.errorDecription = errors;
        return res.status(response.code).json(response).end();
    }

    if(!moment(req.body.accountExpires, "MM-DD-YYYY", true).isValid()) {
        errType  = {type:REQUEST_ERR, key:"invalid_date"};
        response = errorGenerator.generateErrorCode(errType);
        return res.status(response.code).json(response).end();
    }

    let timestamp = moment(req.body.accountExpires, "MM-DD-YYYY").tz(TIME_ZONE).unix();
    
    response = await parseService.processGetOperation({actionType:'single', actionParam:`/user/${req.params.user}`});
    if(response && response.code) {
        return res.status(response.code).json(response).end();
    }

    try {
        req.body.accountExpires = parseService.convertDateToTicks(timestamp*1000);
        data = await restClient.put(baseUrl, '/user/' + req.params.user + '/extend/', req.body);
        if(data.error) {
            if(data.code) {
                errType  = {type:ADDICT_ERR, key:data.code.toLowerCase()};
                response = errorGenerator.generateErrorCode(errType);
                return res.status(response.code).json(response).end();
            }
            errorLogger.generateErrorLog(data);
            errType  = {type:UNKNOWN_ERR, key:'unknown_error'};
            response = errorGenerator.generateErrorCode(errType);
            return res.status(response.code).json(response).end();
        }
        return res.status(200).json(data).end();
    } catch(err) {
        errorLogger.generateErrorLog(err);
        errType  = {type:ADDICT_ERR, key:'econnrefused'};
        response = errorGenerator.generateErrorCode(errType);
        return res.status(response.code).json(response).end();
    }
});

module.exports = router;