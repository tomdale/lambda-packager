var AWS    = require('aws-sdk');
var RSVP   = require('rsvp');
var fsp    = require('fs-promise');
var path   = require('path');
var Lambda = require('./aws/lambda');
var S3     = require('./aws/s3');
var ui     = require('./util/ui');
var green  = require('chalk').green;
var exec   = RSVP.denodeify(require('child_process').exec);

var DependencyBuilder = function(options) {
  this.config          = options.config;
  this.packageJSONPath = options.packageJSONPath;
  this.destination     = options.destination;
};

DependencyBuilder.prototype.build = function() {
  var config         = this.config;
  var dest           = this.destination;
  var lambda         = new Lambda(config);
  var s3             = new S3(config);
  var nodeModulesZip = path.join(dest, 'node_modules.zip');

  var timeout = printDots();

  // Transmit our package.json to the Lambda function to
  // be built.
  function buildDependencies(packageJSON) {
    var payload = {
      packages: JSON.parse(packageJSON),
      bucket: config.bucket
    };

    ui.log('Sending package.json to Lambda function');
    ui.log('Compiling dependencies on Lambda');

    return lambda.invoke(payload)
      .then(stopDots(timeout));
  }

  // Once the Lambda function returns the request ID,
  // we can fetch the zip of node_modules from S3.
  function downloadZippedDependencies(result) {
    var requestID = result.requestID;

    ui.log('Downloading zipped dependencies');

    return s3.download({
      key: requestID + "/node_modules.zip",
      destination: nodeModulesZip
    });
  }

  // Unzip the zipped node_modules directory that we fetched from S3,
  // then delete the archive once decompressed.
  function unzipDependencies() {
    ui.log('Unzipping dependencies');

    return exec('unzip -q ' + nodeModulesZip + " -d " + dest)
      .then(function() {
        return fsp.remove(nodeModulesZip);
      });
  }

  return fsp.readFile(this.packageJSONPath)
    .then(buildDependencies)
    .then(downloadZippedDependencies)
    .then(unzipDependencies);
};

function printDots() {
  return setInterval(function() {
    process.stdout.write(green('.'));
  }, 1000);
}

function stopDots(timeout) {
  return function(requestID) {
    ui.log('');
    clearInterval(timeout);
    return requestID;
  }
}

module.exports = DependencyBuilder;
