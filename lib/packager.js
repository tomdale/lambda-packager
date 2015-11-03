"use strict";

var fsp = require('fs-promise');
var RSVP = require('rsvp');
var Promise = require('rsvp').Promise;
var path = require('path');
var util = require('util');
var ZipFile = require('./zip-file');
var LambdaBuilder = require('./lambda-builder');
var temp = require('temp').track();
var mktempdir = RSVP.denodeify(temp.mkdir);

var Packager = function() {
};

Packager.prototype.build = function(options) {
  var packagePath = options.from;
  var zipPath = options.to;
  var tmpDir;
  var outputPath;

  return createTempDirectory()
    .then(copySourceDirectory)
    .then(buildLambdaDependencies)
    .then(zipPackage)
    .catch(function(err) {
      console.log(err);
      console.log(err.stack);
    });

  function createTempDirectory() {
    return mktempdir('lambda-packager')
      .then(function(dirPath) {
        tmpDir = dirPath;
        outputPath = path.join(tmpDir, path.basename(packagePath));
      });
  }

  function copySourceDirectory() {
    return fsp.copy(packagePath, outputPath);
  }

  function buildLambdaDependencies() {
    var packageJSONPath = path.join(outputPath, 'package.json');
    var builder = new LambdaBuilder({
      packageJSONPath: packageJSONPath,
      bucket: 'tomdale-thaumaturgy',
      destination: outputPath
    });

    return builder.build();
  }

  function zipPackage() {
    var zipFile = new ZipFile({
      sourceDirectory: outputPath,
      destinationZip: zipPath
    });

    return zipFile.zip();
  }
};

module.exports = new Packager();
