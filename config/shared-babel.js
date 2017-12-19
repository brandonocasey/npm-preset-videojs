var babel = require('rollup-plugin-babel');
var es3 = require('babel-preset-es3');
var es2015 = require('babel-preset-es2015');
var externalHelpers = require('babel-plugin-external-helpers');
var transformObjectAssign = require('babel-plugin-transform-object-assign');

export default function(options) {
  return babel(Object.assign({
    babelrc: false,
    exclude: 'node_modules/**',
    presets: [
      es3,
      es2015.buildPreset(null, {loose: true, modules: false})
    ],
    plugins: [
      externalHelpers,
      transformObjectAssign
    ]
  }, options || {}));
}
