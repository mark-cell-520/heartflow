/**
 * test/round-179-moralistic-fallacy.js — 第 177 维度 moralistic_fallacy
 * （道德主义谬误 / moralistic fallacy：应然规范倒推实然事实）负例注入测试
 * + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入 [] 置空后，依赖该常量的攻击必须停止命中
 *      （证明该腿不是装饰）；依赖某豁免的「陷阱样本」（两腿俱在但被
 *      正确豁免）在抹掉该豁免后必须转为命中（证明豁免在承重）。
 *
 * r179 实现设计（三条，已固化进测试与源码注释）：
 *   · 腿②只收「自然/本质/事实标记 + 肯定系动词」形——系动词必须紧跟
 *     标记，「天性未必就是」「本质上并非」等否定形因缺肯定系动词天然
 *     不匹配，把否定排挤出腿②本身，不依赖事后否定豁免（避免误伤
 *     「本质上都是无私的」攻击形）。
 *   · 腿③顺序判定：腿①必须早于腿②——「善良是人性的一部分，所以人应该
 *     向善」（实然前提→规范结论）是合法论证，方向倒置即非本族。
 *   · 两腿之间的前提连接词（因为/由于/because/since）拦截实然作前提的
 *     合法论证形（「人应该善良，因为善良本来就是人性的一部分」）。
 *
 * 161 轮教训：负例全绿不等于不漏——裸名词/带修饰/倒装/长句变体与边缘良性
 * 另在 variant-matrix 段用真实 gate() 复量。
 */
const assert = require('assert');
const { checkMoralisticFallacy } = require('../src/moralistic-fallacy.js');
const gateMod = require('../src/gate.js');
const gate = gateMod.gate;

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（无注入必须命中）────────────────────────────────────
// 每条标注其依赖的规范词、实然断言形与连接词。
const ATTACK_ZH = [
  '世界应该是公平的，所以世界本来就是公平的。',                    // [0] 应该 × 所以 × 本来就是
  '人理应诚实，所以人的天性就是诚实的。',                          // [1] 理应 × 所以 × 天性就是
  '爱应当是无私的，因此父母的爱本质上都是无私的。',                // [2] 应当 × 因此 × 本质上都是
  '既然人生而平等是应然，那么人人生而平等就是事实。',              // [3] 应然（裸名词） × 那么 × 就是事实
  '婚姻理应美满，可见婚姻本质上都是美满的，不睦只是意外。',        // [4] 理应 × 可见 × 本质上都是
  '如果人应该是自由的，那人本来就是自由的。',                      // [5] 应该 × 那 × 本来就是（条件形）
  '政府本该服务于人民，所以政府的所作所为本质上都是在服务于人民。', // [6] 本该 × 所以 × 本质上都是（长句）
  '社会应当关爱弱者，所以人的本性就是关爱弱者的。',                // [7] 应当 × 所以 × 本性就是
];
const ATTACK_EN = [
  'Since the world ought to be fair, the world is fair by nature.',      // [E0] ought to × by nature
  'Because love should be selfless, parental love is naturally selfless.', // [E1] should × naturally
  'If people are meant to be honest, human nature is fundamentally honest.', // [E2] meant to × fundamentally
];

// ─── 良性样本（无注入必须放行）────────────────────────────────────
const BENIGN = [
  '善良是人性的一部分，所以人应该向善。',              // 顺序倒置：实然前提→规范结论（合法，归 appeal_to_nature 一族）
  '世界实际上并不公平，但我们仍然应该为公平而努力。',  // 实际上 + 否定（无肯定系动词腿②）
  '人性本善还是本恶，哲学家争论了几千年。',            // 无腿①
  '既然人应该有言论自由，这就说明言论自由是被法律保障的权利。', // 有腿①无腿②（说明不是实然等式）
  '我们应该诚实，因为诚实被证明能降低社会协作成本。',  // 前提连接词两腿相隔（实然作前提，合法）
  '婚姻法规定夫妻应当互相忠实，这是法律义务。',        // 法律条文：有腿①无腿②
  '人们理应得到公正对待，这是普世价值。',              // 规范性重申：有腿①无腿②
  '虽然理想中社会应该平等，现实中贫富差距依然存在。',  // 现实中 + 无系动词（正确指出实然与规范不符）
  '孩子理应得到照顾，照顾孩子本来就是父母的天职。',    // 规范名词回指（本来就是+天职）
  '人理应诚实，所以人的天性未必就是诚实的。',          // 腿②前否定（正确判别）
  '世界应该是公平的，但本质上现实并非如此。',          // 腿②缺肯定系动词（本质上是批评性分析）
  'People are naturally inclined to cooperate, which is why we should build on that tendency.', // EN 顺序倒置（实然→规范，合法）
  'Just because something ought to be done does not mean it will happen automatically.', // EN：ought 不推出 is（正确判别）
  'The world ought to be fair, but it is not fair by nature.', // EN：腿②前否定
  '道德主义谬误是指把应然规范倒推为实然事实的论证错误。', // 概念/教学转述
  '学生应该多读书吗？读书本来就是人类的天性。',        // 疑问句豁免
];

