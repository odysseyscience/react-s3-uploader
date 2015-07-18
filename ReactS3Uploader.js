"use strict";

var React = require('react'),
    S3Upload = require('./s3upload.js'),
    objectAssign = require('object-assign');

var ReactS3Uploader = React.createClass({

    getInitialState:function(){
        return{
            filename:""
        }
    },   
    propTypes: {
        signingUrl: React.PropTypes.string.isRequired,
        onProgress: React.PropTypes.func,
        onFinish: React.PropTypes.func,
        onError: React.PropTypes.func
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

    uploadFile: function(e) {
        var file = e.target.files[0];
        
        console.log(e);

        if (!file) return;
        this.setState({filename:file.name});

        new S3Upload({
            fileElement: e.target,
            signingUrl: this.props.signingUrl,
            onProgress: this.props.onProgress,
            onFinishS3Put: this.props.onFinish,
            onError: this.props.onError
        });
    },

    render: function() {
        return (
    React.createElement("div", {className: "file-uploader"}, 
        React.createElement("div", {className: "button"}, 
            React.createElement("div", {className: "fileUpload btn btn-primary"}, 
                React.createElement("span", null, React.createElement("i", {className: "fa fa-paperclip"})), 
                React.createElement("input", {ref: "in", className: "upload", type: "file", accept: "/*", onChange: this.uploadFile})
            ), 
            React.createElement("div", {className: "filename"}, 
                this.state.filename
            )
         )
    )
        );

 

    }

});


module.exports = ReactS3Uploader;
