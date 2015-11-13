"use strict";

var React = require('react'),
    S3Upload = require('./s3upload.js'),
    objectAssign = require('object-assign');

var ReactS3Uploader = React.createClass({

    propTypes: {
        signingUrl: React.PropTypes.string.isRequired,
        onProgress: React.PropTypes.func,
        onFinish: React.PropTypes.func,
        onError: React.PropTypes.func,
        signingUrlHeaders: React.PropTypes.object,
        signingUrlQueryParams: React.PropTypes.object,
        uploadRequestHeaders: React.PropTypes.object,
        contentDisposition: React.PropTypes.string,
        onUploadStart: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            onProgress: function(percent, message) {
                console.log('Upload progress: ' + percent + '% ' + message);
            },
            onFinish: function(signResult) {
                console.log("Upload finished: " + signResult.publicUrl)
            },
            onError: function(message) {
                console.log("Upload error: " + message);
            },
            onUploadStart: function(s3upload, clear) {
                console.log("Upload started: " + s3upload);
            }
        };
    },

    uploadFile: function() {
        var s3upload = new S3Upload({
            fileElement: findDOMNode(this),
            signingUrl: this.props.signingUrl,
            onProgress: this.props.onProgress,
            onFinishS3Put: this.props.onFinish,
            onError: this.props.onError,
            signingUrlHeaders: this.props.signingUrlHeaders,
            signingUrlQueryParams: this.props.signingUrlQueryParams,
            uploadRequestHeaders: this.props.uploadRequestHeaders,
            contentDisposition: this.props.contentDisposition
        });
        this.props.onUploadStart(s3upload, this.clear);
    },

    clear: function() {
        clearInputFile(findDOMNode(this));
    },

    render: function() {
        return React.DOM.input(objectAssign({}, this.props, {type: 'file', onChange: this.uploadFile}));
    }

});

function findDOMNode(cmp) {
    return React.findDOMNode ? React.findDOMNode(cmp) : cmp.getDOMNode();
}

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
