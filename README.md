react-s3-uploader
===========================

Provides a `React` component that automatically uploads to an S3 Bucket.

Install
-----------

    $ npm install react-s3-uploader

From Browser
------------

    var ReactS3Uploader = require('react-s3-uploader');

    ...

    <ReactS3Uploader
        signingUrl="/s3/sign"
        accept="image/*"
        onProgress={this.onUploadProgress}
        onError={this.onUploadError}
        onFinish={this.onUploadFinish}/>

The above example shows all supported `props`.

This expects a request to `/s3/sign` to return JSON with a `signedUrl` property that can be used
to PUT the file in S3.

The resulting DOM is essentially:

    <input type="file" onChange={this.uploadFile} />

When a file is chosen, it will immediately be uploaded to S3.  You can listen for progress (and
create a status bar, for example) by providing an `onProgress` function to the component.

Server-Side
-----------

You can use the Express router that is bundled with this module to answer calls to `/s3/sign`

    app.use('/s3', require('react-s3-uploader/s3router')({
        bucket: "MyS3Bucket"
    }));

This also provides another endpoint: `GET /s3/img/(.*)`.  This will create a temporary URL
that provides access to the uploaded file (which are uploaded privately at the moment).  The
request is then redirected to the URL, so that the image is served to the client.

You must provide environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_KEY` to use the server route.
