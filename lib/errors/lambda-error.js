var util = require('util');

function LambdaError(data) {
  if (data.FunctionError) {
    this.handled = data.FunctionError === 'Handled';
  }

  this.statusCode = data.StatusCode;
  this.payload = data.Payload;
}

LambdaError.prototype = Object.create(Error.prototype);
LambdaError.prototype.constructor = LambdaError;

LambdaError.detect = function(data) {
  return data.StatusCode === 200;
};

Object.defineProperty(LambdaError.prototype, 'message', {
  get: function() {
    var payload = JSON.parse(this.payload);

    return "Error while invoking Lambda function.\n" +
      "Status code: " + this.statusCode + "\n" +
      "Error message: " + payload.errorMessage;
  }
});

module.exports = LambdaError;
