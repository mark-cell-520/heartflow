'use strict';
/**
 * test/round-163-incredulity.js
 * [r163] 第 162 维度 incredulity（诉诸个人怀疑 / argument from personal
 * incredulity）轮测试。结构同 r161 先例：攻击集 / 良性集 / 边界锁 /
 * 分工边界锁 / 存量回归 / 登记断言 / 负例注入承重。
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同
 * r720-r729/r161 纪律。
 *
 * 注入机制：checkIncredulity(text, inject) 第二参以空白正则替换指定常量，
 * 逐常量置空验证「承重」——置空后攻击必须停判（腿承重）、豁免样本必须
 * 翻转为命中（豁免承重）。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const incMod = require(path.join(ROOT, 'src', 'incredulity.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const NULLRE = /(?!x)x/;
const hit = (s, inject) => incMod.checkIncredulity(s, inject).score > 0;
const gateAct = (s) => { try { return gate.checkOutput(s).gate.action; } catch (e) { return 'ERROR:' + e.message; } };
const dimCount = (s, k) => {
  const d = (idx.discriminate(s).dimensions || {})[k];
  if (!d || typeof d !== 'object') return 0;
  return d.count !== undefined ? d.count : (Array.isArray(d.hits) ? d.hits.length : 0);
};

// ── 1. 攻击集（模块层实测命中——同族变体矩阵：中英双语/裸词干/带修饰/
//      倒装/长句，r161 裸词教训：变体矩阵是负例测试之外的强制项）────────
const attacksZh = [
  '我无法想象他怎么能做到，所以这成绩一定是假的',                       // 基本形
  '他的进步速度快得简直令人难以置信，因此这个纪录根本不可信',           // 带修饰
  '这结果真是难以置信，一看就是后期剪辑的',                             // 裸词干+显式否定
  '这数据不可能是真的，我实在无法想象它怎么采集的',                     // 倒装形
  '他年纪轻轻就身居高位，我根本想象不到他凭什么拿到这个职位，所以背后一定有推手', // 长句
  '视频播放量高得离谱，我难以想象是自然增长，肯定是刷出来的',           // 刷量族
  '冠军的成绩好到让人想象不到，肯定是吃了药',                           // 想象不到+吃药族
  '这幅画精妙得不可思议，一看就是后期合成的',                           // 不可思议+后期合成
];
const attacksEn = [
  'I cannot imagine how this is possible, so it cannot be true.',
  'The result is unbelievable; clearly the footage was doctored.',
  "It can't be real, because I simply cannot conceive of such precision.",
  'There is no way that happened; I cannot fathom it.',
  'Her performance was inconceivable, therefore the recording must have been edited.',
];
t('攻击-ZH 全命中（变体矩阵）', () => {
  for (const s of attacksZh) assert.ok(hit(s), '漏判: ' + s);
});
t('攻击-EN 全命中（变体矩阵）', () => {
  for (const s of attacksEn) assert.ok(hit(s), '漏判: ' + s);
});

// ── 2. 良性集（模块层零误伤——惊讶非否定/有据可查/元评析/提问）────────
const benigns = [
  '实验结果令人难以置信，但已经过第三方独立复核',              // 证据豁免
  '我无法想象没有互联网的生活会是什么样',                      // 无否定腿
  '他的速度快得令人难以置信，但有计时录像和裁判记录为证',      // 证据豁免
  '宇宙的浩瀚让人难以想象，这正是科普文章想传达的',            // 无否定腿
  '这道菜好吃得不可思议，但我相信后厨没有放违规添加剂',        // 无否定腿
  '诉诸个人怀疑是一种用「我无法想象」否定事实的谬误',          // 元评析
  '我无法想象这是怎么做到的，这怎么可能呢？',                  // 提问豁免
  '他创造的成绩令人难以置信，不过这有完整的比赛录像可以查证',  // 证据豁免
  "The magician's trick was unbelievable, but the audience verified the props.",
  "I can't imagine why anyone would refuse such an offer.",     // 无否定腿
  'The argument from personal incredulity is a common fallacy.', // 元评析(EN)
];
t('良性-模块层零误伤', () => {
  for (const s of benigns) assert.ok(!hit(s), '误伤: ' + s);
});

// ── 3. 边界锁（豁免承重样本——含双腿但被豁免）────────────────────
const boundary = [
  ['EVIDENCE_EXEMPT', '成绩提升幅度令人难以置信，所以这一定有假，但有三次模考记录和批改痕迹可查'],
  ['QUESTION_EXEMPT', '我无法想象这是怎么做到的，所以这不可能是真的，对吧？'],
  ['META_EXEMPT_ZH', '诉诸个人怀疑：我无法想象这一切，所以这不是真的'],
  ['META_EXEMPT_EN', 'The argument from personal incredulity: I cannot imagine it, so it cannot be true.'],
];
t('边界-豁免样本模块层零误伤', () => {
  for (const [k, s] of boundary) assert.ok(!hit(s), '边界误伤[' + k + ']: ' + s);
});

// ── 4. 分工边界锁（存量维度已覆盖的族不因本维度降级）────────────
t('分工-absolute_claim 存量样本仍被覆盖', () => {
  const s = '毫无疑问这是唯一正确的方案';
  assert.notStrictEqual(gateAct(s), 'pass', 'absolute_claim 存量攻击不再拦截');
});
t('分工-appeal_to_ignorance 存量样本仍被覆盖', () => {
  const s = '没人能证明这个方法无效，所以它一定有效';
  assert.notStrictEqual(gateAct(s), 'pass', 'appeal_to_ignorance 存量攻击不再拦截');
});
t('分工-unsupported_claim 存量样本仍被覆盖', () => {
  const s = '根据2025年哈佛研究，咖啡能延长寿命12.5年';
  assert.notStrictEqual(gateAct(s), 'pass', 'unsupported_claim 存量攻击不再拦截');
});

// ── 5. 存量回归（共享腿族攻击/良性不因本维度翻转）────────────────
t('存量回归-存量攻击族不降级', () => {
  const cases = [
    ['monocause', '这家公司倒闭完全是因为管理不善，没有别的原因'],
    ['psychologists_fallacy', '所有人都像我这么想，这很明显'],
    ['sycophancy', '您说得完全正确，您的每一个观点都深刻无比'],
  ];
  for (const [k, s] of cases) {
    assert.notStrictEqual(gateAct(s), 'pass', k + ' 存量攻击不再拦截: ' + gateAct(s) + ' :: ' + s);
  }
});
t('存量回归-共享腿良性样本零误伤', () => {
  const cases = [
    '我无法想象这首诗描绘的意境，但它确实打动了我',
    'If it rains tomorrow, the match will be postponed.',
    '实验结果令人惊讶，研究团队正在复核数据',
  ];
  for (const s of cases) {
    const a = gateAct(s);
    assert.ok(a === 'pass' || a === 'warn' || a === 'verify', '良性被误拦: ' + a + ' :: ' + s);
  }
});

// ── 6. 登记断言 ────────────────────────────────────────────────
t('登记-dimensions 计数 162', () => {
  const ks = Object.keys(idx.discriminate('probe').dimensions);
  assert.strictEqual(ks.length, 162, '维度计数 = ' + ks.length);
});
t('登记-incredulity 在 dimensions 内', () => {
  const ks = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(ks.includes('incredulity'), 'dimensions 缺 incredulity');
});
t('登记-incredulity 在 VERIFY_DIMS（攻击 gate 非 pass）', () => {
  for (const s of attacksZh.concat(attacksEn)) {
    assert.notStrictEqual(gateAct(s), 'pass', 'gate 放行攻击: ' + gateAct(s) + ' :: ' + s);
  }
});
t('登记-gate 层良性放行（不 block/rewrite）', () => {
  const gateBenign = [
    '实验结果令人难以置信，但已经过第三方独立复核',
    '我无法想象没有互联网的生活会是什么样',
    '诉诸个人怀疑是一种用「我无法想象」否定事实的谬误',
    '宇宙的浩瀚让人难以想象，这正是科普文章想传达的',
  ];
  for (const s of gateBenign) {
    const a = gateAct(s);
    assert.ok(a === 'pass' || a === 'warn' || a === 'verify', '良性被 block/rewrite: ' + a + ' :: ' + s);
  }
});
t('登记-概念条文存在', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(src.includes("'incredulity':"), 'index.js 缺 incredulity 概念条文');
});
t('登记-summary 命中可见（诉诸个人怀疑计数）', () => {
  const s = idx.discriminate('我无法想象他怎么能做到，所以这成绩一定是假的').summary || '';
  assert.ok(/诉诸个人怀疑/.test(s), 'summary 未含诉诸个人怀疑: ' + String(s).slice(0, 200));
});
t('登记-攻击样本 incredulity 维度 count > 0（本维度承重，非存量维度代拦）', () => {
  for (const s of attacksZh.concat(attacksEn)) {
    assert.ok(dimCount(s, 'incredulity') > 0, 'incredulity 维度未命中: ' + s);
  }
});
t('登记-__internals 判据腿/豁免常量在位', () => {
  const need = ['INCREDULITY_ZH', 'INCREDULITY_EN', 'DENY_ZH',
    'TRUTHDENIAL_ZH_B', 'TRUTHDENIAL_EN',
    'EVIDENCE_EXEMPT', 'QUESTION_EXEMPT', 'META_EXEMPT_ZH', 'META_EXEMPT_EN'];
  const I = incMod.__internals();
  for (const k of need) {
    assert.ok(I[k] && String(I[k]).length > 0, '__internals 缺 ' + k);
  }
});

// ── 7. 负例注入承重（inject 第二参逐常量置空，必须真实翻转）──────
t('注入-腿①全置空攻击全停判', () => {
  const inj = { INCREDULITY_ZH: NULLRE, INCREDULITY_EN: NULLRE };
  for (const s of attacksZh.concat(attacksEn)) assert.ok(!hit(s, inj), '置空腿①后仍命中: ' + s);
});
t('注入-腿②全置空攻击全停判', () => {
  const inj = { DENY_ZH: NULLRE, TRUTHDENIAL_ZH_B: NULLRE, TRUTHDENIAL_EN: NULLRE };
  for (const s of attacksZh.concat(attacksEn)) assert.ok(!hit(s, inj), '置空腿②后仍命中: ' + s);
});
t('注入-豁免常量逐项置空翻转', () => {
  for (const [k, s] of boundary) {
    const inj = {}; inj[k] = NULLRE;
    assert.ok(hit(s, inj), '置空 ' + k + ' 后未翻转为命中: ' + s);
  }
});

console.log('== r163 诉诸个人怀疑新维度轮测试 ==');
if (fails.length) {
  console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败');
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
} else {
  console.log('结果: ' + pass + ' 通过, 0 失败');
}
