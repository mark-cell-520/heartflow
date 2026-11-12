// r308 留档探针：src/econ-reasoning-gate.js P0  Interim 重建件行为契约（历史留档）
// 用法：node scripts/round-308/probe-econ-gate-restore.js
// ⚠️ 时效声明：本探针验证的是 2026-11-12 22:12 CST 的 Interim 重建件（原件不可恢复假设下的
//   按契约重建版）。同轮 22:35 CST 另一实例找回了 r304 原始件并提交（main 5a5bae7 之前的
//   cbc32e1 审计轮），现役 src/econ-reasoning-gate.js 是**原稿**（18 族硬编码 FAMILIES 表、
//   max+multiBonus 打分公式），与本重建件（21 族经插件 analyze() 聚合）结构不同、行为经
//   双向门禁验证等价。对现役原稿运行本探针会因「运行态 250 键」期望（现为 251）与族表
//   口径差异报红——这是预期，不是缺陷；本文件作为 P0 时间线证据留档，不供现役门禁使用。
// 验证项（针对 Interim 重建件，2026-11-12 22:12 实测全过）：
//   ① 21 族攻击样本经 gate.gate() 归因到 econ_reasoning_gate（与 round-295 插件层同款句）
//   ② 326 条官方良性语料 econ_reasoning_gate 零误伤（族模块层已验证零误命中）
//   ③ 注入删族：从插件 FAMILIES 动态摘除 3 族后，对应攻击样本归因必须消失
//      （证明聚合层对族表的依赖是承重的，不是空跑）
//   ④ 运行态维度/路由/模块数与 scripts/measure-claimed-numbers.js 口径一致
'use strict';
const gate = require('../../src/gate.js');
const plugin = require('../../src/plugins/econ-reasoning-check/index.js');

// ① 21 族攻击样本（test/round-295-econ-reasoning-wiring.test.js 同款句，逐族一条）
const ATTACK = {
  budget_value_conflation: '我们预算不够，所以这件事本来就不值得做。',
  average_marginal_conflation: '单台成本已经压到这么低了，说明再生产一台更便宜。',
  mental_accounting: '这笔年终奖是意外之财，不算正经收入，所以可以放心大胆地挥霍一把。',
  perverse_incentive: '按销量发奖金最能调动积极性，员工自己进货刷单也算业绩，双赢。',
  winners_curse: '竞标赢了说明这块地就值这个价，我们的判断得到了验证。',
  tragedy_of_commons: '这片草场是公共的，每家多养几只羊自己就多挣一份，至于草场退化那是大家一起承担的。',
  illusion_of_control: '买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的。',
  disposition_effect: '我这只票涨了四成，先落袋为安，套牢的那只再拿拿，总能涨回来的。',
  endowment_effect: '这把吉他是我的，陪了我十年，别说三千，五千我都不卖。',
  anchoring_effect: '谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。',
  present_bias: '体检以后再说，今晚先痛快吃了，以后的事再说。',
  peak_end_rule: '全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了。',
  effort_justification: '我们熬了几个月做出来的方案，质量肯定没问题。',
  p_hacking: '测试了30个参数组合，有一组p值终于小于0.05，说明策略有效。',
  inverse_gamblers_fallacy: '他一上场就进球，肯定是个身经百战的老将。',
  significance_effect_size: 'p 小于 0.05，所以这个药有效，可以全面推广',
  selection_on_dependent_variable: '能活下来的公司都融过资，所以融资能救命',
  ad_hominem: '他是个骗子，所以他说的关于气候的数据全是假的。',
  adverse_selection: '保险池自然会同时吸引低风险和高风险的人，这对保费没有影响。',
  moral_hazard: '全额兜底不会让机构去承担更多风险。',
  free_rider: '公共事务总会有人站出来管，我个人不用参与。',
};

function econFindings(text) {
  return (gate.gate(text).findings || []).filter(f => f.dimension === 'econ_reasoning_gate');
}

// ① 全族攻击归因
let hit = 0; const miss = [];
for (const [k, t] of Object.entries(ATTACK)) { if (econFindings(t).length) hit++; else miss.push(k); }
console.log(`① 21 族攻击 gate 归因: ${hit}/21` + (miss.length ? ` — miss: ${miss.join(', ')}` : ''));

// ② 良性语料 326 条（与 bidirectional-guard 良性侧同源）
const gb = require('../../test/gate-benchmark.js');
const ex = require('../../test/gate-benchmark-extended.js');
const vb = require('../../test/vertical-benign-benchmark.js');
const bm = require('../../test/benign-mixed-benchmark.js');
const texts = [];
for (const cat of ['benign', 'technical', 'pedagogical', 'borderline']) {
  for (const s of (gb.SAMPLES && gb.SAMPLES[cat]) || []) texts.push(typeof s === 'string' ? s : s.text);
}
for (const [cat, list] of Object.entries(ex.SAMPLES || {})) {
  if (cat === 'adversarial') continue;
  for (const s of list) texts.push(typeof s === 'string' ? s : s.text);
}
for (const list of Object.values(vb.CATEGORIES || {})) for (const t of list) texts.push(t);
for (const s of bm.SAMPLES || []) texts.push(typeof s === 'string' ? s : s.text);
const fps = texts.filter(t => t && econFindings(t).length);
console.log(`② 良性语料 ${texts.length} 条 econ_reasoning_gate 误伤: ${fps.length}` + (fps.length ? ` — 首条: ${String(fps[0]).slice(0, 60)}` : ''));

// ③ 注入删族：从 FAMILIES 摘除指定 key，对应攻击归因必须消失
const DROP = [
  ['anchoring_effect', ATTACK.anchoring_effect],
  ['budget_value_conflation', ATTACK.budget_value_conflation],
  ['ad_hominem', ATTACK.ad_hominem],
];
let injOk = 0; const injBad = [];
const arr = plugin.FAMILIES; // 与插件模块内部同一数组对象——原地增删才影响 analyze() 的遍历
for (const [key, sample] of DROP) {
  const before = econFindings(sample).length;
  const idx = arr.findIndex(f => f.key === key);
  if (idx < 0) { injBad.push(`${key}: FAMILIES 中不存在`); continue; }
  const [removed] = arr.splice(idx, 1);
  const after = econFindings(sample).length;
  arr.splice(idx, 0, removed);
  const restored = econFindings(sample).length;
  if (before > 0 && after === 0 && restored > 0) injOk++;
  else injBad.push(`${key}: before=${before} after=${after} restored=${restored}`);
}
console.log(`③ 注入删族 3 组: ${injOk}/3 翻 miss` + (injBad.length ? ` — 异常: ${injBad.join('; ')}` : ''));

// ④ 运行态口径
const { discriminate } = require('../../src/index.js');
const d = discriminate('neutral baseline text');
console.log('④ 运行态 dimMap 键数:', Object.keys(d.dimensions || {}).length, '（期望 250）');

const ok = hit === 21 && fps.length === 0 && injOk === 3 && Object.keys(d.dimensions || {}).length === 250;
console.log(ok ? 'PROBE PASS' : 'PROBE FAIL');
process.exit(ok ? 0 : 1);
