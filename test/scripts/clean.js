const shelljs = require('shelljs');
const path = require('path');

const npmPresetDir = path.join(__dirname, '..', '..');
const testPkgDir = path.join(npmPresetDir, 'test', 'fixtures', 'test-pkg-main');

shelljs.rm(path.join(testPkgDir, 'node_modules', 'npm-preset-videojs'));
shelljs.rm(path.join(testPkgDir, 'node_modules'));
