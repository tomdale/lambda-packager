var AdmZip = require('adm-zip');

module.exports = function(zipPath) {
  var zip = new AdmZip(zipPath);
  return new Zip(zip);
};

function Zip(zip) {
  this.zip = zip;
}

Zip.prototype.shouldInclude = function(included) {
  var entries = this.zip.getEntries().map(function(e) {
    return e.entryName;
  });

  var found = [];
  included.forEach(function(i) {
    if (entries.indexOf(i) > -1) {
      found.push(i);
    }
  });

  if (found.length < included.length) {
    var error = new Error("Files not found in zip file");
    error.expected = included;
    error.actual = found;
    throw error;
  }
};
