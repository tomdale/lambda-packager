var fsp   = require('fs-promise');
var merge = require('lodash.merge');
var path  = require('path');
var userHome = require('user-home');

var CONFIG_PATH = path.join(userHome, ".lambda-packager/config.json");

// Default settings to make Lambda Packager work out-of-the-box. These settings
// are overridden by the user's ~/.lambda-packager/config.json file.
var DEFAULT_CONFIG = {
  region:         'us-east-1',
  bucket:         'lambda-packager-outputbucket-10n8d1dsfdloq',
  lambdaFunction: 'arn:aws:lambda:us-east-1:637538906757:function:lambda-packager-LambdaFunction-1V6EVJACIW2S7'
};

// The Config class reads settings from disk on instantiation and uses a set of
// default configuration options if they cannot be found.
function Config() {
  var config = readConfig();

  this.region = config.region;
  this.bucket = config.bucket;
  this.lambdaFunction = config.lambdaFunction;
}

Config.prototype.save = function() {
  var region         = this.region;
  var bucket         = this.bucket;
  var lambdaFunction = this.lambdaFunction;

  fsp.ensureDir(path.dirname(CONFIG_PATH))
    .then(function() {
      return fsp.writeJson(CONFIG_PATH, {
        region: region,
        bucket: bucket,
        lambdaFunction: lambdaFunction
      });
    })
    .catch(function(err) {
      console.log(err.stack);
    });
};

function readConfig() {
  var config;

  try {
    config = fsp.readJsonSync(CONFIG_PATH);
  } catch(e) {
    config = {};
  }

  return merge({}, DEFAULT_CONFIG, config);
}

module.exports = Config;
