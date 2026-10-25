#!/usr/bin/env node
"use strict";

// Runs inside the Firestore emulator (npm run test:rules): this repo's tests,
// then mindset's emulator tests from a sibling checkout (MINDSET_DIR, default ../mindset).
var childProcess = require("child_process");
var fs = require("fs");
var path = require("path");

var root = path.join(__dirname, "..");
var mindset = path.resolve(root, process.env.MINDSET_DIR || "../mindset");

function run(file) {
  console.log("> " + path.relative(process.cwd(), file));
  childProcess.execFileSync(process.execPath, [file], { stdio: "inherit", env: process.env });
}

fs.readdirSync(path.join(root, "tests"))
  .filter(function (file) {
    return file.endsWith(".emulator.js");
  })
  .sort()
  .forEach(function (file) {
    run(path.join(root, "tests", file));
  });

var mindsetTests = ["rules.emulator.js", "sim.emulator.js"].map(function (file) {
  return path.join(mindset, "tests", file);
});
if (mindsetTests.every(fs.existsSync)) {
  process.env.RULES_FILE = path.join(root, "firestore.rules");
  run(path.join(mindset, "tests", "rules.test.js"));
  mindsetTests.forEach(run);
} else if (process.env.CI) {
  console.error("mindset checkout not found at " + mindset);
  process.exit(1);
} else {
  console.log("skip mindset tests: no checkout at " + mindset);
}
