'use strict';
/**
 * test/round-165-appeal-to-consequences.js
 * [r165] 第 164 维度 appeal_to_consequences（诉诸后果 / appeal to
 * consequences / argumentum ad consequentiam）轮测试。结构同 r161/r163
 * 先例：攻击集 / 良性集 / 边界锁 / 分工边界锁 / 存量回归 / 登记断言 /
 * 负例注入承重 / gate 层实测。
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同
 * r720-r729/r161/r163/r164 纪律。
 *
 * 注入机制：checkAppealToConsequences(text, inject) 第二参以空白正则替换
 * 指定常量，逐常量置空验证「承重」——置空后攻击必须停判（腿承重）、豁免
 * 样本必须翻转为命中（豁免承重）。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const atcMod = require(path.join(ROOT, 'src', 'appeal-to-consequences.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const NULLRE = /(?!x)x/;
const hit = (s, inject) => atcMod.checkAppealToConsequences(s, inject).score > 0;
const gateAct = (s) => { try { return gate.checkOutput(s).gate.action; } catch (e) { return 'ERROR:' + e.message; } };
const dimCount = (s, k) => {
  const d = (idx.discriminate(s).dimensions || {})[k];
  if (!d || typeof d !== 'object') return 0;
  return d.count !== undefined ? d.count : (Array.isArray(d.hits) ? d.hits.length : 0);
};

// ── 1. 攻击集（模块层实测命中——同族变体矩阵：中英双语/裸词干/带修饰/
//      倒装/长句，r161 裸词教训：变体矩阵是负例测试之外的强制项）────────
const attacksZh = [
  '承认房价会跌太可怕了，那么多人还着贷款，所以房价不可能跌。',              // 基本形
  '如果进化论是真的，那人活着就没有意义了，所以进化论不可能是真的。',        // 条件形（与 conditional_proposition 交集）
  '我不敢相信气候变化是人为的，万一这是真的，经济就全盘崩溃了。',            // 倒装（拒绝在前，后果在后）
  '这种结果太可怕了，简直不敢想，所以一定是数据造假。',                      // 裸词干+长句
  '细思极恐，所以这事绝对不可能是真的。',                                  // 裸词干
  '说AI会取代人类工作，那大家还奋斗干什么，这种说法一定是危言耸听。',        // 意义消解+定性词
  '那大家还努力什么，人生还有什么意义，所以这套理论绝对是假的。',            // 意义消省略装
  '万一这是真的，我们的生产方式就得全盘推翻，所以我拒绝相信这个结论。',      // 远距离修饰
];
const attacksEn = [
  'If climate change were real, our economy would collapse, so it cannot be true.',
  'The consequences of admitting this would be too damaging, so I refuse to believe it.',
  'The findings are too devastating to be true — the data must be fabricated.',
  'Life would have no meaning if this were true, so it simply cannot be true.',
  'The whole system would collapse, therefore the projections must be false.',
];
t('攻击-ZH 全命中（变体矩阵）', () => {
  for (const s of attacksZh) assert.ok(hit(s), '漏判: ' + s);
});
t('攻击-EN 全命中（变体矩阵）', () => {
  for (const s of attacksEn) assert.ok(hit(s), '漏判: ' + s);
});

// ── 2. 良性集（模块层全 pass——含边缘良性：正当风险沟通/否定翻转/证据
//      在场/转述他人错误推理）──────────────────────────────────────────
const benignZh = [
  '如果报告属实，影响会很大，我们需要认真准备应对措施。',                    // 边缘良性：后果评估落点是行动
  '这些后果虽然严重，但这并不能说明结论本身是假的。',                        // 否定翻转
  '房价可能会跌，需要关注贷款风险。',                                      // 对冲+无真值否定
  '诉诸后果是一种常见的逻辑谬误，指的是用后果的可接受性替代事实判断。',      // 概念转述
  '对照组实验显示这个结论有坚实支持，风险已在重复试验中量化。',              // 证据在场
  '实验结果令人震惊，但经过三次重复实验验证。',                            // 惊讶+验证
  '如果真的存在问题，那就应该依法处理，而不是掩盖。',                        // 真值条件+行动
  '如果明天下雨，运动会就取消。',                                          // 规则条件句（无后果评估）
];
const benignEn = [
  'The consequences of inaction would be catastrophic, so we must prepare now.',
  'Even if the projections hold, that does not mean the policy is wrong.',
  'Have you considered what happens if the projections are wrong?',
];
t('良性-ZH 全 pass', () => {
  for (const s of benignZh) assert.ok(!hit(s), '误伤: ' + s);
});
t('良性-EN 全 pass', () => {
  for (const s of benignEn) assert.ok(!hit(s), '误伤: ' + s);
});

// ── 3. 边界锁（豁免承重：每个豁免常量置空，其边界样本必须翻转为命中）────
t('边界锁-META 豁免承重', () => {
  const s = '因为后果太可怕所以不是真的，这就是诉诸后果。';
  assert.ok(!hit(s), '概念转述未豁免');
  assert.ok(hit(s, { META_EXEMPT_ZH: NULLRE }), 'META 置空后未翻转——豁免常量不承重');
});
t('边界锁-QUESTION 豁免承重', () => {
  const s = '后果太可怕了，这事绝对不是真的？';
  assert.ok(!hit(s), '提问未豁免');
  assert.ok(hit(s, { QUESTION_EXEMPT: NULLRE }), 'QUESTION 置空后未翻转——豁免常量不承重');
});
t('边界锁-HEDGE 豁免承重', () => {
  const s = '如果真的跌了后果太严重，所以也许不可能跌。';
  assert.ok(!hit(s), '对冲未豁免');
  assert.ok(hit(s, { HEDGE_EXEMPT: NULLRE }), 'HEDGE 置空后未翻转——豁免常量不承重');
});
t('边界锁-EVIDENCE 豁免承重', () => {
  const s = '数据显示结论成立，但后果太严重了，所以数据一定是假的。';
  assert.ok(!hit(s), '证据在场未豁免');
  assert.ok(hit(s, { EVIDENCE_EXEMPT: NULLRE }), 'EVIDENCE 置空后未翻转——豁免常量不承重');
});
t('边界锁-NEGATION_FLIP 豁免承重', () => {
  const s = '后果太可怕了，但这并不能说明结论不是真的。';
  assert.ok(!hit(s), '否定翻转未豁免');
  assert.ok(hit(s, { NEGATION_FLIP_EXEMPT: NULLRE }), 'NEGFLIP 置空后未翻转——豁免常量不承重');
});

// ── 4. 分工边界锁（与存量维度的射程分界）────────────────────────────
t('分工-conditional_proposition 交集样本 gate 取并集', () => {
  // 交集样本两维同时命中，gate 不得漏判（r729 先例口径）
  const s = '如果进化论是真的，那人活着就没有意义了，所以进化论不可能是真的。';
  assert.notStrictEqual(gateAct(s), 'pass', '交集样本 gate 漏判');
  assert.ok(dimCount(s, 'appeal_to_consequences') >= 1, '交集样本 atc 未承重');
});
t('分工-wishful_thinking 方向相反', () => {
  // 信念→结果必然（wishful）不判；后果→真值否定（本族）判
  assert.ok(!hit('我相信会成功，所以一定会成功。'), 'wishful 样本被本族误判');
  assert.ok(hit('成功太可怕了，所以这一定是假的。'), '本族样本漏判');
});

// ── 5. 存量回归（共享腿族攻击/良性不因本维度翻转）──────────────────
t('存量回归-存量攻击族不降级', () => {
  const cases = [
    ['incredulity', '我无法想象他怎么能做到，所以这成绩一定是假的'],
    ['doublespeak', '公司把裁员称为人员优化'],
    ['conditional_proposition', '如果他真的爱你，就不会让你受这种委屈'],
  ];
  for (const [k, s] of cases) {
    assert.notStrictEqual(gateAct(s), 'pass', k + ' 存量攻击不再拦截: ' + gateAct(s) + ' :: ' + s);
  }
});
t('存量回归-共享腿良性样本零误伤', () => {
  const cases = [
    '如果明天下雨，运动会就取消。',
    '实验结果令人惊讶，研究团队正在复核数据',
    'If it rains tomorrow, the match will be postponed.',
  ];
  for (const s of cases) {
    const a = gateAct(s);
    assert.ok(a === 'pass' || a === 'warn' || a === 'verify', '良性被误拦: ' + a + ' :: ' + s);
  }
});

// ── 6. 登记断言 ────────────────────────────────────────────────
t('登记-dimensions 计数 164', () => {
  const ks = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(ks.length >= 164, 'dimensions 键数 ' + ks.length + ' != 164' + '（≥164，维度总数只增不减）');
  assert.ok(ks.includes('appeal_to_consequences'), 'dimensions 缺 appeal_to_consequences');
});
t('登记-VERIFY_DIMS 含本维度（读源码，同 r163 先例）', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(src.includes("'appeal_to_consequences',"), 'index.js 缺 appeal_to_consequences 登记');
});
t('登记-DIM_GUIDANCE 有条目（读源码）', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(src.includes("'appeal_to_consequences': \""), 'index.js 缺 DIM_GUIDANCE 概念条文');
});
t('登记-module.exports 导出单维函数', () => {
  assert.strictEqual(typeof idx.checkAppealToConsequences, 'function', '未导出 checkAppealToConsequences');
});
t('登记-summary 命中可见（诉诸后果计数）', () => {
  const s = idx.discriminate('承认房价会跌太可怕了，那么多人还着贷款，所以房价不可能跌。').summary || '';
  assert.ok(/诉诸后果/.test(s), 'summary 未含诉诸后果: ' + String(s).slice(0, 200));
});
t('登记-__internals 判据腿/豁免常量在位', () => {
  const need = ['CONSEQ_ZH', 'CONSEQ_EN', 'TDENY_ZH', 'TDENY_EN',
    'HEDGE_EXEMPT', 'EVIDENCE_EXEMPT', 'META_EXEMPT_ZH', 'META_EXEMPT_EN',
    'NEGATION_FLIP_EXEMPT', 'QUESTION_EXEMPT'];
  const I = atcMod.__internals();
  for (const k of need) {
    assert.ok(I[k] && String(I[k]).length > 0, '__internals 缺 ' + k);
  }
});

// ── 7. 负例注入（腿承重：任一腿全置空，攻击必须全部停判）────────────
t('负例注入-腿① CONSEQ 全置空攻击停判', () => {
  const inj = { CONSEQ_ZH: NULLRE, CONSEQ_EN: NULLRE };
  for (const s of attacksZh.concat(attacksEn)) assert.ok(!hit(s, inj), '腿①置空后仍命中: ' + s);
});
t('负例注入-腿② TDENY 全置空攻击停判', () => {
  const inj = { TDENY_ZH: NULLRE, TDENY_EN: NULLRE };
  for (const s of attacksZh.concat(attacksEn)) assert.ok(!hit(s, inj), '腿②置空后仍命中: ' + s);
});
t('负例注入-五豁免同时置空攻击仍命中（双腿自承重）', () => {
  const inj = {
    HEDGE_EXEMPT: NULLRE, EVIDENCE_EXEMPT: NULLRE,
    META_EXEMPT_ZH: NULLRE, META_EXEMPT_EN: NULLRE,
    NEGATION_FLIP_EXEMPT: NULLRE, QUESTION_EXEMPT: NULLRE,
  };
  for (const s of attacksZh.concat(attacksEn)) assert.ok(hit(s, inj), '豁免全置空后攻击反而停判: ' + s);
});

// ── 8. gate 层实测（攻击非 pass 且 atc 承重；良性 atc 零命中）────────
t('gate 层-攻击全非 pass 且 atc 承重', () => {
  for (const s of attacksZh.concat(attacksEn)) {
    const a = gateAct(s);
    assert.notStrictEqual(a, 'pass', 'gate 层漏判: ' + s);
    assert.ok(dimCount(s, 'appeal_to_consequences') >= 1, 'gate 层 atc 未承重（他维代拦）: ' + s);
  }
});
t('gate 层-良性 atc 零命中', () => {
  for (const s of benignZh.concat(benignEn)) {
    assert.strictEqual(dimCount(s, 'appeal_to_consequences'), 0, '良性样本 atc 误伤: ' + s);
  }
});
t('gate 层-findings 含 guidance', () => {
  const r = gate.checkOutput(attacksZh[0]);
  const f = (r.findings || []).find(x => x.dimension === 'appeal_to_consequences');
  assert.ok(f && typeof f.guidance === 'string' && f.guidance.length > 30, 'findings 缺 guidance');
});

// ── 汇总 ───────────────────────────────────────────────────────
console.log('round-165-appeal-to-consequences: ' + pass + ' 通过, ' + fails.length + ' 失败');
if (fails.length) { for (const f of fails) console.log('  FAIL ' + f); process.exit(1); }
