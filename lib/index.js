'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.upload = exports.presign = undefined;

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _bus = require('bus');

var _bus2 = _interopRequireDefault(_bus);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('es6-promise').polyfill();


/**
 * noOp
 * Default param value
 * @return {Function}
 */

var noOp = function noOp(_) {};

/**
 * reqs
 * a hash of existing XHR requests
 */

var reqs = {};

/**
 * abortUploadRequest
 * Fired from a preview elements `x` button, passing in it's data-uid attribute value
 * Search the `reqs` hash for an existing request of the same name and
 * abort() and delete it
 */

_bus2.default.on('abortUploadRequest', function (uid) {
  if (reqs.hasOwnProperty(uid)) {
    if (!reqs[uid]) return;
    reqs[uid].abort();
    delete reqs[uid];
  }
});

/**
 * checkStatus
 * take a response and check it's `status` property
 * if between 200-300 return the response object
 * else throw an error
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */

function checkStatus(res) {
  if (res.status >= 200 && res.status < 300) {
    return res;
  } else {
    var error = new Error(res.statusText);
    error.response = res;
    throw error;
  }
}

/**
 * parseJSON
 * Take a response object and return it parsed
 * @param  {String} response
 * @return {Object}
 */

function parseJSON(res, url) {
  return JSON.parse(res.text);
}

/**
 * buildUploadURL
 * Construct a string using params
 * @param  {String} url
 * @param  {String} uuid
 * @param  {String} expiration
 * @param  {String} hmac
 * @param  {String} filename
 * @return {[String}
 */

function buildUploadURL(url, uuid, expiration, hmac, filename) {
  return url + '?uuid=' + uuid + '&expiration=' + expiration + '&hmac=' + hmac + '&file=' + filename;
}

/**
 * uploadRequest
 * Assign an XHR request to the `reqs` hash using the `uid`.
 * @param  {Object} res - the response from presignRequest()
 * @param  {File Object} file
 * @param  {Function} on progress event handler
 * @return  {Promise}
 */

function uploadRequest(res, fileObject, showProgress) {
  var url = res.url;
  var expiration = res.expiration;
  var hmac = res.hmac;
  var uuid = res.uuid;
  var file = fileObject.file;
  var uid = fileObject.uid;

  var uploadURL = buildUploadURL(url, uuid, expiration, hmac, file.name);

  return new Promise(function (resolve, reject) {
    reqs[uid] = _superagent2.default.put(uploadURL).send(file).set({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }).on('progress', function (e) {
      showProgress(e, file);
    }).end(function (err, res) {
      delete reqs[uid];
      if (err) reject(err);

      // append the `uploadURL` to the response
      var response = Object.assign({}, res);
      var data = JSON.parse(res.text);
      data.uploadURL = url;
      response.text = JSON.stringify(data);
      resolve(response);
    });
  });
}

/**
 * upload
 * Take a response object (from presignRequest) a file and a token
 * and return a Promise that makes an uploadRequest()
 * @param  {Object} res - the response from presignRequest()
 * @param  {File Object} file
 * @param  {Function} showProgress - progress event handler
 * @param  {Function} fn - defaults to uploadRequest()
 * @return {Promise}
 */

function upload(res, file) {
  var showProgress = arguments.length <= 2 || arguments[2] === undefined ? noOp : arguments[2];
  var fn = arguments.length <= 3 || arguments[3] === undefined ? uploadRequest : arguments[3];

  return new Promise(function (resolve, reject) {
    fn(res, file, showProgress).then(checkStatus).then(parseJSON).then(function (res) {
      resolve(res);
    }).catch(function (err) {
      reject(err);
    });
  });
}

/**
 * presignRequest
 * Perform an XHR request and Resolve or Reject
 * @param  {String} presignUrl
 * @param  {String} token
 * @param  {Promise}
 */

function presignRequest(presignUrl, token) {
  return new Promise(function (resolve, reject) {
    _superagent2.default.post(presignUrl).set({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': token
    }).end(function (err, res) {
      if (err) reject(err);
      resolve(res);
    });
  });
}

/**
 * presign
 * Take a url and optional token
 * return a Promise that makes a presignRequest()
 * @param  {String} presignUrl
 * @param  {String} token
 * @param  {Function} defaults to preSignRequest()
 * @param  {Promise}
 */

function presign(presignUrl, token) {
  var fn = arguments.length <= 2 || arguments[2] === undefined ? presignRequest : arguments[2];

  return new Promise(function (resolve, reject) {
    fn(presignUrl, token).then(checkStatus).then(parseJSON).then(function (res) {
      resolve(res);
    }).catch(function (err) {
      reject(err);
    });
  });
}

exports.presign = presign;
exports.upload = upload;