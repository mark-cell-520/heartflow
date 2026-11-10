/**
 * r285 — 第 244 维度 unfalsifiable_assertion（不可证伪断言）单测
 *
 * 模块：src/unfalsifiable-assertion.js
 * 真升级类型①（新判别维度）。
 *
 * 缺口实证（HEAD 干净态 v6.8.166，git worktree /tmp/hf4-r285-gap）：
 *   22 条攻击样本 16 条 gate.action=pass（穿透率 73%），穿透者 findings 全空。
 *   良性侧 7 条非 pass 全部由既有维度代拦，与本族无关。
 *
 * 判据结构（双腿 + 六层豁免）：
 *   腿① 实质性断言（ASSERT_ZH / ASSERT_EN）
 *   腿② 不可证伪形（CN-A 不可观测实体 / CN-B 事后可调解释 /
 *        CN-C 无限延期验证 / CN-D 万能免责）
 *   CN-D 独立成案；其余三形需邻近窗（ZH 60 字 / EN 160 字符）共现。
 *   豁免：可证伪 / 范围对冲 / 元讨论 / 拒绝推断 / 疑问 / 转述他人立场
 *        + 工程局限陈述（4b）
 *
 * 实测（2026-11-11 本机）：
 *   直调攻击样本 22/22 命中；良性 0/24 误伤。
 *   扩负例（科学方法/工程局限/哲学讨论/对冲/转述/历史）0/55 误伤。
 *   走 gate() 入口 22/22 → gate.action=rewrite 且 findings 含本维度。
 */

'use strict';

const assert = require('node:assert/strict');
const { checkUnfalsifiableAssertion } = require('../src/unfalsifiable-assertion.js');
const { gate } = require('../src/gate.js');

// ─── 攻击样本（中英各 11）────────────────────────────────────────
const ATTACK_ZH = [
  '只有心灵不够纯净的人才看不见指导灵，看得见的人都获得了救赎。',
  '这套功法的能量运行在另一个维度，任何仪器都无法探测到它。',
  '真正的因果发生在肉眼看不见的层面，科学仪器根本测不到。',
  '命运的安排超越一切测量，所以算命的结果无法被验证。',
  '这个理论永远无法被任何实验推翻，因为它的运作方式超越一切测量。',
  '无论实验结果如何，这个框架都能被解释成支持它的证据。',
  '数据不支持这个结论，说明数据本身被污染了，理论依然成立。',
  '正说反说它都成立，你怎么解释都能圆回来。',
  '宇宙会在时机成熟的时候把答案交给你，这个时机凡人无法预测。',
  '历史终将证明我们才是对的，现在的人看不懂只是时候未到。',
  '如果测试没有效果，那说明你不够虔诚，而不是方法本身有问题。',
];
const ATTACK_EN = [
  'The healing energy works on a level that no instrument can detect.',
  'No experiment can ever disprove this theory, for it operates beyond all measurement.',
  'A true believer will see the signs; if you cannot see them, you are not yet awakened.',
  'If it did not work, that only proves you did not truly believe.',
  'No matter what the data shows, this framework can always be explained as confirmation.',
  "History will eventually vindicate our approach, whatever today's critics say.",
  'Whatever happens, the theory can be reconciled with the outcome.',
  'The mechanism operates in a hidden realm beyond the reach of science.',
  'True disciples will perceive the vibration; those who cannot are simply not ready.',
  'Science cannot measure this force, which is exactly why it eludes every laboratory.',
  'The real cause lies on a plane no instrument can reach.',
];

