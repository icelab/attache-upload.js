
import test from 'blue-tape'
import { upload, presign } from './src'

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
})
