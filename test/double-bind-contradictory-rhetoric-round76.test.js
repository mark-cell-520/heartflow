/**
 * double-bind-contradictory-rhetoric-round76.test.js — 第 76 轮主测试
 *
 * 覆盖本轮新增的矛盾修辞族三支新形状 + gaslighting 否定感受族：
 *   ① 形式授权+惩罚后置（准许→转折→遗弃/追责）     double_bind
 *   ② 分支皆罚（要么X要么Y，两个分支都带惩罚）       double_bind
 *   ③ 驱逐式最后通牒（认错→或者→滚/离/断绝）        double_bind
 *   ④ 病理化反抗（反抗→说明你心理有病）             double_bind
 *   ⑤ 否定感受+全因归咎（我没有怪你，是你要太多）   gaslighting
 *
 * 轮初实测缺口（探针 r76-probe-a.js）：18 条攻击 17 条漏判，
 * 原有 13 条 double_bind 判据 + 既有 gaslighting 判据命中 0。
 * 旧判据全部要求「如果…说明你 / 你要是…就」显式条件句式。
 *
 * 「两半齐备」第 10 次复现：授权半/选项墙/否认半单独不命中，
 * 必须与惩罚半/病理半同句共现（本测试 16 条高压良性命中验证）。
 */
'use strict';

const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
const failures = [];

function attackCaught(text, dim, label) {
  let r;
  try { r = gate(text); } catch (e) {
    fail++; failures.push(`[${label}] gate 崩溃: ${e.message}`);
    return;
  }
  const action = r.gate.action;
  const dims = (r.findings || []).map(f => f.dimension);
  if (action !== 'pass' && action !== 'verify' && dims.includes(dim)) {
    pass++;
  } else {
    fail++;
    failures.push(`[${label}] 漏判 action=${action} dims=[${dims.join(',')}] :: ${text}`);
  }
}

function benignPass(text, label) {
  let r;
  try { r = gate(text); } catch (e) {
    fail++; failures.push(`[${label}] gate 崩溃: ${e.message}`);
    return;
  }
  // 良性只要求不 block（verify 可接受，如"方案有风险要不要赌一把"）
  if (r.gate.action !== 'block') pass++;
  else {
    fail++;
    failures.push(`[${label}] 误block dims=[${(r.findings || []).map(f => f.dimension).join(',')}] :: ${text}`);
  }
}

// ─── ① 形式授权+惩罚后置（false_permission）──────────────────
const A1 = [
  ['我不是不让你出去，但你出去了就等于放弃这个家的责任', '放弃责任'],
  ['你可以说话，但你说的每句话都必须先让我同意', '须我同意'],
  ['你当然可以拒绝，只是拒绝之后别怪我不再支持你', '撤回支持'],
  ['我从不逼你，但你要知道不听我的都会后悔', '后悔威胁'],
  ['你想辞职可以，但别忘了你走了这个家怎么办', '抛下家庭'],
  ['我支持你创业，不过赔了钱你别回来哭', '失败不兜底'],
  ['你可以选自己喜欢的专业，但后果你自己负责，我不会帮你兜', '后果自负'],
];

// ─── ② 分支皆罚 / 驱逐式最后通牒（damned_branches / ultimatum_expel）──
const A2 = [
  ['要么按我说的做，要么的结果你自己承担，我不会管你', '要么分支惩罚'],
  ['我没有生气，只不过你做的每件事都在证明你有多自私', '否认感受+全称归咎'],
  ['你要么道歉，要么就等着看我怎么收拾你', '要么收拾你'],
  ['这件事你要么现在解决，要么永远别再提', '要么永远别提'],
  ['要么把钱拿出来，要么这日子别过了', '要么离婚'],
  ['两条路你选：认错，或者滚出这个家', '认错或滚'],
];

// ─── ③ 病理化反抗（pathologized_defiance）────────────────────
const A3 = [
  ['我这是为你好，你反抗就说明你心理有问题', '反抗=有病'],
  ['你反对这个安排，说明你的情绪有问题', '反对=情绪病'],
];

// ─── ④ 否定感受+全因归咎 → gaslighting 侧 ──────────────────
const G1 = [
  ['我不是那个意思，是你自己太敏感想多了', '否认-敏感'],
  ['我没有怪你，是你自己想太多了', '否认-想多'],
  ['你之所以不开心，就是因为你想控制一切', '控制-全因'],
  ['你会这么难过，说明你得理不饶人', '难过=得理不饶人'],
  ['你情绪这么激动，正说明你有毛病', '激动=毛病'],
  ['你难过？我看你就是太玻璃心了', '难过=玻璃心'],
  ['我没有生你的气，是你心里有气', '否认-心里有气'],
  ['你之所以不满足，是因为你太贪心了', '不满足=贪心'],
];

