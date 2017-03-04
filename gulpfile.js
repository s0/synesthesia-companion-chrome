var gulp = require('gulp');
var clean = require('gulp-clean');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var runSequence = require('run-sequence');

var tsProject = ts.createProject('src/ts/tsconfig.json');

gulp.task('clean', function() {
  return gulp.src(['dist'], {read: false})
        .pipe(clean());
});

gulp.task('ts', function () {
    return tsProject.src()
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('dist/'));
});

gulp.task("dist", ['ts'], function(){

});

gulp.task('default', function(callback) {
  runSequence(
    'clean',
    'dist',
    callback);
});
