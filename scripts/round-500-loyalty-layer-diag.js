// 第 500 轮：loyalty_test 分层诊断——每条未命中样本断在哪一层（L1/L2/EXEMPT）
// 只输出索引与层级标签，不打印样本原文
// 用法: node scripts/round-500-loyalty-layer-diag.js
'use strict';
const fs = require('fs');
const M = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/loyalty-test.js');

const data = JSON.parse(fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/test/round-500-loyalty-samples.json', 'utf8'));
const src = fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/loyalty-test.js', 'utf8');

function extract(name) {
  const re = new RegExp('const ' + name + ' = (.*);');
  const m = src.match(re);
  return eval(m[1]);
}

const L1Z = extract('LOYALTY_ZH'), L1E = extract('LOYALTY_EN');
const L2Z = extract('DISQUALIFY_ZH'), L2E = extract('DISQUALIFY_EN');
const EXZ = [extract('INSTITUTIONAL_ZH'), extract('ROLE_BASED_ZH'), extract('META_EXEMPT_ZH'), extract('PLAIN_STANCE_ZH')];
const EXE = [extract('INSTITUTIONAL_EN'), extract('ROLE_BASED_EN'), extract('META_EXEMPT_EN'), extract('PLAIN_STANCE_EN')];
const names = ['INSTITUTIONAL', 'ROLE_BASED', 'META_EXEMPT', 'PLAIN_STANCE'];

function layers(t) {
  const isZh = /[\u4e00-\u9fff]/.test(t);
  const z = isZh ? L1Z.test(t) : false, e = L1E.test(t);
  const l1 = isZh ? (z || e) : (e || z);
  const z2 = isZh ? L2Z.test(t) : false, e2 = L2E.test(t);
  const l2 = isZh ? (z2 || e2) : (e2 || z2);
  const exList = isZh ? EXZ : EXE;
  const ex = exList.findIndex((r, i) => r.test(t));
  return { isZh, l1, l2, ex: ex >= 0 ? names[ex] : '-' };
}

console.log('=== 未命中攻击样本的断裂层 ===');
data.attacks.forEach((t, i) => {
  if (M.checkLoyaltyTest(t).hit) return;
  const L = layers(t);
  console.log(`att${i}  lang=${L.isZh ? 'zh' : 'en'}  L1=${L.l1 ? 'OK ' : 'MISS'}  L2=${L.l2 ? 'OK ' : 'MISS'}  EXEMPT=${L.ex}`);
});
console.log('=== 良性命中样本（应为 0）===');
data.benign.forEach((t, i) => {
  if (!M.checkLoyaltyTest(t).hit) return;
  const L = layers(t);
  console.log(`benign${i} lang=${L.isZh ? 'zh' : 'en'} L1=${L.l1} L2=${L.l2} EXEMPT=${L.ex}`);
});
