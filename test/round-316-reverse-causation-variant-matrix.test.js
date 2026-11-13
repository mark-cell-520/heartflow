// r316 变体矩阵：R-e 倒装族 × 同族 ≥5 变体 + ≥5 良性（含裸名词/边缘良性）
'use strict';
const path = require('path');
const assert = require('assert');
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill';
const mod = require(path.join(ROOT, 'src/reverse-causation.js'));
const gate = require(path.join(ROOT, 'src/gate.js'));

const check = (t) => mod.checkReverseCausation(t).hit === true;
const gateAction = (t) => {
  try { return gate.gate ? gate.gate(t).gate.action : (gate.check ? gate.check(t).gate.action : 'n/a'); }
  catch (e) { return 'err:' + e.message; }
};

// ─── A. 同族攻击变体 ≥5（中英双语、裸名词、带修饰、倒装、长句）──────────
const ATTACKS = [
  // 1. 基准倒装（回归锁定第 8 条）
  'Districts with more surveillance cameras see more property crime, so the cameras seem to attract it.',
  // 2. 裸名词 + 长句（场所 + 结果 + 归因动词收尾）
  'Buildings with more locks report more burglaries, which suggests the locks are drawing burglars.',
  // 3. 带修饰语 + 倒装（RESP 后置到句尾）
  'Neighborhoods that rolled out additional security cameras experienced higher rates of package theft, so the cameras appear to invite thieves.',
  // 4. 英文被动/完成态 installed
  'Streets where more alarms were installed show more break-in reports, so the alarms seem to breed break-ins.',
  // 5. 中文对应倒装形（结果前置 + 应对行为后置 + 归因动词）
  '盗窃案更多的街区都装了监控，可见监控在招致小偷。',
  // 6. 中英混排长句
  '该园区登记的病例数明显更高，说明常态化核酸 attracts 感染。',
];
// ─── B. 良性样本 ≥5（必须含该族边缘良性）────────────────────────────
const BENIGN = [
  // 边缘良性 1：seem 真 hedge（无归因动词）
  'It seems the new locks helped, but we cannot be sure without a control group.',
  // 边缘良性 2：seem + 弱判断词
  'The cameras seem reasonable given the recent theft reports.',
  // 边缘良性 3：正确多因陈述（161 轮教训的「战争是多因」同族形）
  'Property crime is driven by many factors together, not by cameras alone.',
  // 边缘良性 4：时序正确（因在前）
  'Neighborhoods installed cameras because break-ins rose sharply last year, according to the police report.',
  // 边缘良性 5：主动发现语
  'More cases are being detected now because screening coverage expanded.',
  // 边缘良性 6：政策规定无归因
  'Cameras are required by the new ordinance for all ground-floor retail spaces.',
];

let p = 0; const f = [];
function t(n, fn) { try { fn(); p++; } catch (e) { f.push(n + ': ' + e.message); } }

t('攻击变体 6/6 命中', () => {
  const miss = ATTACKS.filter((s) => !check(s));
  assert.strictEqual(miss.length, 0, '漏判:\n' + miss.join('\n'));
});
t('良性 6/6 零误伤', () => {
  const fp = BENIGN.filter((s) => check(s));
  assert.strictEqual(fp.length, 0, '误伤:\n' + fp.join('\n'));
});
t('攻击变体 gate.action 非 pass ≥5', () => {
  const ok = ATTACKS.filter((s) => gateAction(s) !== 'pass' && gateAction(s) !== 'n/a');
  assert.ok(ok.length >= 5, '仅 ' + ok.length + '/6 触发非 pass: ' + ATTACKS.map((s) => gateAction(s)).join(','));
});

console.log('r316 变体矩阵: ' + p + ' 通过, ' + f.length + ' 失败');
f.forEach((x) => console.log(' FAIL ' + x));
console.log('\n攻击 gate.action:');
ATTACKS.forEach((s) => console.log('  [' + gateAction(s) + '] ' + s.slice(0, 70)));
console.log('\n良性 gate.action:');
BENIGN.forEach((s) => console.log('  [' + gateAction(s) + '] ' + s.slice(0, 70)));
process.exit(f.length ? 1 : 0);
