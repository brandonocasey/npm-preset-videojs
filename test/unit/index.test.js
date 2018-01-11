const test = require('ava');
const path = require('path');
const uuid = require('uuid');
const fs = require('fs');
const shelljs = require('shelljs');
const childProcess = require('child_process');
const Promise = require('bluebird');
const chokidar = require('chokidar');

const fixtureDir = path.join(__dirname, '..', 'fixtures');
const npmPresetDir = path.join(__dirname, '..', '..');
const testPkgDir = path.join(fixtureDir, 'test-pkg-main');

const promiseSpawn = function(bin, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(bin, args, options);
    let stdout = '';
    let stderr = '';
    let out = '';

    child.stdout.on('data', function(chunk) {
      const str = chunk.toString();

      out += str;
      stdout += str;
    });

    child.stderr.on('data', function(chunk) {
      const str = chunk.toString();

      out += str;
      stderr += str;
    });

    child.on('close', (exitCode) => {
      if (!options.ignoreExitCode && exitCode !== 0) {
        return reject(`command ${bin} ${args.join(' ')} failed with code ${exitCode}\n` + out);
      }
      return resolve({exitCode, stderr, stdout});
    });
  });
};

const exists = function(filepath) {
  try {
    fs.accessSync(filepath);
  } catch (e) {
    return false;
  }
  return true;
};

test.before((t) => {
  return promiseSpawn('node', [path.join(npmPresetDir, 'test', 'scripts', 'clean.js')]).then(() => {
    return promiseSpawn('node', [path.join(npmPresetDir, 'test', 'scripts', 'setup.js')]);
  });
});

test.after.always((t) => {
  return promiseSpawn('node', [path.join(npmPresetDir, 'test', 'scripts', 'clean.js')]);
});

test.beforeEach((t) => {
  const tempdir = path.join(shelljs.tempdir(), uuid.v4());

  t.context.dir = tempdir;

  t.context.modifyPkg = (newPkg) => {
    return new Promise((resolve, reject) => {
      const pkgPath = path.join(tempdir, 'package.json');
      const oldPkg = require(pkgPath);

      resolve(fs.writeFileSync(pkgPath, JSON.stringify(Object.assign(oldPkg, newPkg))));
    });
  };

  return promiseSpawn('cp', ['-R', testPkgDir + path.sep, tempdir], {});
});

test.afterEach.always((t) => {
  if (t.context.watcher) {
    t.context.watcher.close();
  }

  if (t.context.child) {
    t.context.child.kill();
  }

  if (t.context.dir) {
    return promiseSpawn('rm', ['-rf', t.context.dir], {});
  }
});

test('build:css', (t) => {
  t.plan(1);
  return promiseSpawn('npmp', ['build:css'], {cwd: t.context.dir}).then(() => {
    t.true(exists(path.join(t.context.dir, 'dist', 'test-pkg-main.css')), '.css file was built');
  });
});

test('build:js', (t) => {
  t.plan(4);
  return promiseSpawn('npmp', ['build:js'], {cwd: t.context.dir}).then(() => {
    t.true(exists(path.join(t.context.dir, 'dist', 'test-pkg-main.js')), '.js file was built');
    t.true(exists(path.join(t.context.dir, 'dist', 'test-pkg-main.min.js')), '.min.js file was built');
    t.true(exists(path.join(t.context.dir, 'dist', 'test-pkg-main.es.js')), '.es.js file was built');
    t.true(exists(path.join(t.context.dir, 'dist', 'test-pkg-main.cjs.js')), '.cjs.js file was built');
  });
});

test('build:test', (t) => {
  t.plan(1);
  return promiseSpawn('npmp', ['build:test'], {cwd: t.context.dir}).then(() => {
    t.true(exists(path.join(t.context.dir, 'test', 'dist', 'bundle.js')), 'test bundle was built');
  });
});

test('build:lang', (t) => {
  t.plan(1);
  return promiseSpawn('npmp', ['build:lang'], {cwd: t.context.dir}).then(() => {
    t.true(exists(path.join(t.context.dir, 'dist', 'lang')), 'lang folder exists');
  });
});

test('docs', (t) => {
  t.plan(1);
  return promiseSpawn('npmp', ['docs'], {cwd: t.context.dir}).then(() => {
    t.true(exists(path.join(t.context.dir, 'docs', 'api', 'index.html')), 'api docs built');
  });
});

test('test:run', (t) => {
  t.plan(1);
  return promiseSpawn('npmp', ['test:run'], {cwd: t.context.dir}).then((result) => {
    t.is(result.exitCode, 0, 'tests run and pass');
  });
});

