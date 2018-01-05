var shelljs = require('shelljs');
var path = require('path');

var npmPresetDir = path.join(__dirname, '..', '..');
var testPkgDir = path.join(npmPresetDir, 'test', 'fixtures', 'test-pkg-main');

shelljs.rm(path.join(testPkgDir, 'node_modules', 'npm-scripts-preset-videojs'));
shelljs.rm(path.join(testPkgDir, 'node_modules'));
