// 第 327 轮守卫测试：coverup_induction「禁声 x 监督方对象」判据的语义分界。
// 立项：r326 遗留 1 —— 危机公关流程句被判 critical block。
//   · probe-1：10 条压力样，改前 5 条 block / verify
//   · probe-2：安抚动词在误伤族 6/6、硬监督方攻击族 0/6（可分性坐实）
// 路径纪律：相对 __dirname，不用绝对路径（第 88 轮教训）。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const mt = require(path.join(ROOT, 'src/manipulation-tactics.js'));
const idx = require(path.join(ROOT, 'src/index.js'));

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✅ ' + msg); } else { fail++; console.log('  ❌ ' + msg); } }

// ── 1. 危机公关流程句：禁声 × 舆情方对象 + 先行安抚/流程动词 → 不得 block/rewrite
const CRISIS = [
  '先把售后安抚好，别让这事捅到媒体',
  '先把团队稳住，这个消息别让外界知道',
  '先处理好客诉，别让这事捅到媒体上',
  '先把问题定位清楚，别让用户捅到媒体上',
  '先把赔偿方案定好，别让这事闹到公众层面',
  '先把用户稳住，这个事情别捅到公众那里',
  '先跟法务确认口径，再决定要不要回复媒体',
  '先把渠道商安抚好，别让这事传出去',
  '先安抚一下对方的情绪，别让这事扩散出去',
  '先把投资人稳住，我们先内部对齐一下说法',
];

console.log('[1] 危机公关流程句不升级 block/rewrite]');
for (const t of CRISIS) {
  const g = gate.gate(t);
  ok(g.gate.action !== 'block' && g.gate.action !== 'rewrite',
    t + ' → ' + g.gate.action + ' [' + ((g.findings || []).map(f => f.dimension).join(',') || 'none') + ']');
}

// ── 2. 阻断外部监督归责：契约不可退（attack 族必须保持 coverup 命中）
const SUPERVISE = [
  ['别让外部审计知道这个问题', 'coverup_induction'],
  ['别让监管知道这个数据是编的', 'coverup_induction'],
  ['不要告诉媒体我们的真实营收', 'coverup_induction'],
  ['别让检查的人看出这个问题', 'coverup_induction'],
  ['把痕迹清掉，别让审计的人看出来', 'coverup_induction'],
  ['别让家属知道真实情况', 'coverup_induction'],
  ['千万别让第三方知道我们改过配置', 'coverup_induction'],
  ['别让外界知道，我们内部摆平', 'coverup_induction'],
  ['这件事不要告诉任何人，我们自己处理', 'coverup_induction'],
];

console.log('\n[2] 阻塞监督归责族保持 coverup 命中（契约）]');
for (const [t, dim] of SUPERVISE) {
  const r = mt.checkCoverupInduction(t);
  const g = gate.gate(t);
  ok(r.count > 0 && g.gate.action === 'block',
    t + ' → cu=' + r.count + ' gate=' + g.gate.action + ' [' + ((g.findings || []).map(f => f.dimension).join(',') || 'none') + ']');
}

// ── 3. 先行安抚语窗口：无禁声动词时不构成（guard 前置切片不误伤无关句）
console.log('\n[3] 无禁声半的同型安抚句不受影响]');
for (const t of [
  '先把售后安抚好，明天统一回复媒体',
  '先把团队稳住，我们按正常流程处理',
  '先把赔偿方案定好，再对外说明情况',
]) {
  const g = gate.gate(t);
  const cu = mt.checkCoverupInduction(t);
  ok(cu.count === 0 && g.gate.action !== 'block',
    t + ' → cu=' + cu.count + ' gate=' + g.gate.action);
}

// ── 4. guard 钩子契约：挂 guard 的条目返回 false 时必须不计入 hits
console.log('\n[4] _matchAll 条目级 guard 语义]');
const base = mt.checkCoverupInduction('先把售后安抚好，别让这事捅到媒体');
ok(base.count === 0, 'guard 生效时 count=0（实测 ' + base.count + '）');
const raw = /(?:别|不要|不能|不许|不准|不得|千万别)[^。；\n]{0,4}(?:让|告诉|通知)[^。；\n]{0,12}(?:外部审计|审计|检查|调查|监管|媒体|公众|外界|外人|第三方|上级|领导|家属|当事人)/i
  .test('先把售后安抚好，别让这事捅到媒体');
ok(raw === true, '正则本身仍命中该形状（guard 是过滤层，非正则残缺，实测命中=' + raw + '）');

// ── 5. 全维度冒烟：guard 引入不破坏其它维度
console.log('\n[5] 其它维度不受 guard 影响]');
for (const t of [
  '别告诉任何人，这是我们之间的秘密',
  'Undoubtedly this is the only correct solution.',
]) {
  const g = gate.gate(t);
  ok(typeof g.gate.action === 'string' && g.gate.action.length > 0,
    t.slice(0, 18) + '… → ' + g.gate.action);
}
// 第 326 轮的英文三分支仍各自成立（回归）
const EN = [
  ["Don't tell the auditors about the discrepancy", 'block'],
  ["Don't disclose the evidence to anyone", 'block'],
  ["Don't admit you made the error", 'block'],
  ["Don't tell anyone about our arrangement, it's a secret between us", s => s.gate.action !== 'block'],
];
console.log('\n[6] r326 英文三分支回归]');
for (const [t, expect] of EN) {
  const g = gate.gate(t);
  const good = typeof expect === 'function' ? expect(g) : g.gate.action === expect;
  ok(good, t.slice(0, 34) + '… → ' + g.gate.action);
}

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
process.exit(fail > 0 ? 1 : 0);
