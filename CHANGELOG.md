
##### 4.5.0

* Removed `peerDependencies` on react and react-dom [#136]

##### 4.4.0

* Support `getS3` function in bundled router options [#139]
* Support `s3Path` string prefix prop [#140]

##### 4.3.0

* Support middleware in express module with optional second arg
* Allow 200 or 201 for success on sign request

##### 4.2.0

* Switch to `uuid` instead of `node-uuid` [#115]
* Not using `React.DOM.input` [#127]
* Allow function for `signingUrlHeaders`
* Support setting headers in `signResult` callback

##### 4.1.1

* Fix INVALID_STATE_ERR on Safari 5 [#118]

##### 4.1.0

* Using `create-react-class` and `prop-types` to fix deprecation warnings [#116]

##### 4.0.3

* Return `fileKey` in response bundled router sign response

##### 4.0.2

* Add `uniquePrefix` option to express router support turning off the UUID prefix of filenames.  Default is true, but set to false to preserve original filenames.

##### 4.0.1

* Don't pass `scrubFilename` prop to `<input>`

##### 4.0.0

* BREAKING CHANGE: Removed `unorm` and `latinize` dependencies, which were used to scrub file names before uploading.  Now we just remove all characters that are not alphanumeric, underscores, dashes, or periods.  If you need different behavior, please provide a custom `scrubFilename` function in props.

##### 3.4.0

* Adding optional prop `signingUrlMethod` (default: `GET`) [#103]
* Adding optional prop `signingUrlWithCredentials` [#103]
* Adding `abort` to react component [#96]

##### 3.3.0
* Adding optional preprocess hook supports asynchronous operations such as resizing an image before upload [#79 #72]
* Fix uglify warning [#77]

##### 3.2.1

* Avoid react warning by not passing unnecessary props to Dom.input [#75]

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
