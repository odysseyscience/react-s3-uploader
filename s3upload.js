/**
 * Taken, CommonJS-ified, and heavily modified from:
 * https://github.com/flyingsparx/NodeDirectUploader
 */

var mime = require('mime-types');

S3Upload.prototype.server = '';
S3Upload.prototype.signingUrl = '/sign-s3';
S3Upload.prototype.signingUrlMethod = 'GET';
S3Upload.prototype.successResponses = [200, 201, 204];
S3Upload.prototype.fileElement = null;
S3Upload.prototype.files = null;

S3Upload.prototype.onFinishS3Put = function(signResult, file) {
    return console.log('base.onFinishS3Put()', signResult.publicUrl);
};

S3Upload.prototype.preprocess = function(file, next) {
    console.log('base.preprocess()', file);
    return next(file);
};

S3Upload.prototype.onProgress = function(percent, status, file) {
    return console.log('base.onProgress()', percent, status);
};

S3Upload.prototype.onError = function(status, file) {
    return console.log('base.onError()', status);
};

S3Upload.prototype.onSignedUrl = function(result) {};

S3Upload.prototype.scrubFilename = function(filename) {
    return filename.replace(/[^\w\d_\-\.]+/ig, '');
};

function S3Upload(options) {
    if (options == null) {
        options = {};
    }
    for (var option in options) {
        if (options.hasOwnProperty(option)) {
            this[option] = options[option];
        }
    }
    var files = this.fileElement ? this.fileElement.files : this.files || [];
    this.handleFileSelect(files);
}

function getFileMimeType(file) {
    return file.type || mime.lookup(file.name);
}

S3Upload.prototype.handleFileSelect = function(files) {
    var result = [];
    for (var i=0; i < files.length; i++) {
        var file = files[i];
        this.preprocess(file, function(processedFile){
            this.onProgress(0, 'Waiting', processedFile);
            result.push(this.uploadFile(processedFile));
            return result;
        }.bind(this));
    }
};

S3Upload.prototype.createCORSRequest = function(method, url, opts) {
    var opts = opts || {};
    var xhr = new XMLHttpRequest();

    if (xhr.withCredentials != null) {
        xhr.open(method, url, true);
        if (opts.withCredentials != null) {
            xhr.withCredentials = opts.withCredentials;
        }
    }
    else if (typeof XDomainRequest !== "undefined") {
        xhr = new XDomainRequest();
        xhr.open(method, url);
    }
    else {
        xhr = null;
    }
    return xhr;
};

S3Upload.prototype._getErrorRequestContext = function (xhr) {
    return {
        response: xhr.responseText,
        status: xhr.status,
        statusText: xhr.statusText,
        readyState: xhr.readyState
    };
}

S3Upload.prototype.executeOnSignedUrl = function(file, callback) {
    var fileName = this.scrubFilename(file.name);
    var queryString = '?objectName=' + fileName + '&contentType=' + encodeURIComponent(getFileMimeType(file));
    if (this.s3path) {
        queryString += '&path=' + encodeURIComponent(this.s3path);
    }
    if (this.signingUrlQueryParams) {
        var signingUrlQueryParams = typeof this.signingUrlQueryParams === 'function' ? this.signingUrlQueryParams() : this.signingUrlQueryParams;
        Object.keys(signingUrlQueryParams).forEach(function(key) {
            var val = signingUrlQueryParams[key];
            queryString += '&' + key + '=' + val;
        });
    }
    var xhr = this.createCORSRequest(this.signingUrlMethod,
      this.server + this.signingUrl + queryString, { withCredentials: this.signingUrlWithCredentials });
    if (this.signingUrlHeaders) {
        var signingUrlHeaders = typeof this.signingUrlHeaders === 'function' ? this.signingUrlHeaders() : this.signingUrlHeaders;
        Object.keys(signingUrlHeaders).forEach(function(key) {
            var val = signingUrlHeaders[key];
            xhr.setRequestHeader(key, val);
        });
    }
    xhr.overrideMimeType && xhr.overrideMimeType('text/plain; charset=x-user-defined');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && this.successResponses.indexOf(xhr.status) >= 0) {
            var result;
            try {
                result = JSON.parse(xhr.responseText);
                this.onSignedUrl( result );
            } catch (error) {
                this.onError(
                  'Invalid response from server',
                  file,
                  this._getErrorRequestContext(xhr)
                );
                return false;
            }
            return callback(result);
        } else if (xhr.readyState === 4 && this.successResponses.indexOf(xhr.status) < 0) {
            return this.onError(
              'Could not contact request signing server. Status = ' + xhr.status,
              file,
              this._getErrorRequestContext(xhr)
            );
        }
    }.bind(this);
    return xhr.send();
};

