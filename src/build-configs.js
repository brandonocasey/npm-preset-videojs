var path = require('path');
var glob = require('glob');
var buildConfigs = {};

glob.sync(path.join(__dirname, '..', 'config', '*')).forEach(function(filepath) {
  buildConfigs[path.basename(filepath)] = filepath;
});

module.exports = buildConfigs;
