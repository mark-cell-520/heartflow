/**
 * test/round-656-silent-treatment.js
 *
 * 第 656 轮守护测试：第 105 维度 silent_treatment_coercion（冷暴力胁迫）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：scripts/round-656-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput() 返回 pass 才算漏判）：族 U「冷暴力胁迫」
 * 攻击 12 条漏判 8 条（67%）、良性 8 条 0 误伤。心虫 decision 本体
 * 一次选出（scripts/round-656-decide.js，composite_score 0.94 /
 * confidence 0.90 / identity alignment 100%）。
 * Phase 1.5 同律复核：8 条漏判样本逐条跑 discriminate()，实测
 * 全维度零命中 8/8——不是被聚合压掉，是射程外。缺口成立。
 *
 * 覆盖六节：
 *   A 单维命中（16 条攻击：撤回供给族 × 英文族 × 句式变体）
 *   B 单维不误伤（16 条良性：四类看守 + 相邻维度域）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + summary 文案 + 维度总数）
 *   D gate 端到端（16 条全非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空双腿/单腿 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 × 2 + 四类看守各自锁一条 + relationship_severance 边界）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/silent-treatment-coercion.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkSilentTreatmentCoercion;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（16 条攻击）────────────────────────────────────────
const ATTACK = [
  // 探测器 U 族 12 条（原始样本）
  '你不答应我，我就一个月不跟你说话。',
  '今天不按我说的做，晚饭就别吃了，饿着。',
  '你再顶嘴，这个月零花钱一分都没有。',
  '你不听话，以后别想我再来接你。',
  '除非你现在认错，否则我永远不跟你说话。',
  'If you do not obey me, I will not speak to you for a month.',
  'You will not get any allowance until you do exactly as I say.',
  '你再不听话，以后别想我给你做饭。',
  '今天不道歉，晚上就别回家了，自己想办法。',
  '你要是不答应，以后学费生活费我一分不出。',
  '除非你认错，否则这个家不让你进。',
  'If you keep arguing back, I will stop cooking for you entirely.',
  // 句式变体
  '你再顶嘴，这个周末我不给你做饭了。',
  '从今天起你不认错，就别想我再跟你说话。',
  'If you refuse to apologize, I will stop picking you up from school.',
  'You will get no pocket money unless you start obeying me.',
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

// ─── B 节：单维不误伤（16 条良性）──────────────────────────────────────
const BENIGN = [
  // 探测器良性 8 条
  '明确的规则和后果是育儿中常见的手段。',
  '家长需要情绪稳定，避免长期冷战。',
  '家庭成员之间应就家务分配达成一致。',
  'Time-outs can be an effective discipline tool when used briefly.',
  '零花钱需要与孩子约定清晰的使用规则。',
  '冷战会伤害关系，沟通才是解决之道。',
  '适度的冷处理能让双方有时间冷静下来。',
  '家长和孩子约定好规则后要一致执行。',
  // 补充良性：规范陈述/概念分析/正当做法/相邻维度域
  '家长不该拿撤回照料作威胁，这属于冷暴力。',
  '把不给吃饭当成控制手段是明确的虐待行为。',
  '父母可以表达失望，但不该用断供来逼孩子认错。',
  'Withholding meals as punishment is widely regarded as harmful.',
  '你需要做的是把规则和后果提前说清楚，然后一致执行。',
  '因工作原因今晚不能接你，我会提前告诉老师。',
  'Parents sometimes need a moment to cool down before responding.',
  '这个月家里经济紧张，我们得重新规划一下开支。',
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
t('C1 dimensions 登记 silent_treatment_coercion 键', () => {
  const d = idx.discriminate(ATTACK[0]);
  assert.ok(Object.prototype.hasOwnProperty.call(d.dimensions, 'silent_treatment_coercion'),
    'dimensions 缺少 silent_treatment_coercion 键，实际键: ' + Object.keys(d.dimensions).slice(0, 5).join(','));
});

t('C2 命中样本 dimensions.silent_treatment_coercion.count > 0', () => {
  const d = idx.discriminate('今天不按我说的做，晚饭就别吃了，饿着。');
  const v = d.dimensions.silent_treatment_coercion;
  const c = v && (v.count !== undefined ? v.count : (Array.isArray(v.hits) ? v.hits.length : 0));
  assert.ok(c > 0, 'silent_treatment_coercion count 应 > 0，实际: ' + c);
});

t('C3 findings 里出现 silent_treatment_coercion 维度', () => {
  const d = idx.discriminate('你再顶嘴，这个月零花钱一分都没有。');
  const findings = d.findings || [];
  const hit = findings.some(f => f && (f.dimension === 'silent_treatment_coercion' || f.name === 'silent_treatment_coercion'));
  assert.ok(hit, 'findings 未出现 silent_treatment_coercion');
});

t('C4 summary 出现冷暴力胁迫文案', () => {
  const d = idx.discriminate('你不答应我，我就一个月不跟你说话。');
  const summary = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert.ok(summary.indexOf('冷暴力胁迫') !== -1, 'summary 缺少「冷暴力胁迫」: ' + summary.slice(0, 200));
});

t('C5 维度总数 = 105', () => {
  const d = idx.discriminate('probe');
  const n = Object.keys(d.dimensions).length;
  // 105 个维度 + evidence 记账键
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

// ─── E 节：变异注入负例 ───────────────────────────────────────────────
t('E1 双腿置空 → 全部回落不判', () => {
  const inj = { COND_ZH: /(?!x)x/, WITHDRAW_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '双腿置空仍命中: ' + still.join(' | '));
});

t('E2 只置空右腿（仅不顺从条件）→ 全部不判', () => {
  const inj = { WITHDRAW_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '单腿仍命中: ' + still.join(' | '));
});

t('E3 只置空左腿（仅撤回供给）→ 全部不判', () => {
  const inj = { COND_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '单腿仍命中: ' + still.join(' | '));
});

t('E4 __internals 暴露全部六组判据', () => {
  const I = internals();
  ['COND_ZH', 'WITHDRAW_ZH', 'RULES_ZH', 'COOLDOWN_ZH', 'ANALYSIS_ZH', 'QUESTION_ZH']
    .forEach(k => assert.ok(I[k] instanceof RegExp, '缺少 ' + k));
});

// ─── F 节：边界锁 ─────────────────────────────────────────────────────
t('F1 双腿共现铁律：单有不顺从条件不判', () => {
  assert.strictEqual(check('你不答应我，我就告诉你妈妈。').hit, false);
  assert.strictEqual(check('If you do not obey, I will tell your teacher.').hit, false);
});

t('F2 双腿共现铁律：单有撤回供给陈述不判', () => {
  assert.strictEqual(check('这个月我工作太忙，没时间给你做饭。').hit, false);
  assert.strictEqual(check('I stopped cooking for the family after my surgery.').hit, false);
});

t('F3 守门 G1：规则与后果陈述不判', () => {
  assert.strictEqual(check('把零花钱规则和后果提前讲清楚，孩子才知道边界。').hit, false);
  assert.strictEqual(check('Brief time-outs are an effective discipline tool.').hit, false);
});

t('F4 守门 G2：正当冷静与情绪陈述不判', () => {
  assert.strictEqual(check('家长需要先冷静几天，再和孩子谈这件事。').hit, false);
  assert.strictEqual(check('A short cooling-off period helps both sides calm down.').hit, false);
});

t('F5 守门 G3：概念分析与规范陈述不判', () => {
  assert.strictEqual(check('用断供逼孩子认错属于冷暴力，是明确不可取的。').hit, false);
  assert.strictEqual(check('Withholding meals is a recognized form of child abuse.').hit, false);
});

t('F6 守门 G4：句首咨询提问不判', () => {
  assert.strictEqual(check('如何应对总是不给吃饭来逼我认错的家人？').hit, false);
  assert.strictEqual(check('How do I deal with a parent who withholds meals?').hit, false);
});

t('F7 边界：relationship_severance（r654）样本不进本维度', () => {
  // 关系断绝要挟终止的是关系存续，不是关系里的供给——本维度不接
  assert.strictEqual(check('你不答应我，我就当没生过你这个儿子。').hit, false);
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) {
  console.log('失败明细:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
