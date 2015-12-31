'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var jetpack = require('fs-jetpack');
var polybuild = require('polybuild');
var browserSync = require('browser-sync');
var projectDir = jetpack;
var destTest = projectDir.cwd('./polybuild');

var paths = {
  modules: [
      'app/modules/**/*.js',
      'app/app.js'
  ],
  test: [
    'app/drivers/*.html'
  ],
  destTest: 'polybuild'

};

var viewFiles = function(src) {
  return gulp.src(src)
    .pipe($.size({
      showFiles: true
    }));

};

var polymerBuild = function(src, dest) {
  return gulp.src(src)
  .pipe($.size())
  .pipe(polybuild())
  .pipe(gulp.dest(dest));

};

var jshintTask = function(src) {
  return gulp.src(src)
  .pipe($.size({
    showFiles: true
  }))
  .pipe($.jshint.extract())
  .pipe($.jshint())
  .pipe($.jshint.reporter('jshint-stylish'));

};

gulp.task('test',function() {
  return viewFiles(paths.modules);
});

// serve task
gulp.task('serve',function() {
  browserSync({
    port: 5000,
    server: {
      baseDir: 'app',
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });
});

gulp.task('jshint',function() {
  return jshintTask(paths.modules);
});

gulp.task('polymerBuild',function() {
  return polymerBuild(paths.test,paths.destTest);
});
