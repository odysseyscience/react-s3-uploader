"use strict";

var React = require('react'),
    S3Upload = require('./s3upload.js'),
    objectAssign = require('object-assign'),
    ProgressBar = require('react-bootstrap/lib/ProgressBar');

var ReactS3Uploader = React.createClass({

    getInitialState:function(){
        return{
            filename:"",
            progress:0
        }
    },   

    propTypes: {
        signingUrl: React.PropTypes.string.isRequired,
        onProgress: React.PropTypes.func,
        onFinish: React.PropTypes.func,
        onError: React.PropTypes.func
    },

    onProgress: function(percent){
        this.setState({progress: percent});
    },
    getDefaultProps: function() {
        return {
            onProgress: function(percent, message) {
            
            },
            onFinish: function(signResult) {
            },
            onError: function(message) {
            }
        };
    },

    uploadFile: function(e) {
        var file = e.target.files[0];
        
        console.log(e);

        if (!file) return;
        this.setState({filename:file.name});
        var self=this;

        new S3Upload({
            fileElement: e.target,
            signingUrl: this.props.signingUrl,
            onProgress: self.onProgress,
            onFinishS3Put: this.props.onFinish,
            onError: this.props.onError
        });
    },

    render: function() {
        return (

                React.createElement("div", {className: "react-s3-uploader"}, 

                    React.createElement("div", {className: "button"}, 
                       React.createElement("div", {className: "fileUpload btn btn-primary"}, 
                            React.createElement("span", null, React.createElement("i", {className: "fa fa-paperclip"})), 
                            React.createElement("input", {ref: "in", className: "upload", type: "file", accept: "/*", onChange: this.uploadFile})
                       )
                    ), 
                    React.createElement("div", {className: "filename"}, 
                    this.state.filename
                    ),
                    React.createElement(ProgressBar,{now:this.state.progress, label:'%(percent)s%', srOnly:true})
                )

           );

 

    }

});


module.exports = ReactS3Uploader;
