const shelljs = require('shelljs');
const path = require('path');
const npmPresetDir = path.join(__dirname, '..', '..');
const testPkgDir = path.join(npmPresetDir, 'test', 'fixtures', 'test-pkg-main');

shelljs.ln('-sf', path.join(npmPresetDir, 'node_modules'), path.join(testPkgDir, 'node_modules'));
shelljs.ln('-sf', path.join(npmPresetDir), path.join(testPkgDir, 'node_modules', 'npm-preset-videojs'));
shelljs.rm('-rf', path.join(testPkgDir, 'dist'));
shelljs.rm('-rf', path.join(testPkgDir, 'test', 'dist'));

