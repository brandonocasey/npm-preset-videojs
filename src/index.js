const path = require('path');
const buildConfigs = require('./build-configs');
const defaults = require('./defaults');

const getScripts = function(config) {
  const vjsConfig = Object.assign(defaults, config.npmPreset.videojs || {});

  const scripts = {
    'prebuild': 'npmp clean',
    'build': 'npmp -p build:*',
    'build:js': 'npmp -p build:js:rollup-modules -s build:js:rollup-umd build:js:bannerize build:js:uglify',
    'build:js:bannerize': 'bannerize ' + path.join(config.root, 'dist', config.name + '.js ') + '--banner=' + buildConfigs['banner.ejs'],
    'build:js:rollup-modules': 'rollup -c ' + buildConfigs['modules.rollup.config.js'],
    'build:js:rollup-umd': 'rollup -c ' + buildConfigs['umd.rollup.config.js'],
    'build:js:uglify': 'uglifyjs dist/' + config.name + '.js --comments --mangle --compress --ie8 -o dist/' + config.name + '.min.js',
    'build:test': 'rollup -c ' + buildConfigs['test.rollup.config.js'],
    'clean': 'rimraf ' + path.join(config.root, 'dist') + ' ' + path.join(config.root, 'test', 'dist'),
    'mkdir': 'mkdirp ' + path.join(config.root, 'dist') + ' ' + path.join(config.root, 'test', 'dist'),
    'lint': 'vjsstandard',
    'start': 'npmp -p start:server watch',
    'start:server': 'node ' + buildConfigs['server.js'],
    'test': 'npmp test:run lint',
    'pretest:run': 'npmp build',
    'test:run': 'karma start ' + buildConfigs['karma.conf.js'],
    'preversion': 'npmp test',
    'version': 'node ' + buildConfigs['version.js'],
    'watch': 'npmp -p watch:*',
    'watch:js': 'npmp -p watch:js:modules watch:js:umd',
    'watch:js:modules': 'rollup -c ' + buildConfigs['modules.rollup.config.js'] + ' -w',
    'watch:js:umd': 'rollup -c ' + buildConfigs['umd.rollup.config.js'] + ' -w',
    'watch:test': 'rollup -c ' + buildConfigs['test.rollup.config.js'] + ' -w'
  };

  if (vjsConfig.css) {
    Object.assign(scripts, {
      'build:css': 'npmp build:css:sass build:css:bannerize',
      'build:css:bannerize': 'bannerize ' + path.join(config.root, 'dist', config.name + '.css') + ' --banner=' + buildConfigs['banner.ejs'],
      'build:css:sass': 'node-sass ' + path.join(config.root, 'src', 'plugin.scss') + ' ' + path.join(config.root, 'dist', config.name + '.css') + ' --output-style=compressed --linefeed=lf',
      // we run npm run build:css:sass here for intial rebuild
      'watch:css': 'npmp -p watch:css:sass build:css:sass',
      'watch:css:sass': 'npmp build:css:sass -- --watch src/**/*.scss'
    });
  }

  if (vjsConfig.docs) {
    Object.assign(scripts, {
      'predocs:api': 'npmp clean:docs',
      'clean:docs': 'rimraf ' + path.join(config.root, 'docs', 'api'),
      'docs': 'npmp -p docs:api docs:toc',
      'docs:api': 'jsdoc src -r -c ' + buildConfigs['jsdoc.json'] + ' -d ' + path.join(config.root, 'docs', 'api'),
      'docs:toc': 'doctoc ' + path.join(config.root, 'README.md')
    });
  }

  if (vjsConfig.lang) {
    Object.assign(scripts, {
      'build:lang': 'vjslang --dir ' + path.join(config.root, 'dist', 'lang')
    });
  }

  return scripts;
};

module.exports = getScripts;
