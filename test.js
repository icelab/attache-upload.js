
import test from 'blue-tape'
import { upload, preSign } from './index.js'

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

const files = [{
  name: 'W1004855.jpg',
  lastModified: 1458086083000,
  lastModifiedDate: new Date(),
  webkitRelativePath: '',
  size: 214179,
  type: 'image/jpeg'
}]

test('presign:', (nest) => {
  nest.test('...returns a promise', (t) => {
    return preSign(files, url, token, fakeXHRResponse)
  })

  nest.test('...should fail', (t) => {
    return t.shouldFail(preSign(files, url, token, fakeXHRResponse)
      .then(() => {
        throw new Error('Failed!')
      }))
  })

  nest.test('...should return a response', (t) => {
    preSign(files, url, token, fakeXHRResponse)
      .then((res) => {
        t.equal(res.foo, 'bar')
        t.end()
      })
  })

  nest.test('...should fail on 500', (t) => {
    let failedStatus = Object.assign({}, serverResponse, {status: 500})

    const fakeXHRResponse = function (files, url, token) {
      return new Promise((resolve, reject) => {
        resolve(failedStatus)
      })
    }

    return t.shouldFail(preSign(files, url, token, fakeXHRResponse))
  })
})

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
    return upload(presignResponse, files, token, showProgress, fakeXHRResponse)
  })

  nest.test('...should fail', (t) => {
    return t.shouldFail(upload(presignResponse, files, token, showProgress, fakeXHRResponse).then(() => {
      throw new Error('Failed!')
    }))
  })

  nest.test('...should return a response', (t) => {
    upload(presignResponse, files, token, showProgress, fakeXHRResponse)
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

    return t.shouldFail(upload(files, url, token, fakeXHRResponse))
  })
})
