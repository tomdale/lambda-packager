var AWS = require('aws-sdk');
var RSVP = require('rsvp');
var fsp = require('fs-promise');
var path = require('path');
var exec = RSVP.denodeify(require('child_process').exec);

var LambdaBuilder = function(options) {
  this.packageJSONPath = options.packageJSONPath;
  this.bucket = options.bucket;
  this.destination = options.destination;
};

LambdaBuilder.prototype.build = function() {

  function buildDependencies(packageJSON) {
    var payload = {
      packages: JSON.parse(packageJSON),
      bucket: 'tomdale-thaumaturgy'
    };

    return invokeLambdaFunction({
      name: 'lambda-packager',
      payload: payload
    });
  }

  var destination = this.destination;

  function downloadZippedDependencies(result) {
    var requestID = result.requestID;
    var destinationPath = path.join(destination, 'node_modules.zip');
    return download('tomdale-thaumaturgy', requestID + "/node_modules.zip", destinationPath);
  }

  function unzipDependencies() {
    var nodeModulesZip = path.join(destination, 'node_modules.zip');
    return exec('unzip -q ' + nodeModulesZip + " -d " + destination)
      .then(function() {
        return fsp.remove(nodeModulesZip);
      });
  }

  return fsp.readFile(this.packageJSONPath)
    .then(buildDependencies)
    .then(downloadZippedDependencies)
    .then(unzipDependencies);
};

function invokeLambdaFunction(options) {
  AWS.config.region = 'us-east-1';
  var lambda = new AWS.Lambda();
  var invoke = RSVP.denodeify(lambda.invoke.bind(lambda));

  return new RSVP.Promise(function(resolve, reject) {
    lambda.invoke({
      FunctionName: options.name,
      Payload: JSON.stringify(options.payload),
      InvocationType: "RequestResponse",
      LogType: "Tail"
    }, function(err, data) {
      if (err) { reject(err); }

      resolve(JSON.parse(data.Payload));
    });
  });
}

function download(bucket, key, destination) {
  return new RSVP.Promise(function(resolve, reject) {
    AWS.config.region = 'us-east-1';
    var s3 = new AWS.S3();

    s3.getObject({
      Bucket: bucket,
      Key: key
    }, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  }).then(function(data) {
    return fsp.writeFile(destination, data.Body);
  });
}

module.exports = LambdaBuilder;
