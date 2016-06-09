"use strict";

var React = require('react'),
    ReactDOM = require('react-dom'),
    S3Upload = require('./s3upload.js'),
    objectAssign = require('object-assign');

var ReactS3Uploader = React.createClass({

    propTypes: {
        signingUrl: React.PropTypes.string,
        getSignedUrl: React.PropTypes.func,
        onProgress: React.PropTypes.func,
        onFinish: React.PropTypes.func,
        onError: React.PropTypes.func,
        signingUrlHeaders: React.PropTypes.object,
        signingUrlQueryParams: React.PropTypes.object,
        uploadRequestHeaders: React.PropTypes.object,
        contentDisposition: React.PropTypes.string,
        server: React.PropTypes.string
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
            server: ''
        };
    },

    uploadFile: function() {
        new S3Upload({
            fileElement: ReactDOM.findDOMNode(this),
            signingUrl: this.props.signingUrl,
            getSignedUrl: this.props.getSignedUrl,
            onProgress: this.props.onProgress,
            onFinishS3Put: this.props.onFinish,
            onError: this.props.onError,
            signingUrlHeaders: this.props.signingUrlHeaders,
            signingUrlQueryParams: this.props.signingUrlQueryParams,
            uploadRequestHeaders: this.props.uploadRequestHeaders,
            contentDisposition: this.props.contentDisposition,
            server: this.props.server
        });
    },

    clear: function() {
        clearInputFile(ReactDOM.findDOMNode(this));
    },

    render: function() {
        return React.DOM.input(objectAssign({}, this.props, {type: 'file', onChange: this.uploadFile}));
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
