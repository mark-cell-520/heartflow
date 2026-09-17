/**
 * Preload that installs describe/it/expect as globals for jest-style test files.
 *
 * About 22 files under test/ were written for jest (expect(x).toBe(...)) but the repo
 * ships no devDependencies, so they all died with "describe is not defined" and were
 * silently skipped by the old runner. Loading this file with `node -r` gives them the
 * globals they expect, and the summary is printed when the process exits — so the
 * files run unmodified.
 *
 * Usage: node -r test/_jest-globals.js test/some-jest-style.test.js
 */
'use strict';

const M = require('./helpers/mini-expect.js');

global.describe = M.describe;
global.it = M.it;
global.test = M.it;
global.expect = M.expect;
global.beforeEach = () => {};
global.afterEach = () => {};
global.beforeAll = () => {};
global.afterAll = () => {};

let _printed = false;
process.on('exit', () => {
  if (_printed) return;
  _printed = true;
  M.run();
});
