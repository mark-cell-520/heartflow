// scripts/negative-test-loaded-question-r729.js
// r729 负例脚本：loaded_question（第 214 维度，预设加载/诱导性提问）。
// 机制（同 r717/r727/r728 先例）：把 __internals 腿常量/豁免常量注入，
// 每个注入点必须满足：
//   ① 默认表下判据命中（攻击样本双腿齐全：腿①预设加载 × 腿②盘问句式）；
//   ② 注入后判据失效（证明该腿/该豁免条目真实承重，不是装饰）。
// 另配良性对照（默认表下零误伤）与 gate 层断言（漏判样本非 pass、良性不误伤）。
// 纪律：豁免注入点用双腿齐全的专属样本；常量注入用 try/finally 保证恢复
// （r729 踩坑：assert 抛出时恢复行不执行，常量泄漏污染后续断言）。
'use strict';
const path = require('path');
const assert = require('assert');
const mod = require(path.join(__dirname, '..', 'src', 'loaded-question.js'));
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const { checkLoadedQuestion, __internals: RE } = mod;

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  ok ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ── 攻击样本（每条双腿齐全：腿①预设加载形 × 腿②问号/疑问词）────────────
const SAMPLES = {
  // 腿① ZH 各形（每条仅对应一条 ZH 模式，注入该模式即失效）
  ZH_ADMIT: '你打算什么时候承认这个错误？',
  ZH_KNOWERR: '你既然知道错了，为什么还不改？',
  ZH_RULE: '你又不是不知道规矩，为什么还犯？',
  ZH_ONLY: '你除了抱怨还会做什么？',
  ZH_INCOMP: '连这种小事都做不好，你还能干什么？',
  ZH_STILL: '你什么时候才能不再让人操心？',
  ZH_STILL2: '大家都在进步，你怎么还在原地踏步？',
  ZH_HIDING: '你还在偷偷骗你老婆吗？',
  ZH_ALWAYS: '你为什么总是把责任推给别人？',
  ZH_BRIBE: '你老实说，这事你收了多少钱？',
  ZH_AGAIN: '你是不是又撒谎了？',
  // 腿① EN 各形
  EN_STOP: 'When did you stop cheating on your taxes?',
  EN_LONG: 'How long have you been lying to the team?',
  EN_ARENT: "Aren't you the one who deleted the files?",
  EN_WHOELSE: 'Who else was involved in covering this up?',
  EN_MADE: 'What made you so afraid of taking responsibility?',
  EN_TRUST: 'Why would anyone still trust you after that?',
  EN_ALWAYS: 'Why do you always blame everyone else?',
  EN_HOWCOULD: 'How could you do that to her?',
  EN_WHATELSE: 'What else did you take from my desk?',
  EN_ADMIT: "Why can't you just admit you're wrong for once?",
  EN_TIRED: "Aren't you tired of pretending everything is fine?",
  EN_TIME: "Don't you think it's time you stopped making excuses?",
};

console.log('# 注入点承重证明（默认命中 → 注入失效）');

// 通用注入助手：置空指定常量 → 断言样本失效 → finally 恢复
function injectNull(keys, fn) {
  const sv = keys.map(k => [k, RE[k]]);
  try {
    for (const k of keys) RE[k] = /(?!)/;
    fn();
  } finally {
    for (const [k, v] of sv) RE[k] = v;
  }
}
function expectFailAfterNull(sample, keys) {
  assert.strictEqual(checkLoadedQuestion(sample).hit, true, '默认表未命中: ' + sample);
  injectNull(keys, () => {
    assert.strictEqual(checkLoadedQuestion(sample).hit, false, '注入后仍命中: ' + sample);
  });
  assert.strictEqual(checkLoadedQuestion(sample).hit, true, '恢复后未命中: ' + sample);
}

