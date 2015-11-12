var AWS   = require('aws-sdk');
var RSVP  = require('rsvp');
var debug = require('debug')('lambda-packager:cloud-formation');
var fsp   = require('fs-promise');
var ui    = require('../util/ui');
var green = require('chalk').green;

function CloudFormation(config) {
  this.cloudFormation = new AWS.CloudFormation({
    apiVersion: '2015-03-31',
    region: config.region
  });
}

CloudFormation.prototype.createStack = function(name, templatePath) {
  var cloudFormation = this.cloudFormation;

  return fsp.readFile(templatePath)
    .then(function(template) {
      var newTemplate = JSON.parse(template);
      newTemplate.Resources.LambdaFunction.Properties.Code.S3Bucket = name;
      template = JSON.stringify(newTemplate).toString();

      debug('creating stack; name=', name, '; template=', template);

      return new RSVP.Promise(function(resolve, reject) {
        var params = {
          StackName: name,
          Capabilities: [
            'CAPABILITY_IAM'
          ],
          OnFailure: 'DELETE',
          TemplateBody: template
        };

        cloudFormation.createStack(params, function(err, data) {
          if (err) {
            debug('cloudformation error; err=', err);
            return reject(err);
          }

          debug('createStack succeeded; data=', data);
          resolve(data.StackId);
        });
      });
    });

};

CloudFormation.prototype.poll = function(stackID) {
  var cloudFormation = this.cloudFormation;

  return new RSVP.Promise(function(resolve, reject) {
    var timer = setInterval(function() {
      var params = {
        StackName: stackID
      };

      cloudFormation.describeStacks(params, function(err, data) {
        if (err) {
          clearTimer();
          reject(err);
          return;
        }

        var status = data.Stacks[0].StackStatus;
        switch(status) {
          case 'CREATE_IN_PROGRESS':
            process.stdout.write(green('.'));
            break;
          case 'CREATE_COMPLETE':
            clearTimer();
            ui.log("\nStack created");
            resolve(mapOutputs(data.Stacks[0].Outputs));
            break;
          default:
            clearTimer();
            reject(data);
        }
      });
    }, 2000);

    function clearTimer() {
      clearInterval(timer);
    }
  });
};

function mapOutputs(outputs) {
  var mapped = {};

  outputs.forEach(function(item) {
    mapped[item.OutputKey] = item.OutputValue;
  });

  return mapped;
}

module.exports = CloudFormation;
