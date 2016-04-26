# attache-upload.js
Upload your files to [attache](https://github.com/choonkeat/attache).

### Example
```js
import {upload, presign} from 'attache-upload'

presign(presign_url)
  .then((presignResponse) => {

    // presignResponse:
    // {
    //   url: "http://path_to_your_attache_serve/upload",
    //   uuid: "5f0d4d62-e082-4cdf-a143-26258de59c47",
    //   expiration: 1461649282,
    //   hmac: "fd89637821afca1787dfe458be29bc87f0366122"
    // }

    return upload(presignResponse, fileObject)
  })
  .then((uploadResponse) => {

    // Do something with the uploadResponse
    // uploadResponse:
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

## API Documentation

#### presign(options)

 * `presign_url` - required, a URL to perform a presign request.
 * `token` - optional, `X-CSRF-Token` value.

On success, this request will return:

 * `url` - the URL to the `/upload` API of your attache serve
 * `uuid` - a uuid string
 * `expiration` - a unix timestamp of a future time
 * `hmac` - the `HMAC-SHA1` of your `SECRET_KEY`

#### upload(options)

 * `presignResponse` - required, response object passed in from presign request.
 * `fileObject` - required, the file to be uploaded.
 * `onProgress` - optional, `onProgress` function.

On success, this request will return:

* `path` - a unique path for the uploaded file
* `content_type`
* `geometry`
* `bytes`