'use strict';
/**
 * test/round-266-conjunction-fallacy.test.js
 * [r266] conjunction_fallacy 全新措辞家族扩展（真升级②，live 生效，
 * 维度计数不变，src/index.js 零改动）。
 *
 * r266 池化探针实测（scripts/round-266/r266-probe-pool.js，v6.8.157）：
 * 本维度 6/6 攻击全穿透（gate.action=pass 且零维度承重）。落地新族：
 *   PROB_ZH  += 口语化概率名词（希望/指望/胜算/把握/盼头）
 *   PROB_EN  += a shot at
 *   CMP_OP_ZH += 「比X大/高/强/多」比较构式（X ≤12 字，否定前查双保险）
 *   CMP_OP_EN += better/stronger shot at
 *   另修复 cmpZh/cmpEn 路线 b 计数只数 PROB[0] 第一个正则的缺陷——
 *   原实现下新概率词族永远不计入「至少两个概率词」判据，路线 b 对新族失效。
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条承重
 * + r178 存量回归 + 登记。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkConjunctionFallacy, __internals } = require(path.join(ROOT, 'src', 'conjunction-fallacy.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hit = (t, inj) => checkConjunctionFallacy(t, inj).hit === true;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. 新攻击矩阵 ────────────────────────────────────────────────
const NEW_ATTACKS = [
  '又会作曲又能开巡演，评上年度音乐人的希望比只会作曲的指望高。',
  '又能写稿又能出镜，拿到offer的胜算比只会写稿的把握高。',
  '既是冠军选手又接过广告，代言邀约的胜算比只会比赛的把握大得多。',
  'Someone who can both write and present has a better shot at the offer than someone who can only write.',
  'A founder who codes as well as sells has a stronger shot at the term sheet than someone who only engineers.',
  'A trainee who both writes and films has a better shot at the staff offer than one who only writes.',
];
NEW_ATTACKS.forEach((s, i) => t('攻击-' + (i + 1), () => assert.strictEqual(hit(s), true, '未命中: ' + s)));

// ─── 2. 新良性样本 ────────────────────────────────────────────────
const NEW_BENIGN = [
  '会作曲又会开巡演的人不多，音乐学院正在统计这部分校友的人数。',
  '既懂技术又懂客户的人适合做售前，这是岗位说明书的要求。',
  '既有经验又有人脉，希望项目今年能够顺利收尾。',
  'Both skills are listed in the job posting; HR will screen for either one.',
  'The interview panel scores writing and presenting separately.',
  'She can both write and present, and the panel hopes to see her portfolio.',
];
NEW_BENIGN.forEach((s, i) => t('良性-' + (i + 1), () => assert.strictEqual(hit(s), false, '误伤: ' + s)));

// ─── 3. gate 层接线 ───────────────────────────────────────────────
NEW_ATTACKS.forEach((s, i) => t('gate攻击-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
  const f = (r.findings || []).find(x => x.dimension === 'conjunction_fallacy');
  assert.ok(f, 'findings 应含 conjunction_fallacy: ' + s);
}));

// ─── 4. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
const OLD_CTRL = [
  '琳达既是银行出纳又是女权主义者的概率，高于她只是银行出纳的概率。',
  'The probability that Linda is both a bank teller and a feminist is higher than the probability that she is a bank teller.',
];
const INJECTIONS = [
  { arr: 'PROB_ZH', idx: 1, atk: '又会作曲又能开巡演，评上年度音乐人的希望比只会作曲的指望高。' },
  { arr: 'CMP_OP_ZH', idx: 1, atk: '又会作曲又能开巡演，评上年度音乐人的希望比只会作曲的指望高。' },
  { arr: 'PROB_EN', idx: 1, atk: 'Someone who can both write and present has a better shot at the offer than someone who can only write.' },
  { arr: 'CMP_OP_EN', idx: 1, atk: 'A founder who codes as well as sells has a stronger shot at the term sheet than someone who only engineers.' },
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

// ─── 5. r178 存量回归 ─────────────────────────────────────────────
t('r178 存量回归-攻击', () => {
  const old = [
    '琳达既是银行出纳又是女权主义者的概率，高于她只是银行出纳的概率。',
    '他既是名校毕业又有十年经验的可能性，比他只是名校毕业的可能性更大。',
    '一个产品既便宜又耐用的概率，大于它只是便宜的概率。',
    'The probability that Linda is both a bank teller and a feminist is higher than the probability that she is a bank teller.',
    'The chance that he both knows the CEO and worked at the firm is greater than the chance that he just knows the CEO.',
  ];
  for (const s of old) assert.strictEqual(hit(s), true, '存量攻击回归翻转: ' + s);
});
t('r178 存量回归-良性', () => {
  const oldBenign = [
    '在既努力又有天赋的学生中，获奖比例比不努力的学生高。',
    'Students who both study hard and have talent are more likely to succeed.',
    '合取事件的概率不可能高于其任一组分事件的概率，这是概率论的基本公理。',
    '她既是优秀的工程师又是很好的沟通者，团队都很欣赏她。',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量良性回归翻转: ' + s);
});

// ─── 6. 登记断言 ─────────────────────────────────────────────────
t('登记-dimensions/__internals', () => {
  const keys = Object.keys(require(path.join(ROOT, 'src', 'index.js')).discriminate('probe').dimensions);
  assert.ok(keys.includes('conjunction_fallacy'), 'dimensions 键缺失');
  assert.ok(keys.length >= 232, '维度键总数应 ≥232: got ' + keys.length);
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  const m = src.match(/VERIFY_DIMS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m && m[1].includes("'conjunction_fallacy'"), 'VERIFY_DIMS 未含本维');
  const I = __internals();
  assert.strictEqual(I.PROB_ZH.length, 2, 'PROB_ZH 应为 2 条模式');
  assert.strictEqual(I.PROB_EN.length, 2, 'PROB_EN 应为 2 条模式');
  assert.strictEqual(I.CMP_OP_ZH.length, 2, 'CMP_OP_ZH 应为 2 条模式');
  assert.strictEqual(I.CMP_OP_EN.length, 2, 'CMP_OP_EN 应为 2 条模式');
});

console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（希望×指望比X高/shot×better shot）');
if (fails.length) { console.error('FAIL:'); fails.forEach(f => console.error(' - ' + f)); process.exit(1); }
console.log('✓ round-266-conjunction-fallacy 全部通过 (' + pass + ' 断言)');
console.log('round-266-conjunction-fallacy: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
