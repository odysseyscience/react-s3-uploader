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
        uploadRequestHeaders: React.PropTypes.object
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
            }
        };
    },

    uploadFile: function() {
        new S3Upload({
            fileElement: this.getDOMNode(),
            signingUrl: this.props.signingUrl,
            onProgress: this.props.onProgress,
            onFinishS3Put: this.props.onFinish,
            onError: this.props.onError,
            signingUrlHeaders: this.props.signingUrlHeaders,
            signingUrlQueryParams: this.props.signingUrlQueryParams,
            uploadRequestHeaders: this.props.uploadRequestHeaders
        });
    },

    render: function() {
        return React.DOM.input(objectAssign({}, this.props, {type: 'file', onChange: this.uploadFile}));
    }

});


module.exports = ReactS3Uploader;
