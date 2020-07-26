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
        'node_modules/owl.carousel/src/scss/owl.carousel.scss',
        'node_modules/owl.carousel/src/scss/owl.theme.default.scss',
        'app/scss/**/*.scss'
      ],
      dist: 'dist/css'
    },
    js: {
      src: 'app/js/**/*.js',
      dist: 'dist/js',
      jsFiles: [
        'script.js'
      ],
      jsFolder: './app/js/'
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
        .pipe(src(path.js.jsFolder + '/vendor/**/*.js'))
        .pipe( rename({ extname: '.min.js' }) )
        .pipe( buffer() )
        .pipe( sourcemaps.init({ loadMaps: true }) )
        .pipe( uglify() )
        //.pipe(dest(path.js.dist + '/vendor/'))
        .pipe( sourcemaps.write( path.mapURL ) )
        .pipe( dest( path.js.dist ) )
    });
    done();
}


/**
 * Watch task
 */
function watchTask() {
  watch( path.css.src, {usePolling : true}, series( styleTask ) );
  watch( path.js.src, {usePolling : true}, series( jsTask ) );
}

exports.styleTask = styleTask;
exports.jsTask = jsTask;
exports.watch = watch;

exports.default = series(
  parallel(styleTask, jsTask),
  watchTask
);