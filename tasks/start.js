'use strict';

var Q = require('q');
var electron = require('electron-prebuilt');
var pathUtil = require('path');
var childProcess = require('child_process');
var utils = require('./utils');

//getting the path of gulp from the platform
var gulpPath = pathUtil.resolve('./node_modules/.bin/gulp');
if (process.platform === 'win32') {
  gulpPath += '.cmd';
}

/**
 * runBuild - building the app using gulp task build
 *
 * @return {promise} [ build process promise ]
 */
var runBuild = function() {
  var deferred = Q.defer();

  //using gulp
  var build = childProcess.spawn(gulpPath, [
      'build',
      '--env=' + utils.getEnvName(),
      '--color'
  ]);

  build.stdout.pipe(process.stdout);
  build.stderr.pipe(process.stderr);

  build.on('close', function(code) {
    deferred.resolve();
  });

  return deferred.promise;
};

/**
 * runGulpWatch - running the gulp watch task defined in the build.js
 *
 */
var runGulpWatch = function() {
  var watch = childProcess.spawn(gulpPath, [
      'watch',
      '--env=' + utils.getEnvName(),
      '--color'
  ]);

  watch.stdout.pipe(process.stdout);
  watch.stderr.pipe(process.stderr);

  watch.on('close', function(code) {
    // Gulp watch exits when error occured during build.
    // Just respawn it then.
    runGulpWatch();
  });
};

/**
 * runApp - launching the builded app (./build) using electron in global space
 *
 */
var runApp = function() {
  var app = childProcess.spawn(electron, ['./build']);

  app.stdout.pipe(process.stdout);
  app.stderr.pipe(process.stderr);

  app.on('close', function(code) {
    // User closed the app. Kill the host process.
    process.exit();
  });
};

/**
 * runBuild  - Executing runGulpWatch and runApp
 *
 */
runBuild()
.then(function() {
  runGulpWatch();
  runApp();
});
