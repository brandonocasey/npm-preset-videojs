const execSync = require('child_process').execSync;
const semver = require('semver');
const pkg = require('../package.json');
const config = require('npm-script/src/config');

if (!semver.prerelease(pkg.version)) {
  process.chdir(config.root);
  execSync('conventional-changelog -p videojs -i CHANGELOG.md -s');
  execSync('git add CHANGELOG.md');
}
