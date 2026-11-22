'use strict';
/**
 * r448 收尾 — selection_on_dependent_variable 独立接线 + 腿②共同点族
 * （第 282 维度落地）
 *
 * 背景（scripts/round-448/probe-r448-cause4.js 与
 *   probe-r448-sodv-matrix.js 实测）：
 *   上一轮 WIP 把 sodv require/计算/dimMap 都接好了，但漏了 VERIFY_DIMS
 *   注册——gate.action 恒 pass、维度数停在 281（e2e 实测 action: pass |
 *   dims: none）。本轮补注册后模块层仍漏「共同点/共性 + 冒号」句式族：
 *     存量腿②（CAUSE_ZH/CAUSE2_ZH/CAUSE3_ZH）全部要求「推断标记
 *     （所以/因此/看来/因为）+ 因果动词（让/使/能）+ 结果名词」，而
 *     「都有一个共同点：X」「有个共性，就是 X」「共同点在于 X」
 *     「不约而同地做了同样的选择」不带任何推断标记——冒号/「就是」/
 *     「在于」本身就是归因连接形（把冒号后的特征指定为群体达成结果的
 *     原因）。EN 侧同构：shared one trait: X。
 *
 * 判定纪律：攻击必须 sodv 指名命中（gate.action 非 pass 且 findings
 * 出现 selection_on_dependent_variable）、良性零误伤、负例注入语义保留
 * （删 CAUSE4_ZH → 新样本 miss，证新腿承重）、四组豁免不回归。
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const gateMod = require(path.join(ROOT, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod;

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('  ok -', name); }
  else { fail++; console.log('  FAIL -', name, extra != null ? '| ' + JSON.stringify(extra).slice(0, 200) : ''); }
}

function hit(sample) {
  const r = gate(sample);
  const f = (r.findings || []).find(x => x.dimension === 'selection_on_dependent_variable');
  return { action: r.gate.action, f: !!f, dims: (r.findings || []).map(x => x.dimension) };
}
function actionPass(sample) {
  return gate(sample).gate.action === 'pass';
}

// ── 一、注册生效：VERIFY_DIMS 收录 sodv（e2e gate 层，非模块层）────────
console.log('== 一、第 282 维度注册生效（gate.action 非 pass + findings 指名）==');
const ATK = [
  ['共同点冒号形', '这批创业成功的公司都有一个共同点：它们都敢于在关键时刻加杠杆。'],
  ['特点逗号就是形', '能上市的企业大多有一个特点，就是创始人都极度自信。'],
  ['共性逗号就是形', '康复者普遍有个共性，就是他们都没有放弃过希望。'],
  ['不约而同同动作形', '这些活下来的幸存者都不约而同地做了同样的选择。'],
  ['共同点在于无标点形', '减肥成功的人共同点在于都记录过饮食。'],
  ['所以推断存量腿', '活下来的公司都融过资，所以融资能救命。'],
  ['EN shared trait 冒号形', 'The companies that made it all shared one trait: relentless risk-taking.'],
];
for (const [label, s] of ATK) {
  const r = hit(s);
  ok(r.action !== 'pass' && r.f, label + ' → ' + r.action, r.dims);
}

// ── 二、良性零误伤（含该族边缘良性）──────────────────────────────
console.log('== 二、良性零误伤 ==');
const BEN = [
  ['多因正确陈述', '战争是多因共同造成的，既有资源争夺也有地缘政治。'],
  ['成功学教学转述', '成功学书籍常说要只关注成功者的共性，这其实是选择依赖变量。'],
  ['对冲值得研究', '活下来的公司都融过资，但这值得研究，不能就此断定融资是原因。'],
  ['对照正确陈述', '我们访谈了二十位业绩冠军，也访谈了二十位落选者，两组训练强度相当。'],
  ['单纯观察无特征', '这批创业成功的公司都有一个共同点。'],
  ['EN 元陈述批评', 'The common thread cited by motivational books is a textbook case of selection bias.'],
];
for (const [label, s] of BEN) {
  ok(actionPass(s), label, hit(s).dims);
}

// ── 三、负例注入：删 CAUSE4_ZH → 新样本 miss（证新腿承重）────────────
console.log('== 三、负例注入承重 ==');
const mod = require(path.join(ROOT, 'src', 'selection-on-dependent-variable.js'));
const I = mod.__internals();
ok(Array.isArray(I.CAUSE4_ZH) && I.CAUSE4_ZH.length >= 4, 'CAUSE4_ZH 已导出且 ≥4 族', I.CAUSE4_ZH && I.CAUSE4_ZH.length);
ok(Array.isArray(I.CAUSE4_EN) && I.CAUSE4_EN.length >= 3, 'CAUSE4_EN 已导出且 ≥3 族', I.CAUSE4_EN && I.CAUSE4_EN.length);
// 注入空数组 → 共同点族必须全 miss（存量腿吃不掉这些句式）
// 注意：__internals() 不接受参数（签名 () => ({...})），注入必须直接传给
// detectSelectionOnDependentVariable(text, inject)——它的第二参即 findSignatures
// 的 R（含 CAUSE4_ZH/CAUSE4_EN 覆写键）。
const INJECT = { CAUSE4_ZH: [], CAUSE4_EN: [] };
const bare = mod.detectSelectionOnDependentVariable('这批创业成功的公司都有一个共同点：它们都敢于在关键时刻加杠杆。', INJECT);
ok(!bare.hit, '注入空 CAUSE4_ZH 后共同点冒号形 miss（新腿承重）', bare);
const bare2 = mod.detectSelectionOnDependentVariable('The companies that made it all shared one trait: relentless risk-taking.', INJECT);
ok(!bare2.hit, '注入空 CAUSE4_EN 后 EN shared trait 形 miss（新腿承重）', bare2);
// 存量腿不受注入影响：带推断标记的样本仍由存量 CAUSE3_ZH 命中
const legacy = mod.detectSelectionOnDependentVariable('活下来的公司都融过资，所以融资能救命。', INJECT);
ok(legacy.hit, '注入空 CAUSE4 后存量推断标记样本仍命中（存量语义保留）', legacy);

console.log('\n== 汇总 ==');
console.log('通过 ' + pass + ' / 失败 ' + fail);
if (fail > 0) { process.exitCode = 1; }
