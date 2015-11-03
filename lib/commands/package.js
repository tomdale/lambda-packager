var packager = require('../packager');
var green = require('chalk').green;

var PackageCommand = {
  run: function(packageDirectory, outputZip) {
    return packager.build({
      from: packageDirectory,
      to: outputZip
    })
    .then(function() {
      console.log(green("Packaged " + packageDirectory + " into " + outputZip + "."));
    });
  }
};

module.exports = PackageCommand;
