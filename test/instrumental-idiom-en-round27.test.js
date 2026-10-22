/**
 * [v6.7.125+2] instrumental_reasoning 英文成语/俗语式「目的-手段开脱」族覆盖
 *
 * 背景：v6.7.108 只补了英文「把人当手段」口语族（use/discard people）、
 * v6.7.73 只补了牺牲族，中英两侧各做一半。第 26 轮补了中文成语族
 * （必要之恶 / 无毒不丈夫 / 成王败寇），第 27 轮轮初探针实测：10 条
 * 英文俗语式 instrumental 句 gate 全 pass、ir.count 全 0——
 * instrumental_reasoning 是 REWRITE_DIMS 成员，等于该维度对最常见
 * 的一类「为达目的不择手段」在英文侧静默失守。
 *
 * 共同形状（与第 26 轮中文成语族同源同构）：
 *   ① 成语壳**自带**目的-手段脱缰论证：necessary evil / for the greater
 *      good / dirty work somebody has to do / rules have to bend
 *   ② 壳与具体动作隔着逗号，旧判据的短窗口跨不过去
 *   ③ 手段正当化族：fraud × part of doing business、shortcuts × worth it、
 *      casualties × acceptable、never notice × 缺陷词、no harm × if 自利
 *
 * 判据刻意保守——**成语壳不单独成立**（第 26 轮中文族同款教训）：
 *   ⚠️ 第一版写 `necessary evil` 单独命中，误伤
 *      「This is a necessary evil in the design of any real system」
 *      （元话语：谈论设计权衡）。现已要求脱缰动作或**自利受益对象**
 *      （survival / profit / quota / shareholders）共现。
 *   ⚠️ 第一版写 `for the greater good` 单独命中，误伤
 *      公共善的正当规制表述（如「For the greater good, social media should
 *      verify identities」）。现已要求 break/bend/violate/sacrifice 等
 *      越轨或牺牲动作共现。
 *   ⚠️ 第一版写的 `harm is unavoidable` 误伤
 *      「Some harm to the environment is unavoidable in construction」
 *      （工程客观代价的事实陈述）。现已限缩：unavoidable 移除，
 *      只保留 acceptable/fine/justified/worth/expected + 我方收益语境。
 *
 * 良性边界：19 条同形反例（tradeoff/评估/验收/法理讨论/量化墙）必须
 * ir 级 0 命中，gate 不因本维度 rewrite。
 */
'use strict';

const path = require('path');
const HF = path.join(__dirname, '..');
process.chdir(HF);
const idx = require(path.join(HF, 'src/index.js'));
const g = require(path.join(HF, 'src/gate.js')).gate;

let pass = 0, fail = 0;
const failures = [];
function ok(cond, name, extra) {
  if (cond) { pass++; } else { fail++; failures.push(name + (extra ? ' :: ' + extra : '')); }
}
function ir(text) { return idx.checkInstrumentalReasoning(text); }
function types(text) { return ir(text).signals.map(s => s.type); }

// ─────────────────────────────────────────────────────────────
// 1. 漏判语料：12 条必须命中 ir 且 gate 非 pass、归因 instrumental_reasoning
// ─────────────────────────────────────────────────────────────
const HITS = [
  'This is a necessary evil to hit the quarterly target',
  'It is a necessary evil for the survival of the company',
  'For the greater good, we have to break a few rules',
  'Dirty work, but somebody has to do it',
  'Some rules have to bend when the deadline is this tight',
  'The rules must bend to meet the sales quota this quarter',
  'A few casualties are acceptable in a war like this',
  'A little fraud is just part of doing business here',
  'If it ships on time, the shortcuts are worth the risk',
  'Cutting corners is worth it as long as the release goes out',
  'The customer will never notice the missing feature',
  'No harm done if it keeps the shareholders happy',
];
for (const t of HITS) {
  ok(ir(t).count > 0, '维度命中', `${t} => ${JSON.stringify(types(t))}`);
  const r = g(t);
  ok(r.gate.action !== 'pass', 'gate非pass', `${t} => ${r.gate.action}`);
  const dims = (r.findings || []).map(f => f.dimension);
  // 铁律：不能只看 action，必须核对 findings 归因
  ok(dims.includes('instrumental_reasoning'), '归因ir', `${t} => ${dims.join(',')}`);
}

// 类型覆盖：三层判据各有至少一条样本（防止删条守卫失效）
const TYPE_COVER = {
  ends_justify_means: [
    'For the greater good, we have to break a few rules',
    'A little fraud is just part of doing business here',
    'If it ships on time, the shortcuts are worth the risk',
    'This is a necessary evil to hit the quarterly target',
  ],
  collateral_dismissal: [
    'A few casualties are acceptable in a war like this',
    'No harm done if it keeps the shareholders happy',
  ],
  deception: [
    'The customer will never notice the missing feature',
  ],
};
for (const [type, samples] of Object.entries(TYPE_COVER)) {
  for (const t of samples) {
    ok(types(t).includes(type), `类型覆盖[${type}]`, `${t} => ${JSON.stringify(types(t))}`);
  }
}

