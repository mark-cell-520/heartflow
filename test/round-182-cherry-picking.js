/**
 * test/round-182-cherry-picking.js — 第 180 维度 cherry_picking
 * （选择性取证 / cherry-picking：只从支持某结论的证据池取证——只找/只引用/
 * 只保留支持性证据或隐去略去不利证据——却把结论封装为「证明/证实/成立/
 * 毫无疑问」）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量（26 个可注入常量）注入 [] 置空后，依赖该常量的攻击
 *      必须停止命中；依赖某豁免的「陷阱样本」（攻击结构俱在但被正确豁免）
 *      在抹掉该豁免后必须转为命中。
 *
 * r182 实现设计（五条，已固化进测试与源码注释）：
 *   · 腿②三形：A 连接词形（连接词 → [≤18字] → [确定性副词 → [≤6字] →]
 *     封结论名词；A' 连接词 → 封结论动词 → [≤10字] → 封结论名词）、B 直接
 *     封装形（[足以/完全可以] + 封结论动词 → [≤8字] → 封结论名词——
 *     「足以证明产品没有问题」无连接词，是最常见攻击形，B 形不收则整族
 *     漏判）、C 情态封装形（确定性副词 → [≤6字] → 封结论名词，跨句亦判：
 *     「报告只引用正面评价。方案完全可靠。」）。
 *   · 腿① A2 无副词形（动词 → [≤6字] → 方向标记 → [≤8字] → 对象）：
 *     「筛选符合预期的实验记录」选择性由紧邻结构自足，不收则漏判；代价
 *     是 SEL_ADV_ZH 只对「动词-标记间隔 7-10 字」的长句独立承重，注入
 *     样本专门取该形（r182 实测设计，非偶然通过）。
 *   · 封结论动词词表与连接词词表**互斥**：首版把「足以证明」放进
 *     CONNECT_ZH，导致 A 形跨承重——注入 SEAL_VERB_ZH 后「足以证明产品
 *     没有问题」仍被 A 形（连接词 + 封结论名词）命中，负例测试假绿；
 *     剔除后 B 形才独家承重（同 r180「谓语必须用末组捕获组定位」教训）。
 *   · CONNECT_EN **不收** which proves / that proves：它们同时是 EN B 形
 *     的封结论动词前缀，收了会让 EN A' 形跨承重（注入 SEAL_VERB_EN 假绿）。
 *   · 豁免表**刻意不收「选择性取证/断章取义」裸词**（META_ZH）：它们
 *     同时是腿① C 形攻击词，收了会把自己的腿①豁免掉（r180 同款教训）——
 *     META 只收「确认偏误/认知偏差/cherry-picking fallacy」等概念名。
 *
 * 161 轮教训：负例全绿不等于不漏——裸名词/带修饰/倒装/长句变体与边缘良性
 * 另在 variant-matrix 段用真实 gate() 复量。
 */
const assert = require('assert');
const { checkCherryPicking, __internals } = require('../src/cherry-picking.js');
const gateMod = require('../src/gate.js');
const gate = gateMod.gate;
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 一、攻击样本（无注入必须命中）────────────────────────────────
// A 支持性取样形（副词 × 动词 × 方向标记 × 对象）
const ATTACK_A = [
  '我只找支持这个结论的证据，所以它一定是成立的。',
  '只收集了来自三个渠道的支持性反馈，因此结论是可靠的。',   // 动词-标记间隔 8 字：A 形专属（A2 窗口 ≤6 不匹配）
  '报告对数据做了选择性引用，因此结论是毋庸置疑的。',       // C 短语形
];
// B 反向抑制形（两种语序）
const ATTACK_B = [
  '反面证据全部略去，因此结论毫无疑问是成立的。',
  '报告里只引用正面评价，隐瞒了所有不利记录，可见方案是完全可靠的。',
];
// EN 三形
const ATTACK_EN = [
  'We only cited the studies that supported our hypothesis, which proves the theory is correct.',
  'The report only presented favorable evidence, so the conclusion is certainly sound.',
  'The author cherry-picked the data, which proves the claim is true.',
];
// 腿②三形分别承重
const ATTACK_SEAL_A = ['我只找支持这个结论的证据，因此结论是正确的。'];            // A 形（无副词尾）
const ATTACK_SEAL_B = ['他专门挑对自己有利的数据说，足以证明产品没有问题。'];        // B 形（无连接词）
const ATTACK_SEAL_C = ['报告只引用正面评价。方案完全可靠。'];                        // C 形（跨句）

