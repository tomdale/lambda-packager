var CloudFormation = require('../aws/cloud-formation');
var Config         = require('../config');
var prompt         = require('../util/prompt');
var green          = require('chalk').green;
var red            = require('chalk').red;
var cyan           = require('chalk').cyan;
var path           = require('path');
var ui             = require('../util/ui');
var root           = __dirname;

var DeployCommand = {
  run: function() {
    var config = new Config();

    var cloudFormation;

    return askQuestions()
      .then(function(answers) {
        ui.log("Creating stack " + answers.stackName + "...");
        ui.log("This may take a few minutes.");

        config.region = answers.region;

        cloudFormation = new CloudFormation({
          apiVersion: '2010-05-15',
          region: config.region
        });

        var templatePath = path.join(root, '../../blueprints/cloudformation-template.json');
        return cloudFormation.createStack(answers.stackName, templatePath);
      })
      .then(function(stackID) {
        return cloudFormation.poll(stackID);
      })
      .then(function(outputs) {
        config.bucket = outputs.Bucket;
        config.lambdaFunction = outputs.Function;
        config.save();

        ui.log("Saved AWS configuration:");
        ui.log("Bucket: " + cyan(config.bucket));
        ui.log("Lambda Function: " + cyan(config.lambdaFunction));
      })
      .catch(function(err) {
        ui.error(err.message || err);
      });
  }
};

function askQuestions() {
  var questions = [{
    type: 'input',
    name: 'stackName',
    default: 'lambda-packager',
    message: 'Stack name'
  }, {
    type: 'region',
    name: 'region',
    default: 'us-east-1',
    message: 'Region'
  }];

  return prompt(questions);
}

module.exports = DeployCommand;
