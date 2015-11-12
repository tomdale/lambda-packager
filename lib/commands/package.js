var packager = require('../packager');
var green    = require('chalk').green;
var ui       = require('../util/ui');
var util     = require('util');

var PackageCommand = {
  run: function(packageDirectory, outputZip) {
    return packager.build({
      from: packageDirectory,
      to: outputZip
    })
    .then(function() {
      ui.log("Packaged " + packageDirectory + " into " + outputZip + ".");
    })
    .catch(function(err) {
      ui.error(err.message || util.inspect(err));
      ui.error(err.stack);
    });
  }
};

module.exports = PackageCommand;
