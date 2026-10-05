'use strict';
// 验证 variantWithout 的替换是否真的生效
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/appeal-tradition.js', 'utf8');

function variant(constName) {
  const re = new RegExp(`const ${constName} = /[\\s\\S]*?/;\\n`, 'm');
  return src.replace(re, `const ${constName} = /(?!x)x/;\n`);
}
const out = variant('CROWD_ZH');
out.split('\n').forEach((l, i) => { if (/CROWD_ZH = /.test(l)) console.log('OUT', i + 1, l.slice(0, 60)); });
src.split('\n').forEach((l, i) => { if (/CROWD_ZH = /.test(l)) console.log('SRC', i + 1, l.slice(0, 60)); });
const sandbox = { module: { exports: {} }, exports: {} };
try { vm.runInNewContext(out, sandbox); console.log('run ok', typeof sandbox.module.exports.checkAppealToTradition); } catch (e) { console.log('run err', e.message); }
