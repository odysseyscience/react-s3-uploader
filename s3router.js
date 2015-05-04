
var mime = require('mime'),
    uuid = require('node-uuid'),
    aws = require('aws-sdk'),
    express = require('express'),
    moment = require('moment');


function S3Router(options) {

    var S3_BUCKET = options.bucket,
        getFileKeyDir = function(name) { return (options.getFileKeyDir ? (options.getFileKeyDir(name) + '/') : '') + moment().format('YYYY[/]MM[/]DD'); };

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
            Key: getFileKeyDir(req) + '/' + req.params[0]
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
        if(!req.user) {
            res.send(500, "No user is authenticated.");
        } else {
	    var mimeType = mime.lookup(req.query.objectName);
	    var filename = Math.floor(new Date() / 1000) + "_" + req.user.username + '.' + mime.extension(mimeType);//req.query.objectName;
            var fileKey = getFileKeyDir(req) + '/' + filename;
	    
            var s3 = new aws.S3();
            var params = {
		Bucket: S3_BUCKET,
		Key: fileKey,
		Expires: 60,
		ContentType: mimeType,
		ACL: 'public-read'
            };
            s3.getSignedUrl('putObject', params, function(err, data) {
		if (err) {
                    console.log(err);
                    return res.send(500, "Cannot create S3 signed URL");
		}
		res.json({
                    signedUrl: data,
                    publicUrl: '/s3/img/' + filename,
		    s3Url: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + fileKey,
                    filename: filename
		});
            });
	}
    });

    return router;
}

module.exports = S3Router;
