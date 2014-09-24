react-s3-uploader
===========================

Provides a `React` component that automatically uploads to an S3 Bucket.

From Browser
------------

```javascript
var ReactS3Uploader = require('react-s3-uploader');

...

    <ReactS3Uploader
        signingUrl="/s3/sign"
        accept="image/*"
        onProgress={this.onUploadProgress}
        onError={this.onUploadError}
        onFinish={this.onUploadFinish}/>

```

This expects a request to `/s3/sign` to return JSON with a `signedUrl` property.

Server-Side
-----------

You can use the Express router that is bundled with this module to answer calls to `/s3/sign`

```javascript
    app.use('/s3', require('react-s3-uploader/s3router')({
        bucket: "MyS3Bucket"
    }));
```