/**
 * @summary Creates the submittable body sent to {@link XMLHttpRequest.send} to upload contents.
 * @typedef {{
 *   url: string,
 *   fields: {
 *     [key: string]: string,
 *   },
 * }} PresignedPostResult
 * @param {File} file
 * @param {PresignedPostResult | null} presignedPostResult
 * @returns {File | FormData} Either the input {@link file}, or a {@link FormData}
 * instance containing the fields from the {@link PresignedPostResult} and the original
 * file.
 */
S3Upload.prototype.createS3Body = function(file, presignedPostResult) {
    var fields = presignedPostResult && presignedPostResult.fields;
    if (!fields) {
        return file;
    }

    var formData = new FormData();
    for (var key of Object.keys(fields)) {
        var value = fields[key];
        formData.append(key, value);
    }
    formData.append('file', file);
    return formData;
};

/**
 * @summary Creates the main {@link XMLHttpRequest} used to upload a file to S3.
 * @typedef {string | PresignedPostResult} SignedUrl
 * @param {SignedUrl} signedUrl Either the string or object containing the URL to submit to.
 * @param {string} fileType The content type of the file to upload
 */
S3Upload.prototype.createS3Request = function(signedUrl, fileType) {
    var method, url, contentType;
    if (typeof signedUrl === 'string') {
        method = 'PUT';
        url = signedUrl;
        contentType = fileType;
    } else {
        method = 'POST';
        url = signedUrl.url;
        // Presigned post doesn't send a content type.
    }
    var xhr = this.createCORSRequest(method, url);
    if (contentType) {
        xhr.setRequestHeader('content-type', contentType);
    }
    return xhr;
};

/**
 * @summary Uploads a file to S3 using a signed URL.
 * @typedef {{
 *   signedUrl: SignedUrl,
 * }} SignResult
 * @param {File} file The file to upload.
 * @param {SignResult} signResult The resulting object that contains the signed URL to upload to.
 */
S3Upload.prototype.uploadToS3 = function(file, signResult) {
    var fileType = getFileMimeType(file);
    var xhr = this.createS3Request(signResult.signedUrl, fileType);
    if (!xhr) {
        this.onError('CORS not supported', file, {});
    } else {
        xhr.onload = function() {
            if (this.successResponses.indexOf(xhr.status) >= 0) {
                this.onProgress(100, 'Upload completed', file);
                return this.onFinishS3Put(signResult, file);
            } else {
                return this.onError(
                  'Upload error: ' + xhr.status,
                  file,
                  this._getErrorRequestContext(xhr)
                );
            }
        }.bind(this);
        xhr.onerror = function() {
            return this.onError(
              'XHR error',
              file,
              this._getErrorRequestContext(xhr)
            );
        }.bind(this);
        xhr.upload.onprogress = function(e) {
            var percentLoaded;
            if (e.lengthComputable) {
                percentLoaded = Math.round((e.loaded / e.total) * 100);
                return this.onProgress(percentLoaded, percentLoaded === 100 ? 'Finalizing' : 'Uploading', file);
            }
        }.bind(this);
    }

    var headers = { };

    if (this.contentDisposition) {
        var disposition = this.contentDisposition;
        if (disposition === 'auto') {
            if (fileType.substr(0, 6) === 'image/') {
                disposition = 'inline';
            } else {
                disposition = 'attachment';
            }
        }

        var fileName = this.scrubFilename(file.name)
        headers['content-disposition'] = disposition + '; filename="' + fileName + '"';
    }
    if (!this.uploadRequestHeaders) {
        xhr.setRequestHeader('x-amz-acl', 'public-read');
    }
    [signResult.headers, this.uploadRequestHeaders].filter(Boolean).forEach(function (hdrs) {
        Object.entries(hdrs).forEach(function(pair) {
            headers[pair[0].toLowerCase()] = pair[1];
        })
    });
    Object.entries(headers).forEach(function (pair) {
        xhr.setRequestHeader(pair[0], pair[1]);
    })
    this.httprequest = xhr;
    var body = this.createS3Body(file, signResult.signedUrl);
    return xhr.send(body);
};

S3Upload.prototype.uploadFile = function(file) {
    var uploadToS3Callback = this.uploadToS3.bind(this, file);

    if(this.getSignedUrl) return this.getSignedUrl(file, uploadToS3Callback);
    return this.executeOnSignedUrl(file, uploadToS3Callback);
};

S3Upload.prototype.abortUpload = function() {
    this.httprequest && this.httprequest.abort();
};


module.exports = S3Upload;
