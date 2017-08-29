react-s3-uploader
===========================

Provides a `React` component that automatically uploads to an S3 Bucket.

Install
-----------
```bash
$ npm install --save react-s3-uploader
```
From Browser
------------

```jsx
var ReactS3Uploader = require('react-s3-uploader');

...

<ReactS3Uploader
    signingUrl="/s3/sign"
    signingUrlMethod="GET"
    accept="image/*"
    s3path="/uploads/"
    preprocess={this.onUploadStart}
    onProgress={this.onUploadProgress}
    onError={this.onUploadError}
    onFinish={this.onUploadFinish}
    signingUrlHeaders={{ additional: headers }}
    signingUrlQueryParams={{ additional: query-params }}
    signingUrlWithCredentials={ true }      // in case when need to pass authentication credentials via CORS
    uploadRequestHeaders={{ 'x-amz-acl': 'public-read' }}  // this is the default
    contentDisposition="auto"
    scrubFilename={(filename) => filename.replace(/[^\w\d_\-.]+/ig, '')}
    server="http://cross-origin-server.com" />
```

The above example shows all supported `props`.

This expects a request to `/s3/sign` to return JSON with a `signedUrl` property that can be used
to PUT the file in S3.

`contentDisposition` is optional and can be one of `inline`, `attachment` or `auto`. If given,
the `Content-Disposition` header will be set accordingly with the file's original filename.
If it is `auto`, the disposition type will be set to `inline` for images and `attachment` for
all other files.

`server` is optional and can be used to specify the location of the server which is
running the ReactS3Uploader server component if it is not the same as the one from
which the client is served.

Use `scrubFilename` to provide custom filename scrubbing before uploading.  Prior to version 4.0, this library used `unorm` and `latinize` to filter out characters.  Since 4.0, we simply remove all characters that are not alphanumeric, underscores, dashes, or periods.

The resulting DOM is essentially:

```jsx
<input type="file" onChange={this.uploadFile} />
```

The `preprocess(file, next)` prop provides an opportunity to do something before the file upload begins,
modify the file (scaling the image for example), or abort the upload by not calling `next(file)`.

When a file is chosen, it will immediately be uploaded to S3.  You can listen for progress (and
create a status bar, for example) by providing an `onProgress` function to the component.

### Extra props
You can pass any extra props to `<ReactS3Uploader />` and these will be passed down to the final `<input />`. which means that if you give the ReactS3Uploader a className or a name prop the input will have those as well.

Using custom function to get signedUrl
------------

It is possible to use a custom function to provide `signedUrl` directly to `s3uploader` by adding `getSignedUrl` prop. The function you provide should take `file` and `callback` arguments. Callback should be called with an object containing `signedUrl` key.

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
    ACL: 'private', // this is default
    uniquePrefix: true // (4.0.2 and above) default is true, setting the attribute to false preserves the original filename in S3
}));
```

This also provides another endpoint: `GET /s3/img/(.*)` and `GET /s3/uploads/(.*)`.  This will create a temporary URL
that provides access to the uploaded file (which are uploaded privately by default).  The
request is then redirected to the URL, so that the image is served to the client.

If you need to use pass more than region and signatureVersion to S3 instead use the `getS3` param. `getS3` accepts a
function that returns a new AWS.S3 instance. This is also useful if you want to mock S3 for testing purposes.

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

url = storage.put_object_url(ENV['S3_BUCKET_NAME'], "user_uploads/#{params[:objectName]}", 15.minutes.from_now.to_time.to_i, headers, options)

respond_to do |format|
  format.json { render json: {signedUrl: url} }
end
```


##### Other Servers

If you do some work on another server, and would love to contribute documentation, please send us a PR!