console.log('\n[r182 cherry_picking 攻击样本]');
for (const s of [].concat(ATTACK_A, ATTACK_B, ATTACK_EN, ATTACK_SEAL_A, ATTACK_SEAL_B, ATTACK_SEAL_C)) {
  t('命中: ' + s.slice(0, 22), () => {
    assert.ok(checkCherryPicking(s).hit, '应命中: ' + s.slice(0, 30));
  });
}

// ─── 二、良性样本（无注入必须放行）────────────────────────────────
const BENIGN = [
  // 纪律性否定
  '不能只挑对自己有利的证据，结论要经得起反面检验。',
  '他没有只保留支持性数据，因此这个结论是成立的。',
  // 结论侧否定与存疑（对他人选择性取证的正确指控）
  '他引用的数据全是支持性的，所以这个结论不足以采信。',
  '他只收集支持性反馈，因此结果无疑是准确的，但这仍不足以证明因果。',
  // 无方向标记 + 无确定性封装
  '我们目前只收集到三个案例，样本量不足，结论待验证。',
  '这份报告只呈现了支持该疗法的数据，但作者同时列出了全部不良事件记录，结论仍需独立复核。',
  // 概念/教学转述
  'Cherry-picking is a common confirmation bias; we should report all the data.',
  '这就是典型的确认偏误：只引用支持性数据，所以结论完全可靠。',
  'This is classic confirmation bias: they only cited favorable data, so the result is certainly sound.',
  // 对冲弱化
  '他只引用正面评价，所以方案可能是可靠的。',
  '他可能只看了支持自己的报道，也许结论有偏差。',
  'He only cited favorable data, so the conclusion is certainly sound, though this may be premature.',
  // 与既有维度射程交界的良性（selection_bias / survivorship_bias 域）
  '问卷只发给了注册会员，所以这个结果不能代表全体用户。',
  '我们只统计了活下来的用户，这个结论不足以推广到全体。',
  // 边缘良性：与本族无关的正确多因陈述（161 轮同款边缘良性）
  '战争是多因共同造成的，不能只归因于单一因素。',
  // EN 良性：来源受限 + 结论否定
  'We only surveyed a subset of users, so these results cannot be generalized.',
];
console.log('\n[r182 cherry_picking 良性样本]');
for (const s of BENIGN) {
  t('放行: ' + s.slice(0, 22), () => {
    assert.ok(!checkCherryPicking(s).hit, '应放行: ' + s.slice(0, 30));
  });
}

