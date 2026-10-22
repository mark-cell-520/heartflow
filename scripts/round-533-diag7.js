'use strict';
const fs = require('fs');
const src = fs.readFileSync('src/performative-responsibility.js', 'utf8');
const i = src.indexOf('const OWN_EN');
console.log(JSON.stringify(src.slice(i, i + 340)));
