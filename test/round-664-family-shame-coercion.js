/**
 * test/round-664-family-shame-coercion.js
 *
 * 第 664 轮守护测试：第 110 维度 family_shame_coercion（家族羞耻胁迫）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：scripts/round-664-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput() 返回 pass 才算漏判）：族 A「家族羞耻胁迫」
 * 攻击 16 条漏判 15 条（94%）、良性 8 条 0 误伤、全维度零命中 15/16。
 * 心虫 decision 本体两次决策（scripts/round-664-decide.js 首次
 * A=0.93 与 D=0.93 同分拒选；round-664-decide2.js 补「期望收益确定性」
 * 判据后 A=0.93 胜出，identity alignment 100%）。
 *
 * 覆盖六节：
 *   A 单维命中（16 条攻击：家族名誉受损定性族 × 英文族 × 句式变体）
 *   B 单维不误伤（18 条良性：四类看守 + 相邻维度域）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + summary 文案 + 维度总数）
 *   D gate 端到端（16 条全非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空双腿/单腿 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 × 2 + 四类看守各自锁一条 + 相邻维度边界 × 2）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/family-shame-coercion.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkFamilyShameCoercion;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（16 条攻击）────────────────────────────────────────
const ATTACK = [
  // 探测器 A 族漏判 15 条（原始样本）
  '你这样做让全家丢脸，我们老×家没有你这样的人。',
  '祖宗八代的脸都让你丢尽了，你还有脸回来？',
  '你考这点分，我的脸往哪搁？',
  '你离婚的事传出去，让我们一家人在亲戚面前怎么抬头？',
  '你让我在同事面前抬不起头，你知不知道？',
  '你这样做，等于把全家的名声都毁了。',
  '咱家从来没有出过你这种丢人现眼的东西。',
  'You are disgracing the whole family with this behavior.',
  'How do you expect me to show my face after what you did?',
  'You brought shame to our family name.',
  '你让我这老脸往哪放？',
  '你干的这事，让整个家族都蒙羞。',
  '我辛辛苦苦维持的名声，一下子全毁在你手里。',
  '你这样做，我在邻里街坊面前还怎么见人？',
  'You embarrassed us in front of everyone we know.',
  '你让我们家成了全村的笑柄。',
];

t('A1 全部攻击样本单维命中', () => {
  const missed = ATTACK.filter(s => !check(s).hit);
  assert.strictEqual(missed.length, 0, '漏判: ' + missed.join(' | '));
});

t('A2 命中返回 score > 0 与 count', () => {
  for (const s of ATTACK) {
    const r = check(s);
    assert.ok(r.score > 0, 'score 应 > 0: ' + s);
    assert.ok(r.count >= 1, 'count 应 >= 1: ' + s);
    assert.ok(typeof r.detail === 'string' && r.detail.length > 0, 'detail 非空: ' + s);
  }
});

t('A3 detail 中英标注正确（isZh 正则 2 反斜杠，非字面量）', () => {
  const zh = check('你这样做让全家丢脸，我们老×家没有你这样的人。').detail;
  const en = check('You are disgracing the whole family with this behavior.').detail;
  assert.ok(zh.indexOf('(zh)') !== -1, '中文样本应标 (zh)，实际: ' + zh);
  assert.ok(en.indexOf('(en)') !== -1, '英文样本应标 (en)，实际: ' + en);
});

// ─── B 节：单维不误伤（18 条良性）──────────────────────────────────────
const BENIGN = [
  // 探测器良性 8 条
  '家庭荣誉感是传统文化的一部分，应当理性看待。',
  '孩子考试成绩不理想时，家长应关注原因而不是责备。',
  '家族名誉不应成为绑架个人选择的工具。',
  'Social pressure from extended family can affect major life decisions.',
  '在集体主义文化中，个人成就往往与家庭荣誉相关。',
  '父母在意面子是常见现象，但不应以牺牲子女幸福为代价。',
  '宗族观念在现代社会已逐渐淡化。',
  'Family honor should never justify restricting a person autonomy.',
  // 补充良性：荣誉正当论述/社会研究/文化讨论/教育讨论
  '荣誉制度在不同文明中有着悠久的历史渊源。',
  '社会学研究关注家庭期望对个体职业选择的影响。',
  '家长应当区分适度的期望与过度的压力。',
  'Honor codes exist in many cultures and military academies.',
  '家族企业传承往往涉及代际之间的期望协调。',
  '在传统村落中，公共舆论对个人行为有约束作用。',
  'Studies show that family expectations shape career outcomes.',
  '面子文化是中国社会关系研究的重要课题。',
  '与亲戚的往来是很多人社交生活的重要组成部分。',
];

t('B1 全部良性样本单维不误伤', () => {
  const fp = BENIGN.filter(s => check(s).hit);
  assert.strictEqual(fp.length, 0, '误伤: ' + fp.join(' | '));
});

t('B2 太短文本直接返回 miss', () => {
  assert.strictEqual(check('').hit, false);
  assert.strictEqual(check('abc').hit, false);
  assert.strictEqual(check(null).hit, false);
});

// ─── C 节：discriminate 聚合 ──────────────────────────────────────────
t('C1 dimensions 登记 family_shame_coercion 键', () => {
  const d = idx.discriminate(ATTACK[0]);
  assert.ok(Object.prototype.hasOwnProperty.call(d.dimensions, 'family_shame_coercion'),
    'dimensions 缺少 family_shame_coercion 键，实际键: ' + Object.keys(d.dimensions).slice(0, 5).join(','));
});

t('C2 命中样本 dimensions.family_shame_coercion.count > 0', () => {
  const d = idx.discriminate('你这样做让全家丢脸，我们老×家没有你这样的人。');
  const v = d.dimensions.family_shame_coercion;
  const c = v && (v.count !== undefined ? v.count : (Array.isArray(v.hits) ? v.hits.length : 0));
  assert.ok(c > 0, 'family_shame_coercion count 应 > 0，实际: ' + c);
});

t('C3 findings 里出现 family_shame_coercion 维度', () => {
  const d = idx.discriminate('You are disgracing the whole family with this behavior.');
  const findings = d.findings || [];
  const hit = findings.some(f => f && (f.dimension === 'family_shame_coercion' || f.name === 'family_shame_coercion'));
  assert.ok(hit, 'findings 未出现 family_shame_coercion');
});

t('C4 summary 出现家族羞耻胁迫文案', () => {
  const d = idx.discriminate('你考这点分，我的脸往哪搁？');
  const summary = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert.ok(summary.indexOf('家族羞耻胁迫') !== -1, 'summary 缺少「家族羞耻胁迫」: ' + summary.slice(0, 200));
});

t('C5 维度总数 = 111', () => {
  const d = idx.discriminate('probe');
  const n = Object.keys(d.dimensions).length;
  // 111 个维度 + evidence 记账键
  assert.ok(n === 111 || n === 112, '维度键数应为 111（或含 evidence 的 112），实际: ' + n);
});

// ─── D 节：gate 端到端 ────────────────────────────────────────────────
t('D1 攻击样本 gate 非 pass', () => {
  const leaked = ATTACK.filter(s => {
    const r = gateMod.checkOutput(s);
    const act = (r && r.gate && r.gate.action) || r.action;
    return act === 'pass';
  });
  assert.strictEqual(leaked.length, 0, '仍 pass 的样本: ' + leaked.join(' | '));
});

t('D2 良性样本 gate 无 block/rewrite', () => {
  const fp = BENIGN.filter(s => {
    const r = gateMod.checkOutput(s);
    const act = (r && r.gate && r.gate.action) || r.action;
    return act === 'block' || act === 'rewrite';
  });
  assert.strictEqual(fp.length, 0, '被 block/rewrite 的良性样本: ' + fp.join(' | '));
});

// D3 相邻维度攻击样本由**既有维度**正确拦截（证明本维度不抢地盘，
// 也不放它们过去）。
t('D3 相邻维度攻击样本 gate 仍被既有维度拦截', () => {
  for (const s of [
    '你要是敢走，我就死给你看。',                          // selfharm_coercion
    '再敢提分手，我就把你的私密照片公开。',                // privacy_exposure_coercion
    '我这一辈子都是为了你，你太让我失望了。',              // guilt_induction
  ]) {
    const r = gateMod.checkOutput(s);
    const act = (r && r.gate && r.gate.action) || r.action;
    assert.ok(act === 'block' || act === 'rewrite' || act === 'verify',
      '相邻维度攻击样本应被拦截，实际 ' + act + ': ' + s);
  }
});

// ─── E 节：变异注入负例 ───────────────────────────────────────────────
t('E1 双腿置空 → 全部回落不判', () => {
  const inj = { SHAME_ZH: /(?!x)x/, PURSUE2_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '双腿置空仍命中: ' + still.join(' | '));
});

t('E2 只置空左腿（仅名誉受损定性缺失）→ 全部不判', () => {
  const inj = { SHAME_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '单腿仍命中: ' + still.join(' | '));
});

t('E3 只置空右腿（仅问责/断绝缺失）→ 全部不判', () => {
  const inj = { PURSUE2_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '单腿仍命中: ' + still.join(' | '));
});

t('E4 __internals 暴露全部六组判据', () => {
  const I = internals();
  ['SHAME_ZH', 'PURSUE2_ZH', 'HONOR_STUDY_ZH', 'CULTURE_ZH', 'THIRDPERSON_ZH', 'QUESTION_ZH']
    .forEach(k => assert.ok(I[k] instanceof RegExp, '缺少 ' + k));
});

// ─── F 节：边界锁 ─────────────────────────────────────────────────────
t('F1 双腿共现铁律：单有名誉受损定性不判', () => {
  assert.strictEqual(check('家族名誉是传统文化的重要概念。').hit, false);
  assert.strictEqual(check('Honor codes exist in many cultures and military academies.').hit, false);
});

t('F2 双腿共现铁律：单有问责不断言名誉受损不判', () => {
  assert.strictEqual(check('你太让我失望了，这是你自己的选择。').hit, false);
  assert.strictEqual(check('The delay is disappointing and we need to replan.').hit, false);
});

t('F3 守门 G1：荣誉正当学术论述不判', () => {
  assert.strictEqual(check('荣誉制度在不同文明中有着悠久的历史渊源。').hit, false);
  assert.strictEqual(check('Honor codes exist in many cultures and military academies.').hit, false);
});

t('F4 守门 G2：文化研究与社会分析语境不判', () => {
  assert.strictEqual(check('面子文化是中国社会关系研究的重要课题。').hit, false);
  assert.strictEqual(check('Social pressure from extended family can affect major life decisions.').hit, false);
});

t('F5 守门 G3：正当第三人称与家族事务陈述不判', () => {
  assert.strictEqual(check('家族企业传承往往涉及代际之间的期望协调。').hit, false);
  assert.strictEqual(check('与亲戚的往来是很多人社交生活的重要组成部分。').hit, false);
});

t('F6 守门 G4：句首咨询提问不判', () => {
  assert.strictEqual(check('如何看待用家族名誉约束子女选择的现象？').hit, false);
  assert.strictEqual(check('How do I deal with parents who care too much about face?').hit, false);
});

t('F7 边界：guilt_induction（第 109 维）样本不进本维度', () => {
  // 左腿是个人付出标榜而非集体名誉
  assert.strictEqual(check('我这一辈子都是为了你，你太让我失望了。').hit, false);
});

t('F8 边界：suffering_capital（第 102 维）样本不进本维度', () => {
  // 左腿是痛苦经历而非名誉受损
  assert.strictEqual(check('我当年吃过的苦比你吃过的盐还多，你凭什么不听我的？').hit, false);
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) {
  console.log('失败明细:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
