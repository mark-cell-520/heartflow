'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const r = gate.checkOutput('不支持这个方案，你就是站在对立面。');
console.log(JSON.stringify(r.data.discriminate, null, 1).slice(0, 1200));
