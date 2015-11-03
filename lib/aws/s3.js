var AWS  = require('aws-sdk');
var RSVP = require('rsvp');
var fsp  = require('fs-promise');

function S3(config) {
  this.bucket = config.bucket;
  this.s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    region: config.region
  });
}

S3.prototype.download = function(options) {
  var bucket      = this.bucket;
  var s3          = this.s3;
  var key         = options.key;
  var destination = options.destination;

  return new RSVP.Promise(function(resolve, reject) {
    var params = {
      Bucket: bucket,
      Key: key
    };

    s3.getObject(params, function(err, data) {
      if (err) { reject(err); }

      resolve(data);
    });
  }).then(function(data) {
    // Extract the raw bytes from the response and
    // write them to disk.
    var body = data.Body;
    return fsp.writeFile(destination, body);
  });
};

module.exports = S3;
