var inquirer = require('inquirer');
var RSVP     = require('rsvp');

function prompt(questions) {
  return new RSVP.Promise(function(resolve) {
    inquirer.prompt(questions, function(answers) {
      resolve(answers);
    });
  });
}
module.exports = prompt;
