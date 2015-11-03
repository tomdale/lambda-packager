var fs = require('fs-extra');
var merge = require('lodash.merge');

var CONFIG_PATH = "~/.lambda-packager/config.json";

// Default settings to make Lambda Packager work out-of-the-box. These settings
// are overridden by the user's ~/.lambda-packager/config.json file.
var DEFAULT_CONFIG = {
  region:         'us-east-1',
  bucket:         'tomdale-thaumaturgy',
  lambdaFunction: 'lambda-packager'
};

function Config() {
  var config = readConfig();

  this.region = config.region;
  this.bucket = config.bucket;
  this.lambdaFunction = config.lambdaFunction;
}

function readConfig() {
  var config;

  try {
    config = fs.readJsonSync(CONFIG_PATH);
  } catch(e) {
    config = {};
  }

  return merge({}, DEFAULT_CONFIG, config);
}

module.exports = Config;
