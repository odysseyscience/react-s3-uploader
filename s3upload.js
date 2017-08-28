/**
 * Taken, CommonJS-ified, and heavily modified from:
 * https://github.com/flyingsparx/NodeDirectUploader
 */

S3Upload.prototype.server = '';
S3Upload.prototype.signingUrl = '/sign-s3';
S3Upload.prototype.signingUrlMethod = 'GET';
S3Upload.prototype.signingUrlSuccessResponses = [200, 201];
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

S3Upload.prototype.executeOnSignedUrl = function(file, callback) {
    var fileName = this.scrubFilename(file.name);
    var queryString = '?objectName=' + this.s3path + fileName + '&contentType=' + encodeURIComponent(file.type);
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
        if (xhr.readyState === 4 && this.signingUrlSuccessResponses.indexOf(xhr.status) >= 0) {
            var result;
            try {
                result = JSON.parse(xhr.responseText);
            } catch (error) {
                this.onError('Invalid response from server', file);
                return false;
            }
            return callback(result);
        } else if (xhr.readyState === 4 && this.signingUrlSuccessResponses.indexOf(xhr.status) < 0) {
            return this.onError('Could not contact request signing server. Status = ' + xhr.status, file);
        }
    }.bind(this);
    return xhr.send();
};

S3Upload.prototype.uploadToS3 = function(file, signResult) {
    var xhr = this.createCORSRequest('PUT', signResult.signedUrl);
    if (!xhr) {
        this.onError('CORS not supported', file);
    } else {
        xhr.onload = function() {
            if (xhr.status === 200) {
                this.onProgress(100, 'Upload completed', file);
                return this.onFinishS3Put(signResult, file);
            } else {
                return this.onError('Upload error: ' + xhr.status, file);
            }
        }.bind(this);
        xhr.onerror = function() {
            return this.onError('XHR error', file);
        }.bind(this);
        xhr.upload.onprogress = function(e) {
            var percentLoaded;
            if (e.lengthComputable) {
                percentLoaded = Math.round((e.loaded / e.total) * 100);
                return this.onProgress(percentLoaded, percentLoaded === 100 ? 'Finalizing' : 'Uploading', file);
            }
        }.bind(this);
    }
    xhr.setRequestHeader('Content-Type', file.type);
    if (this.contentDisposition) {
        var disposition = this.contentDisposition;
        if (disposition === 'auto') {
            if (file.type.substr(0, 6) === 'image/') {
                disposition = 'inline';
            } else {
                disposition = 'attachment';
            }
        }

        var fileName = this.scrubFilename(file.name)
        xhr.setRequestHeader('Content-Disposition', disposition + '; filename="' + fileName + '"');
    }
    if (signResult.headers) {
        var signResultHeaders = signResult.headers
        Object.keys(signResultHeaders).forEach(function(key) {
            var val = signResultHeaders[key];
            xhr.setRequestHeader(key, val);
        })
    }
    if (this.uploadRequestHeaders) {
        var uploadRequestHeaders = this.uploadRequestHeaders;
        Object.keys(uploadRequestHeaders).forEach(function(key) {
            var val = uploadRequestHeaders[key];
            xhr.setRequestHeader(key, val);
        });
    } else {
        xhr.setRequestHeader('x-amz-acl', 'public-read');
    }
    this.httprequest = xhr;
    return xhr.send(file);
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
