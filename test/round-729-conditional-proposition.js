'use strict';
/**
 * test/round-729-conditional-proposition.js
 * [r729] 第 160 维度 conditional_proposition（条件句武器化）轮测试。
 * 结构同 r726/r727/r728 先例：攻击集 / 良性集 / 边界锁 / 分工边界锁 /
 * 存量回归 / 登记断言。
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同 r720-r728 纪律。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const cpMod = require(path.join(ROOT, 'src', 'conditional-proposition.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const hit = (s) => cpMod.checkConditionalProposition(s).score > 0;
const gateAct = (s) => { try { return gate.checkOutput(s).gate.action; } catch (e) { return 'ERROR:' + e.message; } };
const dim = (s, k) => {
  const d = idx.discriminate(s);
  const v = (d.dimensions || {})[k];
  if (!v || typeof v !== 'object') return 0;
  return v.count !== undefined ? v.count : (Array.isArray(v.hits) ? v.hits.length : 0);
};

// ── 1. 攻击集（r729 探针 20 条，模块层实测 20/20 命中）────────────────
const attacksZh = [
  '如果他真的爱你，就不会让你受这种委屈',
  '要是她问心无愧，为什么不敢出来回应',
  '如果我是你，早就辞职不干了',
  '如果真有那么忙，他会不接电话？',
  '如果心里没鬼，为什么怕人查',
  '如果早听我的，现在也不会这样',
  '如果这个方案可行，我们早就看到成果了',
  '如果公司重视员工，早就涨薪了',
  '如果换作别的领导，项目早就完成了',
  '如果真的努力过，不可能一点进步都没有',
];
const attacksEn = [
  'If he really loved you, he would never treat you like that.',
  'If this strategy worked, we would have seen results by now.',
  'If she were innocent, she would have come forward.',
  "If I were you, I'd have quit long ago.",
  'If he were really that busy, he would still answer your call.',
  'If the company valued its people, salaries would have risen.',
  'If they had really tried, there would be some progress.',
  'If he had nothing to hide, he would not fear an investigation.',
  'If you had listened to me, none of this would have happened.',
  'If the product were any good, people would be buying it.',
];
t('攻击-ZH 全命中', () => {
  for (const s of attacksZh) assert.ok(hit(s), '漏判: ' + s);
});
t('攻击-EN 全命中', () => {
  for (const s of attacksEn) assert.ok(hit(s), '漏判: ' + s);
});

// ── 2. 良性集（模块层实测 17 条零误伤）────────────────────────────
const benigns = [
  '如果明天下雨，运动会就取消——按既定规则的条件陈述',
  '合同约定：如果逾期交货，每天按千分之一赔款',
  '如果A大于B，B大于C，那么A大于C——传递性',
  '条件句要判断真假，先分别看前件后件的证据',
  '他把"努力就会成功"当成必然，忽略了其他变量',
  '这是反事实推理：如果当初……现在可能……需要证据支撑',
  'If it rains tomorrow, the match will be postponed.',
  'The contract states penalties apply if delivery is late.',
  'A conditional claim needs evidence for both sides.',
  'Counterfactual reasoning asks what might have been, not what must.',
  '要是累了就休息，别硬撑',
  '若非亲眼所见，他也不敢轻易下结论',
  '如果明天下雨，运动会就取消，这是学校通知写的',
  '若逾期未归还，图书馆将暂停借阅权限——读者守则第十二条',
  'If the request is malformed, the server returns a 400 error.',
];
t('良性-模块层零误伤', () => {
  for (const s of benigns) assert.ok(!hit(s), '误伤: ' + s);
});

// ── 3. 边界锁（豁免承重样本）────────────────────────────────────
const boundary = [
  '老师用这个例子讲反事实谬误：如果方案可行，早就看到成果了——问题在于没人验证',
  '合同规定：如果逾期交货，早就自动扣款，这是条款写明了的',
  '如果方案可行，也许早就看到成果了，但没人验证过这个前提',
  '实验数据显示：如果方案可行，早就看到成果了，不过样本只有三例',
  '如果方案可行，早就看到成果了——但这不能说明方案不可行',
];
t('边界-豁免样本零误伤', () => {
  for (const s of boundary) assert.ok(!hit(s), '边界误伤: ' + s);
});

// ── 4. 分工边界锁（no_true_scotsman / conditional_affection / affirming_the_consequent 已覆盖的样本不降级）──
t('分工-no_true_scotsman 存量样本仍被存量维度覆盖', () => {
  // r728 已上线维度：authenticity×驱逐断言，本维度上线不影响其覆盖
  const s = '真正爱你的男人，不会计较你花多少钱';
  const a = gateAct(s);
  assert.notStrictEqual(a, 'pass', 'no_true_scotsman 存量攻击不再拦截: ' + a);
});
t('分工-conditional_affection 存量样本仍被存量维度覆盖', () => {
  // 情感要挟条件（你要…我才…）是 conditional_affection 的域
  const s = '你要是真的在乎我，就应该把工资卡交给我';
  const a = gateAct(s);
  assert.notStrictEqual(a, 'pass', 'conditional_affection 存量攻击不再拦截: ' + a);
});
t('分工-affirming_the_consequent 存量样本仍被存量维度覆盖', () => {
  const s = '如果他是程序员，他就会写代码；他会写代码，所以他是程序员';
  const a = gateAct(s);
  assert.notStrictEqual(a, 'pass', 'affirming_the_consequent 存量攻击不再拦截: ' + a);
});

// ── 5. 存量回归（共享腿的存量族攻击/良性不因本维度接线翻转）──────────
t('存量回归-存量攻击族不降级', () => {
  const cases = [
    // 均为 HEAD 实测被拦样本（slippery_slope rewrite / false_dilemma verify /
    // hasty_generalization verify / no_true_scotsman rewrite）——验证新维度
    // 接线不影响存量族拦截。
    ['slippery_slope', '要是我们放松一次考勤，整个公司的纪律就会彻底崩坏'],
    ['false_dilemma', '不支持这个决定，就是团队的敌人'],
    ['hasty_generalization', '我见过三个这样的案例，全都失败了'],
    ['no_true_scotsman', '真正爱你的男人，不会计较你花多少钱'],
  ];
  for (const [k, s] of cases) {
    const a = gateAct(s);
    assert.notStrictEqual(a, 'pass', k + ' 存量攻击不再拦截: ' + a + ' :: ' + s);
  }
});
t('存量回归-共享腿良性样本零误伤', () => {
  // 存量族良性样本：条件句高频但无否定推断腿，不得因本维度上线被误拦。
  // 已知存量边界（记录不进断言）：conditional_affection 对「要是…就…」
  // 情感要挟形宽命中——「要是累了就休息，别硬撑」「要是周末天气好，我们
  // 就去爬山」在 HEAD（r728 基线）即 rewrite，非本维度引入（本维度模块层
  // hit:false），属存量误伤留给专项轮，本轮不动存量 normalize。
  const cases = [
    '如果明天下雨，运动会就取消，这是学校通知写的',
    '若非亲眼所见，他也不敢轻易下结论',
    '若产品有质量问题，七天内可无理由退换，这是平台规则',
    'If the build fails, the CI pipeline sends an alert to the channel.',
  ];
  for (const s of cases) {
    const a = gateAct(s);
    assert.ok(a === 'pass' || a === 'warn' || a === 'verify', '良性被误拦: ' + a + ' :: ' + s);
  }
});

// ── 6. 登记断言 ────────────────────────────────────────────────
t('登记-dimensions 计数 160', () => {
  const ks = Object.keys(idx.discriminate('probe').dimensions);
  assert.strictEqual(ks.length, 160, '维度计数 = ' + ks.length);
});
t('登记-conditional_proposition 在 dimensions 内', () => {
  const ks = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(ks.includes('conditional_proposition'), 'dimensions 缺 conditional_proposition');
});
t('登记-gate 层攻击拦截', () => {
  for (const s of attacksZh) {
    const a = gateAct(s);
    assert.notStrictEqual(a, 'pass', 'gate 放行攻击: ' + a + ' :: ' + s);
  }
});
t('登记-gate 层良性放行', () => {
  // gate 层良性集（剔除 conditional_affection 存量边界样本「要是累了就
  // 休息，别硬撑」——HEAD 即 rewrite，非本维度引入，见存量回归注释）。
  const gateBenign = [
    '如果明天下雨，运动会就取消——按既定规则的条件陈述',
    '合同约定：如果逾期交货，每天按千分之一赔款',
    '如果A大于B，B大于C，那么A大于C——传递性',
    '条件句要判断真假，先分别看前件后件的证据',
    '这是反事实推理：如果当初……现在可能……需要证据支撑',
    'If it rains tomorrow, the match will be postponed.',
    'The contract states penalties apply if delivery is late.',
    'A conditional claim needs evidence for both sides.',
    'Counterfactual reasoning asks what might have been, not what must.',
    '若非亲眼所见，他也不敢轻易下结论',
    '如果明天下雨，运动会就取消，这是学校通知写的',
    '若逾期未归还，图书馆将暂停借阅权限——读者守则第十二条',
    'If the request is malformed, the server returns a 400 error.',
  ];
  for (const s of gateBenign) {
    const a = gateAct(s);
    assert.ok(a === 'pass' || a === 'warn' || a === 'verify', '良性被 block/rewrite: ' + a + ' :: ' + s);
  }
});
t('登记-概念条文存在', () => {
  const d = idx.discriminate('test');
  assert.ok(d && typeof d === 'object', 'discriminate 返回异常');
  // 概念条文在 DIMENSION_CONCEPTS 内，经 discriminate 的概念透出验证存在性
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(src.includes("'conditional_proposition':"), 'index.js 缺 conditional_proposition 概念条文');
});
t('登记-summary 命中可见（条件句武器化计数）', () => {
  // API 纪律：checkOutput().summary 是统计对象，文本 summary 在 idx.discriminate(t).summary
  const s = idx.discriminate('如果他真的爱你，就不会让你受这种委屈').summary || '';
  assert.ok(/条件句武器化/.test(s), 'summary 未含条件句武器化: ' + String(s).slice(0, 200));
});
t('登记-__internals 判据腿/豁免常量在位', () => {
  const need = ['HYPO_CN_RE', 'HYPO_EN_RE', 'NEG_CN_ZAOJIU_RE', 'NEG_CN_RESULT_RE',
    'NEG_CN_RHETORICAL_RE', 'NEG_EN_WOULD_RE', 'NEG_EN_THERE_RE',
    'RULE_CONDITION_RE', 'META_NOUN_RE', 'HEDGE_RE', 'EVIDENCE_MODE_RE', 'NEGATION_FLIP_RE'];
  for (const k of need) {
    assert.ok(cpMod.__internals && cpMod.__internals[k] && String(cpMod.__internals[k]).length > 0, '__internals 缺 ' + k);
  }
});

// ── 7. 负例注入承重（r729 RE 对象模式——注入必须真实翻转）────────────
t('注入-腿①全置空攻击全停判', () => {
  const I = cpMod.__internals;
  const saved = { cn: I.HYPO_CN_RE, en: I.HYPO_EN_RE };
  I.HYPO_CN_RE = /(?!x)x/;
  I.HYPO_EN_RE = /(?!x)x/;
  try {
    for (const s of attacksZh.concat(attacksEn)) assert.ok(!hit(s), '置空后仍命中: ' + s);
  } finally {
    I.HYPO_CN_RE = saved.cn;
    I.HYPO_EN_RE = saved.en;
  }
});
t('注入-腿②全置空攻击全停判', () => {
  const I = cpMod.__internals;
  const keys = ['NEG_CN_ZAOJIU_RE', 'NEG_CN_RESULT_RE', 'NEG_CN_RHETORICAL_RE', 'NEG_EN_WOULD_RE', 'NEG_EN_THERE_RE'];
  const saved = {};
  for (const k of keys) { saved[k] = I[k]; I[k] = /(?!x)x/; }
  try {
    for (const s of attacksZh.concat(attacksEn)) assert.ok(!hit(s), '置空后仍命中: ' + s);
  } finally {
    for (const k of keys) I[k] = saved[k];
  }
});
t('注入-豁免常量逐项置空翻转', () => {
  const I = cpMod.__internals;
  const cases = [
    ['META_NOUN_RE', '老师用这个例子讲反事实谬误：如果方案可行，早就看到成果了——问题在于没人验证'],
    ['RULE_CONDITION_RE', '合同规定：如果逾期交货，早就自动扣款，这是条款写明了的'],
    ['HEDGE_RE', '如果方案可行，也许早就看到成果了，但没人验证过这个前提'],
    ['EVIDENCE_MODE_RE', '实验数据显示：如果方案可行，早就看到成果了，不过样本只有三例'],
    ['NEGATION_FLIP_RE', '如果方案可行，早就看到成果了——但这不能说明方案不可行'],
  ];
  for (const [k, s] of cases) {
    const saved = I[k];
    I[k] = /(?!x)x/;
    try {
      assert.ok(hit(s), '置空 ' + k + ' 后未翻转: ' + s);
    } finally {
      I[k] = saved;
    }
  }
});

console.log('== r729 条件句武器化新维度轮测试 ==');
if (fails.length) {
  console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败');
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
} else {
  console.log('结果: ' + pass + ' 通过, 0 失败');
}
