var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css');

// Build
gulp.task('build', ['html', 'images', 'books', 'fonts']);
 
// Default task
gulp.task('default', function () {
    gulp.start('build');
});

gulp.task('html', function () {
    var assets = useref.assets();

    return gulp.src('src/*.html')
        .pipe(assets)
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('www/'));
});

gulp.task('images', function() {
    return gulp.src(['src/img/*'])
        .pipe(gulp.dest('www/img/'));
});

gulp.task('fonts', function() {
    return gulp.src(['src/bower_components/onsenui/build/css/font_awesome/fonts/*'])
        .pipe(gulp.dest('www/fonts/'));
});

gulp.task('books', function() {
    return gulp.src(['src/books/**'])
        .pipe(gulp.dest('www/books/'));
});

