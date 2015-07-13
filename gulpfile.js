var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css'),
    rename = require("gulp-rename"),
    replace = require('gulp-replace');

var config = {
    cordova : {
        src : 'src/cordova-index.html',
        dest : 'www/'
    },
    chrome : {
        src : 'src/chrome-index.html',
        dest : 'chrome-app/'
    }
};

// Default task
gulp.task('default', function () {
    gulp.start(['cordova', 'chrome']);
});

gulp.task('cordova', function () {
    index(config.cordova);
    viewer(config.cordova);
    images(config.cordova);
    fonts(config.cordova);
    books(config.cordova);
});

gulp.task('chrome', function () {
    index(config.chrome);
    viewer(config.chrome);
    images(config.chrome);
    fonts(config.chrome);
    //books(config.chrome);
    return gulp.src(['src/bower_components/zip.js/WebContent/z-worker.js', 'src/bower_components/zip.js/WebContent/inflate.js'])
        .pipe(gulpif('*.js', uglify({mangle: false})))
        .pipe(gulp.dest('chrome-app/js/'));
});

function index(cfg) {
    var assets = useref.assets();
    return gulp.src(cfg.src)
        .pipe(rename('index.html'))
        .pipe(assets)
        .pipe(gulpif('*.js', uglify({mangle: false})))
        .pipe(replace('bower_components/zip.js/WebContent/', 'js/'))
        .pipe(gulpif('*.css', minifyCss({processImport: false})))
        .pipe(replace('../bower_components/material-design-icons/iconfont/MaterialIcons-Regular.woff2', '../fonts/MaterialIcons-Regular.woff2'))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest(cfg.dest));
}

function viewer(cfg) {
    var assets = useref.assets();
    return gulp.src('src/viewer.html')
        .pipe(assets)
        .pipe(gulpif('*.js', uglify({mangle: false})))
        .pipe(gulpif('*.css', minifyCss({processImport: false})))
        .pipe(replace('../bower_components/material-design-icons/iconfont/MaterialIcons-Regular.woff2', '../fonts/MaterialIcons-Regular.woff2'))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest(cfg.dest));
}

function images(cfg) {
    return gulp.src(['src/img/*'])
        .pipe(gulp.dest(cfg.dest + 'img/'));
}

function fonts(cfg) {
    return gulp.src(['src/bower_components/material-design-icons/iconfont/MaterialIcons-Regular.woff2'])
        .pipe(gulp.dest(cfg.dest + '/fonts/'));
}

function books(cfg) {
    return gulp.src(['src/books/**'])
        .pipe(gulp.dest(cfg.dest + '/books/'));
}
