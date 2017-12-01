/**
 * Rollup configuration for packaging the plugin in a module that is consumable
 * by either CommonJS (e.g. Node or Browserify) or ECMAScript (e.g. Rollup).
 *
 * These modules DO NOT include their dependencies as we expect those to be
 * handled by the module system.
 */
import json from 'rollup-plugin-json';
import babel from './shared-babel';
import config from 'npm-script/src/config';

export default {
  name: config.moduleName,
  input: 'src/plugin.js',
  output: [{
    file: `dist/${config.name}.cjs.js`,
    format: 'cjs'
  }, {
    file: `dist/${config.name}.es.js`,
    format: 'es'
  }],
  external: [
    'global',
    'global/document',
    'global/window',
    'video.js'
  ],
  globals: {
    'video.js': 'videojs'
  },
  legacy: true,
  plugins: [
    json(),
    babel()
  ]
};
