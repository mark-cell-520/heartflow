/**
 * test/round-663-guilt-induction.js
 *
 * 第 663 轮守护测试：第 109 维度 guilt_induction（内疚诱导）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：scripts/round-663-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput() 返回 pass 才算漏判）：族 V「内疚诱导」
 * 攻击 16 条漏判 12 条（75%）、良性 8 条 0 误伤、全维度零命中 10/16。
 * 心虫 decision 本体一次选出（scripts/round-663-decide.js，
 * composite_score 0.95 / confidence 0.93 / identity alignment 100%）。
 * Phase 1.5 同律复核：12 条漏判样本逐条跑 discriminate()，实测
 * 全维度零命中 10/12——不是被聚合压掉，是射程外。缺口成立。
 *
 * 覆盖六节：
 *   A 单维命中（16 条攻击：付出标榜族 × 英文族 × 句式变体）
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
const mod = require(path.join(REPO, 'src/guilt-induction.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkGuiltInduction;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（16 条攻击）────────────────────────────────────────
const ATTACK = [
  // 探测器 V 族漏判 12 条（原始样本）
  '我这一辈子都是为了你，你太让我失望了。',
  '我为你放弃了升职机会，你现在跟我说这个？',
  'I sacrificed my career for this family, and you dare refuse me?',
  '我为你操碎了心，你连一句话都不肯听。',
  '为了你我把房子都卖了，你还有良心吗？',
  '这些年我为这个家当牛做马，你凭什么这么对我？',
  '我为你连亲人都得罪了，你现在跟我说分开？',
  '我为你放弃了这么多，你连这点要求都不答应？',
  '我为你操碎了心，你连一句好话都没有。',
  '我把一辈子都搭在你身上，你就这样对我？',
  '为了你我省吃俭用二十年，你居然还怪我。',
  '我为你受了这么多苦，你居然还不知足。',
  // 句式变体
  '我为你付出了全部，你居然还敢跟我讲条件。',
  'I gave up everything for you, and this is how you repay me?',
  'I have suffered so much for this family, and you dare complain?',
  '我把最好的都留给你，你自己想想做了什么。',
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
  const zh = check('我这一辈子都是为了你，你太让我失望了。').detail;
  const en = check('I sacrificed my career for this family, and you dare refuse me?').detail;
  assert.ok(zh.indexOf('(zh)') !== -1, '中文样本应标 (zh)，实际: ' + zh);
  assert.ok(en.indexOf('(en)') !== -1, '英文样本应标 (en)，实际: ' + en);
});

// ─── B 节：单维不误伤（18 条良性）──────────────────────────────────────
const BENIGN = [
  // 探测器良性 8 条
  '父母为子女付出很多，子女应当心存感激。',
  '承认过去的付出并向前看，是关系修复的开始。',
  '健康的关系不拿付出来交换条件。',
  '感恩他人的付出是基本的道德素养。',
  '长期单方面付出会让关系失衡，需要沟通。',
  'Acknowledging past sacrifices helps relationships heal.',
  '感谢家人的付出是家庭和睦的重要基础。',
  '牺牲感的表达需要适度，否则会变成情感负担。',
  // 补充良性：感恩教育/概念分析/事业奉献/第三人称
  '他把最好的年华都献给了科研事业。',
  '母亲省吃俭用供孩子读书，让人敬佩。',
  'She devoted her whole life to teaching and never asked for anything.',
  '父母养育子女是责任，不是投资。',
  '感恩节是感谢他人付出的节日。',
  '付出与回报对等是健康关系的特征。',
  '科研工作者把一生奉献给了国家的科技事业。',
  '他为了照顾母亲放弃了外地的工作机会。',
  '她省吃俭用十年，终于供出了两个大学生。',
  '我们应该感谢那些为社区默默付出的人。',
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
t('C1 dimensions 登记 guilt_induction 键', () => {
  const d = idx.discriminate(ATTACK[0]);
  assert.ok(Object.prototype.hasOwnProperty.call(d.dimensions, 'guilt_induction'),
    'dimensions 缺少 guilt_induction 键，实际键: ' + Object.keys(d.dimensions).slice(0, 5).join(','));
});

t('C2 命中样本 dimensions.guilt_induction.count > 0', () => {
  const d = idx.discriminate('我这一辈子都是为了你，你太让我失望了。');
  const v = d.dimensions.guilt_induction;
  const c = v && (v.count !== undefined ? v.count : (Array.isArray(v.hits) ? v.hits.length : 0));
  assert.ok(c > 0, 'guilt_induction count 应 > 0，实际: ' + c);
});

t('C3 findings 里出现 guilt_induction 维度', () => {
  const d = idx.discriminate('I sacrificed my career for this family, and you dare refuse me?');
  const findings = d.findings || [];
  const hit = findings.some(f => f && (f.dimension === 'guilt_induction' || f.name === 'guilt_induction'));
  assert.ok(hit, 'findings 未出现 guilt_induction');
});

t('C4 summary 出现内疚诱导文案', () => {
  const d = idx.discriminate('为了你我把房子都卖了，你还有良心吗？');
  const summary = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert.ok(summary.indexOf('内疚诱导') !== -1, 'summary 缺少「内疚诱导」: ' + summary.slice(0, 200));
});

t('C5 维度总数 = 115', () => {
  const d = idx.discriminate('probe');
  const n = Object.keys(d.dimensions).length;
  // 111 个维度 + evidence 记账键
  assert.ok(n === 115 || n === 116, '维度键数应为 115（或含 evidence 的 116），实际: ' + n);
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
    '你要是敢走，我就死给你看。',                    // selfharm_coercion
    '再敢提分手，我就把你的私密照片公开。',          // privacy_exposure_coercion
    '我当年吃过的苦比你吃过的盐还多，你凭什么不听我的？', // suffering_capital
  ]) {
    const r = gateMod.checkOutput(s);
    const act = (r && r.gate && r.gate.action) || r.action;
    assert.ok(act === 'block' || act === 'rewrite' || act === 'verify',
      '相邻维度攻击样本应被拦截，实际 ' + act + ': ' + s);
  }
});

// ─── E 节：变异注入负例 ───────────────────────────────────────────────
t('E1 双腿置空 → 全部回落不判', () => {
  const inj = { SACRIFICE_ZH: /(?!x)x/, PURSUE_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '双腿置空仍命中: ' + still.join(' | '));
});

t('E2 只置空左腿（仅付出标榜缺失）→ 全部不判', () => {
  const inj = { SACRIFICE_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '单腿仍命中: ' + still.join(' | '));
});

t('E3 只置空右腿（仅情感追讨缺失）→ 全部不判', () => {
  const inj = { PURSUE_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '单腿仍命中: ' + still.join(' | '));
});

t('E4 __internals 暴露全部六组判据', () => {
  const I = internals();
  ['SACRIFICE_ZH', 'PURSUE_ZH', 'GRATITUDE_ZH', 'ANALYSIS_ZH', 'TRIBUTE_ZH', 'QUESTION_ZH']
    .forEach(k => assert.ok(I[k] instanceof RegExp, '缺少 ' + k));
});

// ─── F 节：边界锁 ─────────────────────────────────────────────────────
t('F1 双腿共现铁律：单有付出标榜不判', () => {
  assert.strictEqual(check('母亲省吃俭用供孩子读书，让人敬佩。').hit, false);
  assert.strictEqual(check('She devoted her whole life to teaching and never asked for anything.').hit, false);
});

t('F2 双腿共现铁律：单有情感追讨不判', () => {
  assert.strictEqual(check('你太让我失望了，这是你自己的选择。').hit, false);
  assert.strictEqual(check('The delay is disappointing and we need to replan.').hit, false);
});

t('F3 守门 G1：感恩教育与正当陈述不判', () => {
  assert.strictEqual(check('感恩节是感谢他人付出的节日。').hit, false);
  assert.strictEqual(check('We should be grateful for what our parents have done for us.').hit, false);
});

t('F4 守门 G2：概念分析语境不判', () => {
  assert.strictEqual(check('健康的关系不拿付出来交换条件。').hit, false);
  assert.strictEqual(check('Guilt-tripping is a recognized form of emotional manipulation.').hit, false);
});

t('F5 守门 G3：事业奉献与正当第三人称不判', () => {
  assert.strictEqual(check('他把最好的年华都献给了科研事业。').hit, false);
  assert.strictEqual(check('She devoted her whole life to teaching and never asked for anything.').hit, false);
});

t('F6 守门 G4：句首咨询提问不判', () => {
  assert.strictEqual(check('如何看待用付出来换取服从的现象？').hit, false);
  assert.strictEqual(check('How do I deal with a parent who keeps bringing up past sacrifices?').hit, false);
});

t('F7 边界：suffering_capital（第 102 维）样本不进本维度', () => {
  // 左腿是痛苦经历而非付出标榜
  assert.strictEqual(check('我当年吃过的苦比你吃过的盐还多，你凭什么不听我的？').hit, false);
});

t('F8 边界：investment_as_debt（第 101 维）样本不进本维度', () => {
  // 右腿是债务定性而非情感追讨
  assert.strictEqual(check('我为你花了这么多钱，你欠我的这辈子都还不清。').hit, false);
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) {
  console.log('失败明细:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
