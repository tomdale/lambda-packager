var chalk = require('chalk');
var util = require('util');

function log(message) {
  if (!ui.silent) {
    console.log(chalk.green(util.format.apply(this, arguments)));
  }
}

function error() {
  if (!ui.silent) {
    console.log(chalk.red(util.format.apply(this, arguments)));
  }
}

var ui = {
  silent: true,
  log:    log,
  error:  error
};

module.exports = ui;