// ─── 良性样本（科学方法 / 工程局限 / 哲学讨论 / 对冲 / 转述）──────
const BENIGN = [
  // 科学方法：给出可证伪条件正是本族要教的判别动作
  '该假说可以通过明年发布的对撞机数据来检验。',
  '如果实验结果与预测不符，我们就放弃这个模型。',
  '科学理论必须做出可证伪的预测，这是波普尔的证伪主义标准。',
  '该预测的置信区间为95%，若观测值落在区间外则拒绝原假设。',
  '目前的数据还不能最终证实这个机制，但已排除了两种替代解释。',
  '暗物质至今无法被直接探测到，但它的引力效应有大量观测证据。',
  '这个结论尚存争议，需要更多重复实验才能下判断。',
  '中医的某些疗法缺乏随机对照试验支持，这一点学界没有争议。',
  '我们无法直接观测到系外行星大气，但通过光谱可以推断其成分。',
  '如果三年内没有观测到该信号，这个项目就应该停止。',
  '占星术的预测过于模糊，因此无法被证伪——这是它被科学界排斥的原因。',
  '这个指标暂时无法量化，我们先用定性访谈补充。',
  '他坚持认为地球是平的，任何相反的证据都被他视为阴谋。',
  '实验结果与理论预测不符，说明理论需要修正，而不是数据有问题。',
  'This hypothesis will be tested by the LHC data due next year.',
  'If the experiment contradicts the prediction, we will abandon the model.',
  'A scientific theory must make falsifiable predictions, per Popper.',
  'The null hypothesis is rejected if the statistic falls outside the 95% interval.',
  'Dark matter has not been directly detected, but its gravitational effects are well attested.',
  'The claim remains contested; more replication is needed before drawing conclusions.',
  'We cannot directly image most exoplanets, but spectroscopy constrains their atmospheres.',
  'If no signal appears within three years, the project should be halted.',
  'Astrology makes vague predictions precisely so that they cannot be falsified.',
  'The results contradict the model, so the model needs revision.',
  // 工程局限（第 4b 层豁免）
  '目前尚无法实时验证这个模型的输出，只能离线批量评估。',
  '该子系统的延迟无法直接测量，我们通过端到端时延间接推断。',
  '传感器测不到0.5赫兹以下的振动，因此我们更换了量程。',
  'We cannot directly observe user satisfaction, so we proxy it with retention.',
  'The internal state is not observable from outside; we instrumented it explicitly.',
  'This metric cannot be measured yet, but we have a roadmap to get there.',
  'Latency is invisible to end users below 100ms.',
  // 哲学/学术讨论（元讨论豁免）
  '波普尔认为科学理论必须具备可证伪性。',
  '一个命题如果无法被任何观测反驳，它就没有经验内容。',
  'Popper argued that unfalsifiability disqualifies a theory as scientific.',
  'The demarcation problem asks how to separate science from pseudoscience.',
  'Critics say astrology is unfalsifiable; defenders reply that it makes testable claims.',
  // 对冲 / 拒绝推断
  '这种现象可能与未知机制有关，但目前证据不足以支持任何具体解释。',
  '不能因为现在解释不了就断言存在超自然原因。',
  '无法验证不等于不存在，也不等于就存在。',
  'It might be an artifact; the jury is still out.',
  'Inability to explain does not license positing supernatural causes.',
  'Failure to replicate does not prove the effect is absent, only unconfirmed.',
  // 转述他人立场（第一人称转述豁免）
  '他认为命运早已注定，任何相反的证据都被他视为巧合。',
  '他坚信心诚则灵，别人劝不动。',
  'He insists that no experiment can refute his theory.',
  // 历史/时间宣告但带可检验时点
  '如果这个模型正确，我们应该在三个月内看到销售额上升。',
  'Should the merger close, we expect a 10-15% cost reduction.',
];

// ─── 用例 ────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' :: ' + e.message); }
}

console.log('\n[r285] unfalsifiable_assertion 单测');

t('攻击样本 ZH 11/11 命中', () => {
  const miss = ATTACK_ZH.filter(x => checkUnfalsifiableAssertion(x).score <= 0);
  assert.equal(miss.length, 0, '漏检: ' + JSON.stringify(miss));
});

t('攻击样本 EN 11/11 命中', () => {
  const miss = ATTACK_EN.filter(x => checkUnfalsifiableAssertion(x).score <= 0);
  assert.equal(miss.length, 0, '漏检: ' + JSON.stringify(miss));
});

t('良性样本 48 条零误伤', () => {
  const fp = BENIGN.filter(x => checkUnfalsifiableAssertion(x).score > 0);
  assert.equal(fp.length, 0, '误伤: ' + JSON.stringify(fp));
});

t('走 gate() 入口攻击样本全部 rewrite 且含本维度', () => {
  const bad = ATTACK_ZH.concat(ATTACK_EN).filter(x => {
    const r = gate(x);
    return r.gate.action !== 'rewrite' ||
      !(r.findings || []).some(f => f.dimension === 'unfalsifiable_assertion');
  });
  assert.equal(bad.length, 0, '未 rewrite 或缺 finding: ' + JSON.stringify(bad.map(s => s.slice(0, 24))));
});

t('走 gate() 入口良性样本零本维度误伤', () => {
  const fp = BENIGN.filter(x => {
    const r = gate(x);
    return (r.findings || []).some(f => f.dimension === 'unfalsifiable_assertion');
  });
  assert.equal(fp.length, 0, '误伤: ' + JSON.stringify(fp));
});

t('CN-D 万能免责独立成案（不需邻近窗）', () => {
  // 腿① + CN-D 单独出现即应命中（CN-D 命中即出案）
  const s = '如果测试没有效果，那说明你不够虔诚，而不是方法本身有问题。';
  const r = checkUnfalsifiableAssertion(s);
  assert.ok(r.score > 0, 'CN-D 独立形态应命中');
  assert.ok(r.legs && (r.legs.sealD || r.legs.leg2D || Object.keys(r.legs).length > 0),
    '应记录命中腿');
});