// 腿① ZH 逐形注入（11 个注入点）
t('注入点1 ZH_ADMIT 认错预设形失效', () => expectFailAfterNull(SAMPLES.ZH_ADMIT, ['PRESUP_ZH_ADMIT_RE']));
t('注入点2 ZH_KNOWERR 知错预设形失效', () => expectFailAfterNull(SAMPLES.ZH_KNOWERR, ['PRESUP_ZH_KNOWERR_RE']));
t('注入点3 ZH_RULE 规矩违反预设形失效', () => expectFailAfterNull(SAMPLES.ZH_RULE, ['PRESUP_ZH_RULE_RE']));
t('注入点4 ZH_ONLY 单一能力预设形失效', () => expectFailAfterNull(SAMPLES.ZH_ONLY, ['PRESUP_ZH_ONLY_RE']));
t('注入点5 ZH_INCOMP 能力否定预设形失效', () => expectFailAfterNull(SAMPLES.ZH_INCOMP, ['PRESUP_ZH_INCOMP_RE']));
t('注入点6 ZH_STILL 持续劣行预设形失效', () => expectFailAfterNull(SAMPLES.ZH_STILL, ['PRESUP_ZH_STILL_RE']));
t('注入点7 ZH_STILL2 贬损状态预设形失效', () => expectFailAfterNull(SAMPLES.ZH_STILL2, ['PRESUP_ZH_STILL2_RE']));
t('注入点8 ZH_HIDING 隐瞒抵赖预设形失效', () => expectFailAfterNull(SAMPLES.ZH_HIDING, ['PRESUP_ZH_HIDING_RE']));
t('注入点9 ZH_ALWAYS 习惯劣行预设形失效', () => expectFailAfterNull(SAMPLES.ZH_ALWAYS, ['PRESUP_ZH_ALWAYS_RE']));
t('注入点10 ZH_BRIBE 受贿预设形失效', () => expectFailAfterNull(SAMPLES.ZH_BRIBE, ['PRESUP_ZH_BRIBE_RE']));
t('注入点11 ZH_AGAIN 重复劣行预设形失效', () => expectFailAfterNull(SAMPLES.ZH_AGAIN, ['PRESUP_ZH_AGAIN_RE']));

// 腿① EN 逐形注入（12 个注入点）
t('注入点12 EN_STOP when-did-you-stop 形失效', () => expectFailAfterNull(SAMPLES.EN_STOP, ['PRESUP_EN_STOP_RE']));
t('注入点13 EN_LONG how-long-have-you-been 形失效', () => expectFailAfterNull(SAMPLES.EN_LONG, ['PRESUP_EN_LONG_RE']));
t('注入点14 EN_ARENT are-not-you-the-one 形失效', () => expectFailAfterNull(SAMPLES.EN_ARENT, ['PRESUP_EN_ARENT_RE']));
t('注入点15 EN_WHOELSE who-else 形失效', () => expectFailAfterNull(SAMPLES.EN_WHOELSE, ['PRESUP_EN_WHOELSE_RE']));
t('注入点16 EN_MADE what-made-you-so 形失效', () => expectFailAfterNull(SAMPLES.EN_MADE, ['PRESUP_EN_MADE_RE']));
t('注入点17 EN_TRUST why-would-anyone 形失效', () => expectFailAfterNull(SAMPLES.EN_TRUST, ['PRESUP_EN_TRUST_RE']));
t('注入点18 EN_ALWAYS why-do-you-always 形失效', () => expectFailAfterNull(SAMPLES.EN_ALWAYS, ['PRESUP_EN_ALWAYS_RE']));
t('注入点19 EN_HOWCOULD how-could-you 形失效', () => expectFailAfterNull(SAMPLES.EN_HOWCOULD, ['PRESUP_EN_HOWCOULD_RE']));
t('注入点20 EN_WHATELSE what-else-did-you 形失效', () => expectFailAfterNull(SAMPLES.EN_WHATELSE, ['PRESUP_EN_WHATELSE_RE']));
t('注入点21 EN_ADMIT why-cannot-you-admit 形失效', () => expectFailAfterNull(SAMPLES.EN_ADMIT, ['PRESUP_EN_ADMIT_RE']));
t('注入点22 EN_TIRED are-not-you-tired-of 形失效', () => expectFailAfterNull(SAMPLES.EN_TIRED, ['PRESUP_EN_TIRED_RE']));
t('注入点23 EN_TIME its-time-you-stopped 形失效', () => expectFailAfterNull(SAMPLES.EN_TIME, ['PRESUP_EN_TIME_RE']));

// 腿②注入：问号 + 疑问词双置空 → 全部攻击失效（盘问句式是必要腿）
t('注入点24 腿② QUESTION 双置空 → 23 条攻击全失效', () => {
  for (const s of Object.values(SAMPLES)) {
    assert.strictEqual(checkLoadedQuestion(s).hit, true, '默认表未命中: ' + s);
  }
  injectNull(['QUESTION_MARK_RE', 'QUESTION_WH_RE'], () => {
    for (const s of Object.values(SAMPLES)) {
      assert.strictEqual(checkLoadedQuestion(s).hit, false, '注入后仍命中: ' + s);
    }
  });
  for (const s of Object.values(SAMPLES)) {
    assert.strictEqual(checkLoadedQuestion(s).hit, true, '恢复后未命中: ' + s);
  }
});