t('全部攻击样本命中（无注入）', () => {
  for (const s of ATTACK_ZH.concat(ATTACK_EN)) {
    assert.strictEqual(checkMoralisticFallacy(s).hit, true, '未命中: ' + s.slice(0, 24));
  }
});

t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) {
    assert.strictEqual(checkMoralisticFallacy(s).hit, false, '误判: ' + s.slice(0, 24));
  }
});

// ─── 负例注入承重：腿① OUGHT ──────────────────────────────────────
t('注入空 OUGHT_ZH 后中文攻击停火', () => {
  const inj = { OUGHT_ZH: [] };
  for (const s of ATTACK_ZH) assert.strictEqual(checkMoralisticFallacy(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 OUGHT_EN 后英文攻击停火', () => {
  const inj = { OUGHT_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkMoralisticFallacy(s, inj).hit, false, s.slice(0, 24));
});

// ─── 负例注入承重：腿② ISNATURE ───────────────────────────────────
t('注入空 ISNATURE_ZH 后中文攻击停火', () => {
  const inj = { ISNATURE_ZH: [] };
  for (const s of ATTACK_ZH) assert.strictEqual(checkMoralisticFallacy(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 ISNATURE_EN 后英文攻击停火', () => {
  const inj = { ISNATURE_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkMoralisticFallacy(s, inj).hit, false, s.slice(0, 24));
});

// ─── 陷阱样本：豁免在承重（抹掉豁免后必须转为命中）──────────────────
t('陷阱：前提连接词形抹掉 PREMISE_ZH 后转为命中', () => {
  const trap = '人应该善良，因为善良本来就是人性的一部分。';
  assert.strictEqual(checkMoralisticFallacy(trap).hit, false, '无注入应放行（实然作前提合法）');
  assert.strictEqual(checkMoralisticFallacy(trap, { PREMISE_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：EN 前提连接词形抹掉 PREMISE_EN 后转为命中', () => {
  const trap = 'People should be kind, because kindness is fundamentally part of human nature.';
  assert.strictEqual(checkMoralisticFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkMoralisticFallacy(trap, { PREMISE_EN: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：规范名词回指抹掉 NORMNOUN_ZH 后转为命中', () => {
  const trap = '人理应得到尊重，这本来就是做人的底线。';
  assert.strictEqual(checkMoralisticFallacy(trap).hit, false, '无注入应放行（规范性重申）');
  assert.strictEqual(checkMoralisticFallacy(trap, { NORMNOUN_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：规范词后置复述抹掉 OUGHT_AFTER_ZH 后转为命中', () => {
  const trap = '社会应当关爱弱者，可见人的本性就是应该关爱弱者的。';
  assert.strictEqual(checkMoralisticFallacy(trap).hit, false, '无注入应放行（元陈述形）');
  assert.strictEqual(checkMoralisticFallacy(trap, { OUGHT_AFTER_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：腿②前否定抹掉 NEG_ZH 后转为命中', () => {
  const trap = '人理应诚实，但诚实从来就不是天性使然的。';
  assert.strictEqual(checkMoralisticFallacy(trap).hit, false, '无注入应放行（正确判别）');
  assert.strictEqual(checkMoralisticFallacy(trap, { NEG_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：EN 腿②前否定抹掉 NEG_EN 后转为命中', () => {
  const trap = 'Society ought to be equal, but it is not equal by nature.';
  assert.strictEqual(checkMoralisticFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkMoralisticFallacy(trap, { NEG_EN: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：概念转述抹掉 META_EXEMPT_ZH 后转为命中', () => {
  const trap = '教材指出：世界应该是公平的，所以世界本来就是公平的——这是道德主义谬误的典型形式。';
  assert.strictEqual(checkMoralisticFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkMoralisticFallacy(trap, { META_EXEMPT_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：对冲抹掉 HEDGE_ZH 后转为命中', () => {
  const trap = '人理应健康长寿，或许人的天性就是健康长寿的。';
  assert.strictEqual(checkMoralisticFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkMoralisticFallacy(trap, { HEDGE_ZH: [] }).hit, true, '抹豁免后应命中');
});

// ─── 腿③顺序判定专测 ──────────────────────────────────────────────
t('顺序倒置（实然→规范）不判', () => {
  assert.strictEqual(checkMoralisticFallacy('人的天性就是诚实的，所以人理应诚实。').hit, false);
});

// ─── 登记断言 ─────────────────────────────────────────────────────
t('dimensions 键数 177 且含 moralistic_fallacy', () => {
  const dims = gate('测试').dimensions || {};
  assert.strictEqual(Object.keys(dims).length, 177, '维度总数应为 177，实测 ' + Object.keys(dims).length);
  assert.ok('moralistic_fallacy' in dims, 'dimensions 应含 moralistic_fallacy');
});
t('index.js 导出 checkMoralisticFallacy 且 VERIFY_DIMS 源登记在位', () => {
  const fs = require('fs');
  const path = require('path');
  const idx = require('../src/index.js');
  assert.strictEqual(typeof idx.checkMoralisticFallacy, 'function', 'index.js 应导出 checkMoralisticFallacy');
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(src.includes("    'moralistic_fallacy',"), "VERIFY_DIMS 应登记 'moralistic_fallacy',");
});

// ─── 变体矩阵：真实 gate() 复量（161 轮教训强制项）─────────────────
// 同族 ≥5 变体（中英双语、裸名词、带修饰、倒装、长句）必须全部非 pass；
// ≥5 良性（含边缘良性）必须全部 pass。
(async () => {
  const VARIANTS = [
    '世界应该是公平的，所以世界本来就是公平的。',                        // 原型
    '人理应诚实，所以人的天性就是诚实的。',                              // 裸名词短句
    '既然人生而平等是应然，那么人人生而平等就是事实。',                  // 应然裸名词 + 就是事实
    '婚姻理应美满，可见婚姻本质上都是美满的，不睦只是意外。',            // 带修饰（尾句补刀）
    '如果人应该是自由的，那人本来就是自由的，感到不自由完全是自己的心态问题。', // 长句
    'Since the world ought to be fair, the world is fair by nature.',    // EN 原型
    'If people are meant to be honest, human nature is fundamentally honest.', // EN 短句
  ];
  const VARIANTS_BENIGN = [
    '善良是人性的一部分，所以人应该向善。',                // 边缘良性：顺序倒置（实然→规范合法）
    '世界本该公平，但现实中远非如此，证据是基尼系数。',    // 边缘良性：批评性分析（实然与规范不符的正确陈述）
    '婚姻法规定夫妻应当互相忠实，这是法律义务。',          // 边缘良性：法律条文
    'Just because something ought to be done does not mean it will happen automatically.', // EN 边缘良性：ought 不推出 is
    'People are naturally inclined to cooperate, which is why we should build on that tendency.', // EN 边缘良性：实然→规范
  ];

  for (const s of VARIANTS) {
    const r = await gate(s);
    t('变体命中: ' + s.slice(0, 20) + ' → ' + r.gate.action, () => {
      assert.notStrictEqual(r.gate.action, 'pass', '变体应被拦截: ' + s.slice(0, 30));
    });
  }
  for (const s of VARIANTS_BENIGN) {
    const r = await gate(s);
    t('良性放行: ' + s.slice(0, 20) + ' → ' + r.gate.action, () => {
      assert.strictEqual(r.gate.action, 'pass', '良性应放行: ' + s.slice(0, 30));
    });
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
