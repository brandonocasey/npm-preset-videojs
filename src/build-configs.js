const path = require('path');
const glob = require('glob');
const buildConfigs = {};

glob.sync(path.join(__dirname, '..', 'config', '*')).forEach(function(filepath) {
  buildConfigs[path.basename(filepath)] = filepath;
});

module.exports = buildConfigs;
