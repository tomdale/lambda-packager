var packager = require('../packager');
var green    = require('chalk').green;
var ui       = require('../util/ui');

var PackageCommand = {
  run: function(packageDirectory, outputZip) {
    return packager.build({
      from: packageDirectory,
      to: outputZip
    })
    .then(function() {
      ui.log("Packaged " + packageDirectory + " into " + outputZip + ".");
    });
  }
};

module.exports = PackageCommand;
