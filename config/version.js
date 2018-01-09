const execSync = require('child_process').execSync;
const semver = require('semver');
const pkg = require('../package.json');
const config = JSON.parse(process.env.NPM_PRESET_CONFIG);

if (!semver.prerelease(pkg.version)) {
  process.chdir(config.root);
  execSync('conventional-changelog -p videojs -i CHANGELOG.md -s');
  execSync('git add CHANGELOG.md');
}
