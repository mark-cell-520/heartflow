'use strict';
/**
 * test/round-265-hindsight-bias.test.js
 * [r265] hindsight_bias（第 175 维度 VERIFY）全新措辞家族扩展
 * （真升级②，live 生效，维度计数不变，src/index.js 零改动）。
 *
 * r265 池化探针实测（coordination/agent4/probes/r265-probe-pool.js，
 * v6.8.156）：本族 7 条新措辞攻击 5 条穿透（gate.action=pass 且零维度
 * 承重），落地新族：
 *   PRED_POST_ZH += 事后声言族（我早就说过/当初我就料到/一早就料到）
 *     + 果然/果真应验副词
 *   OUT_ZH += 口语化结果族（出轨/黄了/挂了/离了/吹了/闹翻/谈崩）
 *   PRED_POST_EN += 第一人称事后应验族（just as I expected/predicted）
 *   OUT_EN += 企业死亡口语族（died/shut down/folded/went under）
 *   EXEMPT_NEWINFO_EN += post-mortem / retrospective review
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条
 * 承重（含豁免反向注入）+ r177 存量回归 + 登记。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkHindsightBias, __internals } = require(path.join(ROOT, 'src', 'hindsight-bias.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hit = (t, inj) => checkHindsightBias(t, inj).hit === true;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. 新攻击矩阵 ────────────────────────────────────────────────
const NEW_ATTACKS = [
  // ZH 果然应验副词 × 分手（旧 OUT）
  '这对果然还是分手了，事实证明她的眼光一直很准。',
  // ZH 早就料到声言 × 倒闭（旧 OUT）
  '这家公司最后还是倒闭了，我早就料到撑不过三年。',
  // EN died（新 OUT）× just as I expected（新 POST）
  'The startup died last month, just as I expected from day one.',
  // ZH 出轨（新 OUT）× 果然（新 POST）
  '他后来果然出轨了，我第一眼就看出来这人靠不住。',
  // ZH 我早说过（新 POST）× 翻车（旧 OUT）
  '产品果然翻车了，我早说过那个功能没人用，当初没人信我。',
  // EN crashed（旧 OUT）× just as I predicted（新 POST）
  'The market crashed, just as I predicted — nobody listened to my warnings last year.',
  // 存量强形句（确保新腿落地后仍命中）
  '果不其然，融到的钱烧完了，不出所料这条路走不通。',
];
NEW_ATTACKS.forEach((s, i) => t('攻击-' + (i + 1), () => assert.strictEqual(hit(s), true, '未命中: ' + s)));

// ─── 2. 新良性样本 ────────────────────────────────────────────────
const NEW_BENIGN = [
  '这对果然还是分手了，不过感情的事说不准，当初没人能预料。',
  '这家公司最后还是倒闭了，财报数据在事发前就已现端倪，这是可验证的信号。',
  'The startup died last month, though nobody could have predicted the supply chain collapse.',
  'The market crashed, and the post-mortem shows the warning signs were visible in Q1.',
  '他果然考上了，不过这是他复读一年应得的结果。',
];
NEW_BENIGN.forEach((s, i) => t('良性-' + (i + 1), () => assert.strictEqual(hit(s), false, '误伤: ' + s)));

// ─── 3. gate 层接线 ───────────────────────────────────────────────
NEW_ATTACKS.forEach((s, i) => t('gate攻击-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
  const f = (r.findings || []).find(x => x.dimension === 'hindsight_bias');
  assert.ok(f, 'findings 应含 hindsight_bias: ' + s);
}));
NEW_BENIGN.forEach((s, i) => t('gate良性-' + (i + 1), () => {
  const r = gate(s);
  const f = (r.findings || []).find(x => x.dimension === 'hindsight_bias');
  assert.ok(!f, '新良性不应触发本维: ' + s);
}));

// ─── 4. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
const OLD_CTRL = [
  '这件事早就注定会失败，明眼人一开始都能看出来',
  '我早就知道他会背叛我们，一切都在意料之中',
];
const INJECTIONS = [
  { arr: 'PRED_POST_ZH', idx: 1, atk: '这家公司最后还是倒闭了，我早就料到撑不过三年。' },
  { arr: 'OUT_ZH', idx: 1, atk: '他后来果然出轨了，我第一眼就看出来这人靠不住。' },
  { arr: 'PRED_POST_EN', idx: 1, atk: 'The startup died last month, just as I expected from day one.' },
  { arr: 'OUT_EN', idx: 1, atk: 'The startup died last month, just as I expected from day one.' },
];
INJECTIONS.forEach((c) => t('注入-' + c.arr + '[' + c.idx + ']', () => {
  const full = __internals()[c.arr];
  assert.ok(full.length > c.idx, c.arr + ' 数组长度不足，下标失效');
  assert.strictEqual(hit(c.atk), true, '正向命中: ' + c.arr + '[' + c.idx + ']');
  const inj = {};
  inj[c.arr] = full.filter((re, i) => i !== c.idx);
  assert.strictEqual(hit(c.atk, inj), false, '删 [' + c.arr + '[' + c.idx + ']] 后攻击须转 miss（承重证明）');
  for (const old of OLD_CTRL) assert.strictEqual(hit(old, inj), true, '删 [' + c.arr + '[' + c.idx + ']] 后旧攻击仍命中（旧分支不受影响）');
}));

// 豁免族反向注入：删 post-mortem 豁免后良性须转红。良性句须自带
// HS+PRED_WEAK 腿（obvious × in hindsight），否则不命中、测不出豁免承重。
t('注入-EXEMPT_NEWINFO_EN[1]（豁免反向）', () => {
  const full = __internals().EXEMPT_NEWINFO_EN;
  assert.ok(full.length > 1, 'EXEMPT_NEWINFO_EN 数组长度不足');
  const benign = 'The market crashed, and the post-mortem says it was obvious in hindsight.';
  assert.strictEqual(hit(benign), false, '正向应豁免: ' + benign);
  const inj = { EXEMPT_NEWINFO_EN: full.filter((re, i) => i !== 1) };
  assert.strictEqual(hit(benign, inj), true, '删 post-mortem 豁免后良性须转红（豁免承重证明）');
});

// ─── 5. r177 存量回归 ─────────────────────────────────────────────
t('r177 存量回归-攻击', () => {
  const old = [
    '这件事早就注定会失败，明眼人一开始都能看出来',
    '我早就知道他会背叛我们，一切都在意料之中',
    '结果不出所料，这件事从一开始就是注定的',
    '事后看来这一切都很明显，当时我们太迟钝了',
    '这场危机早就埋下了伏笔，聪明人一眼就能看穿',
    '他早就看出这家公司没有未来',
    '如今看来，这个项目的失败是必然的',
    'This was always going to fail; anyone could have seen it coming.',
    'I knew it all along — the outcome was inevitable from the start.',
    'Looking back, the signs were there all along.',
  ];
  for (const s of old) assert.strictEqual(hit(s), true, '存量攻击回归翻转: ' + s);
});
t('r177 存量回归-良性', () => {
  const oldBenign = [
    '事后看来我们当时的决策确实存在问题，这是新的信息带来的认识',
    '通过复盘我们才发现，之前忽略了几个关键风险因素',
    '这场比赛我们注定会赢',
    '我早就知道会下雨，所以出门带了伞',
    '公司明年可能会倒闭，需要提前准备风险预案',
    '他早就提醒过风险，可惜管理层没有采纳',
    'It is easy to say in hindsight, but the information was not available at the time.',
    'With hindsight the collapse was obvious, though nobody could have known.',
    'Based on what we knew then, the failure was entirely predictable.',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量良性回归翻转: ' + s);
});

// ─── 6. 登记断言 ─────────────────────────────────────────────────
t('登记-dimensions/VERIFY_DIMS/__internals', () => {
  const keys = Object.keys(require(path.join(ROOT, 'src', 'index.js')).discriminate('probe').dimensions);
  assert.ok(keys.includes('hindsight_bias'), 'dimensions 键缺失');
  assert.ok(keys.length >= 232, '维度键总数应 ≥232: got ' + keys.length);
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  const m = src.match(/VERIFY_DIMS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m && m[1].includes("'hindsight_bias'"), 'VERIFY_DIMS 未含本维');
  const need = ['PRED_STRONG_ZH', 'PRED_POST_ZH', 'PRED_WEAK_ZH', 'OUT_ZH',
    'PRED_STRONG_EN', 'PRED_POST_EN', 'PRED_WEAK_EN', 'OUT_EN',
    'EXEMPT_META_ZH', 'EXEMPT_META_EN', 'EXEMPT_NEWINFO_ZH', 'EXEMPT_NEWINFO_EN',
    'EXEMPT_EXANTE_ZH', 'EXEMPT_EXANTE_EN', 'EXEMPT_NEG_ZH', 'EXEMPT_NEG_EN'];
  for (const k of need) assert.ok(__internals()[k], '__internals 缺 ' + k);
  assert.strictEqual(__internals().PRED_POST_ZH.length, 2, 'PRED_POST_ZH 应为 2 条模式');
  assert.strictEqual(__internals().OUT_ZH.length, 2, 'OUT_ZH 应为 2 条模式');
  assert.strictEqual(__internals().PRED_POST_EN.length, 2, 'PRED_POST_EN 应为 2 条模式');
  assert.strictEqual(__internals().OUT_EN.length, 2, 'OUT_EN 应为 2 条模式');
  assert.strictEqual(__internals().EXEMPT_NEWINFO_EN.length, 2, 'EXEMPT_NEWINFO_EN 应为 2 条模式');
});

console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（早就料到/我早说过/果然/出轨/died/just as I expected 族）');
console.log('✓ 新良性样本 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 零误伤');
console.log('✓ gate 层接线 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 新攻击非 pass 且 findings 含本维');
console.log('✓ gate 层新良性 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 无本维误伤');
console.log('✓ 逐新模式注入 5 个：5 个变红，0 个未变红（4 新腿 + 1 豁免反向，均带旧分支对照）');
console.log('✓ 存量回归：r177 原族 10/10 攻击仍命中、9/9 良性仍放行');
console.log('✓ 登记断言：dimensions 键 ≥232 含本维、VERIFY_DIMS/__internals 齐全');

console.log('\n全部断言通过（hindsight_bias 第 175 维度 · r265 新措辞家族扩展）');
console.log('测试结果: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
if (fails.length) {
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
}
