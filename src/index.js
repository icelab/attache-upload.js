require('es6-promise').polyfill()
import request from 'superagent'
import bus from 'bus'

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
 * abortUploadRequest
 * Fired from a preview elements `x` button, passing in it's data-uid attribute value
 * Search the `reqs` hash for an existing request of the same name and
 * abort() and delete it
 */

bus.on('abortUploadRequest', (uid) => {
  if (reqs.hasOwnProperty(uid)) {
    if (!reqs[uid]) return
    reqs[uid].abort()
    delete reqs[uid]
  }
})

/**
 * checkStatus
 * take a response and check it's `status` property
 * if between 200-300 return the response object
 * else throw an error
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */

function checkStatus (res) {
  if (res.status >= 200 && res.status < 300) {
    return res
  } else {
    let error = new Error(res.statusText)
    error.response = res
    throw error
  }
}

/**
 * parseJSON
 * Take a response object and return it parsed
 * @param  {String} response
 * @return {Object}
 */

function parseJSON (res, url) {
  return JSON.parse(res.text)
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
  const uploadURL = buildUploadURL(url, uuid, expiration, hmac, file.name)

  return new Promise((resolve, reject) => {
    reqs[uid] = request
      .put(uploadURL)
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
        if (err) reject(err)

        // append the `uploadURL` to the response
        let response = Object.assign({}, res)
        let data = JSON.parse(res.text)
        data.uploadURL = url
        response.text = JSON.stringify(data)
        resolve(response)
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
      .then(checkStatus)
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
        if (err) reject(err)
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
      .then(checkStatus)
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
  presign,
  upload
}
