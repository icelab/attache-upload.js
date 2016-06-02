
import test from 'blue-tape'
import isEqual from 'lodash.isequal'

import {
  responseStatus,
  parseJSON,
  upload,
  presign,
  customError,
  getXHRRequests,
  setXHRRequests,
  abortXHRRequest
} from './src'

const token = ''
const url = 'www.foo.com'
let serverResponse = {
  status: 200,
  text: '{"foo": "bar"}'
}

const fakeXHRResponse = function (file, url, token, showProgress) {
  return new Promise((resolve, reject) => {
    resolve(serverResponse)
  })
}

const file = {
  name: 'W1004855.jpg',
  lastModified: 1458086083000,
  lastModifiedDate: new Date(),
  webkitRelativePath: '',
  size: 214179,
  type: 'image/jpeg'
}

const noOp = (_) => {}

/**
 * presign
 */

test('presign:', (nest) => {
  nest.test('...returns a promise', (t) => {
    return presign(url, token, fakeXHRResponse)
  })

  nest.test('...returns a promise without a token param', (t) => {
    return presign(url, null, fakeXHRResponse)
  })

  nest.test('...should fail', (t) => {
    return t.shouldFail(presign(url, token, fakeXHRResponse)
      .then(() => {
        throw new Error('Failed!')
      }))
  })

  nest.test('...should return a response', (t) => {
    presign(url, token, fakeXHRResponse)
      .then((res) => {
        t.equal(res.foo, 'bar')
        t.end()
      })
  })

  nest.test('...should fail on 500', (t) => {
    let failedStatus = Object.assign({}, serverResponse, {status: 500})

    const fakeXHRResponse = function (file, url, token) {
      return new Promise((resolve, reject) => {
        resolve(failedStatus)
      })
    }

    return t.shouldFail(presign(url, token, fakeXHRResponse))
  })

  nest.test('...should return custom error message on 500', (t) => {
    let failedStatus = Object.assign({}, serverResponse, {status: 500})

    const fakeXHRResponse = function (file, url, token) {
      return new Promise((resolve, reject) => {
        resolve(failedStatus)
      })
    }

    presign(url, token, fakeXHRResponse)
      .catch((err) => {
        t.equal(err.name, 'responseStatus')
        t.end()
      })
  })
})

/**
 * Upload
 */

test('upload:', (nest) => {
  const presignResponse = {
    url: 'foo',
    id: 1
  }

  const showProgress = function (e) {}

  serverResponse = {
    status: 200,
    text: '{"baz": "qux"}'
  }

  nest.test('...returns a promise', (t) => {
    return upload(presignResponse, file, showProgress, fakeXHRResponse)
  })

  nest.test('...should fail', (t) => {
    return t.shouldFail(upload(presignResponse, file, showProgress, fakeXHRResponse).then(() => {
      throw new Error('Failed!')
    }))
  })

  nest.test('...should return a response', (t) => {
    upload(presignResponse, file, showProgress, fakeXHRResponse)
      .then((res) => {
        t.equal(res.baz, 'qux')
        t.end()
      })
  })

  nest.test('...should fail on 500', (t) => {
    let failedStatus = Object.assign({}, serverResponse, {status: 500})

    const fakeXHRResponse = function (file, url, token) {
      return new Promise((resolve, reject) => {
        resolve(failedStatus)
      })
    }

    return t.shouldFail(upload(file, url, fakeXHRResponse))
  })

  nest.test('...should return custom error message on 500', (t) => {
    let failedStatus = Object.assign({}, serverResponse, {status: 500})

    const fakeXHRResponse = function (file, url, token) {
      return new Promise((resolve, reject) => {
        resolve(failedStatus)
      })
    }

    upload(presignResponse, file, showProgress, fakeXHRResponse)
      .catch((err) => {
        t.equal(err.name, 'responseStatus')
        t.end()
      })
  })
})

/**
 * Custom error message
 */

test('Custom error message:', (nest) => {
  nest.test('...should return custom error object', (t) => {
    const errorObject = {
      message: 'Custom error message'
    }

    const error = customError('presignRequest', errorObject)
    t.equal(error.name, 'presignRequest')
    t.end()
  })
})

/**
 * Set requests
 */

test('Set Requests:', (t) => {
  const expected = {one: 'foo'}
  const actual = setXHRRequests(expected)
  t.ok(isEqual(actual, expected), 'match')
  t.end()
})

/**
 * Get requests
 */

test('Get Requests:', (t) => {
  const actual = getXHRRequests()
  const expected = {one: 'foo'}
  t.ok(isEqual(actual, expected), 'match')
  t.end()
})

/**
 * Abort request
 */

test('Abort Requests:', (t) => {
  const actual = getXHRRequests()
  let expected = {one: 'foo'}
  t.ok(isEqual(actual, expected), 'match')

  // add additional requests
  expected = setXHRRequests({two: 'bar', three: 'baz'})

  // abort 'two' from the requests
  const updated = abortXHRRequest('two', noOp)
  delete expected.two

  t.ok(isEqual(updated, expected), 'match')
  t.end()
})

/**
 * responseStatus
 */

test('responseStatus:', (t) => {
  const response = {status: 200}
  const expected = response
  const actual = responseStatus(response)
  t.ok(isEqual(actual, expected), 'match')
  t.end()
})

/**
 * parseJSON
 */

test('parseJSON:', (t) => {
  const expected = {foo: 'bar'}
  const actual = {text: '{"foo": "bar"}'}
  t.ok(isEqual(parseJSON(actual), expected), 'match')
  t.end()
})