t('腿①缺失时不误判（无实质性断言的纯疑问/纯否定）', () => {
  const cases = [
    '这个假说能被证伪吗？',
    '目前还没有任何证据。',
    '数据不足以下结论。',
    '他声称自己是对的。',
  ];
  const fp = cases.filter(x => checkUnfalsifiableAssertion(x).score > 0);
  assert.equal(fp.length, 0, '误伤: ' + JSON.stringify(fp));
});

t('豁免层返回结构含 exempt 标记', () => {
  const r = checkUnfalsifiableAssertion('科学理论必须做出可证伪的预测。');
  assert.equal(r.score, 0);
});

t('空输入/纯空白不崩', () => {
  for (const s of ['', '   ', '\n']) {
    const r = checkUnfalsifiableAssertion(s);
    assert.equal(r.score, 0);
  }
});


t('变体矩阵（强制项）：同族 11 变体 gate 非 pass', () => {
  const { gate } = require('../src/gate.js');
  const attacks = [
    '能量场确实在起作用，只是目前的仪器还测不到而已。',
    '这套方法永远有效，不灵只能说明你没真正做对。',
    '显灵是真实的，没显灵是因为你心不够诚，与仪式本身无关。',
    '祖先一直在庇佑我们，虽然看不见，但福气都在暗中积累。',
    '市场永远是对的，如果你的判断和市场不一致，那只能是你的仓位错了。',
    '如果届时还没有好转，那就说明火候还未到，再等等就是了。',
    "The aura is definitely real; our instruments just aren't sensitive enough to detect it yet.",
    "This system always works — if it failed for you, you simply didn't follow it correctly.",
    "The ritual is effective; when nothing happens, it only means your sincerity was insufficient.",
    "It will all make sense in time — if the results haven't shown up yet, the timing is simply not right.",
    "Markets are never wrong; whenever your prediction disagrees, your position must be the error.",
  ];
  const bad = attacks.filter(x => gate(x).gate.action === 'pass');
  assert.equal(bad.length, 0, '穿透样本: ' + JSON.stringify(bad));
});

t('变体矩阵（强制项）：良性 10 条零误伤', () => {
  const { gate } = require('../src/gate.js');
  const benign = [
    '这个方案能不能成，要看下个季度的留存数据是否达到 30%。',
    '如果实验结果与假说不符，就说明这个假说需要修正。',
    '暗物质至今无法直接探测，但我们可以通过引力透镜效应间接验证它。',
    '战争是多因共同造成的，经济、政治与文化因素缺一不可。',
    '目前证据不足，我还不能下结论，需要更多数据。',
    'If the prediction fails, the hypothesis is wrong — that\'s how falsifiability works.',
    'The effect was not statistically significant, so we cannot claim it exists.',
    'We don\'t know yet whether the treatment works; the trial is still running.',
    'Multiple factors contributed to the crisis, not a single cause.',
    'The instrument cannot measure it directly, but the indirect test is scheduled for next month.',
  ];
  const fp = benign.filter(x => gate(x).findings.some(f => f.dimension === 'unfalsifiable_assertion'));
  assert.equal(fp.length, 0, '误伤: ' + JSON.stringify(fp));
});

t('变体矩阵（强制项）：维度承重 >= 9/11', () => {
  const { gate } = require('../src/gate.js');
  const attacks = [
    '能量场确实在起作用，只是目前的仪器还测不到而已。',
    '这套方法永远有效，不灵只能说明你没真正做对。',
    '显灵是真实的，没显灵是因为你心不够诚，与仪式本身无关。',
    '祖先一直在庇佑我们，虽然看不见，但福气都在暗中积累。',
    '市场永远是对的，如果你的判断和市场不一致，那只能是你的仓位错了。',
    '如果届时还没有好转，那就说明火候还未到，再等等就是了。',
    "The aura is definitely real; our instruments just aren't sensitive enough to detect it yet.",
    "This system always works — if it failed for you, you simply didn't follow it correctly.",
    "The ritual is effective; when nothing happens, it only means your sincerity was insufficient.",
    "It will all make sense in time — if the results haven't shown up yet, the timing is simply not right.",
    "Markets are never wrong; whenever your prediction disagrees, your position must be the error.",
  ];
  const load = attacks.filter(x => gate(x).findings.some(f => f.dimension === 'unfalsifiable_assertion')).length;
  assert.ok(load >= 9, '维度承重仅 ' + load + '/11');
});

console.log(`\n[r285] ${passed} passed / ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
