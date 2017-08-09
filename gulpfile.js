/**
 * Created by xgharibyan on 7/3/17.
 */

const gulp = require('gulp');
const gulpLoadPlugins  = require('gulp-load-plugins');
const path = require('path');
const del = require('del');
const runSequence = require('run-sequence');
const isparta = require('isparta');
const apidoc = require('gulp-apidoc');
const babelCompiler = require('babel-core/register');
const exec = require('child_process').exec;

const plugins = gulpLoadPlugins();
const testPath = './server/tests/';
const paths = {
    js: ['./**/*.js', '!services/**', '!models/**' , '!common/**', '!dist/**', '!tests/**', '!projects/**', '!publish/**', '!public/**', '!node_modules/**', '!coverage/**', '!history/**', '!resources/**'],
    nonJs: ['./package.json', './.gitignore'],
    tests: './tests/*.js',
    singleTestFile: ['' + testPath + '1.user.test.js', `${testPath}2.projects.test.js`, `${testPath}7.modules.test.js`, '' + testPath + '99.removeUser.test.js'],
};
const microServices = {auth: null, user: null};


const options = {
    codeCoverage: {
        reporters: ['lcov', 'text-summary'],
        thresholds: {
            global: { statements: 80, branches: 80, functions: 80, lines: 80 },
        },
    },
};

// Clean up dist and coverage directory
gulp.task('clean', () =>
    del(['dist/**', 'coverage/**', '!dist', '!coverage'])
);

// Set env variables for testing process
gulp.task('set-env', () => {
    plugins.env({
        vars: {
            NODE_ENV: 'test',
        },
    });
});
// Lint Javascript
// gulp.task('lint', () =>
//   gulp.src(paths.js)
//     // eslint() attaches the lint output to the "eslint" property
//     // of the file object so it can be used by other modules.
//     .pipe(plugins.eslint())
//     // eslint.format() outputs the lint results to the console.
//     // Alternatively use eslint.formatEach() (see Docs).
//     .pipe(plugins.eslint.format())
//     // To have the process exit with an error code (1) on
//     // lint error, return the stream and pipe to failAfterError last.
//     .pipe(plugins.eslint.failAfterError())
// );

gulp.task('apidoc', (done) => {
    apidoc({
        src: './server',
        dest: './doc',
    }, done);
});

// Copy non-js files to dist
gulp.task('copy', () =>
    gulp.src(paths.nonJs)
        .pipe(plugins.newer('dist'))
        .pipe(gulp.dest('dist'))
);


gulp.task('start:microservices',  (cb) => {
    // The magic happens here ...
    microServices.auth = exec('node ./services/auth/index.js');
    microServices.user = exec('node ./services/user/index.js');
    microServices.project = exec('node ./services/projects/index.js');
    microServices.build = exec('node ./services/build/index.js');
    microServices.hook = exec('node ./services/hooks/index.js');
    microServices.payments = exec('node ./services/payments/index.js');
    microServices.editor = exec('node ./services/editor/index.js');
    microServices.pages = exec('node ./services/pages/index.js');
    cb();
});

// covers files for code coverage
gulp.task('pre-test', () =>
    gulp.src([...paths.js, '!gulpfile.js'])
    // Covering files
        .pipe(plugins.istanbul({
            instrumenter: isparta.Instrumenter,
            includeUntested: true,
        }))
        // Force `require` to return covered files
        .pipe(plugins.istanbul.hookRequire())
);

// triggers mocha test with code coverage
gulp.task('test', ['pre-test', 'set-env', 'start:microservices'], () => {
    let reporters;
    let	exitCode = 0;

    if (plugins.util.env['code-coverage-reporter']) {
        reporters = [...options.codeCoverage.reporters, plugins.util.env['code-coverage-reporter']];
    } else {
        reporters = options.codeCoverage.reporters;
    }

    return gulp.src([paths.tests], { read: false })
        .pipe(plugins.plumber())
        .pipe(plugins.mocha({
            reporter: plugins.util.env['mocha-reporter'] || 'spec',
            ui: 'bdd',
            timeout: 6000,
            compilers: {
                js: babelCompiler,
            },
        }))
        .once('error', (err) => {
            plugins.util.log(err);
            exitCode = 1;
        })
        // Creating the reports after execution of test cases
        .pipe(plugins.istanbul.writeReports({
            dir: './coverage',
            reporters,
        }))
        // Enforce test coverage
        // .pipe(plugins.istanbul.enforceThresholds({
        //   thresholds: options.codeCoverage.thresholds
        // }))
        .once('end', () => {
            plugins.util.log('completed !!');
            microServices.auth.kill();
            microServices.user.kill();
            console.log('exitCode', exitCode);
            process.exit(exitCode);
        });
});


// run single test
gulp.task('singletest', ['set-env'], () => {
    let reporters;
    let	exitCode = 0;

    return gulp.src([...paths.singleTestFile], { read: false })
        .pipe(plugins.mocha({
            reporter: plugins.util.env['mocha-reporter'] || 'spec',
            ui: 'bdd',
            timeout: 6000,
            compilers: {
                js: babelCompiler,
            },
        }))
        .once('error', (err) => {
            plugins.util.log(err);
            exitCode = 1;
        })
        .once('end', () => {
            plugins.util.log('completed !!');
            process.exit(exitCode);
        });
});

// clean dist, compile js files, copy non-js files and execute tests
gulp.task('mocha', ['clean'], () => {
    runSequence(
        ['copy'],
        'test'
    );
});

// gulp serve for development
gulp.task('serve', ['clean'], () => runSequence('nodemon'));

gulp.task('default', ['clean'], () => {
    runSequence(
        ['copy', 'babel']
    );
});
