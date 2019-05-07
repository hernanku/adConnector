/** 
*   @fileOverview contains function to log errors
*   @author VMWare
*/

/**
* Instance of winston class
* @constant
*
* @type {instance}
*/
const logger = require('../winston');

/**
* @description function to log errors 
* @param   {object} response     response error object that needs to be logged
*
*/
generateErrorLog = response => {
    logger.info(`Error  : ${JSON.stringify(response)}`);
}

module.exports = {
    generateErrorLog
}