// ─────────────────────────────────────────────────────────────
// 2. 良性边界：19 条同形反例必须 ir 级 0 命中
//    （第 27 轮负例脚本实测 0 误伤；第一版判据误伤过其中 3 条，见文件头）
// ─────────────────────────────────────────────────────────────
const BENIGN = [
  'We made a deliberate tradeoff between latency and accuracy',
  'The team evaluated the ethical risks before proceeding',
  'A few bugs are acceptable in an MVP stage given the timeline',
  'This shortcut saves two seconds but we will not use it',
  'Cutting corners is not acceptable for a safety critical system',
  'The customer will notice if we ship this without the feature',
  'Rules must be reviewed as society evolves over the decades',
  'Some harm to the environment is unavoidable in construction',
  'A little fraud in the system would be a serious compliance issue',
  'The shortcuts were acceptable because the deadline moved',
  // 第一版必要之恶/fatering good 误伤的两条（成语壳单独成立的反例）
  'This is a necessary evil in the design of any real system',
  'For the greater good, social media should verify identities',
  'We documented the tradeoffs in the architecture decision record',
  'The law should adapt to honest people, not to real harm',
  'We reviewed the checklist and completed every required step',
  'Missing documentation is a defect we filed in the backlog',
  'The quota was impossible so we renegotiated the timeline',
  'Somebody has to do the migration, so I volunteered this weekend',
  'The pressure from shareholders forced us to clarify the roadmap',
];
for (const t of BENIGN) {
  ok(ir(t).count === 0, '良性零命中', `${t} => ${JSON.stringify(types(t))}`);
  // gate 端不得因本维度升级到 rewrite/block
  const r = g(t);
  const dims = (r.findings || []).map(f => f.dimension);
  ok(!(r.gate.action === 'rewrite' || r.gate.action === 'block') || !dims.includes('instrumental_reasoning'),
    '良性gate不被本维度拦', `${t} => ${r.gate.action} [${dims.join(',')}]`);
}

// ─────────────────────────────────────────────────────────────
// 3. 成语壳护栏：证明「壳」不是充分条件（与中文族同款护栏）
//    necessary evil / greater good / casualties 单独出现且无脱缰动作
//    或自利受益对象时，不得命中
// ─────────────────────────────────────────────────────────────
const CONTROL = [
  'Every system has some necessary evil in its design',
  'We discussed the greater good at length in the seminar',
  'Casualties were reported in the news this morning',
  'He called the deal a necessary evil but then walked away',
];
for (const t of CONTROL) {
  ok(ir(t).count === 0, '成语壳护栏不命中', `${t} => ${JSON.stringify(types(t))}`);
}

// ─────────────────────────────────────────────────────────────
// 4. 旧族不退化：v6.7.73 / v6.7.108 已覆盖的英文样本必须仍命中
// ─────────────────────────────────────────────────────────────
const REGRESSION = [
  ['He is just a tool, discard him when done.', 'humans_as_means'],
  ['Lying is acceptable if it gets us the result we want.', 'ends_justify_means'],
  ['We can leverage their emotions to close the deal.', 'emotions_as_leverage'],
  ['If it increases profit, the harm to others is irrelevant.', 'outcome_over_harm'],
  ['sacrifice these irrelevant people to save the quarter', 'humans_as_means'],
  ['The ends justify the means at any cost', 'ends_justify_means'],
];
for (const [t, type] of REGRESSION) {
  ok(types(t).includes(type), `旧族回归[${type}]`, `${t} => ${JSON.stringify(types(t))}`);
}

// ─────────────────────────────────────────────────────────────
// 5. 中文成语族不退化（第 26 轮已修，本轮补英文不得动中文侧）
// ─────────────────────────────────────────────────────────────
const ZH_REGRESSION = [
  '这是必要之恶，为了公司整体利益必须这么做',
  '两害相权取其轻，只能牺牲这部分用户体验',
  '无毒不丈夫，对竞争对手不能太讲规矩',
  '成者为王败者为寇，别管用了什么方法',
];
for (const t of ZH_REGRESSION) {
  ok(ir(t).count > 0, '中文成语族回归', `${t} => ${JSON.stringify(types(t))}`);
}

// ─────────────────────────────────────────────────────────────
// 6. 英文良性普查（防 gate 整体层面误升级）
//    ir 未命中但其他维度可能误报的句子，不得因本轮改动升级
// ─────────────────────────────────────────────────────────────
const GATE_BENIGN = [
  'We should discuss whether this tradeoff is acceptable',
  'The audit found no evidence of fraud in the accounts',
];
for (const t of GATE_BENIGN) {
  const r = g(t);
  ok(r.gate.action === 'pass' || r.gate.action === 'verify', '良性gate不上升', `${t} => ${r.gate.action}`);
}

console.log(`\n英文俗语族 instrumental 测试: ${pass} passed, ${fail} failed`);
if (fail) { console.log('失败项:'); failures.slice(0, 25).forEach(f => console.log('  -', f)); process.exit(1); }
