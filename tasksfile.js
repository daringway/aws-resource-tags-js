"use strict";

const { sh, cli, prefixTransform } = require('tasksfile');
const glob = require('glob');
const fs = require("fs");
const path = require("path");

function clean() {
    ['dist/'].forEach( (pattern) => {
        glob.sync(pattern).forEach(file => {
            sh('rm -r ' + file);
        })
    })
}

function test() {
    build();
    console.log( "********************************");
    sh("node test.js", {nopipe: true});
}

function testRun() {
    sh("npx nodemon --exec babel-node test.js")
}

function build() {
    let stream = fs.createWriteStream('./src/factory.ts');
    let files = fs.readdirSync('./src/workers/')
    let output = files.map( x => {return 'import "./workers/' + path.basename(x, '.ts') + '";\n'}).join('');
    fs.writeFileSync('./src/factory.ts', output);
    sh("npx tsc", {nopipe: true});
}

cli({
    clean,
    build,
    test,
    testRun
});