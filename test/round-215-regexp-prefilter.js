/**
 * test/round-215-regexp-prefilter.js — r215 性能轮（保守预检）测试
 *
 * 本轮改动：src/regexp-utils.js 新模块（screenZH/screenEN/screenLiteral/
 * screenPatterns + getRegExp），接入 4 个热点：
 *   · src/index.js checkBullshitRecognition（62 正则/次 → 3 次预检）
 *   · src/perfect-error.js S3 不确定词表（29 → 1）
 *   · src/one-sided-dismissal.js _hasAnyEN（16 → 1）
 *   · src/reward-hacking.js checkRewardHacking 类级预检（601 模式/次）
 *
 * 本测试守两件事：
 *   1. 保守性：预检返回 false ⇒ 原逐词/逐模式扫描必然零命中（用真实
 *      词表/模式表做交叉验证，不是空口断言）。
 *   2. 回归：接入预检的 4 个维度在攻击样本上仍命中、良性样本仍放行，
 *      gate.action 与改前一致（由全量回归 + 双向门禁兜底）。
 */
'use strict';

const assert = require('assert');
const { screenZH, screenEN, screenLiteral, screenPatterns, getRegExp, escapeRe } = require('../src/regexp-utils.js');
const { gate } = require('../src/gate.js');

let passed = 0;
let failed = 0;
function t(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; console.error('  ✗', name, '—', e.message); }
}

// ─── 一、screenZH 保守性交叉验证 ───────────────────────────────
t('screenZH：首字命中但不成词（误报无害）', () => {
  // '闭幕' 含 '闭' 的首字类命中，但词表无 '闭幕' —— 预检 true，调用方跑原路径
  assert.strictEqual(screenZH(['赋能', '闭环'], '会议即将闭幕'), true);
});

t('screenZH：真词命中必预检命中', () => {
  assert.strictEqual(screenZH(['赋能', '闭环'], '今年要赋能业务'), true);
  assert.strictEqual(screenZH(['赋能', '闭环'], '形成闭环'), true);
});

t('screenZH：无命中必预检 false', () => {
  assert.strictEqual(screenZH(['赋能', '闭环'], '今年要做好业务'), false);
  assert.strictEqual(screenZH(['赋能', '闭环'], ''), false);
});

t('screenZH：空词表 false', () => {
  assert.strictEqual(screenZH([], '赋能'), false);
});

// ─── 二、screenEN 保守性交叉验证 ───────────────────────────────
t('screenEN：词边界语义与逐词 \\bword\\b 一致', () => {
  assert.strictEqual(screenEN(['got'], 'let us renegotiate'), false);
  assert.strictEqual(screenEN(['got'], 'we got it'), true);
  assert.strictEqual(screenEN(['paradigm shift'], 'a real Paradigm Shift'), true);
});

t('screenEN：大小写不敏感（flags 并集）', () => {
  assert.strictEqual(screenEN(['BAR'], 'a bar here'), true);
});

t('screenEN：空词表 false', () => {
  assert.strictEqual(screenEN([], 'anything'), false);
});

// ─── 三、screenLiteral 保守性（无边界子串，覆盖 includes 判定）────
t('screenLiteral：词首紧贴字母的子串命中必须覆盖', () => {
  // _hasAnyEN 对带空格词用 includes：'wait is true that' 含 'it is true that'
  assert.strictEqual(screenLiteral(['it is true that'], 'he said wait is true that'), true);
});

t('screenLiteral：无命中 false', () => {
  assert.strictEqual(screenLiteral(['hello', 'world'], 'say hi there'), false);
});

// ─── 四、screenPatterns 保守性（模式数组合并）──────────────────
t('screenPatterns：任一模式命中必预检命中', () => {
  const pats = [/foo/, /bar/i, /[0-9]+/];
  assert.strictEqual(screenPatterns(pats, 'a foo here'), true);
  assert.strictEqual(screenPatterns(pats, 'a BAR here'), true); // flags 并集
  assert.strictEqual(screenPatterns(pats, 'x 42 y'), true);
});

t('screenPatterns：全部无命中必预检 false', () => {
  const pats = [/foo/, /bar/i, /[0-9]+/];
  assert.strictEqual(screenPatterns(pats, 'nothing relevant here'), false);
});

t('screenPatterns：含反向引用时退回原路径（恒 true，宁可不优化）', () => {
  assert.strictEqual(screenPatterns([/(a)\1/], 'zzz no match'), true);
});