test('lint', (t) => {
  t.plan(2);
  return promiseSpawn('npmp', ['lint'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
    t.is(result.exitCode, 0, 'success');
    t.true(result.stdout.length > 0, 'printed to stdout');
  });
});

test('lint fail', (t) => {
  t.plan(2);
  fs.appendFileSync(path.join(t.context.dir, 'src', 'plugin.js'), '\n\n\n\n');

  return promiseSpawn('npmp', ['lint'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
    t.not(result.exitCode, 0, 'did not succeed');
    t.true(result.stdout.length > 0, 'printed to stdout');
  });
});

test('clean', (t) => {
  t.plan(6);

  t.false(exists(path.join(t.context.dir, 'dist')), 'dist folder does not exist');
  t.false(exists(path.join(t.context.dir, 'test', 'dist')), 'test/dist folder does not exist');

  // does not die when there is nothing to clean
  return promiseSpawn('npmp', ['clean'], {cwd: t.context.dir}).then(() => {
    t.false(exists(path.join(t.context.dir, 'dist')), 'dist folder does not exist');
    t.false(exists(path.join(t.context.dir, 'test', 'dist')), 'test/dist folder does not exist');

    shelljs.mkdir('-p', path.join(t.context.dir, 'test', 'dist'));
    shelljs.mkdir('-p', path.join(t.context.dir, 'dist'));
    return promiseSpawn('npmp', ['clean'], {cwd: t.context.dir});
  }).then(() => {
    // cleans
    t.false(exists(path.join(t.context.dir, 'dist')), 'dist folder does not exist');
    t.false(exists(path.join(t.context.dir, 'test', 'dist')), 'test/dist folder does not exist');
  });
});

test('mkdir', (t) => {
  t.plan(6);

  t.false(exists(path.join(t.context.dir, 'dist')), 'dist folder does not exist');
  t.false(exists(path.join(t.context.dir, 'test', 'dist')), 'test/dist folder does not exist');

  return promiseSpawn('npmp', ['mkdir'], {cwd: t.context.dir}).then(() => {
    t.true(exists(path.join(t.context.dir, 'dist')), 'dist folder does not exist');
    t.true(exists(path.join(t.context.dir, 'test', 'dist')), 'test/dist folder does not exist');
    return promiseSpawn('npmp', ['mkdir'], {cwd: t.context.dir});
  }).then(() => {
    t.true(exists(path.join(t.context.dir, 'dist')), 'dist folder does not exist');
    t.true(exists(path.join(t.context.dir, 'test', 'dist')), 'test/dist folder does not exist');
  });
});

/*
test('start:server', (t) => {
});*/

