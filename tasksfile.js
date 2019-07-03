"use strict";

const { sh, cli, prefixTransform } = require("tasksfile");
const glob = require("glob");
const fs = require("fs");
const path = require("path");

function clean() {
    ["dist/"].forEach( (pattern) => {
        glob.sync(pattern).forEach(file => {
            sh("rm -r " + file);
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
    let files = fs.readdirSync("./src/workers/");

    let output = "//This File is auto generated during the build process\n" +
        files.filter( x => { return x !== "index.ts" })
        .map( x => {return "import \"./" + path.basename(x, ".ts") + "\";\n"}).join("");
    fs.writeFileSync("./src/workers/index.ts", output);

    sh("npx tsc", {nopipe: true});
}

function publish() {
    clean();
    build();
    sh("npm publish", {nopipe: true});
}

cli({
    clean,
    build,
    test,
    testRun,
    publish
});