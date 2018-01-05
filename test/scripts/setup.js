var shelljs = require('shelljs');
var path = require('path');
var npmPresetDir = path.join(__dirname, '..', '..');
var testPkgDir = path.join(npmPresetDir, 'test', 'fixtures', 'test-pkg-main');

shelljs.ln('-sf', path.join(npmPresetDir, 'node_modules'), path.join(testPkgDir, 'node_modules'));
shelljs.ln('-sf', path.join(npmPresetDir), path.join(testPkgDir, 'node_modules', 'npm-scripts-preset-videojs'));
shelljs.rm('-rf', path.join(testPkgDir, 'dist'));
shelljs.rm('-rf', path.join(testPkgDir, 'test', 'dist'));

