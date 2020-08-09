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
const cleanCSS = require('gulp-clean-css');

// JS related plugins
const uglify = require( 'gulp-uglify' );
const browserify = require( 'browserify' );
const babelify = require( 'babelify' );
const source = require( 'vinyl-source-stream' );
const buffer = require( 'vinyl-buffer' );

// Utility related plugins
const rename = require( 'gulp-rename' );
const sourcemaps = require( 'gulp-sourcemaps' );
const plumber = require( 'gulp-plumber' );
const del = require('del');
let replace = require('gulp-replace');

// Image related plugins
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');

// Browers related plugins
const browserSync = require( 'browser-sync' ).create();

sass.compiler = require( 'node-sass' );

// Project related variables
// File paths
const path = {
    css: {
      src: [
        'node_modules/bootstrap/scss/bootstrap.scss',
        './app/scss/**/*.scss'
      ],
      dist: './dist/css',
      cssFolder: './app/css/'
    },
    js: {
      src: './app/js/**/*.js',
      dist: './dist/js',
      jsFiles: [
        'script.js'
      ],
      jsFolder: './app/js/'
    },
    mapURL: './',
    fonts: {
      src: './app/fonts/**/*',
      dist: './dist/fonts'
    },
    images: {
      src: './app/images/**/*.+(png|jpg|jpeg|gif|svg)',
      dist: './dist/images'
    },
    html: './**/*.html'
}

/**
 * Browser-sync
 */
function browserSyncTask() {
  browserSync.init({
    server: {
      baseDir: "./"
    }
  });
}

function reload(done) {
	browserSync.reload();
	done();
}

/**
 * Compile scss files to css
 */
function styleTask(done) {
  src( path.css.src )
    .pipe( sourcemaps.init() )
    .pipe( sass({
      errLogToConsole: true,
      outputStyle: 'compressed'
    })
    .on( 'error', sass.logError ) )
    .pipe( postcss( [
      autoprefixer(),
      cssnano()
    ]) )
    .pipe( rename( {suffix: '.min'} ) )
    .pipe(sourcemaps.write( path.mapURL ))
    .pipe( dest( path.css.dist ) )
    .pipe( browserSync.stream() );
  done();
}

/**
 * Plumber
 */
function triggerPlumber( src_file, dest_file ) {
	return src( src_file )
		.pipe( plumber() )
		.pipe( dest( dest_file ) );
}

/**
 * Move css vendor plugins to dist/vendor
 */
function cssVendorTask() {
  const cssSRC = path.css.cssFolder + 'vendor/**/*.css';
  const vendorDIST = path.css.dist + '/vendor';

  return src( cssSRC )
          .pipe( rename({ extname: '.min.css' }) )
          .pipe(cleanCSS({debug: true}, (details) => {
            console.log(`${details.name}: ${details.stats.originalSize}`);
            console.log(`${details.name}: ${details.stats.minifiedSize}`);
          }))
          .pipe( dest( vendorDIST ) ); 
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
        .pipe( browserSync.stream() );
    });
    done();
}

/**
 * Move jss vendor plugins to dist/vendor
 */
function jsVendorTask() {
  const jsSRC = path.js.jsFolder + 'vendor/**/*.js';
  const vendorDIST = path.js.dist + '/vendor';

  return src( jsSRC )
          .pipe( rename({ extname: '.min.js' }) )
          .pipe( uglify() )
          .pipe( dest( vendorDIST ) );
}

/**
 * Move fonts files to dist folder
 */
function fontsTask() {
	return triggerPlumber( path.fonts.src, path.fonts.dist );
};

/**
 * Move fonts files to dist folder
 */
function imageminTask(done) {
	src( path.images.src )
    .pipe(cache( imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.mozjpeg({quality: 50, progressive: true}),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo({
        plugins: [
          {removeViewBox: true},
          {cleanupIDs: false}
        ]
      })
    ]) ))
    .pipe(dest( path.images.dist ))

  done();
};

// Cachebust
/*function cacheBustTask() {
  var cbString = new Date().getTime();
  return src(['index.html'])
      .pipe(replace(/cb=\d+/g, 'cb=' + cbString))
      .pipe(dest('.'));
}*/

/**
 * Clean dist folder
 */
async function cleanTask() {
	const deletedPaths = await del(['./dist']);
 
  console.log('Deleted files and directories:\n', deletedPaths.join('\n'));
};

/**
 * Clear cache
 */
async function clearCache() {
    cache.clearAll();
}


/**
 * Watch task
 */
function watchTask() {
  watch( path.css.src, {usePolling : true}, series( styleTask, reload ) );
  watch( path.js.src, {usePolling : true}, series( jsTask, reload ) );
  watch(
    [path.fonts.src, path.images.src, path.html],
    {usePolling : true},
    series( fontsTask, imageminTask, reload )
  );
}

/**
 * Clean task
 * to clean/remove the dist folder
 * Run "gulp cleanTask" on your terminal
 */
exports.cleanTask = cleanTask;

/**
 * Clear cache task
 * to clear the cache for example: the images cached
 * Run "gulp clearCache" on your terminal
 */
exports.clearCache = clearCache;

/**
 * Watch task
 * Run "gulp watch" on your terminal
 */
exports.watch = watch;

/**
 * Default task
 * Run "gulp" on your terminal
 */
exports.default = series(
  parallel(cleanTask, clearCache),
  fontsTask,
  imageminTask,
  parallel(styleTask, cssVendorTask),
  parallel(jsTask, jsVendorTask),
  parallel(browserSyncTask, watchTask)
);