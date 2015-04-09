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
### Bundled router
You can use the Express router that is bundled with this module to answer calls to `/s3/sign`

    app.use('/s3', require('react-s3-uploader/s3router')({
        bucket: "MyS3Bucket"
    }));

This also provides another endpoint: `GET /s3/img/(.*)`.  This will create a temporary URL
that provides access to the uploaded file (which are uploaded privately at the moment).  The
request is then redirected to the URL, so that the image is served to the client.

#### Access/Secret Keys

The `aws-sdk` must be configured with your account's Access Key and Secret Access Key.  [There are a number of ways to provide these](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html), but setting up environment variables is the quickest.  You just have to configure environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, and AWS automatically picks them up.

### Boto for Python, in a Django project
    
    import boto
    import mimetypes
    import json

    ...
    conn = boto.connect_s3('AWS_KEY', 'AWS_SECRET')

    def sign_s3_upload(request):
        object_name = request.GET['objectName']
        content_type = mimetypes.guess_type(object_name)[0]

        signed_url = conn.generate_url(
            300, 
            "PUT", 
            'BUCKET_NAME', 
            'FOLDER_NAME' + object_name,
            headers = {'Content-Type': content_type, 'x-amz-acl':'public-read'})

        return HttpResponse(json.dumps({'signedUrl': signed_url}))