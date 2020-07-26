'use strict';

/**
 * Importing specific gulp API functions
 * lets us write them below as series() instead of gulp.series()
 */
const { src, dest, watch, series, parallel } = require('gulp');

// Importing all the Gulp-related packages
// CSS related plugins
const sass = require( 'gulp-sass' );
const autoprefixer = require( 'autoprefixer' );
const postcss = require( 'gulp-postcss' );
const cssnano = require( 'cssnano' );

// JS related plugins
const uglify = require( 'gulp-uglify' );
const browserify = require( 'browserify' );
const babelify = require( 'babelify' );
const source = require( 'vinyl-source-stream' );
const buffer = require( 'vinyl-buffer' );

// Utility related plugins
const rename = require( 'gulp-rename' );
const sourcemaps = require( 'gulp-sourcemaps' );

sass.compiler = require( 'node-sass' );

// Project related variables
// File paths
const path = {
    css: {
      src: [
        'node_modules/@fortawesome/fontawesome-free/scss/fontawesome.scss',
        'node_modules/bootstrap/scss/bootstrap.scss',
        'app/scss/**/*.scss'
      ],
      dist: 'dist/css',
      cssFolder: 'app/css/'
    },
    js: {
      src: 'app/js/**/*.js',
      dist: 'dist/js',
      jsFiles: [
        'script.js'
      ],
      jsFolder: 'app/js/'
    },
    mapURL: './'
}

/**
 * Compile scss files to css
 */
function styleTask(done) {
  src( path.css.src )
    .pipe( sourcemaps.init() )
    .pipe( sass( {outputStyle: 'compressed'} ).on( 'error', sass.logError ) )
    .pipe( postcss( [
      autoprefixer(),
      cssnano()
    ]) )
    .pipe( rename( {suffix: '.min'} ) )
    .pipe(sourcemaps.write( path.mapURL ))
    .pipe( dest( path.css.dist ) );
  done();
}

/**
 * Move css vendor plugins to dist/vendor
 */
function cssVendorTask(done) {
  src(path.css.cssFolder + 'vendor/**/*.css')
    .pipe( dest( path.css.dist + '/vendor' ) );
  done();  
}

/**
 * JS task
 */
function jsTask(done) {
    path.js.jsFiles.map(function( entry ) {
        return browserify({
          entries: [path.js.jsFolder + entry]
        })
        .transform( babelify, {presets: ["@babel/preset-env"]} )
        .bundle()
        .pipe( source( entry ) )
        .pipe( rename({ extname: '.min.js' }) )
        .pipe( buffer() )
        .pipe( sourcemaps.init({ loadMaps: true }) )
        .pipe( uglify() )
        .pipe( sourcemaps.write( path.mapURL ) )
        .pipe( dest( path.js.dist ) )
    });
    done();
}

/**
 * Move jss vendor plugins to dist/vendor
 */
function jsVendorTask(done) {
    src(path.js.jsFolder + 'vendor/**/*.js')
      .pipe( rename({ extname: '.min.js' }) )
      .pipe( uglify() )
      .pipe( dest( path.js.dist + '/vendor' ) );
    done();  
}


/**
 * Watch task
 */
function watchTask() {
  watch( path.css.src, {usePolling : true}, series( styleTask ) );
  watch( path.js.src, {usePolling : true}, series( jsTask ) );
}

// exports.styleTask = styleTask;
// exports.jsTask = jsTask;
// exports.jsVendorTask = jsVendorTask;
// exports.cssVendorTask = cssVendorTask;
exports.watch = watch;

exports.default = series(
  parallel(styleTask, cssVendorTask),
  parallel(jsTask, jsVendorTask),
  watchTask
);