// ─── 三、逐常量负例注入承重 ───────────────────────────────────────
// 注入 [] 置空指定常量后，依赖该常量的攻击必须停止命中。
const INJECTIONS = [
  ['SEL_ADV_ZH', '只收集了来自三个渠道的支持性反馈，因此结论是可靠的。'],
  ['SEL_VERB_ZH', '我只找支持这个结论的证据，所以它一定是成立的。'],
  ['SEL_MARK_ZH', '我只找支持这个结论的证据，所以它一定是成立的。'],
  ['SEL_OBJ_ZH', '他专门挑对自己有利的数据说，足以证明产品没有问题。'],
  ['SEL_NEG_QUAL_ZH', '反面证据全部略去，因此结论毫无疑问是成立的。'],
  ['SEL_SUPPRESS_ZH', '反面证据全部略去，因此结论毫无疑问是成立的。'],
  ['SEL_PHRASE_ZH', '报告对数据做了选择性引用，因此结论是毋庸置疑的。'],
  ['SEL_PHRASE_EN', 'The author cherry-picked the data, which proves the claim is true.'],
  ['SEL_EN_ADV', 'We only cited the studies that supported our hypothesis, which proves the theory is correct.'],
  ['SEL_EN_VERB', 'We only cited the studies that supported our hypothesis, which proves the theory is correct.'],
  ['SEL_EN_MARK', 'We only cited the studies that supported our hypothesis, which proves the theory is correct.'],
  ['SEL_EN_OBJ', 'Only favorable evidence was presented, so the conclusion is certainly sound.'],
  ['CONNECT_ZH', '我只找支持这个结论的证据，因此结论是正确的。'],
  ['CONNECT_EN', 'We only cited supportive studies, so the conclusion is valid.'],
  ['SEAL_VERB_ZH', '他专门挑对自己有利的数据说，足以证明产品没有问题。'],
  ['SEAL_VERB_EN', 'The author cherry-picked the data, which proves the claim is true.'],
  ['SEAL_ADV_ZH', '报告只引用正面评价。方案完全可靠。'],
  ['SEAL_ADV_EN', 'Only favorable evidence was presented. The conclusion is certainly sound.'],
  ['SEAL_NOUN_ZH', '他专门挑对自己有利的数据说，足以证明产品没有问题。'],
  ['SEAL_NOUN_EN', 'The report only presented favorable evidence, so the conclusion is certainly sound.'],
];
console.log('\n[r182 cherry_picking 常量注入承重]');
for (const [key, s] of INJECTIONS) {
  t('注入承重 ' + key, () => {
    assert.ok(checkCherryPicking(s).hit, '无注入应命中: ' + s.slice(0, 24));
    assert.ok(!checkCherryPicking(s, { [key]: [] }).hit,
      '注入 [] 后应停判: ' + s.slice(0, 24));
  });
}

// ─── 四、豁免陷阱翻转（抹掉豁免后必须转为命中）────────────────────
const TRAPS = [
  ['META_ZH', '这就是典型的确认偏误：只引用支持性数据，所以结论完全可靠。'],
  ['META_EN', 'This is classic confirmation bias: they only cited favorable data, so the result is certainly sound.'],
  ['NEG_ZH', '他没有只保留支持性数据，因此这个结论是成立的。'],
  ['NEGSEAL_ZH', '他只收集支持性反馈，因此结果无疑是准确的，但这仍不足以证明因果。'],
  ['HEDGE_ZH', '他只引用正面评价，所以方案可能是可靠的。'],
  ['HEDGE_EN', 'He only cited favorable data, so the conclusion is certainly sound, though this may be premature.'],
];
console.log('\n[r182 cherry_picking 豁免陷阱翻转]');
for (const [key, s] of TRAPS) {
  t('豁免陷阱 ' + key, () => {
    assert.ok(!checkCherryPicking(s).hit, '有豁免应放行: ' + s.slice(0, 24));
    assert.ok(checkCherryPicking(s, { [key]: [] }).hit,
      '抹掉豁免应命中: ' + s.slice(0, 24));
  });
}

