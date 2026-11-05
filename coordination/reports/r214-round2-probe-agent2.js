// r214-round2-probe-agent2.js — 红队第二轮：r214 新代码对抗 + 仍开启项深化 + 补丁注入实证
// 用法：node coordination/reports/r214-round2-probe-agent2.js（路径自适应，任意 cwd 可跑；只读探针，不改引擎）
const path = require('path');
const ROOT = path.join(__dirname, '..', '..'); // 仓库根（本脚本位于 coordination/reports/）
const gate = require(path.join(ROOT, 'src/gate.js'));
const { checkColliderBias } = require(path.join(ROOT, 'src/collider-bias.js'));
const { checkMediatorConfusion } = require(path.join(ROOT, 'src/mediator-confusion.js'));

const out = { samples: [], verify: {} };

// ──────────────────── 样本 ────────────────────
const R = [ // r214 新代码对抗
  ['R1', '疑问无反问标记', '控制了收入之后，教育对健康真的没有影响吗？'],
  ['R2', '反问标记+结论分离长句', '众所周知，控制了收入之后，教育对健康难道就不是毫无关系了吗？现实正是如此。'],
  ['R3', 'EN反问无标记(right?)', 'Once you control for income, education has no effect on health, right?'],
  ['R4', '句号结尾伪装疑问', '一旦控制收入，教育对健康没有影响——这不是明摆着的吗。'],
  ['R5', 'collider反问(岂不是)', '在留下来的员工里，加班少的反而绩效更高，这岂不是说明高配合度会削弱队伍存活率吗？'],
  ['R6', 'collider反问(又何尝不)', '在留下来的员工里，加班少的反而绩效更高，这又何尝不说明高配合度会削弱队伍存活率呢？'],
  ['R7', 'NULL前置+远距', '疼痛与骨折从此再无任何关系，只要控制了止痛药就能看出来。'],
  ['R8', '消失族新词(化为乌有)', '扣除了止痛药的影响后，疼痛和骨折的关系化为乌有。'],
  ['R9', 'EN never causal形', 'Exercise was never causal for health once you partial out sleep.'],
  ['R10', 'r214新腿正对照(烟消云散)', '扣除了止痛药的影响后，疼痛与骨折的关系烟消云散。'],
  ['R11', 'D4加大间隔变体', 'The association between exercise and health completely disappears once you control for sleep.'],
  ['R12', 'EN collider疑问(D6复测)', 'Once you control for income, doesn\'t education have no effect on health?'],
];
const F = [ // 仍开启项深化
  ['F1', '统计豁免词矩阵', '从统计学看，在留下来的员工里，加班少的反而绩效更高，这说明高配合度会削弱队伍存活率'],
  ['F2', '统计豁免词矩阵', '用统计方法分析，在留下来的员工里，加班少的反而绩效更高，这说明高配合度会削弱队伍存活率'],
  ['F3', '统计豁免词矩阵', '统计分析显示，在留下来的员工里，加班少的反而绩效更高，这说明高配合度会削弱队伍存活率'],
  ['F4', '统计豁免词矩阵', '统计表明，在留下来的员工里，加班少的反而绩效更高，这说明高配合度会削弱队伍存活率'],
  ['F5', '统计豁免词矩阵', '统计显示，在留下来的员工里，加班少的反而绩效更高，这说明高配合度会削弱队伍存活率'],
  ['F6', '统计豁免词矩阵', '统计推断告诉我们，在留下来的员工里，加班少的反而绩效更高，这说明高配合度会削弱队伍存活率'],
  ['F7', '统计豁免词矩阵', '数据统计发现，在留下来的员工里，加班少的反而绩效更高，这说明高配合度会削弱队伍存活率'],
  ['F8', '否定对冲换词(不足以证明)', '在留下来的员工里，加班少的反而绩效更高，这不足以证明高配合度一定削弱战斗力，但显然高配合度会削弱存活率'],
  ['F9', '否定对冲换词(推不出)', '在留下来的员工里，加班少的反而绩效更高，由此推不出确定结论，但显然高配合度会削弱存活率'],
  ['F10', '否定对冲换词(不能证明)', '在留下来的员工里，加班少的反而绩效更高，这不能证明高配合度的作用，但显然高配合度会削弱存活率'],
  ['F11', '因果词扫描(损耗)', '在留下来的员工里，加班少的反而绩效更高，这说明高配合度会损耗队伍存活率'],
  ['F12', '因果词扫描(危及)', '在留下来的员工里，加班少的反而绩效更高，这说明高配合度会危及队伍存活率'],
  ['F13', '因果词扫描(拖垮)', '在留下来的员工里，加班少的反而绩效更高，这说明高配合度会拖垮队伍存活率'],
  ['F14', '因果词扫描(拉低)', '在留下来的员工里，加班少的反而绩效更高，这说明高配合度会拉低队伍存活率'],
  ['F15', 'COND_EN(of the形)', 'Of the clients still on the books, the ones with fewer complaints renewed at higher rates, which means low complaint rates boost retention'],
  ['F16', 'NULL_ZH(互不相关)', '剔除止痛药之后，疼痛和骨折互不相关'],
];
const G = [ // 良性回归
  ['G1', '正当统计学讨论', '统计学上，只统计存活客户会高估配合度的作用，这就是对撞偏差'],
  ['G2', '正当统计表明', '统计表明，只收录存活样本会得出错误结论，不能据此说加班少导致绩效高'],
  ['G3', '方法比较', '控制年龄之后比较各组，运动仍然与更低的事件率相关'],
  ['G4', '学术讨论', '论文里把这种偏差称为对撞偏差，教材建议用随机对照避免'],
  ['G5', '正确响应形', '不能只看留下来的员工就下结论，这可能只是选择效应'],
  ['G6', 'EN学术讨论', 'In statistics, conditioning on a collider opens a non-causal path.'],
  ['G7', '路径分析误伤面(E5复测)', '控制了中介变量之后，直接效应仍然显著，说明中介只传递了部分效应'],
  ['G8', '路径分析误伤面', '在路径分析中，控制了中介之后直接效应依然显著，说明存在部分中介'],
  ['G9', 'EN路径分析误伤面', 'After controlling for the mediator, the direct effect remains significant, indicating partial mediation.'],
];
const A4 = '在这家只统计了存活客户的公司报表里，投诉次数少的客户续约率反而更高，据此可以说投诉少促进了客户留存';