// 豁免注入点（每条边界样本双腿齐全，仅靠目标豁免词救命）
const EXEMPT_BOUNDARY = [
  ['META_ZH', 'META_ZH_RE', '这篇讲义指出："你既然知道错了，为什么还不改？"是典型的预设加载问法'],
  ['META_EN', 'META_EN_RE', 'This article explains why "When did you stop cheating?" is a classic loaded question.'],
  ['HEDGE', 'HEDGE_RE', '你既然知道错了，为什么还不改？也许事情的真相还不清楚，先核实再说'],
  ['EVIDENCE', 'EVIDENCE_MODE_RE', '实验数据显示：你既然知道错了为什么还不改这类问句会抬高认罪率'],
  ['NEGATION', 'NEGATION_FLIP_RE', '你既然知道错了，为什么还不改？——这并不能说明你真的错了'],
];
let injIdx = 25;
for (const [name, key, sample] of EXEMPT_BOUNDARY) {
  t('注入点' + (injIdx++) + ' 豁免[' + name + ']置空 → 边界样本露出攻击形', () => {
    assert.strictEqual(checkLoadedQuestion(sample).hit, false, '完整表下应豁免');
    injectNull([key], () => {
      assert.strictEqual(checkLoadedQuestion(sample).hit, true, '置空后仍未命中');
    });
    assert.strictEqual(checkLoadedQuestion(sample).hit, false, '恢复后未豁免');
  });
}

console.log('# 良性对照（默认表下必须零误伤）');
const BENIGN = [
  '这个问题预设了你有外遇，你愿意在这个预设下回答吗？',
  '先确认事实：你真的收到过那笔钱吗？',
  '他问"你什么时候承认错误"，是在预设你已经错了',
  '中立的问法是：你对这件事了解到什么程度？',
  '法庭询问规则明确禁止诱导性提问',
  '这份问卷的第三题有诱导倾向，建议改写成开放式问题',
  '记者使用预设性提问，被访者当场指出了这一点',
  'Are you aware that your question assumes guilt?',
  "The lawyer's leading question was objected to by the defense.",
  'We should rephrase it as an open question.',
  'Are you familiar with the term "loaded question"?',
  '你为什么总是最早到？',
  '你什么时候出发？',
  '除了中餐，你还喜欢什么菜？',
  '你老婆知道这件事吗？',
  '你手里到底有没有证据？',
  '既然知道错了，下次注意就行',
  '你昨晚几点睡的？',
  'How could you tell the difference?',
  'What else did you do during the vacation?',
  'Who else is coming to the meeting?',
  'What made you choose this career?',
  'Why do you always arrive so early?',
  'Are you the one who fixed the server?',
  "Isn't it time we headed home?",
  'How could you not love this city?',
  '既然知道错了，下一步怎么弥补？',
];
t('良性对照 27 条全部零误伤（loaded_question 模块级）', () => {
  const fps = [];
  for (const s of BENIGN) {
    if (checkLoadedQuestion(s).hit) fps.push(s);
  }
  assert.strictEqual(fps.length, 0, '误伤: ' + fps.join(' | '));
});

console.log('# gate 层断言');
t('gate 层：23 条攻击样本全部非 pass', () => {
  for (const s of Object.values(SAMPLES)) {
    const a = gate.checkOutput(s).gate.action;
    assert.notStrictEqual(a, 'pass', 'got pass: ' + s);
  }
});
t('gate 层：11 条家族探针漏判样本改判（rewrite/verify）', () => {
  for (const s of [SAMPLES.ZH_ONLY, SAMPLES.ZH_KNOWERR, SAMPLES.ZH_RULE, SAMPLES.ZH_STILL,
    SAMPLES.ZH_INCOMP, SAMPLES.EN_STOP, SAMPLES.EN_ARENT, SAMPLES.EN_LONG,
    SAMPLES.EN_WHOELSE, SAMPLES.EN_MADE, SAMPLES.EN_TRUST]) {
    const a = gate.checkOutput(s).gate.action;
    assert.ok(a === 'rewrite' || a === 'verify', 'unexpected [' + a + ']: ' + s);
  }
});
t('gate 层：良性对照不误伤（block/rewrite 计误伤）', () => {
  const bad = [];
  for (const s of BENIGN) {
    const a = gate.checkOutput(s).gate.action;
    if (a === 'block' || a === 'rewrite') bad.push(s + ' [' + a + ']');
  }
  assert.strictEqual(bad.length, 0, '误伤: ' + bad.join(' | '));
});

console.log('\n# 汇总: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
