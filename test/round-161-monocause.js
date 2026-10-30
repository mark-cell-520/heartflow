'use strict';
/**
 * test/round-161-monocause.js
 * [r161] 第 161 维度 monocause（单一因果过度简化 / fallacy of the single
 * cause）轮测试。结构同 r729 先例：攻击集 / 良性集 / 边界锁 / 分工边界锁 /
 * 存量回归 / 登记断言 / 负例注入承重。
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同 r720-r729 纪律。
 *
 * 注入机制：checkMonocause(text, inject) 第二参以空白正则替换指定常量，
 * 逐常量置空验证「承重」——置空后攻击必须停判（腿承重）、豁免样本必须
 * 翻转为命中（豁免承重）。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const monoMod = require(path.join(ROOT, 'src', 'monocause.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const NULLRE = /(?!x)x/;
const hit = (s, inject) => monoMod.checkMonocause(s, inject).score > 0;
const gateAct = (s) => { try { return gate.checkOutput(s).gate.action; } catch (e) { return 'ERROR:' + e.message; } };
const dim = (s, k) => {
  const d = idx.discriminate(s);
  const v = (d.dimensions || {})[k];
  if (!v || typeof v !== 'object') return 0;
  return v.count !== undefined ? v.count : (Array.isArray(v.hits) ? v.hits.length : 0);
};

// ── 1. 攻击集（模块层实测命中）────────────────────────────────────
const attacksZh = [
  '这家公司倒闭完全是因为管理不善，没有别的原因',
  '如今年轻人不生育，全都是因为房价太高',
  '经济危机的根源全在货币政策，没有别的原因',
  '他创业失败，纯粹是因为运气不好',
  '青少年犯罪率上升，说到底就是因为家庭教育缺失',
  '美国今天的衰落，唯一的原因就是产业空心化',
  '王朝覆灭无非是因为皇帝昏庸',
  '社会撕裂完全是因为贫富差距，与其他因素无关',
  '离婚率攀升，完全是因为女性经济独立',
  '这一系列乱象，说到底不过是监管缺位',
];
const attacksEn = [
  'The financial crisis was caused entirely by deregulation.',
  'Crime is nothing but a product of poverty.',
  'The company failed solely because of bad management.',
  'Rome fell purely because of lead in the aqueducts.',
  'Inequality is entirely the result of one bad policy.',
  'The recession was solely due to a single decision.',
];
t('攻击-ZH 全命中', () => {
  for (const s of attacksZh) assert.ok(hit(s), '漏判: ' + s);
});
t('攻击-EN 全命中', () => {
  for (const s of attacksEn) assert.ok(hit(s), '漏判: ' + s);
});

// ── 2. 良性集（模块层零误伤——可单一归因的琐事 + 正常陈述）──────────
const benigns = [
  '他考试没考好，完全是因为没复习',            // 琐事：考试可单一归因，无腿①
  '这场比赛输了完全是因为主力受伤',            // 琐事：比赛
  '会议延期就是因为主讲人生病',                // 琐事：会议
  '经济衰退是货币政策、供应链和消费信心多重因素共同作用的结果',
  '犯罪率上升的一个主要原因是执法不力，此外还有社会经济因素',
  '帝国衰落是多种因素交织的结果，不能归结为单一原因',
  '金融危机的部分原因是监管放松，但不限于此',
  '今天天气很好，我们出去玩吧',
  '请解释一下什么是通货膨胀',
  '这家公司为什么倒闭？',
  '单一因果谬误是指把复杂结果归因于单一原因',
  'The recession was caused by a combination of monetary and supply factors.',
  'Why did the company fail? There are many possible reasons.',
  'Crime is one of the main drivers of public concern.',
  'Attributing the collapse to a single factor would be a mistake.',
];
t('良性-模块层零误伤', () => {
  for (const s of benigns) assert.ok(!hit(s), '误伤: ' + s);
});

// ── 3. 边界锁（豁免承重样本——含双腿但被豁免）────────────────────
const boundary = [
  '公司倒闭完全是资金和市场多重因素共同作用的结果',   // MULTICAUSE 豁免
  '经济危机的一个主要推手完全是因为货币政策',          // HEDGED 豁免
  '经济危机完全是因为什么原因？',                       // QUESTION 豁免
  '单一因果谬误：有人认为经济危机完全是因为监管，这是简化', // META 豁免
  'The crisis was caused entirely by greed, but there is no single cause.', // MULTICAUSE(EN) 豁免
];
t('边界-豁免样本模块层零误伤', () => {
  for (const s of boundary) assert.ok(!hit(s), '边界误伤: ' + s);
});

// ── 4. 分工边界锁（存量维度已覆盖的族不因本维度降级）────────────
t('分工-post_hoc 存量样本仍被覆盖', () => {
  const s = '昨天给服务器打了补丁，今天就出故障了，补丁有问题';
  assert.notStrictEqual(gateAct(s), 'pass', 'post_hoc 存量攻击不再拦截');
});
t('分工-emotional_manipulation 存量样本仍被覆盖', () => {
  const s = '如果你爱我，你就会同意我';
  assert.notStrictEqual(gateAct(s), 'pass', 'emotional_manipulation 存量攻击不再拦截');
});
t('分工-absolute_claim 存量样本仍被覆盖', () => {
  const s = '毫无疑问这是唯一正确的方案';
  assert.notStrictEqual(gateAct(s), 'pass', 'absolute_claim 存量攻击不再拦截');
});

// ── 5. 存量回归（共享腿族攻击/良性不因本维度翻转）────────────────
t('存量回归-存量攻击族不降级', () => {
  const cases = [
    ['appeal_to_probability', '宇宙这么大，肯定有外星人'],
    ['gamblers_fallacy', '都连开十把小了，下一把肯定开大'],
    ['hasty_generalization', '我见过三个这样的案例，全都失败了'],
  ];
  for (const [k, s] of cases) {
    assert.notStrictEqual(gateAct(s), 'pass', k + ' 存量攻击不再拦截: ' + gateAct(s) + ' :: ' + s);
  }
});
t('存量回归-共享腿良性样本零误伤', () => {
  const cases = [
    '经济衰退正在影响今年的出口数据',
    '请给出通货膨胀的定义和衡量指标',
    'If it rains tomorrow, the match will be postponed.',
  ];
  for (const s of cases) {
    const a = gateAct(s);
    assert.ok(a === 'pass' || a === 'warn' || a === 'verify', '良性被误拦: ' + a + ' :: ' + s);
  }
});

// ── 6. 登记断言 ────────────────────────────────────────────────
t('登记-dimensions 计数 161', () => {
  const ks = Object.keys(idx.discriminate('probe').dimensions);
  assert.strictEqual(ks.length, 161, '维度计数 = ' + ks.length);
});
t('登记-monocause 在 dimensions 内', () => {
  const ks = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(ks.includes('monocause'), 'dimensions 缺 monocause');
});
t('登记-monocause 在 VERIFY_DIMS', () => {
  const r = gate.checkOutput('这家公司倒闭完全是因为管理不善，没有别的原因');
  assert.strictEqual(r.gate.action, 'verify', 'monocause 攻击 gate.action = ' + r.gate.action);
});
t('登记-gate 层攻击拦截', () => {
  for (const s of attacksZh) {
    assert.notStrictEqual(gateAct(s), 'pass', 'gate 放行攻击: ' + gateAct(s) + ' :: ' + s);
  }
});
t('登记-gate 层良性放行（不 block/rewrite）', () => {
  const gateBenign = [
    '经济衰退是货币政策、供应链和消费信心多重因素共同作用的结果',
    '他考试没考好，完全是因为没复习',
    '请解释一下什么是通货膨胀',
    'The recession was caused by a combination of monetary and supply factors.',
  ];
  for (const s of gateBenign) {
    const a = gateAct(s);
    assert.ok(a === 'pass' || a === 'warn' || a === 'verify', '良性被 block/rewrite: ' + a + ' :: ' + s);
  }
});
t('登记-概念条文存在', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(src.includes("'monocause':"), 'index.js 缺 monocause 概念条文');
});
t('登记-summary 命中可见（单一因果过度简化计数）', () => {
  const s = idx.discriminate('这家公司倒闭完全是因为管理不善，没有别的原因').summary || '';
  assert.ok(/单一因果过度简化/.test(s), 'summary 未含单一因果过度简化: ' + String(s).slice(0, 200));
});
t('登记-__internals 判据腿/豁免常量在位', () => {
  const need = ['COMPLEX_ZH', 'COMPLEX_EN', 'SINGLE_ZH', 'SINGLE_EN',
    'MULTICAUSE_EXEMPT', 'HEDGED_EXEMPT', 'QUESTION_EXEMPT', 'META_EXEMPT_ZH', 'META_EXEMPT_EN'];
  const I = monoMod.__internals();
  for (const k of need) {
    assert.ok(I[k] && String(I[k]).length > 0, '__internals 缺 ' + k);
  }
});

// ── 7. 负例注入承重（inject 第二参逐常量置空，必须真实翻转）──────
t('注入-腿①全置空攻击全停判', () => {
  const inj = { COMPLEX_ZH: NULLRE, COMPLEX_EN: NULLRE };
  for (const s of attacksZh.concat(attacksEn)) assert.ok(!hit(s, inj), '置空腿①后仍命中: ' + s);
});
t('注入-腿②全置空攻击全停判', () => {
  const inj = { SINGLE_ZH: NULLRE, SINGLE_EN: NULLRE };
  for (const s of attacksZh.concat(attacksEn)) assert.ok(!hit(s, inj), '置空腿②后仍命中: ' + s);
});
t('注入-豁免常量逐项置空翻转', () => {
  const cases = [
    ['MULTICAUSE_EXEMPT', '公司倒闭完全是资金和市场多重因素共同作用的结果'],
    ['HEDGED_EXEMPT', '经济危机的一个主要推手完全是因为货币政策'],
    ['QUESTION_EXEMPT', '经济危机完全是因为什么原因？'],
    ['META_EXEMPT_ZH', '单一因果谬误：有人认为经济危机完全是因为监管，这是简化'],
    ['META_EXEMPT_EN', 'Calling this a monocausal fallacy: the crisis was caused entirely by greed.'],
  ];
  for (const [k, s] of cases) {
    const inj = {}; inj[k] = NULLRE;
    assert.ok(hit(s, inj), '置空 ' + k + ' 后未翻转为命中: ' + s);
  }
});

console.log('== r161 单一因果过度简化新维度轮测试 ==');
if (fails.length) {
  console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败');
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
} else {
  console.log('结果: ' + pass + ' 通过, 0 失败');
}
