var path = require('path');
var glob = require('glob');
var buildConfigs = {};

glob.sync(path.join(__dirname, '..', 'config', '*')).forEach(function(filepath) {
  buildConfigs[path.basename(filepath)] = filepath;
});

var getScripts = function(config) {
  var vjsConfig = Object.assign({
    css: true,
    docs: true,
    lang: true,
    ie8: false
  }, config.npmScripts.videojs || {});

  var scripts = {
    'prebuild': 'npms clean',
    'build': 'npms -p build:js build:test',
    'build:js': 'npms -p build:js:rollup-modules -s build:js:rollup-umd build:js:bannerize build:js:uglify',
    'build:js:bannerize': 'bannerize ' + path.join(config.root, 'dist',  config.name + '.js ') + '--banner=' + buildConfigs['banner.ejs'],
    'build:js:rollup-modules': 'rollup -c ' + buildConfigs['modules.rollup.config.js'],
    'build:js:rollup-umd': 'rollup -c ' + buildConfigs['umd.rollup.config.js'],
    'build:js:uglify': 'uglifyjs dist/' + config.name + '.js --comments --mangle --compress --ie8 -o dist/' + config.name + '.min.js',
    'build:test': 'rollup -c ' + buildConfigs['test.rollup.config.js'],
    'clean': 'rimraf ' + path.join(config.root, 'dist') + ' ' + path.join(config.root, 'test', 'dist'),
    'mkdir': 'mkdirp ' + path.join(config.root, 'dist') + ' ' + path.join(config.root, 'test', 'dist'),
    'lint': 'vjsstandard',
    'start': 'npms -p start:server watch',
    'start:server': 'node ' + buildConfigs['server.js'],
    'test': 'npms test:run lint',
    'pretest:run': 'npms build',
    'test:run': 'karma start ' + buildConfigs['karma.conf.js'],
    'preversion': 'npms test',
    'version': 'node ' + buildConfigs['version.js'],
    'watch': 'npms -p watch:js-modules watch:js-umd watch:test',
    'watch:js-modules': 'rollup -c ' + buildConfigs['modules.rollup.config.js'] + ' -w',
    'watch:js-umd': 'rollup -c ' + buildConfigs['umd.rollup.config.js'] + ' -w',
    'watch:test': 'rollup -c ' + buildConfigs['test.rollup.config.js'] + ' -w'
  };

  if (vjsConfig.css) {
    Object.assign(scripts, {
      'build:css': 'npms build:css:sass build:css:bannerize',
      'build:css:bannerize': 'bannerize ' + path.join(config.root, 'dist', config.name + '.css') + ' --banner=' + buildConfigs['banner.ejs'],
      'build:css:sass': 'node-sass ' + path.join(config.root, 'src', 'plugin.scss') + ' ' + path.join(config.root, 'dist', config.name + '.css') + ' --output-style=compressed --linefeed=lf',
      // we run npm run build:css:sass here for intial rebuild
      'watch:css': 'npms -p watch:css:sass build:css:sass',
      'watch:css:sass': 'npms build:css:sass -- --watch src/**/*.scss',
      'build': scripts.build + ' build:css',
      'watch': scripts.watch + ' watch:css'
    });
  }

  if (vjsConfig.docs) {
    Object.assign(scripts, {
      'predocs:api': 'npms clean:docs',
      'clean:docs': 'rimraf ' + path.join(config.root, 'docs', 'api'),
      'docs': 'npms -p docs:api docs:toc',
      'docs:api': 'jsdoc src -r -c ' + buildConfigs['jsdoc.json'] + ' -d ' + path.join(config.root, 'docs', 'api'),
      'docs:toc': 'doctoc ' + path.join(config.root, 'README.md')
    });
  }

  if (vjsConfig.lang) {
    Object.assign(scripts, {
      'build:lang': 'vjslang --dir ' + path.join(config.root, 'dist', 'lang'),
      'build': scripts.build + ' build:lang'
    });
  }

  return scripts;
};

module.exports = getScripts;
