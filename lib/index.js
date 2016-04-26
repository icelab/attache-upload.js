'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.upload = exports.preSign = undefined;

var _superagent = require('superagent');

var request = _interopRequireWildcard(_superagent);

var _bus = require('bus');

var _bus2 = _interopRequireDefault(_bus);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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
 * @param  {Object} res - the response from preSignXHR()
 * @param  {File Object} file
 * @param  {String} token
 * @param  {Function} on progress event handler
 * @return  {Promise}
 */

function uploadRequest(res, fileObject, token, showProgress) {
  var url = res.url;
  var expiration = res.expiration;
  var hmac = res.hmac;
  var uuid = res.uuid;
  var file = fileObject.file;
  var uid = fileObject.uid;

  var uploadURL = buildUploadURL(url, uuid, expiration, hmac, file.name);

  return new Promise(function (resolve, reject) {
    reqs[uid] = request.put(uploadURL).send(file).set({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': token
    }).on('progress', function (e) {
      // send the `uid` back so we can assign it to
      // the preview's `x` button for aborting requests
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
 * Take a response object (from preSignRequest) a file and a token
 * and return a Promise that makes an uploadRequest()
 * @param  {Object} res - the response from preSignRequest()
 * @param  {File Object} file
 * @param  {String} token
 * @param  {Function} showProgress - progress event handler
 * @param  {Function} fn - defaults to uploadRequest()
 * @return {Promise}
 */

function upload(res, file, token) {
  var showProgress = arguments.length <= 3 || arguments[3] === undefined ? noOp : arguments[3];
  var fn = arguments.length <= 4 || arguments[4] === undefined ? uploadRequest : arguments[4];

  return new Promise(function (resolve, reject) {
    fn(res, file, token, showProgress).then(checkStatus).then(parseJSON).then(function (res) {
      resolve(res);
    }).catch(function (err) {
      reject(err);
    });
  });
}

/**
 * preSignRequest
 * Perform an XHR request and Resolve or Reject
 * @param  {File Object} file
 * @param  {String} presignUrl
 * @param  {String} token
 * @param  {Promise}
 */

function preSignRequest(fileObject, presignUrl, token) {
  var file = fileObject.file;

  var data = file ? [{
    'file_name': file.name,
    'content_type': file.type
  }] : [];

  return new Promise(function (resolve, reject) {
    request.post(presignUrl).send(data).set({
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
 * preSign
 * Take a file, url and
 * return a Promise that makes a preSignRequest()
 * @param  {File Object} file
 * @param  {String} presignUrl
 * @param  {String} token
 * @param  {Function} defaults to preSignRequest()
 * @param  {Promise}
 */

function preSign(file, presignUrl, token) {
  var fn = arguments.length <= 3 || arguments[3] === undefined ? preSignRequest : arguments[3];

  return new Promise(function (resolve, reject) {
    fn(file, presignUrl, token).then(checkStatus).then(parseJSON).then(function (res) {
      resolve(res);
    }).catch(function (err) {
      reject(err);
    });
  });
}

exports.preSign = preSign;
exports.upload = upload;