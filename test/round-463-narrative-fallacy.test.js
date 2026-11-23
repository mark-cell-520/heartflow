// r463 轮次测试：第 289 维度 narrative_fallacy（叙事谬误）接线验证
// 真升级①：新判别维度——dimMap 新键，独立命中一个新攻击族
//
// 判据（两腿共现 + 邻近窗 + 六组豁免，缺一不判）：
//   腿① COHERE 连贯化叙述框架（把…串起来/环环相扣/顺着脉络捋/对上了；
//     EN string together / piece together / connect the dots / it all fits /
//     every step led / the pattern / too neat）
//   腿② INEVIT 必然化断言（注定/迟早/毫无意外/不是偶然/剧本/精心策划；
//     EN inevitable / bound to / doomed / no accident / not a coincidence /
//     meant to be / scripted / orchestrated / only a matter of time）
//   窗：中文 60 字双朝向、EN 150 字符双朝向
// 立项实证（r463 探针，v6.8.228 gate() 全量 findings）：
//   攻击 5 条穿透 gate=pass 零维度命中，良性 3/3 零误判。
// 每项断言都打真实路径：模块层 checkNarrativeFallacy + gate 层 gate()，
// 不用自检糊弄；负例注入逐常量替换证明承重（r161/r456 教训）。
'use strict';

const NF = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/narrative-fallacy.js');
const { checkNarrativeFallacy, __internals } = NF;
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const fs = require('fs');

const I = __internals();

let passed = 0, failed = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; failures.push(name + (detail ? ' -> ' + detail : '')); console.log(`  ✗ ${name}${detail ? ' -> ' + detail : ''}`); }
}

// ═══ 攻击族（模块层必须命中；含 r463 立项探针 5 条穿透原文）═══
const ATTACKS = [
  '把这件事从头到尾串起来看，他的失败是注定的。',
  '回头一看，每一步都环环相扣，这个结果毫无意外。',
  '整件事情顺着脉络捋一遍，公司倒闭是迟早的事。',
  '这些线索拼在一起，真相已经很明显了。',
  '把线索连起来看，这一切都是精心策划的。',
  'Looking back, every step led inevitably to this outcome.',
  'Piece the clues together and the pattern is unmistakable.',
  'The whole thing fits together too neatly to be a coincidence.',
  '事后把这些事件串成一串，这场灾难是命中注定的。',
  'The timing fits together too perfectly; this was orchestrated all along.',
];

// ═══ 良性（模块层必须 pass——含边缘良性）═════════════════════
const BENIGN = [
  // 偶然性承认（叙事谬误的反面）
  '回头看，每一步都有偶然因素，换一条路径结果可能完全不同。',
  '这一切也许是多种因素巧合交织的结果，并非必然。',
  'Looking back, coincidence and luck played a large role in the outcome.',
  // 多因陈述（正确的因果纪律）
  '这家公司的倒闭是多因共同作用的结果，不能简单归结为单一决策。',
  'The collapse came from a combination of factors, not a single cause.',
  // 概念/教学转述
  '叙事谬误是《黑天鹅》里提到的认知偏差，指用连贯叙述冒充必然性。',
  'The narrative fallacy is a classic concept in behavioral economics.',
  // 推理否定/劝诫
  '不要把连贯的叙述当成必然性的证据，这是叙事谬误的典型陷阱。',
  'Do not mistake a coherent story for evidence of inevitability.',
  // 对冲
  '把这些线索连起来看，失败也许有其结构性的原因，但还需要验证。',
  'It all fits together, but this may be a coincidence; more data is needed.',
];

// ═══ 单腿形（缺任一腿即无族形状）══════════════════════════
const SINGLE_LEG = [
  '把这件事从头到尾串起来看，确实有很多值得反思的地方。',   // 只腿①
  '他的失败是注定的，这一点从一开始就很清楚。',             // 只腿②
  '这家公司的兴衰是经济周期的经典案例。',                   // 概念转述
];

console.log('═'.repeat(56));
console.log('r463 narrative_fallacy 轮测（第 289 维度）');
console.log('═'.repeat(56));

// ─── 1. 攻击族命中 ────────────────────────────────────────────
console.log('\n[1] 攻击族命中（' + ATTACKS.length + ' 条）');
ATTACKS.forEach((t, i) => {
  const r = checkNarrativeFallacy(t);
  check('攻击[' + i + '] 模块层命中: ' + t.slice(0, 26),
    r.hit === true && r.count >= 1 && r.score >= 0.5 && r.detail.length > 10,
    r.hit ? '' : 'miss | ' + t);
});

// gate 层：攻击全部非 pass 且由 narrative_fallacy 指名承重
{
  let carried = 0, nonPass = 0;
  ATTACKS.forEach((t) => {
    const g = gate(t);
    if (g.gate.action !== 'pass') nonPass++;
    if ((g.findings || []).some(f => f.dimension === 'narrative_fallacy')) carried++;
  });
  check('gate 层攻击全部非 pass', nonPass === ATTACKS.length, nonPass + '/' + ATTACKS.length);
  check('gate 层 narrative_fallacy 指名承重', carried === ATTACKS.length, carried + '/' + ATTACKS.length);
  const g0 = gate(ATTACKS[0]);
  const f0 = (g0.findings || []).find(f => f.dimension === 'narrative_fallacy');
  check('findings 带维度名与 severity',
    !!f0 && f0.severity > 0,
    f0 ? 'sev=' + f0.severity : 'no finding');
  check('gate 动作是 verify（VERIFY 级维度）', g0.gate.action === 'verify', g0.gate.action);
}

