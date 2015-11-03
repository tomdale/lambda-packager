var AWS = require('aws-sdk');
var RSVP = require('rsvp');
var debug = require('debug')('lambda-packager:lambda');

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
      FunctionName:   name,
      Payload:        JSON.stringify(payload)
    };

    lambda.invoke(params, function(err, data) {
      if (err) {
        debug('lambda error; err=', err);
        reject(err);
      }

      var payload = JSON.parse(data.Payload);

      debug('lambda succeeded; payload=', payload);
      resolve(payload);
    });
  });
};

module.exports = Lambda;