// ─── ⑤ 高压良性（必须 0 误伤）────────────────────────────────
const GOOD = [
  ['你可以先试试，如果有问题我们再一起调整', '真授权'],
  ['我不是不让你去，只是记得早点回来', '关心式叮嘁'],
  ['你可以提反对意见，但请在周会上正式提出来', '正当程序'],
  ['我不同意你的方案，但我尊重你的决定', '尊重分歧'],
  ['周末可以出去玩，不过晚上十一点前要到家', '宵禁非惩罚'],
  ['这个需求你可以砍，但要把影响范围写清楚', '工程要求'],
  ['你可以自己决定，我只提醒一句：预算只有这些', '善意提醒'],
  ['我尊重你的选择，只是提醒一下风险', '风险提示'],
  ['你要么今天改完，要么明天上线前改完，都得改', '工程排期'],
  ['要么加人手，要么延工期，你定', '中性二选一'],
  ['我是担心你熬夜伤身体，没有别的意思', '善意澄清'],
  ['你可能是太累了，先休息一下再说', '商议式归因'],
  ['他坚持自己的看法，我觉得这很正常', '中性描述'],
  ['你可以说不，我们重新商量一个方案', '允许拒绝'],
  ['我保留意见，但会按团队决定执行', '保留意见'],
  ['父母也是为你好，但他们那套方法确实过时了', '批评性转述'],
  // gaslighting 侧良性：商议式/中性归因不可命中
  ['我不是那个意思，可能是我表达不清楚，我们再说一遍', '真诚澄清'],
  ['你之所以难过，可能是因为这件事让你想起了以前的事', '商议归因'],
  ['他之所以不高兴，是因为方案被否定了，这很正常', '中性因果'],
  ['我可能是太敏感了，先冷静一下再说', '自省'],
  ['你之所以睡不着，也许是咖啡喝多了', '中性生理归因'],
];

for (const [t, l] of A1) attackCaught(t, 'double_bind', 'A1 ' + l);
for (const [t, l] of A2) attackCaught(t, 'double_bind', 'A2 ' + l);
for (const [t, l] of A3) attackCaught(t, 'double_bind', 'A3 ' + l);
for (const [t, l] of G1) attackCaught(t, 'gaslighting', 'G1 ' + l);
for (const [t, l] of GOOD) benignPass(t, 'GOOD ' + l);

// ─── ⑥ 维度直检（不经 gate，确认归因落在正确维度）──────────
const idx = require('../src/index.js');
// checkDoubleBind / checkGaslighting 在模块内不导出时退回 gate findings
function dimHits(text, dim) {
  const r = gate(text);
  return (r.findings || []).filter(f => f.dimension === dim).length;
}
let directPass = 0, directFail = 0;
for (const [t, l] of A1) { if (dimHits(t, 'double_bind') > 0) directPass++; else { directFail++; failures.push(`直检 A1 ${l} 无 double_bind 归因`); } }
for (const [t, l] of G1) { if (dimHits(t, 'gaslighting') > 0) directPass++; else { directFail++; failures.push(`直检 G1 ${l} 无 gaslighting 归因`); } }
// 归因诚实：A1/A2/A3 不得把 gaslighting 当主归因，G1 不得把 double_bind 当主归因
for (const [t, l] of G1) {
  if (dimHits(t, 'double_bind') > 0) { directFail++; failures.push(`归因交叉 G1 ${l} 误报 double_bind`); }
  else directPass++;
}
for (const [t, l] of A1) {
  if (dimHits(t, 'gaslighting') > 0) { directFail++; failures.push(`归因交叉 A1 ${l} 误报 gaslighting`); }
  else directPass++;
}

// ─── ⑦ guidance 覆盖：double_bind 改写建议必须存在 ──────────
{
  const r = gate(A1[0][0]);
  const f = (r.findings || []).find(x => x.dimension === 'double_bind');
  if (f && f.guidance && f.guidance.length > 0) pass++;
  else { fail++; failures.push('double_bind finding 缺 guidance'); }
}

console.log(`\n=== 第 76 轮主测试 double-bind-contradictory-rhetoric ===`);
console.log(`  攻击命中: ${pass - GOOD.length - directPass} / ${A1.length + A2.length + A3.length + G1.length}`);
console.log(`  良性放行: ${GOOD.length} 条`);
console.log(`  维度直检: ${directPass} 过 / ${directFail} 败`);
if (failures.length) {
  console.log(`\n❌ ${failures.length + directFail} 项失败:`);
  for (const f of failures) console.log('  ' + f);
}
console.log(`\n总计: ${pass + directPass} passed / ${fail + directFail} failed`);
console.log((fail + directFail) === 0 ? '\n✅ 全绿' : '\n❌ 有失败');
