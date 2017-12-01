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
	}, config.npmScript['videojs'] || {});

	var scripts = {
		'prebuild': ['npm run clean', 'npm run mkdir'],
		'build': [['npm run build:js'], ['npm run build:test']],
		'build:js': [['npm run build:js:rollup-modules'], ['npm run build:js:rollup-umd', 'npm run build:js:bannerize', 'npm run build:js:uglify']],
		'build:js:bannerize': 'bannerize ' + path.join(config.root, 'dist',  config.name + '.js ') + '--banner=' + buildConfigs['banner.ejs'],
		'build:js:rollup-modules': 'rollup -c ' + buildConfigs['modules.rollup.config.js'],
		'build:js:rollup-umd': 'rollup -c ' + buildConfigs['umd.rollup.config.js'],
		'build:js:uglify': 'uglifyjs dist/' + config.name + '.js --comments --mangle --compress --ie8 -o dist/' + config.name + '.min.js',
		'build:test': 'rollup -c ' + buildConfigs['test.rollup.config.js'],
		'clean': [['rimraf ' + path.join(config.root, 'dist')], ['rimraf ' + path.join(config.root, 'test', 'dist')]],
		'mkdir': 'mkdirp ' + path.join(config.root, 'dist') + ' ' + path.join(config.root, 'test', 'dist'),
		'lint': 'vjsstandard',
		'start': [['npm run start:server'], ['npm run watch']],
		'start:server': 'static -a 0.0.0.0 -p 9999 -H \'{"Cache-Control": "no-cache, must-revalidate"}\' .',
		'pretest': ['npm run lint', 'npm run build'],
		'test': 'karma start ' + buildConfigs['karma.conf.js'],
		'preversion': 'npm test',
		'version': 'node ' + buildConfigs['version.js'],
		'watch': [['npm run watch:js-modules'], ['npm run watch:js-umd'], ['npm run watch:test']],
		'watch:js-modules': 'rollup -c ' + buildConfigs['modules.rollup.config.js'] + ' -w',
		'watch:js-umd': 'rollup -c ' + buildConfigs['umd.rollup.config.js'] + ' -w',
		'watch:test': 'rollup -c ' + buildConfigs['test.rollup.config.js'] + ' -w',
		"prepublishOnly": "npm run build",
		'prepush': 'npm run lint',
	};

	if (vjsConfig.css) {
		Object.assign(scripts, {
			'build:css': ['npm run build:css:sass', 'npm run build:css:bannerize'],
			'build:css:bannerize': 'bannerize ' + path.join(config.root, 'dist', config.name + '.css') + ' --banner=' + buildConfigs['banner.ejs'],
			'build:css:sass': 'node-sass ' + path.join(config.root, 'src', 'plugin.scss') + ' ' + path.join(config.root, 'dist', config.name + '.css') + ' --output-style=compressed --linefeed=lf',
			// we run npm run build:css:sass here for intial rebuild
			'watch:css': [['npm run build:css:sass'], ['npm run watch:css:sass']],
			'watch:css:sass': 'npm run build:css:sass -- --watch src/**/*.scss',
			'build': scripts.build.concat([['npm run build:css']]),
			'watch': scripts.watch.concat([['npm run watch:css']])
		});
	}

	if (vjsConfig.docs) {
		Object.assign(scripts, {
			'predocs:api': 'npm run clean:docs',
			'clean:docs': 'rimraf ' + path.join(config.root, 'docs', 'api'),
			'docs': [['npm run docs:api', 'npm run docs:toc']],
			'docs:api': 'jsdoc src -r -c ' + buildConfigs['jsdoc.json'] + ' -d ' + path.join(config.root, 'docs', 'api'),
			'docs:toc': 'doctoc ' + path.join(config.root, 'README.md'),
			'precommit': ['npm run docs:toc',  'git add ' + path.join(config.root, 'README.md')]
		});
	}

	if (vjsConfig.lang) {
		Object.assign(scripts, {
			'build:lang': 'vjslang --dir ' + path.join(config.root, 'dist', 'lang'),
		});
	}

	return scripts;
};
module.exports = getScripts;
