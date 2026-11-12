/* scripts/round-301/verify-needles-r301.js — 校验测试文件里 needle 字符串与实际正则 source 对齐（只读） */
const path = require('path');
const fs = require('fs');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'test', 'round-301-law-of-averages.test.js'), 'utf8');
const m = src.match(/srcHas\(G\.LLN_EN, '([^']*)'\)/);
console.log('needle literal in file:', JSON.stringify(m && m[1]));
console.log('actual string value  :', JSON.stringify(m && m[1].replace(/\\\\/g, '\\')));
const gf = require(path.join(__dirname, '..', '..', 'src', 'gamblers-fallacy.js'));
const G = gf.__internals();
console.log('LLN_EN source contains needle:', m ? G.LLN_EN.source.includes(eval("'" + m[1] + "'")) : '?');