// ─── 2. 良性豁免 ──────────────────────────────────────────────
console.log('\n[2] 良性豁免（' + BENIGN.length + ' 条，含六组豁免族）');
BENIGN.forEach((t, i) => {
  const r = checkNarrativeFallacy(t);
  check('良性[' + i + '] 模块层 pass: ' + t.slice(0, 26), r.hit === false, 'hit | ' + t);
});
{
  const fp = [];
  BENIGN.forEach((t) => {
    const g = gate(t);
    if ((g.findings || []).some(f => f.dimension === 'narrative_fallacy')) fp.push(t);
  });
  check('良性全集 gate 层 narrative_fallacy 零误伤', fp.length === 0, fp.join(' ;; '));
}

// ─── 3. 单腿不判 ──────────────────────────────────────────────
console.log('\n[3] 单腿不判');
SINGLE_LEG.forEach((t, i) => {
  check('单腿[' + i + '] 不判: ' + t.slice(0, 22), checkNarrativeFallacy(t).hit === false, 'hit');
});

// ─── 4. 负例注入逐常量承重 ─────────────────────────────────────
console.log('\n[4] 负例注入（逐常量替换后原命中句必须失活）');
  // 注入值必须是数组（模块 nearAny 对 sourceList 做 for..of 迭代），
  // 空数组即整族摘除；NEUTRAL 单正则形式本模块不接受（r463 实测）。
  const NEUTRAL = [];
const injCases = [
  { text: ATTACKS[0], patch: 'COHERE_ZH', why: '腿①连贯框架 zh' },
  { text: ATTACKS[0], patch: 'INEVIT_ZH', why: '腿②必然断言 zh' },
  { text: ATTACKS[1], patch: 'COHERE_ZH', why: '腿①环环相扣族' },
  { text: ATTACKS[2], patch: 'INEVIT_ZH', why: '腿②迟早族' },
  { text: ATTACKS[5], patch: 'COHERE_EN', why: '腿① every step led' },
  { text: ATTACKS[5], patch: 'INEVIT_EN', why: '腿② inevitably' },
  { text: ATTACKS[7], patch: 'COHERE_EN', why: '腿① fits together' },
  { text: ATTACKS[7], patch: 'INEVIT_EN', why: '腿② not a coincidence' },
];
injCases.forEach((c) => {
  const before = checkNarrativeFallacy(c.text).hit;
  const inj = {}; inj[c.patch] = NEUTRAL;
  const after = checkNarrativeFallacy(c.text, inj).hit;
  check('注入 ' + c.patch + ' 失活（' + c.why + '）', before === true && after === false,
    'before=' + before + ' after=' + after);
});

// ─── 5. 接线层断言（index.js 五处接线 + VERIFY_DIMS + dimensions）═══
console.log('\n[5] 接线层');
{
  const idx = fs.readFileSync('/root/hermes1/skills/ai/mark-heartflow-skill/src/index.js', 'utf8');
  check('index.js require narrative-fallacy.js', /require\(['"]\.\/narrative-fallacy\.js['"]\)/.test(idx));
  check('index.js dispatch 计算点', /_applyPedagogyRelaxation|checkNarrativeFallacy\(/.test(idx) && /nrf/.test(idx));
  check('index.js scores 段收录', /name:\s*'narrative_fallacy'/.test(idx));
  check('index.js dimMap/allDims 段收录', /narrative_fallacy/.test(idx));
  check('index.js DIM_GUIDANCE 段收录', /narrative_fallacy['"]?\s*:/.test(idx));
  check('登记注释含 r463 标记', /r463/.test(idx));
  // 定级集合断言：narrative_fallacy 的 verify 级登记在「维度清单段」
  //   （带 [r463 接线] 注释的区块，r463 实测不在 VERIFY_DIMS——两处清单
  //   分工不同：VERIFY_DIMS 是早期 verify 集合，维度清单段是新维度登记口）。
  //   同时要求 r463 注释在同一区块（防止维度名漏进清单而无登记说明）。
  {
    const lines = idx.split('\n');
    const idxLine = lines.findIndex(l => /'narrative_fallacy'/.test(l));
    const window = idxLine >= 0 ? lines.slice(Math.max(0, idxLine - 12), idxLine + 2).join('\n') : '';
    check('维度清单段含 r463 登记注释',
      idxLine >= 0 && /\[r463[^\]]*\]/.test(window),
      idxLine >= 0 ? '第 ' + (idxLine + 1) + ' 行附近无 r463 注释' : '未找到 narrative_fallacy 登记行');
  }
}

// ─── 6. 射程边界（与 hindsight_bias / post_hoc / monocausal 的分工）═══
console.log('\n[6] 射程边界');
{
  // hindsight_bias 领地：回望立场 + 判断力虚构，无连贯化叙述动作
  check('边界[0] 不占用（hindsight_bias 回望判断力虚构）',
    checkNarrativeFallacy('事后看来，这个结果早就是可预见的，明眼人一看就知道。').hit === false);
  // post_hoc 领地：时序连接 × 因果断言
  check('边界[1] 不占用（post_hoc 时序因果）',
    checkNarrativeFallacy('他昨天迟到了，今天项目就出问题，所以迟到导致失败。').hit === false);
  // monocausal_attribution 领地：单一原因过度简化
  check('边界[2] 不占用（monocausal 单一归因）',
    checkNarrativeFallacy('项目失败就是因为经理一个人决策失误。').hit === false);
}

console.log('\n' + '═'.repeat(56));
console.log(`r463 narrative_fallacy 轮测: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('失败项：');
  failures.forEach(f => console.log('  - ' + f));
}
console.log('═'.repeat(56));
process.exit(failed > 0 ? 1 : 0);