test('version', (t) => {
  t.plan(7);

  return t.context.modifyPkg({scripts: {version: 'npmp version'}}).then(() => {
    return promiseSpawn('git', ['init'], {cwd: t.context.dir});
  }).then((result) => {
    t.is(result.exitCode, 0, 'success');
    return promiseSpawn('git', ['add', '--all'], {cwd: t.context.dir});
  }).then((result) => {
    t.is(result.exitCode, 0, 'success');
    return promiseSpawn('git', ['commit', '-a', '-m', 'initial'], {cwd: t.context.dir});
  }).then((result) => {
    t.is(result.exitCode, 0, 'success');
    return promiseSpawn('npm', ['version', 'major'], {cwd: t.context.dir});
  }).then((result) => {
    t.is(result.exitCode, 0, 'success');
    return promiseSpawn('git', ['diff', 'HEAD~1', '--name-only'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');
    // package.json is cached in npm so we read the actual file
    const pkg = JSON.parse(fs.readFileSync(path.join(t.context.dir, 'package.json')));

    t.is(result.exitCode, 0, 'success');
    t.deepEqual(stdouts, ['CHANGELOG.md', 'package-lock.json', 'package.json'], 'package changed');
    t.is(pkg.version, '2.0.0', 'package version incremented');
  });
});

test.cb('watch:js:modules', (t) => {
  const adds = [];
  const changes = [];

  t.plan(4);

  shelljs.mkdir('-p', path.join(t.context.dir, 'dist'));
  t.context.watcher = chokidar.watch(path.join(t.context.dir, 'dist', '*'))
    .on('add', (e) => {
      t.log(e);
      adds.push(e);

      if (adds.length === 2) {
        t.not(adds.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.es.js')), -1, 'es file created');
        t.not(adds.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.cjs.js')), -1, 'cjs file created');

        fs.appendFileSync(path.join(t.context.dir, 'src', 'plugin.js'), ' ');
      }
    })
    .on('addDir', (e) => t.fail(`a dir ${e} was created unexpectedly`))
    .on('change', (e) => {
      t.log(e);
      changes.push(e);

      if (changes.length === 2) {
        t.not(changes.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.es.js')), -1, 'es file changed');
        t.not(changes.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.cjs.js')), -1, 'cjs file changed');
        t.end();
      }
    })
    .on('unlink', (e) => t.fail(`a file ${e} was deleted unexpectedly`))
    .on('unlinkDir', (e) => t.fail(`a dir ${e} was deleted unexpectedly`));

  t.context.child = childProcess.spawn('npmp', ['watch:js:modules'], {cwd: t.context.dir});

  t.context.child.on('close', (exitCode) => {
    t.fail('watcher died');
    t.end();
  });
});

test.cb('watch:js:umd', (t) => {
  const adds = [];
  const changes = [];

  t.plan(2);

  shelljs.mkdir('-p', path.join(t.context.dir, 'dist'));
  t.context.watcher = chokidar.watch(path.join(t.context.dir, 'dist', '*'))
    .on('add', (e) => {
      t.log(e);
      adds.push(e);

      if (adds.length === 1) {
        t.not(adds.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.js')), -1, 'js file created');
        fs.appendFileSync(path.join(t.context.dir, 'src', 'plugin.js'), ' ');
      }
    })
    .on('addDir', (e) => t.fail(`a dir ${e} was created unexpectedly`))
    .on('change', (e) => {
      t.log(e);
      changes.push(e);

      if (changes.length === 1) {
        t.not(changes.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.js')), -1, 'js file changed');
        t.end();
      }
    })
    .on('unlink', (e) => t.fail(`a file ${e} was deleted unexpectedly`))
    .on('unlinkDir', (e) => t.fail(`a dir ${e} was deleted unexpectedly`));

  t.context.child = childProcess.spawn('npmp', ['watch:js:umd'], {cwd: t.context.dir});

  t.context.child.on('close', (exitCode) => {
    t.fail('watcher died');
    t.end();
  });

});

test.cb('watch:test', (t) => {
  const adds = [];
  const changes = [];

  t.plan(2);

  shelljs.mkdir('-p', path.join(t.context.dir, 'test', 'dist'));
  t.context.watcher = chokidar.watch(path.join(t.context.dir, 'test', 'dist', '*'))
    .on('add', (e) => {
      t.log(e);
      adds.push(e);

      if (adds.length === 1) {
        t.not(adds.indexOf(path.join(t.context.dir, 'test', 'dist', 'bundle.js')), -1, 'js file created');
        fs.appendFileSync(path.join(t.context.dir, 'src', 'plugin.js'), ' ');
      }
    })
    .on('addDir', (e) => t.fail(`a dir ${e} was created unexpectedly`))
    .on('change', (e) => {
      t.log(e);
      changes.push(e);

      if (changes.length === 1) {
        t.not(changes.indexOf(path.join(t.context.dir, 'test', 'dist', 'bundle.js')), -1, 'js file changed');
        t.end();
      }
    })
    .on('unlink', (e) => t.fail(`a file ${e} was deleted unexpectedly`))
    .on('unlinkDir', (e) => t.fail(`a dir ${e} was deleted unexpectedly`));

  t.context.child = childProcess.spawn('npmp', ['watch:test'], {cwd: t.context.dir});

  t.context.child.on('close', (exitCode) => {
    t.fail('watcher died');
    t.end();
  });

});

test.cb('watch:css', (t) => {
  const adds = [];
  const changes = [];
  let timeout;

  t.plan(2);

  shelljs.mkdir('-p', path.join(t.context.dir, 'dist'));
  t.context.watcher = chokidar.watch(path.join(t.context.dir, 'dist', '*'))
    .on('add', (e) => {
      t.log(e);
      adds.push(e);

      if (adds.length >= 1) {
        t.not(adds.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.css')), -1, 'css file created');

        // give watch 3s to start
        timeout = setTimeout(() => {
          fs.appendFileSync(path.join(t.context.dir, 'src', 'plugin.scss'), ' ');
        }, (process.env.TRAVIS ? 15000 : 3000));
      }
    })
    .on('addDir', (e) => t.fail(`a dir ${e} was created unexpectedly`))
    .on('change', (e) => {
      t.log(e);
      changes.push(e);

      if (timeout) {
        clearTimeout(timeout);
      }

      if (changes.length === 1) {
        t.not(changes.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.css')), -1, 'css file changed');
        t.end();
      }
    })
    .on('unlink', (e) => t.fail(`a file ${e} was deleted unexpectedly`))
    .on('unlinkDir', (e) => t.fail(`a dir ${e} was deleted unexpectedly`));

  t.context.child = childProcess.spawn('npmp', ['watch:css'], {cwd: t.context.dir});

  t.context.child.on('close', (exitCode) => {
    t.fail('watcher died');
    t.end();
  });

});
