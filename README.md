# attache-upload.js
Upload your files to attache.

### Example
```js
import {upload, presign} from 'attache-upload'

presign(presign_url)
  .then((presignResponse) => {

    // presignResponse:
    // {
    //   url: "http://some_url/upload",
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

 * `presign_url` - required, a URL to perform a preSign request.
 * `token` - optional, X-CSRF-Token value.

#### upload(options)

 * `presignResponse` - required, response object passed in from preSign request.
 * `fileObject` - required, the file to be uploaded.
 * `onProgress` - optional, 'onProgress' function.