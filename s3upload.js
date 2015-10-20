/**
 * Taken, CommonJS-ified, and heavily modified from:
 * https://github.com/flyingsparx/NodeDirectUploader
 */

S3Upload.prototype.signingUrl = '/sign-s3';
S3Upload.prototype.fileElement = null;
S3Upload.prototype.files = null;

S3Upload.prototype.onFinishS3Put = function(signResult, file) {
    return console.log('base.onFinishS3Put()', signResult.publicUrl);
};

S3Upload.prototype.onProgress = function(percent, status, file) {
    return console.log('base.onProgress()', percent, status, file);
};

S3Upload.prototype.onError = function(status, file) {
    return console.log('base.onError()', status);
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
        var f = files[i];
        result.push(this.uploadFile(f));
        this.onProgress(f, 0, 'Waiting');
    }
    return result;
};

S3Upload.prototype.createCORSRequest = function(method, url) {
    var xhr = new XMLHttpRequest();

    if (xhr.withCredentials != null) {
        xhr.open(method, url, true);
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
    var xhr = new XMLHttpRequest();
    var fileName = file.name.replace(/\s+/g, "_");
    var queryString = '?objectName=' + fileName + '&contentType=' + file.type;
    if (this.signingUrlQueryParams) {
        var signingUrlQueryParams = this.signingUrlQueryParams;
        Object.keys(signingUrlQueryParams).forEach(function(key) {
            var val = signingUrlQueryParams[key];
            queryString += '&' + key + '=' + val;
        });
    }
    xhr.open('GET', this.signingUrl + queryString, true);
    if (this.signingUrlHeaders) {
        var signingUrlHeaders = this.signingUrlHeaders;
        Object.keys(signingUrlHeaders).forEach(function(key) {
            var val = signingUrlHeaders[key];
            xhr.setRequestHeader(key, val);
        });
    }
    xhr.overrideMimeType && xhr.overrideMimeType('text/plain; charset=x-user-defined');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var result;
            try {
                result = JSON.parse(xhr.responseText);
            } catch (error) {
                this.onError(file, 'Invalid signing server response JSON: ' + xhr.responseText);
                return false;
            }
            return callback(result);
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
            return this.onError(file, 'Could not contact request signing server. Status = ' + xhr.status);
        }
    }.bind(this);
    return xhr.send();
};

S3Upload.prototype.uploadToS3 = function(signResult, file) {
    var xhr = this.createCORSRequest('PUT', signResult.signedUrl);
    if (!xhr) {
        this.onError(file, 'CORS not supported');
    } else {
        xhr.onload = function() {
            if (xhr.status === 200) {
                this.onProgress(file, 100, 'Upload completed.');
                return this.onFinishS3Put(file, signResult);
            } else {
                return this.onError(file, 'Upload error: ' + xhr.status);
            }
        }.bind(this);
        xhr.onerror = function() {
            return this.onError(file, 'XHR error.');
        }.bind(this);
        xhr.upload.onprogress = function(e) {
            var percentLoaded;
            if (e.lengthComputable) {
                percentLoaded = Math.round((e.loaded / e.total) * 100);
                return this.onProgress(file, percentLoaded, percentLoaded === 100 ? 'Finalizing' : 'Uploading');
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
        var fileName = file.name.replace(/\s+/g, "_");
        xhr.setRequestHeader('Content-Disposition', disposition + '; filename=' + fileName);
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
    return this.executeOnSignedUrl(file, function(signResult) {
        return this.uploadToS3(file, signResult);
    }.bind(this));
};

S3Upload.prototype.abortUpload = function() {
    this.httprequest && this.httprequest.abort();
};


module.exports = S3Upload;