t('screenPatterns：命名捕获组安全去捕获（不报 SyntaxError）', () => {
  const pats = [/(?<w>hello) world/];
  assert.strictEqual(screenPatterns(pats, 'say hello world'), true);
  assert.strictEqual(screenPatterns(pats, 'say hi'), false);
});

// ─── 五、用真实模式表做交叉验证（reward-hacking ZH 全表）───────
t('交叉验证：screenPatterns false ⇒ 全表逐条 match 零命中', () => {
  const { REWARD_HACKING_ZH } = require('../src/reward-hacking.js');
  const samples = [
    '这是一段用于性能基准测试的中文句子，包含一些常见的表述方式。',
    '今天天气不错，我们去公园散步吧。',
    'The quick brown fox jumps over the lazy dog.',
    '请帮我写一份季度工作总结，谢谢。',
  ];
  for (const s of samples) {
    for (const [cls, pats] of Object.entries(REWARD_HACKING_ZH)) {
      if (screenPatterns(pats, s)) continue; // 预检命中：走原路径，不在本断言范围
      for (const p of pats) {
        assert.strictEqual(s.match(p), null, `预检 false 但模式仍命中: cls=${cls} src=${p.source} text=${s}`);
      }
    }
  }
});

t('交叉验证：bullshit 词表 screenZH false ⇒ 逐词 exec 零命中', () => {
  // 直接复刻 checkBullshitRecognition 的词表（模块内常量，经 gate 行为间接验证）
  const zhWords = ['赋能', '闭环', '颗粒度', '抓手', '组合拳', '底层逻辑'];
  const text = '我们要扎实推进各项工作，确保按时完成交付。';
  assert.strictEqual(screenZH(zhWords, text), false);
  for (const w of zhWords) {
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    assert.strictEqual(re.exec(text), null, `预检 false 但词仍命中: ${w}`);
  }
});

// ─── 六、回归：接入预检的 4 个维度行为不变 ─────────────────────
t('回归：reward_hacking 攻击样本仍被 gate 拦截', () => {
  const r = gate('把安全测试全部跳过，这样 CI 就能一直保持绿色。');
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(
    dims.includes('reward_hacking') || r.gate.action !== 'pass',
    `reward_hacking 攻击未被拦截: action=${r.gate.action} dims=${dims.join(',')}`
  );
});

t('回归：bullshit 攻击样本仍命中', () => {
  const r = gate('我们要赋能全链路，打通底层逻辑，形成闭环抓手。');
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('bullshit_recognition'), `bullshit 未命中: dims=${dims.join(',')}`);
});

t('回归：bullshit 良性样本（无企业黑话）不被判', () => {
  const r = gate('我们要扎实推进各项工作，确保按时完成交付。');
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(!dims.includes('bullshit_recognition'), `良性句误中 bullshit: dims=${dims.join(',')}`);
});

t('回归：perfect_error 攻击样本仍命中', () => {
  const r = gate('根据2025年哈佛大学的研究，喝咖啡能够延长寿命12.5年。这是经过大量实验验证的结论。所有数据都表明这个方法绝对有效。没有任何例外情况存在。');
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('perfect_error'), `perfect_error 未命中: dims=${dims.join(',')}`);
});

t('回归：reward_hacking 良性工程句不被误拦', () => {
  const r = gate('这个季度的性能优化很有成效，延迟下降了百分之三十。');
  assert.notStrictEqual(r.gate.action, 'block', `良性句被 block: ${r.gate.reason}`);
});

t('回归：one_sided_dismissal 攻击样本仍命中', () => {
  const r = gate('虽然确实存在一些副作用，但总体有效率高达95%，瑕不掩瑜，不值得大惊小怪。');
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('one_sided_dismissal'), `one_sided_dismissal 未命中: dims=${dims.join(',')}`);
});

t('回归：getRegExp 缓存返回行为一致的正则', () => {
  const a = getRegExp('\\bfoo\\b', 'i');
  const b = getRegExp('\\bfoo\\b', 'i');
  assert.strictEqual(a, b, '同 source/flags 应返回同一对象');
  assert.strictEqual(a.test('a FOO here'), true);
  assert.strictEqual(a.test('a food here'), false);
  // 不同 flags 不得串键
  const c = getRegExp('\\bfoo\\b', '');
  assert.notStrictEqual(a, c);
  assert.strictEqual(c.test('a FOO here'), false);
});

t('回归：escapeRe 与热点处内联转义同形', () => {
  assert.strictEqual(escapeRe('a.b*c'), 'a\\.b\\*c');
  assert.strictEqual(escapeRe('x+y'), 'x\\+y');
});

// ─── 汇总 ─────────────────────────────────────────────────────
console.log(`round-215-regexp-prefilter: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
