var chalk = require('chalk');

function log(message) {
  if (!ui.silent) {
    console.log(chalk.green(message));
  }
}

function error(message) {
  if (!ui.silent) {
    console.log(chalk.red(message));
  }
}

var ui = {
  silent: true,
  log:    log,
  error:  error
};

module.exports = ui;
