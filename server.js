var express = require('express');
var bodyParser = require('body-parser');
var uuid = require('uuid');
var buildDependencies = require('./lib/server/build-dependencies');

var app = express();
app.use(bodyParser.json());

app.post('/build', function(req, res) {
  var packages = req.body.packages;
  var bucket = req.body.bucket;

  buildDependencies(packages, bucket, uuid.v4())
    .then(function(data) {
      res.send(data);
    })
    .catch(function(err) {
      response.status(500).send();
    });
});

module.exports = app;

app.set('port', app.get('env') === 'production' ? 80 : 8387);

var server = app.listen(app.get('port'), function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Packager server running at http://%s:%s', host, port);
});

