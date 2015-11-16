"use strict";

var fsp                   = require('fs-promise');
var RSVP                  = require('rsvp');
var Promise               = require('rsvp').Promise;
var path                  = require('path');
var util                  = require('util');
var exec                  = RSVP.denodeify(require('child_process').exec);
var ZipFile               = require('./zip-file');
var HTTPDependencyBuilder = require('./http-dependency-builder');
var temp                  = require('temp').track();
var mktempdir             = RSVP.denodeify(temp.mkdir);
var Config                = require('./config');
var red                   = require('chalk').red;
var ui                    = require('./util/ui');
var debug                 = require('debug')('lambda-packager:packager');

var Packager = function() {
};

Packager.prototype.build = function(options) {
  var packagePath = options.from;
  var zipPath = options.to;
  var tmpDir;
  var outputPath;

  var config = new Config().read();

  return createTempDirectory()
    .then(verifyInputs)
    .then(copySourceDirectory)
    .then(buildLambdaDependencies)
    .then(zipPackage);

  function createTempDirectory() {
    debug('creating temp directory');
    return mktempdir('lambda-packager')
      .then(function(dirPath) {
        tmpDir = dirPath;
        outputPath = path.join(tmpDir, path.basename(packagePath));
      });
  }

  function verifyInputs() {
    return fsp.stat(packagePath)
      .then(function(stats) {
        if (!stats.isDirectory()) {
          throw new Error(packagePath + " is not a directory");
        }
      });
  }

  function copySourceDirectory() {
    debug('copying source directory');
    // Arguments to cp:
    //
    // -R Recursively copies the directory.
    // -L Resolves all symlinks. Symlinks out of this directory ("../../")
    //    won't work once copied to a tmp directory
    return exec("cp -LR " + packagePath + " " + outputPath);
  }

  function buildLambdaDependencies() {
    var packageJSONPath = path.join(outputPath, 'package.json');

    var builder = new HTTPDependencyBuilder({
      config: config,
      packageJSONPath: packageJSONPath,
      destination: outputPath
    });

    return builder.build();
  }

  function zipPackage() {
    ui.log("Saving package to " + zipPath);

    var zipFile = new ZipFile({
      sourceDirectory: outputPath,
      destinationZip: zipPath
    });

    return zipFile.zip();
  }
};

module.exports = new Packager();
