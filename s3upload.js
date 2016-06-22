/**
 * Taken, CommonJS-ified, and heavily modified from:
 * https://github.com/flyingsparx/NodeDirectUploader
 */

var latinize = require('latinize'),
    unorm = require('unorm');

S3Upload.prototype.server = '';
S3Upload.prototype.signingUrl = '/sign-s3';
S3Upload.prototype.fileElement = null;
S3Upload.prototype.files = null;

S3Upload.prototype.onFinishS3Put = function(signResult, file) {
    return console.log('base.onFinishS3Put()', signResult.publicUrl);
};

S3Upload.prototype.onBeforeUpload = function(file, next) {
    console.log('base.onBeforeUpload()');
    return next(file);
};

S3Upload.prototype.onProgress = function(percent, status, file) {
    return console.log('base.onProgress()', percent, status);
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
    this.handleFileSelect(this.files);
}

S3Upload.prototype.handleFileSelect = function(files) {
    var result = [];
    var that = this;
    var next = function (file) {
        that.onProgress(0, 'Waiting', file);
        result.push(that.uploadFile(file));
    }
    for (var i=0; i < files.length; i++) {
        var file = files[i];
        this.onBeforeUpload(file, next)
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
    var normalizedFileName = unorm.nfc(file.name.replace(/[!\^`><{}\[\]()*#%'"~|&@:;$=+?\s\\\/\x00-\x1F\x7f]+/ig, '_'));
    var fileName = latinize(normalizedFileName);
    var queryString = '?objectName=' + fileName + '&contentType=' + encodeURIComponent(file.type);
    if (this.signingUrlQueryParams) {
        var signingUrlQueryParams = this.signingUrlQueryParams;
        Object.keys(signingUrlQueryParams).forEach(function(key) {
            var val = signingUrlQueryParams[key];
            queryString += '&' + key + '=' + val;
        });
    }
    var xhr = this.createCORSRequest('GET',
        this.server + this.signingUrl + queryString);
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
                this.onError('Invalid response from server', file);
                return false;
            }
            return callback(result);
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
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
        var normalizedFileName = unorm.nfc(file.name.replace(/[!\^`><{}\[\]()*#%'"~|&@:;$=+?\s\\\/\x00-\x1F\x7f]+/ig, '_'));
        var fileName = latinize(normalizedFileName);
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
    var uploadToS3Callback = this.uploadToS3.bind(this, file);

    if(this.getSignedUrl) return this.getSignedUrl(file, uploadToS3Callback);
    return this.executeOnSignedUrl(file, uploadToS3Callback);
};

S3Upload.prototype.abortUpload = function() {
    this.httprequest && this.httprequest.abort();
};


module.exports = S3Upload;
