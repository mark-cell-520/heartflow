'use strict';
// 验证 eval 拿到的正则与源码字面量是否一致（escape 二次解析问题）
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');
const tm = src.match(/const AUTHORITY_FIRST_PERSON = \{[\s\S]*?\n\};/);
const body = tm[0].replace(/^const \w+ = /, '').replace(/;\s*$/, '');
console.log('body_len=' + body.length);
// 检查 body 里 \s 是否还是单反斜杠（源码）——eval 会把 '\\s' 变 '\s'，正常
const snippet = body.slice(body.indexOf('identity'), body.indexOf('identity') + 200);
console.log('head=' + JSON.stringify(snippet.slice(0, 120)));
const table = eval('(' + body + ')');
const t = 'Trust me, I am the expert here.';
let hit = 0;
table.en.identity.forEach((re, i) => { if (re.test(t)) { hit++; console.log('id[' + i + '] ' + re.source); } });
console.log('identity_hits=' + hit);
