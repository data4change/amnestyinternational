'use strict';

const gulp          = require('gulp'),
    del             = require('del'),
    changed         = require('gulp-changed'),
    changedInPlace  = require('gulp-changed-in-place'),
    stylelint       = require('gulp-stylelint'),
    jshint          = require('gulp-jshint'),
    processhtml     = require('gulp-processhtml'),
    htmlmin         = require('gulp-htmlmin'),
    autoprefixer    = require('gulp-autoprefixer'),
    concat          = require('gulp-concat'),
    sass            = require('gulp-sass'),
    cleanCSS        = require('gulp-clean-css'),
    babel           = require('gulp-babel'),
    uglify          = require('gulp-uglify'),
    modernizr       = require('gulp-modernizr'),
    FILES           = Object.freeze({
                        allScss: [
                            'scss/**/*.scss',
                            '!scss/**/_*.scss'
                        ],
                        allJs: 'js/**/*.js',
                        allHtml: '*.html'
                    });

gulp.task('default',    ['lint', 'build']);
gulp.task('lint',       ['lint:styles', 'lint:scripts']);
gulp.task('build',      ['build:markup', 'build:styles', 'build:styles-lib', 'build:scripts', 'build:scripts-lib', 'build:modernizr', 'copy:data']);
gulp.task('watch',      ['watch:markup', 'watch:styles', 'watch:scripts']);

gulp.task('clean', () => del('dist'));

gulp.task('lint:styles', () => {
    return gulp.src(FILES.allScss)
        .pipe(changedInPlace())
        .pipe(stylelint({
            reporters: [{ formatter: 'string', console: true }]
        }));
});

gulp.task('lint:scripts', () => {
    return gulp.src(FILES.allJs)
        .pipe(changedInPlace())
        .pipe(jshint({
            esversion: 6
        }))
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('build:markup', () => {
    return gulp.src(FILES.allHtml)
        .pipe(changed('dist/'))
        .pipe(processhtml({}))
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true
        }))
        .pipe(gulp.dest('dist/'));
});

gulp.task('build:styles', () => {
    return gulp.src(FILES.allScss)
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: [
                'last 2 Chrome versions',
                'last 2 Firefox versions',
                'last 2 Edge versions',
                'last 2 Safari versions',
                'last 1 Explorer versions',
                'last 2 ChromeAndroid versions',
                'last 2 iOS versions'
            ],
            cascade: false
        }))
        .pipe(cleanCSS({ processImport: false }))
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('dist/css/'));
});

gulp.task('build:styles-lib', () => {
    return gulp.src([
            'lib/normalize-css/normalize.css'
        ])
        .pipe(concat('style-lib.min.css'))
        .pipe(gulp.dest('dist/css/'));
});

gulp.task('build:scripts', () => {
    return gulp.src(FILES.allJs)
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat('scripts.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('build:scripts-lib', () => {
    return gulp.src([
            'lib/d3/d3.min.js',
            'lib/topojson/topojson.min.js',
            'lib/d3-geo-projection/d3.geo.projection.min.js'
        ])
        .pipe(concat('scripts-lib.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('build:modernizr', () => {
    return gulp.src(FILES.allJs)
        .pipe(modernizr('modernizr.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('lib/modernizr/'));
});

gulp.task('copy:data', () => {
    return gulp.src([
            'data/geodata.json'
        ])
        .pipe(gulp.dest('dist/data/'));
});

gulp.task('watch:markup', () => {
    return gulp.watch(FILES.allHtml, ['build:markup']);
});

gulp.task('watch:styles', () => {
    return gulp.watch(FILES.allScss, ['lint:styles', 'build:styles']);
});

gulp.task('watch:scripts', () => {
    return gulp.watch(FILES.allJs, ['lint:scripts', 'build:scripts']);
});