// ─── 五、登记断言（接线九处 + 维度身份）──────────────────────────
console.log('\n[r182 cherry_picking 登记断言]');
t('__internals 导出 26 个可注入常量', () => {
  const keys = Object.keys(__internals());
  assert.strictEqual(keys.length, 26, '常量数 ' + keys.length);
  for (const k of ['SEL_ADV_ZH', 'SEL_OBJ_ZH', 'SEL_PHRASE_EN', 'CONNECT_ZH',
    'SEAL_VERB_ZH', 'SEAL_NOUN_EN', 'META_ZH', 'NEG_ZH', 'NEGSEAL_ZH', 'HEDGE_EN']) {
    assert.ok(keys.includes(k), '缺常量 ' + k);
  }
});
t('src/index.js 九处接线齐全（require/计算/score/dimMap/guidance/VERIFY_DIMS/dimensions/summary/exports）', () => {
  const idx = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  const needles = [
    "const { checkCherryPicking } = require('./cherry-picking.js');",
    'checkCherryPicking(_normText)',
    "{score: chp.score, name:'cherry_picking'}",
    'cherry_picking: chp,',
    "'cherry_picking',",
    "chp.count ? chp.count + ' 处选择性取证' : '',",
    'checkCherryPicking,',
  ];
  for (const n of needles) assert.ok(idx.includes(n), 'index.js 缺接线: ' + n);
  assert.ok(/\n\s*'cherry_picking': "不得\*\*把单边证据当成充分证据\*\*/.test(idx), 'DIM_GUIDANCE 缺 cherry_picking 条文');
  // dimMap 与 dimensions 两处键注册（grep 计数 ≥3：dimMap + dimensions + score）
  assert.ok((idx.match(/cherry_picking: chp,/g) || []).length >= 2, 'dimMap/dimensions 两处键注册缺失');
});
t('VERIFY_DIMS 含 cherry_picking（gate.action = verify）', () => {
  const idx = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  const m = idx.match(/const VERIFY_DIMS = new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m, 'VERIFY_DIMS 未找到');
  assert.ok(/'cherry_picking'/.test(m[1]), 'VERIFY_DIMS 缺 cherry_picking');
});
t('模块可被 require 且 gate 门禁级可用', () => {
  const mod = require('../src/index.js');
  assert.strictEqual(typeof mod.checkCherryPicking, 'function', 'index.js 未导出 checkCherryPicking');
});

// ─── 六、gate 层变体矩阵（161 轮教训：负例全绿 ≠ 不漏）───────────
// 攻击变体：中英双语 / 裸名词 / 带修饰 / 倒装语序 / 长句 / 跨句 / 无连接词
const VARIANTS = [
  '我只找支持这个结论的证据，所以它一定是成立的。',                              // 中文原型
  '他专门挑对自己有利的数据说，足以证明产品没有问题。',                          // 无连接词直接封装
  '报告里只引用正面评价，隐瞒了所有不利记录，可见方案是完全可靠的。',            // 长句双形态
  'We only cited the studies that supported our hypothesis, which proves the theory is correct.', // EN 原型
  'The report only presented favorable evidence, so the conclusion is certainly sound.',           // EN 带修饰
  '整个论证只保留了支持性案例，反面证据全部略去，因此结论毫无疑问是成立的。',    // 裸名词 + 长句
  '只收集了来自三个渠道的支持性反馈，因此结论是可靠的。',                        // 带修饰长窗口
  '报告对数据做了选择性引用，因此结论是毋庸置疑的。',                            // C 短语形
];
// 良性变体：必须含本族边缘良性（自建豁免/对冲/概念转述/无标记/无关多因陈述）
const VARIANTS_BENIGN = [
  '不能只挑对自己有利的证据，结论要经得起反面检验。',                            // 边缘良性：纪律否定
  '他引用的数据全是支持性的，所以这个结论不足以采信。',                          // 边缘良性：结论侧否定
  '我们目前只收集到三个案例，样本量不足，结论待验证。',                          // 边缘良性：无方向标记
  '战争是多因共同造成的，不能只归因于单一因素。',                                // 边缘良性：正确多因陈述
  'Cherry-picking is a common confirmation bias; we should report all the data.',// 边缘良性：概念转述
  '他可能只看了支持自己的报道，也许结论有偏差。',                                // 边缘良性：对冲弱化
  '这份报告只呈现了支持该疗法的数据，但作者同时列出了全部不良事件记录，结论仍需独立复核。', // 边缘良性：自建豁免
  'We only surveyed a subset of users, so these results cannot be generalized.', // EN 边缘良性：来源受限 + 否定
];

(async () => {
  console.log('\n[r182 cherry_picking gate 层变体矩阵]');
  for (const s of VARIANTS) {
    const r = await gate(s);
    t('变体命中: ' + s.slice(0, 16) + ' → ' + r.gate.action, () => {
      assert.notStrictEqual(r.gate.action, 'pass', '变体应被拦截: ' + s.slice(0, 30));
      const dims = (r.findings || []).map(f => f.dimension);
      assert.ok(dims.includes('cherry_picking'),
        'findings 应含 cherry_picking，实际: ' + dims.join(','));
    });
  }
  for (const s of VARIANTS_BENIGN) {
    const r = await gate(s);
    t('良性放行: ' + s.slice(0, 16) + ' → ' + r.gate.action, () => {
      assert.strictEqual(r.gate.action, 'pass',
        '良性应放行: ' + s.slice(0, 30) + ' → ' + r.gate.action + ' / ' +
        (r.findings || []).map(f => f.dimension).join(','));
    });
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