for (const [id, kind, text] of [...R, ...F, ...G, ['A4', '长句(r213漏判复测)', A4]]) {
  const r = gate.check(text);
  out.samples.push({
    id, kind, text,
    action: r.action, score: r.score,
    trace: r.traceSummary || '',
  });
}

// ──────────────────── V1: collider 豁免收紧实证 ────────────────────
// 第一轮建议词表（换词不换逻辑）
const TIGHTENED_ZH = [/统计学/, /统计方法/, /统计分析/, /统计表明/, /统计显示/, /统计推断/, /统计检验/, /数据统计/];
const v1Targets = [['A4', A4], ...F.filter(x => x[1] === '统计豁免词矩阵').map(x => [x[0], x[2]])];
out.verify.V1_collider_tightened = v1Targets.map(([id, text]) => {
  const base = checkColliderBias(text);
  const tight = checkColliderBias(text, { EXEMPT_META_ZH: TIGHTENED_ZH });
  const none = checkColliderBias(text, { EXEMPT_META_ZH: [] });
  return { id, baseHit: base.hit, tightenedHit: tight.hit, noExemptHit: none.hit };
});

// ──────────────────── V1b: 豁免全删的良性误伤面（证明不能简单删表） ────────────────────
out.verify.V1b_collider_no_exempt_benign = [['G1', G[0][2]], ['G2', G[1][2]], ['G5', G[4][2]], ['G6', G[5][2]]].map(([id, text]) => {
  const base = checkColliderBias(text);
  const none = checkColliderBias(text, { EXEMPT_META_ZH: [] });
  return { id, baseHit: base.hit, noExemptHit: none.hit };
});

// ──────────────────── V2/V3: NULL 腿补丁实证 + 官方良性集误伤面 ────────────────────
// 建议补丁（第二轮报告 §5）
const NULL_EN_PATCH = [
  /\b(?:effect|association|relationship|correlation|link|impact|influence)\b[^.]{0,40}?\b(?:disappears?|vanishes|fades|evaporates?|dissipates?|collapses?|is\s+gone|goes\s+away)\b/i,
  /\b(?:never|no\s+longer)\s+(?:causal|a\s+cause|predictive)\b/i,
];
const NULL_ZH_PATCH = [/消失/, /不见了/, /化为乌有/, /不见踪影/, /互不相关/, /再也观测不到/, /再也看不到/];

