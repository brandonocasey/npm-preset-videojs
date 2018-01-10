const defaults = require('./defaults');
const config = JSON.parse(process.env.NPM_PRESET_CONFIG);

config.npmPreset.videojs = Object.assign(defaults, config.npmPreset.videojs || {});

module.exports = config;
