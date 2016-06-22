react-s3-uploader
===========================

Provides a `React` component that automatically uploads to an S3 Bucket.

Install
-----------
```bash
$ npm install react-s3-uploader
```
From Browser
------------

```jsx
var ReactS3Uploader = require('react-s3-uploader');

...

<ReactS3Uploader
    signingUrl="/s3/sign"
    accept="image/*"
    onBeforeUpload={this.onBeforeUpload}
    onProgress={this.onUploadProgress}
    onError={this.onUploadError}
    onFinish={this.onUploadFinish}
    signingUrlHeaders={{ additional: headers }}
    signingUrlQueryParams={{ additional: query-params }}
    uploadRequestHeaders={{ 'x-amz-acl': 'public-read' }}
    contentDisposition="auto"
    server="http://cross-origin-server.com" />
```

The above example shows all supported `props`.  For `uploadRequestHeaders`, the default ACL is shown.

This expects a request to `/s3/sign` to return JSON with a `signedUrl` property that can be used
to PUT the file in S3.

`contentDisposition` is optional and can be one of `inline`, `attachment` or `auto`. If given,
the `Content-Disposition` header will be set accordingly with the file's original filename.
If it is `auto`, the disposition type will be set to `inline` for images and `attachment` for
all other files.

`server` is optional and can be used to specify the location of the server which is
running the ReactS3Uploader server component if it is not the same as the one from
which the client is served.

The resulting DOM is essentially:

```jsx
<input type="file" onChange={this.uploadFile} />
```

When a file is chosen, it will immediately be uploaded to S3.  You can listen for progress (and
create a status bar, for example) by providing an `onProgress` function to the component.

The `onBeforeUpload(file, next)` prop provides an opportunity to do something before the file upload begins,
modify the file (scaling the image for example), or abort the upload by not calling `next(file)`.

Using custom function to get signedUrl
------------

If can use custom function to get provide `signedUrl` directly to `s3uploader` by adding `getSignedUrl` prop. The function you provide should take `file` and `callback` arguments. Callback should be called with an object containing `signedUrl` key.

```javascript
import ApiClient from './ApiClient';

function getSignedUrl(file, callback) {
  const client = new ApiClient();
  const params = {
    objectName: file.name,
    contentType: file.type
  };

  client.get('/my/signing/server', { params })
  .then(data => {
    callback(data);
  })
  .catch(error => {
    console.error(error);
  });
}


<ReactS3Uploader
  className={uploaderClassName}
  getSignedUrl={getSignedUrl}
  accept="image/*"
  onProgress={onProgress}
  onError={onError}
  onFinish={onFinish}
  uploadRequestHeaders={{
    'x-amz-acl': 'public-read'
  }}
  contentDisposition="auto"
/>

```

Server-Side
-----------
### Bundled router
You can use the Express router that is bundled with this module to answer calls to `/s3/sign`

```js
app.use('/s3', require('react-s3-uploader/s3router')({
    bucket: "MyS3Bucket",
    region: 'us-east-1', //optional
    signatureVersion: 'v4', //optional (use for some amazon regions: frankfurt and others)
    headers: {'Access-Control-Allow-Origin': '*'}, // optional
    ACL: 'private' // this is default
}));
```

This also provides another endpoint: `GET /s3/img/(.*)` and `GET /s3/uploads/(.*)`.  This will create a temporary URL
that provides access to the uploaded file (which are uploaded privately by default).  The
request is then redirected to the URL, so that the image is served to the client.

**To use this you will need to include the [express module](https://www.npmjs.com/package/express) in your package.json dependencies.**

#### Access/Secret Keys

The `aws-sdk` must be configured with your account's Access Key and Secret Access Key.  [There are a number of ways to provide these](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html), but setting up environment variables is the quickest.  You just have to configure environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, and AWS automatically picks them up.

### Other Types of Servers

##### Boto for Python, in a Django project

```python
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
```

#### Ruby on Rails, assuming FOG usage

```ruby
# Usual fog config, set as an initializer
storage = Fog::Storage.new(
  provider: 'AWS',
  aws_access_key_id: ENV['AWS_ACCESS_KEY_ID'],
  aws_secret_access_key: ENV['AWS_SECRET_ACCESS_KEY']
)

# In the controller
options = {path_style: true}
headers = {"Content-Type" => params[:contentType], "x-amz-acl" => "public-read"}

@url = storage.put_object_url(ENV['S3_BUCKET_NAME'], "user_uploads/#{params[:objectName]}", 15.minutes.from_now.to_time.to_i, headers, options)

respond_to do |format|
  format.json { render json: {signedUrl: @url} }
end
```


##### Other Servers

If you do some work on another server, and would love to contribute documentation, please send us a PR!


Changelog (Starting at 1.2.0)
------------

##### 3.2.0

* Allow custom getSignedUrl() function to be provided [#22]

##### 3.1.0

* Replace unsafe characters (per AWS docs) with underscores [#69]

##### 3.0.3

* Support signatureVersion option

##### 3.0.2

* Not passing non-JSON response text to error handlers

##### 3.0.1

* Fixes issue where URL would include "undefined" if this.server was not specified

##### 3.0

* Using `react-dom`

##### 2.0.1

* Fixes issue where URL would include "undefined" if this.server was not specified

##### 2.0

* **Breaking Change** [Fixes #52] Removing `express` as a `peerDependency`.  Projects should explicitly depend on `express` to use the bundled router
* [Fixes #51] url encode the contentType

##### 1.2.3

* Fixes issue where URL would include "undefined" if this.server was not specified

##### 1.2.2

* [Fixes #48] Only setting the AWS region for the S3 client, not the global default

##### 1.2.1

* Added `server` prop to `ReactS3Uploader` to support running the signing server on a different domain
* Added `headers` option to `s3router` to support specifying `'Access-Control-Allow-Origin'` header (or any others)
* [Fixes #44] Using `unorm.nfc(str)` in favor of `str.normalize()`

##### 1.2.0

* Added dependencies `unorm` and `latinize` for uploading files with non-latin characters.
* Filenames are normalized, latinized, and whitespace is stripped before uploading
