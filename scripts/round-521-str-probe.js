/**
 * scripts/round-521-str-probe.js — 字符串直测（构造最小诊断串，不含真实样本）
 * 用法：node scripts/round-521-str-probe.js
 */
'use strict';

const P1 = '(?:一切|所有|全部)(?:以|按|照)(?:委员会|董事会|办公会|党组会|领导|上级|主管|总部|决议|裁定|决定)(?:为准|为算|说来|执行)';
const P2 = '(?:一切|所有|全部)(?:以|按|照)(?:委员会|董事会|办公会|党组会|领导|上级|主管|总部|决议|裁定|决定)(?:为准|为算|说来)';
const P3 = '一切以委员会决议为准';
const P4 = '(?:以|按|照)(?:委员会决议|决议)(?:为准)';

const cases = [
  ['字面匹配', P3],
  ['缩写支', P4],
  ['完整支', P1],
  ['无执行支', P2],
];

for (const [label, pat] of cases) {
  const re = new RegExp(pat);
  console.log(label.padEnd(10) + ' 测试串「一切以委员会决议为准」 → ' + (re.test('一切以委员会决议为准') ? 'HIT' : 'miss'));
}

// 检查源文件里这个支是否真的加进去了
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../src/procedural-burden.js', 'utf8');
console.log('\n源码含 r521 补支注释: ' + /一切以委员会\/领导\/决议为准/.test(src));
const idx = src.indexOf('FINALIZE_ZH');
console.log('FINALIZE_ZH 定义起始位置: ' + idx);
const seg = src.slice(idx, idx + 700);
const lines = seg.split('\n').filter(l => l.includes('委员会') || l.includes('一切'));
console.log('FINALIZE_ZH 内含委员会的行: ' + (lines.length ? JSON.stringify(lines) : '无'));
