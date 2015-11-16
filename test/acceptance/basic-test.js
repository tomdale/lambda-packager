var path = require('path');
var expect = require('chai').expect;
var fsp = require('fs-promise');

var packager = require('../../lib/packager');
var tmpDir = require('../helpers/tmp').create();
var exists = require('../helpers/exists');
var zip = require('../helpers/zip');

describe("Package", function() {
  this.timeout(500000);

  describe("with pure JS dependencies", function() {
    var zipPath = path.join(tmpDir, 'simple-package.zip');

    before(function() {
      return packager.build({
        from: path.resolve(__dirname, '../fixtures/simple-package'),
        to: zipPath
      });
    });

    it("should create a zip file", function() {
      return expect(exists(zipPath)).to.eventually.be.true;
    });

    it("should have a node_modules directory", function() {
      zip(zipPath).shouldInclude([
        'node_modules/',
        'node_modules/chalk/',
        'node_modules/chalk/package.json',
        'package.json'
      ]);
    });

  });

  describe("with native dependencies", function() {
    var zipPath = path.join(tmpDir, 'native-dependencies-package.zip');

    before(function() {
      return packager.build({
        from: path.resolve(__dirname, '../fixtures/native-dependencies-package'),
        to: zipPath
      });
    });

    it("should create a zip file", function() {
      return expect(exists(zipPath)).to.eventually.be.true;
    });

    it("should have a node_modules directory", function() {
      zip(zipPath).shouldInclude([
        'node_modules/',
        'node_modules/chalk/',
        'node_modules/chalk/package.json',
        'node_modules/contextify/',
        'node_modules/contextify/package.json',
        'package.json'
      ]);
    });

  });

});

