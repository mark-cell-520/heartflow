// r531: 用真实 __internals() RegExp 对象逐支诊断 miss 样本（不用字符串提取，避免误判）
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const mod = require('../src/harm-invalidation.js');
const { checkHarmInvalidation } = mod;
const I = mod.__internals();

const attacks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-530-harm-invalidation-samples.json'), 'utf8'));
const benign = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-530-harm-invalidation-benign.json'), 'utf8'));

function probe(text, re) {
  const src = re.source;
  const branches = src.split('|');
  return branches.map((b, i) => [i, b]).filter(([, b]) => {
    try { return new RegExp(b, re.flags).test(text); } catch (e) { return false; }
  }).map(([i]) => i);
}

const missIdx = attacks.map((s, i) => [s, i]).filter(([s]) => !checkHarmInvalidation(s).hit).map(([, i]) => i);
console.log('模块层 miss 索引:', JSON.stringify(missIdx));

for (const i of missIdx) {
  const s = attacks[i];
  const isZh = /[\u4e00-\u9fff]/.test(s);
  const zD = probe(s, I.HARM_DENY_ZH);
  const eD = probe(s, I.HARM_DENY_EN);
  const zM = probe(s, I.MINIMIZE_ZH);
  const eM = probe(s, I.MINIMIZE_EN);
  const exZ = probe(s, I.EXEMPT_ZH);
  const exE = probe(s, I.EXEMPT_EN);
  console.log(`\n--- atk#${i} (${isZh ? 'zh' : 'en'}) ---`);
  console.log(`  HARM_DENY_ZH=${JSON.stringify(zD)} HARM_DENY_EN=${JSON.stringify(eD)}`);
  console.log(`  MINIMIZE_ZH=${JSON.stringify(zM)} MINIMIZE_EN=${JSON.stringify(eM)}`);
  console.log(`  EXEMPT_ZH=${JSON.stringify(exZ)} EXEMPT_EN=${JSON.stringify(exE)}`);
  const deny = (isZh ? zD : eD).length > 0;
  const min = (isZh ? zM : eM).length > 0;
  console.log(`  判定: deny侧${deny ? '✓' : '✗缺失'} / minimize侧${min ? '✓' : '✗缺失'}`);
}

// 良性样本：确认变异目标合法（探针须含豁免+攻击两侧特征）
console.log('\n== 良性样本命中情况（应全空，含 EXEMPT 兜住数）==');
let benignAny = [];
benign.forEach((s, i) => {
  const zD = probe(s, I.HARM_DENY_ZH), eD = probe(s, I.HARM_DENY_EN);
  const zM = probe(s, I.MINIMIZE_ZH), eM = probe(s, I.MINIMIZE_EN);
  const exZ = probe(s, I.EXEMPT_ZH), exE = probe(s, I.EXEMPT_EN);
  if (zD.length || eD.length || zM.length || eM.length || exZ.length || exE.length) {
    benignAny.push(`ben#${i} denyZH=${JSON.stringify(zD)} denyEN=${JSON.stringify(eD)} minZH=${JSON.stringify(zM)} minEN=${JSON.stringify(eM)} exZH=${JSON.stringify(exZ)} exEN=${JSON.stringify(exE)}`);
  }
});
benignAny.forEach(l => console.log('  ' + l));
console.log(`良性有任意支命中的条数: ${benignAny.length}/${benign.length}`);