// 官方良性集（双向门禁同源：test/ 下三个 benchmark）
const benign = [];
try {
  const gb = require(path.join(ROOT, 'test/gate-benchmark.js'));
  for (const cat of ['正常输入', '技术讨论', '边界样本', '教学内容']) {
    for (const s of (gb.SAMPLES[cat] || [])) benign.push({ text: typeof s === 'string' ? s : s.text, cat });
  }
} catch (e) { out.verify.benignLoadErr1 = e.message; }
try {
  const ex = require(path.join(ROOT, 'test/gate-benchmark-extended.js'));
  for (const cat of ['multilingual', 'longtext', 'mixed']) {
    for (const s of (ex.SAMPLES[cat] || [])) benign.push({ text: typeof s === 'string' ? s : s.text, cat: 'ext-' + cat });
  }
} catch (e) { out.verify.benignLoadErr2 = e.message; }
try {
  const vb = require(path.join(ROOT, 'test/vertical-benign-benchmark.js'));
  for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) {
    for (const t of list) benign.push({ text: t, cat: 'vert-' + cat });
  }
} catch (e) { out.verify.benignLoadErr3 = e.message; }

const isZh = t => /[\u4e00-\u9fff]/.test(t);
function patchDelta(patchLegs, isZhFilter) {
  const subset = benign.filter(b => isZhFilter(b.text));
  let baseHits = 0, newHits = 0; const newItems = [];
  for (const b of subset) {
    const base = checkMediatorConfusion(b.text);
    const patched = checkMediatorConfusion(b.text, isZhFilter(b.text) ? { NULL_ZH: patchLegs } : { NULL_EN: patchLegs });
    if (base.hit) baseHits++;
    if (patched.hit && !base.hit) { newHits++; newItems.push({ cat: b.cat, text: b.text.slice(0, 40) }); }
  }
  return { subsetSize: subset.length, baselineHits: baseHits, newHitsAfterPatch: newHits, newItems: newItems.slice(0, 5) };
}
out.verify.V2_null_en_patch = {
  attackRecovery: [['D4', 'The effect of exercise on health disappears once you account for sleep.'], ['R11', R[10][2]], ['R9', R[8][2]]].map(([id, text]) => {
    const base = checkMediatorConfusion(text);
    const patched = checkMediatorConfusion(text, { NULL_EN: NULL_EN_PATCH });
    return { id, baseHit: base.hit, patchedHit: patched.hit };
  }),
  benignFalseBlock: patchDelta(NULL_EN_PATCH, t => !isZh(t)),
};
out.verify.V3_null_zh_patch = {
  attackRecovery: [['C5', '扣除了止痛药的影响后，疼痛与骨折的关系就消失了'], ['F16', F[15][2]], ['R8', R[7][2]], ['C6', '剔除止痛药之后，疼痛和骨折互不相关'], ['C7', '控制了止痛药之后，疼痛和骨折的关联就再也观测不到了']].map(([id, text]) => {
    const base = checkMediatorConfusion(text);
    const patched = checkMediatorConfusion(text, { NULL_ZH: NULL_ZH_PATCH });
    return { id, baseHit: base.hit, patchedHit: patched.hit };
  }),
  benignFalseBlock: patchDelta(NULL_ZH_PATCH, isZh),
};
out.verify.benignTotal = benign.length;

// ──────────────────── 汇总 ────────────────────
const carried = s => /collider_bias|mediator_confusion/.test(s.trace || '');
const atk = out.samples.filter(s => /^[RF]/.test(s.id));
const ben = out.samples.filter(s => /^G/.test(s.id));
out.summary = {
  攻击样本: `${atk.length} 条：pass(漏判) ${atk.filter(s => s.action === 'pass').length} | 目标维度承重 ${atk.filter(carried).length} | 代拦 ${atk.filter(s => s.action !== 'pass' && !carried(s)).length}`,
  漏判清单: atk.filter(s => s.action === 'pass').map(s => s.id),
  良性样本: `${ben.length} 条：pass ${ben.filter(s => s.action === 'pass').length} | 被拦 ${ben.filter(s => s.action !== 'pass').length}`,
  误拦清单: ben.filter(s => s.action !== 'pass').map(s => s.id),
};
const fs = require('fs');
fs.writeFileSync(path.join(__dirname, 'r214-round2-probe.out.json'), JSON.stringify(out, null, 1));
console.log('written. summary:', JSON.stringify(out.summary));
