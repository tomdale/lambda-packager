var AWS         = require('aws-sdk');
var RSVP        = require('rsvp');
var debug       = require('debug')('lambda-packager:lambda');
var ui          = require('../util/ui');
var LambdaError = require('../errors/lambda-error');

function Lambda(config) {
  this.name = config.lambdaFunction;
  this.lambda = new AWS.Lambda({
    apiVersion: '2015-03-31',
    region: config.region
  });
}

Lambda.prototype.invoke = function(payload) {
  var lambda = this.lambda;
  var name   = this.name;

  debug('invoking lambda function; name=', name, '; payload=', payload);

  return new RSVP.Promise(function(resolve, reject) {
    var params = {
      FunctionName: name,
      Payload:      JSON.stringify(payload),
      LogType:      "Tail"
    };

    lambda.invoke(params, function(err, data) {
      if (err) {
        debug('lambda error; err=', err);
        return reject(err);
      }

      if (LambdaError.detect(data)) {
        debug('lambda function error');
        return reject(new LambdaError(data));
      }

      var payload = JSON.parse(data.Payload);

      printLambdaLog(data.LogResult);

      debug('lambda succeeded; payload=', payload);
      resolve(payload);
    });
  });
};

function printLambdaLog(log) {
  // Convert Base64 to string
  log = new Buffer(log, "base64").toString();

  ui.log(log);
}

module.exports = Lambda;
