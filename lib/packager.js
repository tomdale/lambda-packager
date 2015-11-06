"use strict";

var fsp               = require('fs-promise');
var RSVP              = require('rsvp');
var Promise           = require('rsvp').Promise;
var path              = require('path');
var util              = require('util');
var ZipFile           = require('./zip-file');
var DependencyBuilder = require('./dependency-builder');
var temp              = require('temp').track();
var mktempdir         = RSVP.denodeify(temp.mkdir);
var Config            = require('./config');
var red               = require('chalk').red;
var ui                = require('./util/ui');
var debug             = require('debug')('lambda-packager:packager');

var Packager = function() {
};

Packager.prototype.build = function(options) {
  var packagePath = options.from;
  var zipPath = options.to;
  var tmpDir;
  var outputPath;

  var config = new Config().read();

  return createTempDirectory()
    .then(copySourceDirectory)
    .then(buildLambdaDependencies)
    .then(zipPackage)
    .catch(function(err) {
      console.log(red(err.stack));
      throw err;
    });

  function createTempDirectory() {
    debug('creating temp directory');
    return mktempdir('lambda-packager')
      .then(function(dirPath) {
        tmpDir = dirPath;
        outputPath = path.join(tmpDir, path.basename(packagePath));
      });
  }

  function copySourceDirectory() {
    debug('copying source directory');
    return fsp.copy(packagePath, outputPath);
  }

  function buildLambdaDependencies() {
    var packageJSONPath = path.join(outputPath, 'package.json');

    var builder = new DependencyBuilder({
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
