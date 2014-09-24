react-s3-uploader
===========================

Provides a `React` component that automatically uploads to an S3 Bucket.

Install
-----------
```javascript
$ npm install react-s3-uploader
```

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

This expects a request to `/s3/sign` to return JSON with a `signedUrl` property that can be used
to PUT the file in S3.

Server-Side
-----------

You can use the Express router that is bundled with this module to answer calls to `/s3/sign`

```javascript
    app.use('/s3', require('react-s3-uploader/s3router')({
        bucket: "MyS3Bucket"
    }));
```

This also provides another endpoint: `GET /s3/img/(.*)`.  This will create a temporary URL
that provides access to the uploaded file (which are uploaded privately at the moment).  The
request is then redirected to the URL, so that the image is served to the client.