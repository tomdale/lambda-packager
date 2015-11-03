var fsp = require('fs-promise');

module.exports = function(path) {
  return fsp.stat(path)
    .then(function() {
      return true;
    }, function() {
      return false;
    });
};
