var temp = require('temp').track();

module.exports = {
  create: function() {
    if (this.tmpDir) {
      return this.tmpDir;
    }

    return temp.mkdirSync('lambda-packager');
  },

  tmpDir: null
};
