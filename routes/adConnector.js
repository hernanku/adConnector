/** 
* @fileOverview HTTP routes and functions defined for User API methods like create, read, delete, update etc. 
*
*  @author       VMWare
*
*  @requires     NPM:express
*  @requires     ./../utils/repUtility
*  @requires     ./../utils/ad-config
*/


/**
* Instance of express class
* @constant
*
* @type {object}
*/
const express = require('express');

/**
* Instance of express router class
* @constant
*
* @type {object}
*/
const router = express.Router();

/**
* Instance of repUtility class
* @constant
*
* @type {object}
*/
const cmd = require('../utils/repUtility');

/**
* Instance of ad-config class
* @constant
*
* @type {object}
*/
const adConfig = require('../utils/ad-config');

router.get('/', function (req, res, next) {
  var response = cmd.runCmd(adConfig.addictUrl);
  res.send('connected');
});

module.exports = router;