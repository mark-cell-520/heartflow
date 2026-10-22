/**
 * scripts/round-209/probe-r209-diff.js
 * 词面差集定位：第①条 / 第278行(设施在前) 的设施词表 与 SECURITY_BOUNDARY
 * (src/dev-exemptions.js 一票否决表) 逐词比对，找出「豁免侧否决、命中侧零命中」的差集。
 * 只从源码正则截词，不信简报描述。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

function readSrc(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n');
}

// 从 di 第①条正则行截设施词表（动词表之后的那段 (?:...) ）
function sliceFacility(line) {
  const m = line.match(/\)\[\^。\\n\]\{0,12\}\((.+)\)\/i,?\s*$/);
  return m ? m[1] : null;
}
function words(alt) {
  if (!alt) return [];
  // 顶层交替：按 | 切分（不含 (? 组内的 |）
  const out = [];
  let depth = 0, cur = '';
  for (const ch of alt) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === '|' && depth === 0) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  if (cur) out.push(cur);
  return out.map(s => s.trim()).filter(Boolean);
}

const di = readSrc('src/dangerous-instruction.js');
const L102 = di[101];  // 第①条
const L278 = di[277];  // 设施在前形
console.log('L102 tail:', L102.slice(-40));
console.log('L278 tail:', L278.slice(-40));
const f102 = sliceFacility(L102);
const f278 = sliceFacility(L278);
console.log('截取成功?', !!f102, !!f278);

const dev = readSrc('src/dev-exemptions.js');
// SECURITY_BOUNDARY 行
const sbIdx = dev.findIndex(l => /const SECURITY_BOUNDARY/.test(l));
console.log('SECURITY_BOUNDARY at dev line', sbIdx + 1);
console.log(dev.slice(sbIdx, sbIdx + 30).map((l, i) => `${sbIdx + i + 1}| ${l}`).join('\n'));
