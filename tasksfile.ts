'use strict';

/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';

import { cli } from 'tasksfile';
import { shell } from '@pawelgalazka/shell';

function clean() {
    ['dist/'].forEach( (pattern) => {
        glob.sync(pattern).forEach(file => {
            shell('rm -r ' + file);
        })
    })
}

function lint() {
    shell('npx eslint ./src/**/*', {nopipe: true});
}

function test() {
    build();
    console.log( '********************************');
    shell('node test.js', {nopipe: true});
}

function testRun() {
    shell('npx nodemon --exec babel-node test.js')
}

function build() {
    let files = fs.readdirSync('./src/workers/');

    let output = '//This File is auto generated during the build process\n' +
        files.filter( x => { return x !== 'index.ts' })
        .map( x => {return 'import "./' + path.basename(x, '.ts') + '";\n'}).join('');
    fs.writeFileSync('./src/workers/index.ts', output);

    shell('npx tsc', {nopipe: true});
}

function publish() {
    clean();
    build();
    shell('npm publish', {nopipe: true});
}

cli({
    lint,
    clean,
    build,
    test,
    testRun,
    publish
});