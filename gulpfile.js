var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css');
    rename = require("gulp-rename");

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
    books(config.chrome);
});

function index(cfg) {
    var assets = useref.assets();
    return gulp.src(cfg.src)
        .pipe(rename('index.html'))
        .pipe(assets)
        //.pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest(cfg.dest));
}

function viewer(cfg) {
    var assets = useref.assets();
    return gulp.src('src/viewer.html')
        .pipe(assets)
        //.pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest(cfg.dest));
}

function images(cfg) {
    return gulp.src(['src/img/*'])
        .pipe(gulp.dest(cfg.dest + 'img/'));
}

function fonts(cfg) {
    return gulp.src(['src/bower_components/onsenui/build/css/font_awesome/fonts/*'])
        .pipe(gulp.dest(cfg.dest + '/fonts/'));
}

function books(cfg) {
    return gulp.src(['src/books/**'])
        .pipe(gulp.dest(cfg.dest + '/books/'));
}
