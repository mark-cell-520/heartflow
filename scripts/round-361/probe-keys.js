#!/usr/bin/env node
'use strict';
/* r361 归因诊断 2：check() 返回结构全键 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const hf = require(path.join(ROOT, 'src', 'gate.js'));
const r = hf.check('重新分组之后，两组全不提高，改革毫无效果');
console.log('keys=' + JSON.stringify(Object.keys(r)));
console.log(JSON.stringify(r, null, 1).slice(0, 3000));
