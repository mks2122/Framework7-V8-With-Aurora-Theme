const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

gulp.task('scripts', function() {
    return gulp.src('src/js/**/*.js')
        .pipe(concat('app.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.stream());
});

gulp.task('styles', function() {
    return gulp.src('src/css/**/*.css')
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream());
});

gulp.task('html', function() {
    return gulp.src('src/index.html')
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream());
});

gulp.task('serve', function() {
    browserSync.init({
        server: './dist'
    });

    gulp.watch('src/js/**/*.js', gulp.series('scripts'));
    gulp.watch('src/css/**/*.css', gulp.series('styles'));
    gulp.watch('src/index.html', gulp.series('html'));
});

gulp.task('build', gulp.series('scripts', 'styles', 'html'));

gulp.task('default', gulp.series('build', 'serve'));
