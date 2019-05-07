/**
 * Copyright(c) VmWare
 * All rights reserved.
 * Date: 10/12/18
 */ 

var cmd = require('node-command-line');
var config = require('./ad-config');
Promise = require('bluebird');
var logger = require('../winston');

/**
 * Utility to run Cmd commands
 * @param {String} command - windows commands
 */
module.exports.runCmd = function runCmd(command) {
  // return the result as a promise
  return new Promise(function (resolve, reject) {
    Promise.coroutine(function* () {
      // run the command asynchronously
      var response = yield cmd.run(command);
      if (response.success) {
        console.log(command + " sucess with the result :" + response.message);
        resolve({ "success": true });
      } else {
        console.log(command + " failed with the result :" + response.error);
        resolve({ "success": false });
      }
      console.log('command executed' + command);
    })();
  })
}