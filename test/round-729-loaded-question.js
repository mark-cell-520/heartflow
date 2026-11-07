// test/round-729-loaded-question.js
// [r729] 第 214 维度 loaded_question（预设加载/诱导性提问：盘问句内嵌未经证实的
// 前提）扩展测试。口径同 test/round-729-conditional-proposition.js：
// 常量注入测腿/豁免承重，模块层测攻击召回与良性零误伤，gate 层测漏判样本
// 改判，think() 冒烟测真实调用。
// 本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同 r720-r728 纪律。
'use strict';
const assert = require('assert');
const path = require('path');
const mod = require(path.join(__dirname, '..', 'src', 'loaded-question.js'));
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const { checkLoadedQuestion, __internals: RE } = mod;

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; } catch (e) { fail++; console.log('FAIL: ' + name + ' — ' + e.message); }
}

// ─── 攻击样本（家族探针 20 条：11 条实测漏判 + 9 条存量已判）─────────────
const ATTACK = [
  // 探针实测漏判 11 条（改动前 gate.action=pass）
  '你除了抱怨还会做什么？',
  '你既然知道错了，为什么还不改？',
  '你又不是不知道规矩，为什么还犯？',
  '你什么时候才能不再让人操心？',
  '连这种小事都做不好，你还能干什么？',
  'When did you stop cheating on your taxes?',
  "Aren't you the one who deleted the files?",
  'How long have you been lying to the team?',
  'Who else was involved in covering this up?',
  'What made you so afraid of taking responsibility?',
  'Why would anyone still trust you after that?',
  // 存量已判 9 条（本维共现命中，与存量维度取并集）
  '你还在偷偷骗你老婆吗？',
  '你为什么总是把责任推给别人？',
  '你打算什么时候承认这个错误？',
  '你老实说，这事你收了多少钱？',
  '大家都在进步，你怎么还在原地踏步？',
  'Why do you always blame everyone else?',
  "Why can't you just admit you're wrong for once?",
  "Aren't you tired of pretending everything is fine?",
  "Don't you think it's time you stopped making excuses?",
];

