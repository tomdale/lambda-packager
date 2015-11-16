var fs           = require('fs');
var childProcess = require('child_process');
var path         = require('path');
var AWS          = require('aws-sdk');
var RSVP         = require('rsvp');
var archiver     = require('archiver');
var chalk        = require('chalk');
var util         = require('util');

var mkdir        = RSVP.denodeify(fs.mkdir);
var writeFile    = RSVP.denodeify(fs.writeFile);
var exec         = RSVP.denodeify(childProcess.exec);

var root         = __dirname;

// This is the main entry point that Lambda invokes to handle the
// request to build the provided packages.
//
// The workflow is:
//
// 1. Create /tmp/<request-id>/
// 2. Copy the provided package.json to /tmp/<request-id>/package.json
// 3. Run npm install in that directory
// 4. Zip the resulting node_modules directory
// 5. Upload the zip file to <bucket>/<request-id>/node_modules.zip

module.exports = function buildDependencies(packages, bucket, requestID) {
  var tmpDir = path.join("/tmp/", requestID);
  var zipPath = path.join(tmpDir, "node_modules.zip");
  var output = [];
  var error;

  return createTempDirectory()
    .then(writePackageJSON(packages))
    .then(installPackages)
    .then(zipPackages)
    .then(uploadPackagesToS3)
    .then(function() {
      return {
        requestID: requestID
      };
    })
    .finally(function() {
      cleanupTempDirectory();
    });

  function createTempDirectory() {
    log('creating tmpdir; path=' + tmpDir);
    return mkdir(tmpDir);
  }

  function cleanupTempDirectory() {
    log('cleaning up tmpdir; path=' + tmpDir );
    return exec("rm -rf " + tmpDir);
  }

  function writePackageJSON(packages) {
    return function() {
      var packageJSONPath = path.join(tmpDir, "package.json");
      log("writing package.json; path=" + packageJSONPath);
      return writeFile(packageJSONPath, JSON.stringify(packages));
    };
  }

  function installPackages() {
    //var command = "node " + root + "/node_modules/npm/bin/npm-cli.js install";
    var command = "npm install";

    log("execing; cwd=" + tmpDir + "; cmd=" + command);

    return exec(command, {
      cwd: tmpDir
    });
  }

  function zipPackages() {
    var command = "zip -qr " + zipPath + " node_modules";

    log("zipping; from=" + tmpDir + "; to=" + zipPath);
    log("execing; cwd=" + tmpDir + "; cmd=" + command);

    return exec(command, {
      cwd: tmpDir
    });
  }

  function uploadPackagesToS3() {
    var s3 = new AWS.S3();
    var upload = RSVP.denodeify(s3.upload.bind(s3));
    var stream = fs.createReadStream(zipPath);
    var key = requestID + '/node_modules.zip';

    log("uploading to S3; bucket=" + bucket + "; key=" + key);

    return upload({
      Bucket: bucket,
      Key: key,
      Body: stream
    });
  }

  function log() {
    var message = util.format.apply(this, arguments);
    _log(chalk.green(message));
  }

  function logError() {
    var message = util.format.apply(this, arguments);
    _log(chalk.red(message));
  }

  function _log(message) {
    var date = (new Date()).toUTCString();
    console.log("[" + date + "] [" + requestID + "] " + message);
  }
};
