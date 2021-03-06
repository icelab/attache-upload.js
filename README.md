# attache-upload.js

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![js-standard-style][standard-image]][standard-url]

Upload files to your [attache](https://github.com/choonkeat/attache) server.

#### Example
```js
import {upload, presign} from 'attache-upload'

presign(presign_url)
  .then((presignResponse) => {

    // presignResponse:
    //
    // {
    //   url: "http://path_to_your_attache_server/upload",
    //   uuid: "5f0d4d62-e082-4cdf-a143-26258de59c47",
    //   expiration: 1461649282,
    //   hmac: "fd89637821afca1787dfe458be29bc87f0366122"
    // }

    return upload(presignResponse, fileObject)
  })
  .then((uploadResponse) => {

    // uploadResponse:
    //
    // {
    //   path: "54/4d/15/14/b4/09/29/01/36/42/2f/e2/3f/f0/42/15/some_file.jpg",
    //   content_type: "image/jpeg",
    //   geometry: "300x300",
    //   bytes: 19804
    // }

  })
  .catch((err) => {
    // Handle error
  })
```

## Install

```bash
$ npm install --save attache-upload
```

## API Documentation

#### presign(options)

 * `presign_url` - required, a URL to perform a presign request.
 * `token` - optional, `X-CSRF-Token` value.

On success, this request will return:

 * `url` - the URL to the `/upload` API of your attache serve
 * `uuid` - a uuid string
 * `expiration` - a unix timestamp of a future time
 * `hmac` - the `HMAC-SHA1` of your `SECRET_KEY`

```js
presign(presign_url, token)
  .then((presignResponse) => {
    // {
    //   url: "http://path_to_your_attache_server/upload",
    //   uuid: "5f0d4d62-e082-4cdf-a143-26258de59c47",
    //   expiration: 1461649282,
    //   hmac: "fd89637821afca1787dfe458be29bc87f0366122"
    // }
  })
```

#### upload(options)

 * `presignResponse` - required, response object passed in from presign request.
 * `fileObject` - required.  
 An object containing a [uid](#generate-a-uid-for-your-file-object) and `file` property.  
 We use this `uid` as a reference to this object's XHR request, which can then be aborted at a later stage using `abortXHRRequest('uid')`

 ```js
 {
     uid: 'some_generated_uid', // String
     file: FILE // File object
 }
 ```
 * `onProgress` - optional, `onProgress` function.

On success, this request will return:

* `path` - a unique path for the uploaded file
* `content_type`
* `geometry`
* `bytes`

```js

function customProgressHandler (progressEvent, file) {
  console.log('Uploading ' + file.name + ' @ ' + progressEvent.percent + '%')
  //=> 'Uploading foo.jpg @ 100%'
}

presign(presign_url)
  .then((presignResponse) => {
    return upload(presignResponse, fileObject, customProgressHandler)
  })
  .then((uploadResponse) => {
    // {
    //   path: "54/4d/15/14/b4/09/29/01/36/42/2f/e2/3f/f0/42/15/some_file.jpg",
    //   content_type: "image/jpeg",
    //   geometry: "300x300",
    //   bytes: 19804
    // }
  })
```
#### getXHRRequests()

To access all existing XHR requests use `getXHRRequests()`.

```js
import {getXHRRequests} from 'attache-upload'

getXHRRequests()
// {
//   'some_uid': request(){},
//   'some_other_request':  request(){}
// }

```

#### abortXHRRequest(String)

To abort an existing XHR requests use `destroyXHRRequest()` passing in the id of the request.

```js
import {getXHRRequests, abortXHRRequest} from 'attache-upload'

getXHRRequests()
// {
//   'some_uid': request(){},
//   'some_other_request':  request(){}
// }

abortXHRRequest('some_uid')

getXHRRequests()
// {
//   'some_other_request':  request(){}
// }

```

## Error handling

Both `presign` the `upload` methods will return a custom error objects if either `promise` is rejected.  
The XHR requests for each method will return a custom `responseStatus` error message if the response status is not between `200` and `300`.  
This allows us to check for specific errors in our upload process.

The custom error objects look like this:

```js
{
  error: {original error object},
  message: 'Not Authorised'
  name: 'uploadRequest'
}
```

The 3 custom error names we cater for are:
* `presignRequest` - Rejected presign
* `uploadRequest` - Rejected upload
* `responseStatus` - A failing XHR response status

All other errors should be left to bubble up and logged to the console.

#### Example
```js
import {upload, presign} from 'attache-upload'

presign(presign_url)
  .then((presignResponse) => {
    return upload(presignResponse, fileObject)
  })
  .then((uploadResponse) => {
    return doSomethingWithResponse(uploadResponse)
  })
  .catch((err) => {
    // check is the error was with our upload process
    const {name} = err
    if (name === 'presignRequest' || name === 'uploadRequest' || name === 'responseStatus') {
      doSomethingWithErrorMessage(err)
    } else {
      // log and throw the error
      console.error(err)
      throw err
    }
  })
```

## Generate a `uid` for your file object

Some files may have the same name, so it would be great if we had a unique way of identifying them and their XHR request.
Creating a `uid` for your file object is as simple as:

```js
import uid from 'uid'

/**
 * generateUniqueID
 * @param {String} name
 * @return {String}
 */

function generateUniqueID (name) {
  return uid(10) + '_' + name
}

const myUID = generateUniqueID(file.name)
//> hbswt489ts_image.jpg
```
# Development

## Build

Compile `src` scripts to `lib`:

```bash
$ npm run build
```

## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

[npm-image]: https://img.shields.io/npm/v/attache-upload.svg?style=flat-square
[npm-url]: https://npmjs.org/package/attache-upload
[travis-image]: https://img.shields.io/travis/icelab/attache-upload.js.svg?style=flat-square
[travis-url]: https://travis-ci.org/icelab/attache-upload.js
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
