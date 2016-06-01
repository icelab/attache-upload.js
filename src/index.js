require('es6-promise').polyfill()
import request from 'superagent'

/**
 * noOp
 * Default param value
 * @return {Function}
 */

const noOp = (_) => {}

/**
 * reqs
 * a hash of existing XHR requests
 */

let reqs = {}

/**
 * getXHRRequests
 * Get the current XHR processing XHR requests
 * @return {Object}
 */

function getXHRRequests () {
  return reqs
}

/**
 * setXHRRequests
 * Assign an object to `reqs`
 * @param {Object} object
 * @return {Object}
 */

function setXHRRequests (object) {
  Object.assign(reqs, object)
  return reqs
}

/**
 * abortXHRRequest
 * Abort a XHR request by 'uid'
 * @param {String} uid
 * @param {Function} optional function
 * @return {Object}
 */

function abortXHRRequest (uid, fn) {
  if (reqs.hasOwnProperty(uid)) {
    if (!reqs[uid]) return

    if (fn) {
      fn()
    } else {
      reqs[uid].abort()
    }
    delete reqs[uid]
    return reqs
  }
}

/**
 * customError
 * return an object forming a custom error message
 * @param  {String} name
 * @param  {Object} error
 * @return {Object}
 */

function customError (name, error) {
  return {
    error,
    message: error.message,
    name
  }
}

/**
 * responseStatus
 * take a response and check if it's an array or not.
 * 'uploadRequest()' returns an array [response, url]
 * check the response `status` property
 * if between 200-300 return the response object
 * else throw a custom error
 * @param  {Object} res
 * @return {Object}
 */

function responseStatus (res) {

  let response = Array.isArray(res)
    ? res[0]
    : res

  if (response.status >= 200 && response.status < 300) {
    return res
  } else {
    let error = new Error(response.statusText)
    error.response = response
    throw customError ('responseStatus', error)
  }
}

/**
 * parseJSON
 * Take a response object.
 * Check if it's an array.
 * 'uploadRequest()' returns an array [response, url]
 * and return the parsed res.text
 * @param  {String} response
 * @return {Object}
 */

function parseJSON (res) {
  if (Array.isArray(res)) {
    res[0] = JSON.parse(res[0].text)
    return res
  } else {
    return JSON.parse(res.text)
  }
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

function buildUploadURL (url, uuid, expiration, hmac, filename) {
  return url +
    '?uuid=' + uuid +
    '&expiration=' + expiration +
    '&hmac=' + hmac +
    '&file=' + filename
}

/**
 * uploadRequest
 * Assign an XHR request to the `reqs` hash using the `uid`.
 * @param  {Object} res - the response from presignRequest()
 * @param  {File Object} file
 * @param  {Function} on progress event handler
 * @return  {Promise}
 */

function uploadRequest (res, fileObject, showProgress) {
  const { url, expiration, hmac, uuid } = res
  const { file, uid } = fileObject
  const upload_url = buildUploadURL(url, uuid, expiration, hmac, file.name)

  return new Promise((resolve, reject) => {
    reqs[uid] = request
      .put(upload_url)
      .send(file)
      .set({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
      .on('progress', (e) => {
        showProgress(e, file)
      })
      .end((err, res) => {
        delete reqs[uid]

        // throw a custom error message
        if (err) return reject(customError('uploadRequest', err))

        // return and array with the response and the URL is was uploaded to
        resolve([res, url])
      })
  })
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

function upload (res, file, showProgress = noOp, fn = uploadRequest) {
  return new Promise((resolve, reject) => {
    fn(res, file, showProgress)
      .then(responseStatus)
      .then(parseJSON)
      .then((res) => {
        resolve(res)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

/**
 * presignRequest
 * Perform an XHR request and Resolve or Reject
 * @param  {String} presignUrl
 * @param  {String} token
 * @param  {Promise}
 */

function presignRequest (presignUrl, token) {
  return new Promise((resolve, reject) => {
    request
      .post(presignUrl)
      .set({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
      })
      .end((err, res) => {
        // throw a custom error message
        if (err) return reject(customError('presignRequest', err))
        resolve(res)
      })
  })
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

function presign (presignUrl, token, fn = presignRequest) {
  return new Promise((resolve, reject) => {
    fn(presignUrl, token)
      .then(responseStatus)
      .then(parseJSON)
      .then((res) => {
        resolve(res)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

export {
  responseStatus,
  parseJSON,
  presign,
  upload,
  customError,
  abortXHRRequest,
  getXHRRequests,
  setXHRRequests
}
