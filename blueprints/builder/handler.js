var fs = require('fs');
var childProcess = require('child_process');
var path = require('path');
var AWS = require('aws-sdk');
var RSVP = require('rsvp');
var archiver = require('archiver');
var mkdir = RSVP.denodeify(fs.mkdir);
var writeFile = RSVP.denodeify(fs.writeFile);
var exec = RSVP.denodeify(childProcess.exec);

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
module.exports.handler = function(event, context) {
  var packages = event.packages;
  var bucket = event.bucket;
  var requestID = context.awsRequestId;
  var tmpDir = path.join("/tmp/", requestID);
  var zipPath = path.join(tmpDir, "node_modules.zip");
  var output = [];
  var error;

  createTempDirectory()
    .then(writePackageJSON(packages))
    .then(installPackages)
    .then(function(installLog) {
      output.push(installLog.toString());
    })
    .then(zipPackages)
    .then(uploadPackagesToS3)
    .then(function() {
      output.push("Uploaded node_modules.zip to " + requestID);
    })
    .catch(function(err) {
      error = err;
    })
    .finally(function() {
      cleanupTempDirectory();

      if (error) {
        context.fail(error);
      }

      context.succeed({
        requestID: requestID,
        output: output.join("\n")
      });
    });

  function createTempDirectory() {
    return mkdir(tmpDir);
  }

  function cleanupTempDirectory() {
    return exec("rm -rf " + tmpDir);
  }

  function writePackageJSON(packages) {
    return function() {
      var packageJSONPath = path.join(tmpDir, "package.json");
      return writeFile(packageJSONPath, JSON.stringify(packages));
    };
  }

  function installPackages() {
    var command = "node /var/task/node_modules/npm/bin/npm-cli.js install";
    return exec(command, {
      cwd: tmpDir
    });
  }

  function zipPackages() {
    return new RSVP.Promise(function(resolve, reject) {
      var archive = archiver.create('zip', {});
      var output = fs.createWriteStream(zipPath);

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);

      archive.bulk([{
          expand: true,
          cwd: tmpDir,
          src: ['node_modules/**']
      }]);

      archive.finalize();
    });
  }

  function uploadPackagesToS3() {
    var s3 = new AWS.S3();
    var upload = RSVP.denodeify(s3.upload.bind(s3));
    var stream = fs.createReadStream(zipPath);

    return upload({
      Bucket: bucket,
      Key: requestID + '/node_modules.zip',
      Body: stream
    });
  }
};
