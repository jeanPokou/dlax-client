'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var less = require('gulp-less');
var map = require('vinyl-map');
var jetpack = require('fs-jetpack');
var utils = require('./utils');
var polybuild = require('polybuild');
var runSequence = require('run-sequence');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var del = require('del');
var transfrom = require('vinyl-transform');

// var babel = require('gulp-babel');
// var crisper = require('gulp-crisper');

var projectDir = jetpack;
var srcDir = projectDir.cwd('./app');
var destDir = projectDir.cwd('./build');

var paths = {
  jsCodeToTranspile: [
      'app/*.html',
      'app/**/*.js',
      '!app/main.js',
      '!app/spec.js',
      '!app/node_modules/**',
      '!app/bower_components/**',
      '!app/vendor/**'
  ],
  toCopy: [
        'app/main.js',
        'app/spec.js',
        'app/node_modules/**/*',
        'app/api/**/*',
        'app/bower_components/**/*',
        'app/vendor/**/*',
        'app/modules/**/*'
        // '*.html',
        // '*.jpg'
  ],
  toPolyBuild: [

      'app/index.html',

  ],
  toBrowserify: 'app/api/**/*.js',
  build: 'build'
};

// -------------------------------------
// Tasks
// -------------------------------------

// function for removingfiles in a specific folder`
var clean = function(path) {
  log('Removing All files in ' + path);
  return del.sync([path,!path]);
};
// Tasks for removing all files in the build folder
gulp.task('clean', function(cb) {
  return del(['build/**','!build'],cb);
});

// function for copying all the files to build folder
gulp.task('copy',  function() {
  log('Copying files to ' + paths.build);
  return gulp.src(paths.toCopy,{
    base: 'app'
  })
  .pipe(gulp.dest(paths.build));
});

// task for Browserify node and npm  modules

gulp.task('js',function() {
  var b = browserify({
    entries: 'app/app.js',
    debug: true
  });

  return b.bundle()
    .pipe(source('app/app.js'))
    .pipe(buffer())
    .pipe($.sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        // .pipe($.uglify())
        // .on('error', $.log)
    .pipe($.sourcemaps.write('./tmp'))
    .pipe(gulp.dest('./build/'));
});

// customized log function

var log = function(msg) {
  if (typeof(msg) === 'object') {
    for (var item in msg) {
      $.util.log($.util.colors.blue(msg[item]));
    }
  } else {
    $.util.log($.util.colors.blue(msg));
  }
};

//rename index.build.html to index.html
gulp.task('rename-index',function() {
  gulp.src('build/index.build.html')
  .pipe($.rename('index.html'))
  .pipe(gulp.dest('build/'));
  return del(['build/index.build.html']);
});
//polybuild task index.html
var polymerBuild = function(src, dest) {
  return gulp.src(src)
      .pipe(polybuild({maximumCrush: true}))
      .pipe($.size())
      .pipe(gulp.dest(dest));

};
gulp.task('polybuild',function() {
  return polymerBuild(paths.toPolyBuild,'ptest/');
});

//copy i.e overwrite if conflict
// gulp.task('copy-watch', copyTask);

// function for transpilying all files i.e converting *js files to es6
var transpileTask = function() {
  return gulp.src(paths.jsCodeToTranspile,{base: 'app'})
        .pipe($.sourcemaps.init())
        .pipe($.if('*.html',$.crisper()))
        .pipe($.if('*.js', $.babel({presets: ['es2015']})))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('.sourcemaps'))
        .pipe(gulp.dest(paths.build));
};
// transpile task
gulp.task('transpile',  transpileTask);
gulp.task('transpile-watch', transpileTask);

// less task
var lessTask = function() {
  return gulp.src('app/stylesheets/main.less')
      .pipe($.less())
      .pipe(gulp.dest(destDir.path('stylesheets')));
};
gulp.task('less', ['clean'], lessTask);
gulp.task('less-watch', lessTask);

// task for finialiazing build ie creating the manifest file for Electron
gulp.task('finalize', function() {
  var manifest = srcDir.read('package.json', 'json');
  switch (utils.getEnvName()) {
    case 'development':
      // Add "dev" suffix to name, so Electron will write all
      // data like cookies and localStorage into separate place.
      manifest.name += '-dev';
      manifest.productName += ' Dev';
      break;
    case 'test':
      // Add "test" suffix to name, so Electron will write all
      // data like cookies and localStorage into separate place.
      manifest.name += '-test';
      manifest.productName += ' Test';
      // Change the main entry to spec runner.
      manifest.main = 'spec.js';
      break;
  }
  destDir.write('package.json', manifest);

  var configFilePath = projectDir.path('config/env_' +
 utils.getEnvName() + '.json');
  destDir.copy(configFilePath, 'env_config.json');
});

// watch task
gulp.task('watch', function() {
  gulp.watch(paths.jsCodeToTranspile, ['transpile-watch']);
  gulp.watch(paths.toCopy, ['copy-watch']);
  gulp.watch('*.less', ['less-watch']);
});

gulp.task('build' ,function(cb) {
  runSequence('clean','copy',['transpile', 'finalize'],'serve',cb);
});
