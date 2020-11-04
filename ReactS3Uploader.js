"use strict";

var React = require('react'),
    ReactDOM = require('react-dom'),
    PropTypes = require('prop-types'),
    createReactClass = require('create-react-class'),
    S3Upload = require('./s3upload.js'),
    objectAssign = require('object-assign');

var ReactS3Uploader = createReactClass({

    propTypes: {
        signingUrl: PropTypes.string,
        getSignedUrl: PropTypes.func,
        preprocess: PropTypes.func,
        onSignedUrl: PropTypes.func,
        onProgress: PropTypes.func,
        onFinish: PropTypes.func,
        onError: PropTypes.func,
        signingUrlMethod: PropTypes.string,
        signingUrlHeaders: PropTypes.oneOfType([
          PropTypes.object,
          PropTypes.func
        ]),
        signingUrlQueryParams: PropTypes.oneOfType([
          PropTypes.object,
          PropTypes.func
        ]),
        signingUrlWithCredentials: PropTypes.bool,
        uploadRequestHeaders: PropTypes.object,
        contentDisposition: PropTypes.string,
        server: PropTypes.string,
        scrubFilename: PropTypes.func,
        s3path: PropTypes.string,
        inputRef: PropTypes.oneOfType([
          PropTypes.object,
          PropTypes.func
        ]),
        autoUpload: PropTypes.bool
    },

    getDefaultProps: function() {
        return {
            preprocess: function(file, next) {
                console.log('Pre-process: ',file.name);
                next(file);
            },
            onSignedUrl: function( signingServerResponse ) {
                console.log('Signing server response: ', signingServerResponse);
            },
            onProgress: function(percent, message, file) {
                console.log('Upload progress: ',`${percent} % ${message}`);
            },
            onFinish: function(signResult) {
                console.log("Upload finished: ",signResult.publicUrl)
            },
            onError: function(message) {
                console.log("Upload error: ",message);
            },
            server: '',
            signingUrlMethod: 'GET',
            scrubFilename: function(filename) {
                return filename.replace(/[^\w\d_\-\.]+/ig, '');
            },
            s3path: '',
            autoUpload: true
        };
    },

    uploadFile: function() {
        this.myUploader = new S3Upload({
            fileElement: ReactDOM.findDOMNode(this),
            signingUrl: this.props.signingUrl,
            getSignedUrl: this.props.getSignedUrl,
            preprocess: this.props.preprocess,
            onSignedUrl: this.props.onSignedUrl,
            onProgress: this.props.onProgress,
            onFinishS3Put: this.props.onFinish,
            onError: this.props.onError,
            signingUrlMethod: this.props.signingUrlMethod,
            signingUrlHeaders: this.props.signingUrlHeaders,
            signingUrlQueryParams: this.props.signingUrlQueryParams,
            signingUrlWithCredentials: this.props.signingUrlWithCredentials,
            uploadRequestHeaders: this.props.uploadRequestHeaders,
            contentDisposition: this.props.contentDisposition,
            server: this.props.server,
            scrubFilename: this.props.scrubFilename,
            s3path: this.props.s3path
        });
    },

    abort: function() {
        this.myUploader && this.myUploader.abortUpload();
    },

    clear: function() {
        clearInputFile(ReactDOM.findDOMNode(this));
    },

    render: function() {
        return React.createElement('input', this.getInputProps());
    },

    getInputProps: function() {
        // declare ref beforehand and filter out
        // `inputRef` by `ReactS3Uploader.propTypes`
        var additional = {
            type: 'file',
            ref: this.props.inputRef
        };

        if ( this.props.autoUpload ) {
            additional.onChange = this.uploadFile;
        }
        
        var temporaryProps = objectAssign({}, this.props, additional);
        var inputProps = {};

        var invalidProps = Object.keys(ReactS3Uploader.propTypes);

        for(var key in temporaryProps) {
            if(temporaryProps.hasOwnProperty(key) && invalidProps.indexOf(key) === -1) {
                inputProps[key] = temporaryProps[key];
            }
        }

        return inputProps;
    }

});

// http://stackoverflow.com/a/24608023/194065
function clearInputFile(f){
    if(f.value){
        try{
            f.value = ''; //for IE11, latest Chrome/Firefox/Opera...
        }catch(err){ }
        if(f.value){ //for IE5 ~ IE10
            var form = document.createElement('form'),
                parentNode = f.parentNode, ref = f.nextSibling;
            form.appendChild(f);
            form.reset();
            parentNode.insertBefore(f,ref);
        }
    }
}


module.exports = ReactS3Uploader;
