'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setXHRRequests = exports.getXHRRequests = exports.abortXHRRequest = exports.customError = exports.upload = exports.presign = exports.parseJSON = exports.responseStatus = undefined;

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

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
 * getXHRRequests
 * Get the current XHR processing XHR requests
 * @return {Object}
 */

function getXHRRequests() {
  return reqs;
}

/**
 * setXHRRequests
 * Assign an object to `reqs`
 * @param {Object} object
 * @return {Object}
 */

function setXHRRequests(object) {
  Object.assign(reqs, object);
  return reqs;
}

/**
 * abortXHRRequest
 * Abort a XHR request by 'uid'
 * @param {String} uid
 * @param {Function} optional function
 * @return {Object}
 */

function abortXHRRequest(uid, fn) {
  if (reqs.hasOwnProperty(uid)) {
    if (!reqs[uid]) return;

    if (fn) {
      fn();
    } else {
      reqs[uid].abort();
    }
    delete reqs[uid];
    return reqs;
  }
}

/**
 * customError
 * return an object forming a custom error message
 * @param  {String} name
 * @param  {Object} error
 * @return {Object}
 */

function customError(name, error) {
  return {
    error: error,
    message: error.message,
    name: name
  };
}

/**
 * responseStatus
 * take a response and check the response `status` property
 * if between 200-300 return the response object
 * else throw a custom error
 * @param  {Object} res
 * @return {Object}
 */

function responseStatus(res) {
  if (res.status >= 200 && res.status < 300) {
    return res;
  } else {
    var error = new Error(res.statusText);
    error.response = res;
    throw customError('responseStatus', error);
  }
}

/**
 * parseJSON
 * Take a response object and return the parsed res.text
 * @param  {String} response
 * @return {Object}
 */

function parseJSON(res) {
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
 * @return {String}
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

  var upload_url = buildUploadURL(url, uuid, expiration, hmac, file.name);

  return new Promise(function (resolve, reject) {
    reqs[uid] = _superagent2.default.put(upload_url).send(file).set({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }).on('progress', function (e) {
      showProgress(e, file);
    }).end(function (err, res) {
      delete reqs[uid];

      // throw a custom error message
      if (err) return reject(customError('uploadRequest', err));

      resolve(res);
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
    fn(res, file, showProgress).then(responseStatus).then(parseJSON).then(function (res) {
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
      // throw a custom error message
      if (err) return reject(customError('presignRequest', err));
      resolve(res);
    });
  });
}

/**
 * presign
 * Take a url and optional token
 * return a Promise
 * @param  {String} presignUrl
 * @param  {String} token
 * @param  {Function} defaults to presignRequest()
 * @param  {Promise}
 */

function presign(presignUrl, token) {
  var fn = arguments.length <= 2 || arguments[2] === undefined ? presignRequest : arguments[2];

  return new Promise(function (resolve, reject) {
    fn(presignUrl, token).then(responseStatus).then(parseJSON).then(function (res) {
      resolve(res);
    }).catch(function (err) {
      reject(err);
    });
  });
}

exports.responseStatus = responseStatus;
exports.parseJSON = parseJSON;
exports.presign = presign;
exports.upload = upload;
exports.customError = customError;
exports.abortXHRRequest = abortXHRRequest;
exports.getXHRRequests = getXHRRequests;
exports.setXHRRequests = setXHRRequests;