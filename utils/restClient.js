/**
 * Copyright(c) VmWare
 * All rights reserved.
 * Date: 10/12/18
 */ 

var request = require("request");
var config = require('./ad-config.js');

/**
 * Get method utility
 * @param {String} baseUrl - url
 * @param {String} path - sub url
 * @returns {Promise}
 */
module.exports.get = function get(baseUrl, path) {
  var options = {
    url: baseUrl + path,
    headers: {
      'content-type': 'application/json'
    }
  };
  // Return new promise 
  return new Promise(function (resolve, reject) {
    // Do async job
    request.get(options, function (err, resp, body) {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(body));
      }
    })
  })
}

/**
 * Post method utility
 * @param {String} baseUrl - url
 * @param {String} path -sub-url
 * @param {String} params -request body params
 * @returns {Promise}
 */

module.exports.post = function post(baseUrl, path, params) {
  var options = {
    url: baseUrl + path,
    headers: {
      'content-type': 'application/json'
    },
    body: params,
    json: true
  };
  // Return new promise 
  return new Promise(function (resolve, reject) {
    // Do async job
    request.post(options, function (err, resp, body) {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    })
  })
}

/**
 * Put method utility
 * @param {String} baseUrl - url
 * @param {String} path -sub url
 * @param {String} params -request body parameters
 * @returns {Promise} 
 */

module.exports.put = function put(baseUrl, path, body) {
  var options = {
    url: baseUrl + path,
    headers: {
      'content-type': 'application/json'
    },
    body: body,
    json: true
  };
  // Return new promise 
  return new Promise(function (resolve, reject) {
    // Do async job
    request.put(options, function (err, resp, body) {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    })
  })
}

/**
 * Delete method utility
 * @param {String} baseUrl - url
 * @param {String} path - sub url
 * @param {String} params -request body parameters
 * @returns {Promise}
 */

module.exports.delet = function delet(baseUrl, path, body) {
  var options = {
    url: baseUrl + path,
    headers: {
      'content-type': 'application/json'
    },
    body: body,
    json: true
  };
  // Return new promise 
  return new Promise(function (resolve, reject) {
    // Do async job
    request.delete(options, function (err, resp, body) {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    })
  })
}
