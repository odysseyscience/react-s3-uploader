
var mime = require('mime'),
    uuid = require('node-uuid'),
    aws = require('aws-sdk'),
    express = require('express');


function checkTrailingSlash(path) {
    if (path && path[path.length-1] != '/') {
        path += '/';
    }
    return path;
}

function S3Router(options) {

    var S3_BUCKET = options.bucket,
        getFileKeyDir = options.getFileKeyDir || function() { return ""; };
    if (options.region) {
        var REGION = options.region;
        aws.config.update({region: REGION});
    }
    if (!S3_BUCKET) {
        throw new Error("S3_BUCKET is required.");
    }

    var router = express.Router();

    /**
     * Redirects image requests with a temporary signed URL, giving access
     * to GET an image.
     */
    router.get(/\/img\/(.*)/, function(req, res) {
        var params = {
            Bucket: S3_BUCKET,
            Key: checkTrailingSlash(getFileKeyDir(req)) + req.params[0]
        };
        var s3 = new aws.S3();
        s3.getSignedUrl('getObject', params, function(err, url) {
            res.redirect(url);
        });
    });

    /**
     * Returns an object with `signedUrl` and `publicUrl` properties that
     * give temporary access to PUT an object in an S3 bucket.
     */
    router.get('/sign', function(req, res) {
        var filename = uuid.v4() + "_" + req.query.objectName;
        var mimeType = mime.lookup(filename);
        var fileKey = checkTrailingSlash(getFileKeyDir(req)) + filename;

        var s3 = new aws.S3();
        var params = {
            Bucket: S3_BUCKET,
            Key: fileKey,
            Expires: 60,
            ContentType: mimeType,
            ACL: options.ACL || 'private'
        };
        s3.getSignedUrl('putObject', params, function(err, data) {
            if (err) {
                console.log(err);
                return res.send(500, "Cannot create S3 signed URL");
            }
            res.json({
                signedUrl: data,
                publicUrl: '/s3/img/' + filename,
                filename: filename
            });
        });
    });

    return router;
}

module.exports = S3Router;
