// r568 豁免族重整：构造/验证「A1 资本 × A2 许可双腿在场，仅靠看守放行」的样本。
// 输出：每条样本的布尔腿状态（before / 看守置空后）。
// 纪律：样本只在本文件与 test/ 目录，不进命令行参数；输出只有索引与布尔。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 读现有豁免族（r567 写入 test 的两组，实测 permit=0）
const testSrc = fs.readFileSync(path.join(__dirname, '..', 'test', 'round-567-moral-licensing.test.js'), 'utf8');
const sandbox = { console, require, module: { exports: {} }, exports: {} };
const cut = testSrc.indexOf('let passed');
vm.createContext(sandbox);
vm.runInContext(testSrc.slice(0, cut) + '\nmodule.exports={attacks,benign,exemptZh,exemptEn,favorOwn};', sandbox);
const S = sandbox.module.exports;

const ml = require('../src/moral-licensing.js');
const cap = ml.__internals();
const { checkMoralLicensing } = ml;

// ── 新豁免候选：从测试文件的 attacks 族取样本，追加看守放行子句 ──
// 取法是「攻击样本原文 + 独立评估/按制度收尾」，保证双腿在场、看守放行。
const listed = {
  zh: S.attacks.filter(s => /[\u4e00-\u9fff]/.test(s)),
  en: S.attacks.filter(s => !/[\u4e00-\u9fff]/.test(s)),
};
const ZH_TAIL = '但既往记录与本次事项是两个独立事项，本次仍按制度单独复核。';
const EN_TAIL = ' but past record and this issue are separate matters and it is still audited on its own facts.';

function legs(s) {
  const c = cap.CAPITAL_ZH.test(s) || cap.CAPITAL_EN.test(s);
  const g = cap.GUARD_ZH.test(s) || cap.GUARD_EN.test(s);
  const p = cap.PERMIT_ZH.test(s) || cap.PERMIT_EN.test(s);
  return { c: c ? 1 : 0, g: g ? 1 : 0, p: p ? 1 : 0 };
}
function checkNoGuard(s) {
  if (!s || s.length < 6) return false;
  if (!(cap.CAPITAL_ZH.test(s) || cap.CAPITAL_EN.test(s))) return false;
  if (!(cap.PERMIT_ZH.test(s) || cap.PERMIT_EN.test(s))) return false;
  return true;
}

console.log('## 旧豁免族腿状态（r567 写入 test）');
for (const [k, arr] of Object.entries({ exemptZh: S.exemptZh, exemptEn: S.exemptEn })) {
  arr.forEach((s, i) => {
    const L = legs(s);
    console.log(`  ${k} #${i} capital=${L.c} guard=${L.g} permit=${L.p} hit=${checkMoralLicensing(s).hit ? 1 : 0}`);
  });
}

console.log('## 新豁免候选（攻击族 + 看守收尾）');
const out = { newExemptZh: [], newExemptEn: [] };
listed.zh.forEach((s, i) => {
  const cand = s + ZH_TAIL;
  const L = legs(cand);
  const noGuard = checkNoGuard(cand) ? 1 : 0;
  // 要求：双腿在场 + 看守放行 + 看守置空后翻 hit
  const ok = L.c && L.p && L.g && noGuard;
  if (ok) out.newExemptZh.push(cand);
  console.log(`  zhSrc #${i} capital=${L.c} guard=${L.g} permit=${L.p} noGuardHit=${noGuard} keep=${ok ? 1 : 0}`);
});
listed.en.forEach((s, i) => {
  const cand = s + EN_TAIL;
  const L = legs(cand);
  const noGuard = checkNoGuard(cand) ? 1 : 0;
  const ok = L.c && L.p && L.g && noGuard;
  if (ok) out.newExemptEn.push(cand);
  console.log(`  enSrc #${i} capital=${L.c} guard=${L.g} permit=${L.p} noGuardHit=${noGuard} keep=${ok ? 1 : 0}`);
});

console.log('## 采用的新豁免样本');
console.log('  newExemptZh = ' + out.newExemptZh.length + ' 条; newExemptEn = ' + out.newExemptEn.length + ' 条');
fs.writeFileSync(path.join(__dirname, 'round-568-exempt-candidates.json'), JSON.stringify(out, null, 2), 'utf8');
console.log('  已落盘 scripts/round-568-exempt-candidates.json');