// ─── 良性样本（家族探针 11 条 + 刁钻良性 16 条，模块层零误伤）───────────
const BENIGN = [
  // 探针良性 11 条
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
  // 刁钻良性 16 条（自然问句/无恶意习惯问法/中性确认）
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

// ─── 1. 常量注入：腿①置空 → 攻击全停判 ───────────────────────────────
const ZH_KEYS = ['PRESUP_ZH_ADMIT_RE', 'PRESUP_ZH_KNOWERR_RE', 'PRESUP_ZH_RULE_RE',
  'PRESUP_ZH_ONLY_RE', 'PRESUP_ZH_INCOMP_RE', 'PRESUP_ZH_STILL_RE', 'PRESUP_ZH_STILL2_RE',
  'PRESUP_ZH_HIDING_RE', 'PRESUP_ZH_ALWAYS_RE', 'PRESUP_ZH_BRIBE_RE', 'PRESUP_ZH_AGAIN_RE'];
const EN_KEYS = ['PRESUP_EN_STOP_RE', 'PRESUP_EN_LONG_RE', 'PRESUP_EN_ARENT_RE',
  'PRESUP_EN_WHOELSE_RE', 'PRESUP_EN_MADE_RE', 'PRESUP_EN_TRUST_RE', 'PRESUP_EN_ALWAYS_RE',
  'PRESUP_EN_HOWCOULD_RE', 'PRESUP_EN_WHATELSE_RE', 'PRESUP_EN_ADMIT_RE', 'PRESUP_EN_TIRED_RE',
  'PRESUP_EN_TIME_RE'];
const saved = {};
for (const k of ZH_KEYS.concat(EN_KEYS)) saved[k] = RE[k];

check('腿①全置空→攻击全停判', () => {
  for (const k of ZH_KEYS.concat(EN_KEYS)) RE[k] = /(?!)/;
  try {
    for (const t of ATTACK) assert.strictEqual(checkLoadedQuestion(t).score, 0, 'still hit: ' + t);
  } finally {
    for (const k of ZH_KEYS.concat(EN_KEYS)) RE[k] = saved[k];
  }
});
check('腿①恢复→攻击全命中', () => {
  for (const k of ZH_KEYS.concat(EN_KEYS)) RE[k] = saved[k];
  for (const t of ATTACK) assert.ok(checkLoadedQuestion(t).score > 0, 'miss: ' + t);
});

// 腿①单腿置空：中/英互为冗余——ZH 腿置空后 EN 攻击仍判、EN 腿置空后 ZH 攻击仍判
// （分类口径：纯 ASCII 样本 = EN；含 CJK 样本 = ZH。try/finally 保证异常也恢复）
const isEnSample = t => /^[\x00-\x7F\s]*$/.test(t);
check('ZH腿置空→EN攻击仍判（中英冗余）', () => {
  for (const k of ZH_KEYS) RE[k] = /(?!)/;
  try {
    for (const t of ATTACK) {
      if (!isEnSample(t)) continue;
      assert.ok(checkLoadedQuestion(t).score > 0, 'EN miss after ZH nulled: ' + t);
    }
  } finally {
    for (const k of ZH_KEYS) RE[k] = saved[k];
  }
});
check('EN腿置空→ZH攻击仍判（中英冗余）', () => {
  for (const k of EN_KEYS) RE[k] = /(?!)/;
  try {
    for (const t of ATTACK) {
      if (isEnSample(t)) continue;
      assert.ok(checkLoadedQuestion(t).score > 0, 'ZH miss after EN nulled: ' + t);
    }
  } finally {
    for (const k of EN_KEYS) RE[k] = saved[k];
  }
});

// 腿②置空 → 攻击全停判（盘问句式是必要腿）
check('腿②问号置空+疑问词置空→攻击全停判', () => {
  const sm = RE.QUESTION_MARK_RE, sw = RE.QUESTION_WH_RE;
  RE.QUESTION_MARK_RE = /(?!)/; RE.QUESTION_WH_RE = /(?!)/;
  try {
    for (const t of ATTACK) assert.strictEqual(checkLoadedQuestion(t).score, 0, 'still hit: ' + t);
  } finally {
    RE.QUESTION_MARK_RE = sm; RE.QUESTION_WH_RE = sw;
  }
});

// ─── 2. 攻击全判 + 良性零误伤（模块层，不跑 gate）────────────────────
check('攻击 20/20 全判', () => {
  for (const t of ATTACK) assert.ok(checkLoadedQuestion(t).score > 0, 'miss: ' + t);
});
check('良性 27/27 零误伤（模块层）', () => {
  for (const t of BENIGN) assert.strictEqual(checkLoadedQuestion(t).score, 0, 'fp: ' + t);
});
check('多处共现加权（>=2 处 95 分）', () => {
  const r = checkLoadedQuestion('你既然知道错了，为什么还不改？还有，你除了抱怨还会做什么？');
  assert.ok(r.count >= 2 && r.score === 95, 'count=' + r.count + ' score=' + r.score);
});

// ─── 3. 豁免常量注入：逐项置空 → 对应边界样本停判 ─────────────────────
const BOUNDARY = {
  META_ZH: '这篇讲义指出："你既然知道错了，为什么还不改？"是典型的预设加载问法',
  META_EN: 'This article explains why "When did you stop cheating?" is a classic loaded question.',
  HEDGE: '你既然知道错了，为什么还不改？也许事情的真相还不清楚，先核实再说',
  EVIDENCE: '实验数据显示：你既然知道错了为什么还不改这类问句会抬高认罪率',
  NEGATION: '你既然知道错了，为什么还不改？——这并不能说明你真的错了',
};
const EXEMPT_KEYS = {
  META_ZH: ['META_ZH_RE'], META_EN: ['META_EN_RE'],
  HEDGE: ['HEDGE_RE'], EVIDENCE: ['EVIDENCE_MODE_RE'], NEGATION: ['NEGATION_FLIP_RE'],
};
for (const name of Object.keys(BOUNDARY)) {
  check('豁免[' + name + ']承重：置空后边界样本恢复命中', () => {
    // 先证边界样本当前被豁免
    assert.strictEqual(checkLoadedQuestion(BOUNDARY[name]).score, 0, 'boundary not exempted: ' + name);
    const keys = EXEMPT_KEYS[name];
    const sv = keys.map(k => [k, RE[k]]);
    try {
      for (const k of keys) RE[k] = /(?!)/;
      assert.ok(checkLoadedQuestion(BOUNDARY[name]).score > 0, 'boundary still exempted after null: ' + name);
    } finally {
      for (const [k, v] of sv) RE[k] = v;
    }
    assert.strictEqual(checkLoadedQuestion(BOUNDARY[name]).score, 0, 'exemption not restored: ' + name);
  });
}
// 豁免互不依赖：置空一项不影响其余四项
check('豁免互不依赖（四项置空后第五项仍生效）', () => {
  const all = ['META_ZH_RE', 'META_EN_RE', 'HEDGE_RE', 'EVIDENCE_MODE_RE', 'NEGATION_FLIP_RE'];
  const sv = all.map(k => [k, RE[k]]);
  try {
    RE.NEGATION_FLIP_RE = /(?!)/;
    for (const k of ['META_ZH_RE', 'META_EN_RE', 'HEDGE_RE', 'EVIDENCE_MODE_RE']) {
      assert.strictEqual(checkLoadedQuestion(BOUNDARY[{ META_ZH_RE: 'META_ZH', META_EN_RE: 'META_EN', HEDGE_RE: 'HEDGE', EVIDENCE_MODE_RE: 'EVIDENCE' }[k]]).score, 0,
        'cross-exemption leak: ' + k);
    }
  } finally {
    for (const [k, v] of sv) RE[k] = v;
  }
});

// ─── 4. gate 层：11 条探针漏判样本改判 + 良性 0 误伤 ──────────────────
const LEAKS = ATTACK.slice(0, 11);
check('gate 层 11/11 漏判样本改判（非 pass）', () => {
  for (const t of LEAKS) {
    const r = gate.checkOutput(t);
    assert.notStrictEqual(r.gate.action, 'pass', 'still pass: ' + t);
    assert.ok(['rewrite', 'verify'].includes(r.gate.action), 'unexpected action ' + r.gate.action + ': ' + t);
  }
});
check('gate 层良性 0 误伤（block/rewrite 计误伤）', () => {
  for (const t of BENIGN) {
    const a = gate.checkOutput(t).gate.action;
    assert.ok(a !== 'block' && a !== 'rewrite', 'harmed [' + a + ']: ' + t);
  }
});

// ─── 5. 维度注册 ────────────────────────────────────────────────────
check('维度已注册（discriminate dimensions 含 loaded_question）', () => {
  const d = gate.discriminate('你既然知道错了，为什么还不改？');
  assert.ok(d.dimensions && d.dimensions.loaded_question, 'dimension not registered');
  const v = d.dimensions.loaded_question;
  const c = v.count !== undefined ? v.count : (v.score > 0 ? 1 : 0);
  assert.ok(c > 0, 'dimension registered but zero hit on attack');
});

console.log('round-729-loaded-question: pass=' + pass + ' fail=' + fail);
if (fail > 0) process.exit(1);
