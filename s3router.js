
var mime = require('mime'),
    uuid = require('node-uuid'),
    aws = require('aws-sdk'),
    express = require('express');


function S3Router(options) {

    var AWS_ACCESS_KEY_ID = options.accessKey || process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_KEY = options.secretKey || process.env.AWS_SECRET_KEY,
        S3_BUCKET = options.bucket,
        getFileKeyDir = options.getFileKeyDir || function() { return "."; };


    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_KEY || !S3_BUCKET) {
        throw new Error("AWS_ACCESS_KEY_ID, AWS_SECRET_KEY, and S3_BUCKET must be available.");
    }

    aws.config.update({accessKeyId: AWS_ACCESS_KEY_ID , secretAccessKey: AWS_SECRET_KEY });

    var router = express.Router();

    /**
     * Redirects image requests with a temporary signed URL, giving access
     * to GET an image from the customer's folder.
     */
    router.get(/\/img\/(.*)/, function(req, res) {
        var params = {
            Bucket: S3_BUCKET,
            Key: getFileKeyDir(req) + '/' + req.params[0]
        };
        var s3 = new aws.S3();
        s3.getSignedUrl('getObject', params, function(err, url) {
            res.redirect(url);
        });
    });

    /**
     * Returns an object with `signedUrl` and `publicUrl` properties that
     * give temporary access to PUT an object in a customer's folder of
     * our S3 bucket.
     */
    router.get('/sign', function(req, res) {
        var filename = uuid.v4() + "_" + req.query.objectName;
        var mimeType = mime.lookup(filename);
        var fileKey = getFileKeyDir(req) + '/' + filename;

        var s3 = new aws.S3();
        var params = {
            Bucket: S3_BUCKET,
            Key: fileKey,
            Expires: 60,
            ContentType: mimeType,
            ACL: 'private'
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
