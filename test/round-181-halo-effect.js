/**
 * test/round-181-halo-effect.js — 第 179 维度 halo_effect
 * （光环效应 / halo effect：由无关正面特征——外貌/名气/包装装修/平台品牌/
 * 口才嗓音——推断对象人品/能力/技术/观点正确性的迁移断言）负例注入测试
 * + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量（含五个特征子族）注入 [] 置空后，依赖该常量/子族的
 *      攻击必须停止命中；依赖某豁免的「陷阱样本」（迁移结构俱在但被正确
 *      豁免）在抹掉该豁免后必须转为命中。
 *
 * r181 实现设计（四条，已固化进测试与源码注释）：
 *   · 腿②两种形：A 连接词形（所以/可见/说明 + 结论名词 + 肯定情态）与
 *     B 并置迁移形（特征词 + [≤12字] + 结论名词 + [≤6字] + 肯定情态）——
 *     「他长得这么帅，人品肯定也没问题」无连接词、仅靠并置完成迁移，
 *     是最常见攻击形，B 形不收则整族漏判。
 *   · 情态词表**刻意不收「也」**：「她长得漂亮，成绩也很好」是并列陈述
 *     非迁移推断——收了误伤面大于收益（161 轮同款「后缀 vs 裸词」教训的
 *     镜像：这次多出来的是**连接词**的误收）。
 *   · 特征族必须容忍中间插入修饰语：「口才**这么**好」「人气**很**高」
 *     「装修**得这么**高档」——r181 首版实测漏判「他口才这么好，做事能力
 *     一定也很强」，根因是特征正则要求紧邻，已加修饰窗口修复（这正是
 *     变体矩阵「带修饰」项的职责）。
 *   · CONTRAST 豁免查全文（出现「两回事/不能因为/irrelevant」即指示说话
 *     者自己做了维度分离），与 r180 HEDGE 全文级同口径。
 *
 * 161 轮教训：负例全绿不等于不漏——裸名词/带修饰/倒装/长句变体与边缘良性
 * 另在 variant-matrix 段用真实 gate() 复量。
 */
const assert = require('assert');
const { checkHaloEffect } = require('../src/halo-effect.js');
const gateMod = require('../src/gate.js');
const gate = gateMod.gate;

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（无注入必须命中）────────────────────────────────────
// 外貌族（TRAIT_ZH_LOOK 独立承重）
const ATTACK_LOOK = [
  '他长得这么帅，人品肯定也没问题。',
  '这位候选人颜值很高，专业能力想必也十分出色。',
];
// 声音风度口才族（TRAIT_ZH_MANNER 独立承重）
const ATTACK_MANNER = [
  '他口才这么好，做事能力一定也很强。',
  '张总是省台首席主播，声音磁性、台风稳健，课程的专业度想必也不会低。',
];
// 名气族（TRAIT_ZH_FAME 独立承重）
const ATTACK_FAME = [
  '这位嘉宾人气很高，节目效果应该也不会差。',
  '她是当红明星，代言的产品质量肯定也错不了。',
];
// 包装装修族（TRAIT_ZH_WRAP 独立承重——刻意选用 WRAP 独有特征词「界面
// 精致」「包装精美」；「装修得这么高档」的「高档」与 BRAND 族共有，不能
// 用于子族停火断言）
const ATTACK_WRAP = [
  '这 App 界面做得这么精致，底层架构肯定也差不了。',
  '这包装精美得像个艺术品，里面的东西质量肯定也差不了。',
];
// 平台品牌族（TRAIT_ZH_BRAND 独立承重）
const ATTACK_BRAND = [
  '这是百年老店出品的，工艺水准想必也不会低。',
  '毕竟是大厂出品，系统稳定性肯定没问题。',
];
// A 连接词形专属（全部 trait→结论名词间距 >12 字，B 形窗口够不着——
// CONNECT_ZH 承重样本；A 窗口 connect→结论 ≤12 字内可达）
const ATTACK_A_ONLY_ZH = [
  // 唯一 trait「声音磁性」到结论名词「专业度」间距 19 字（B 窗口 12 够不着），
  // 连接词「所以」到结论仅 2 字（A 窗口内）——r181 首版用「课程的专业度」
  // 被 QUALITY 表的「课程」接住导致 B 形误命中，已换成非质量名词路径。
  '这位主播声音磁性，在镜头前的谈吐又十分从容大方，所以他的专业度想必也不会低。',
  '这家店地段好，因此街坊邻居都认为它家的水平一定差不了。',
];
const ATTACK_ZH = ATTACK_LOOK.concat(ATTACK_MANNER, ATTACK_FAME, ATTACK_WRAP, ATTACK_BRAND);
const ATTACK_EN = [
  'He is tall and handsome, so his judgment must be sound.',
  'She is famous, so her advice must be reliable.',
  // A 连接词形专属（B 形窗口 12 字符够不着——CONNECT_EN 承重样本）
  'He is tall and handsome and widely admired, therefore his judgment on this matter must be sound.',
];

// ─── 良性样本（无注入必须放行，标注依赖的豁免）────────────────────
const BENIGN = [
  // 对比/迁移否定 → 说话者自己把维度分开，正确判别
  '虽然他口才好，但这和方案质量是两回事，还是要看数据。',
  '这家商场装修高档，购物体验肯定也差不了，但体验不代表商品质量。',
  '不能因为长得好看就认定可靠，外貌与能力没有必然联系。',
  'His charm is irrelevant to whether the numbers add up.',
  'The office looks stunning, so the engineering must be top-notch, but looks have nothing to do with code quality.',
  // 概念/教学转述 → 讨论这个偏差本身是正确判别
  '他给我们讲了光环效应：因为一个人长得好看，就认定他的人品也一定好，这就是以貌取人。',
  '常见认知偏差包括光环效应、确认偏误和幸存者偏差，教学中常用来举例。',
  'The halo effect means a beautiful face, so people judge his character must be good.',
  // 对冲弱化结论 → 弱推测不是迁移断言
  '他长得帅，可能人品也不错吧，但这需要相处才知道。',
  '这位嘉宾人气很高，节目效果应该也会不错，不过现在还说不准。',
  'He is handsome, so his judgment is surely sound; this might just be a first impression.',
  // 结构性不匹配：无迁移情态（情态表刻意不收「也」）
  '她长得漂亮，成绩也很好。',
  // 结构性不匹配：结论名词在场但无肯定情态
  '他很有名，作品也很多。',
  // 疑问句
  '他长得帅，人品就一定好吗？',
];

t('全部攻击样本命中（无注入）', () => {
  const all = ATTACK_ZH.concat(ATTACK_A_ONLY_ZH, ATTACK_EN);
  for (const s of all) {
    assert.strictEqual(checkHaloEffect(s).hit, true, '未命中: ' + s.slice(0, 24));
  }
});

t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) {
    assert.strictEqual(checkHaloEffect(s).hit, false, '误判: ' + s.slice(0, 24));
  }
});

// ─── 负例注入承重：腿①（整体 + 五子族分别）────────────────────────
t('注入空 TRAIT_ZH 后中文攻击全停火', () => {
  const inj = { TRAIT_ZH: [] };
  for (const s of ATTACK_ZH.concat(ATTACK_A_ONLY_ZH)) {
    assert.strictEqual(checkHaloEffect(s, inj).hit, false, s.slice(0, 24));
  }
});
t('注入空 TRAIT_ZH_LOOK 后外貌族停火（其余族不受影响）', () => {
  const inj = { TRAIT_ZH_LOOK: [] };
  for (const s of ATTACK_LOOK) assert.strictEqual(checkHaloEffect(s, inj).hit, false, s.slice(0, 24));
  for (const s of ATTACK_FAME) assert.strictEqual(checkHaloEffect(s, inj).hit, true, '不应误停: ' + s.slice(0, 24));
});
t('注入空 TRAIT_ZH_MANNER 后口才族停火', () => {
  const inj = { TRAIT_ZH_MANNER: [] };
  for (const s of ATTACK_MANNER) assert.strictEqual(checkHaloEffect(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 TRAIT_ZH_FAME 后名气族停火', () => {
  const inj = { TRAIT_ZH_FAME: [] };
  for (const s of ATTACK_FAME) assert.strictEqual(checkHaloEffect(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 TRAIT_ZH_WRAP 后包装装修族停火', () => {
  const inj = { TRAIT_ZH_WRAP: [] };
  for (const s of ATTACK_WRAP) assert.strictEqual(checkHaloEffect(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 TRAIT_ZH_BRAND 后平台品牌族停火', () => {
  const inj = { TRAIT_ZH_BRAND: [] };
  for (const s of ATTACK_BRAND) assert.strictEqual(checkHaloEffect(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 TRAIT_EN 后英文攻击停火', () => {
  const inj = { TRAIT_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkHaloEffect(s, inj).hit, false, s.slice(0, 24));
});

// ─── 负例注入承重：腿②三张表 ──────────────────────────────────────
t('注入空 QUALITY_ZH 后中文攻击停火（结论名词承重）', () => {
  const inj = { QUALITY_ZH: [] };
  for (const s of ATTACK_ZH.concat(ATTACK_A_ONLY_ZH)) {
    assert.strictEqual(checkHaloEffect(s, inj).hit, false, s.slice(0, 24));
  }
});
t('注入空 QUALITY_EN 后英文攻击停火', () => {
  const inj = { QUALITY_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkHaloEffect(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 MODAL_ZH 后中文攻击停火（肯定情态承重）', () => {
  const inj = { MODAL_ZH: [] };
  for (const s of ATTACK_ZH.concat(ATTACK_A_ONLY_ZH)) {
    assert.strictEqual(checkHaloEffect(s, inj).hit, false, s.slice(0, 24));
  }
});
t('注入空 MODAL_EN 后英文攻击停火', () => {
  const inj = { MODAL_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkHaloEffect(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 CONNECT_ZH 后 A 连接词形停火（B 形仍命中——证明两形分工）', () => {
  const inj = { CONNECT_ZH: [] };
  for (const s of ATTACK_A_ONLY_ZH) assert.strictEqual(checkHaloEffect(s, inj).hit, false, s.slice(0, 24));
  for (const s of ATTACK_LOOK) assert.strictEqual(checkHaloEffect(s, inj).hit, true, 'B 形不应被误停: ' + s.slice(0, 24));
});
t('注入空 CONNECT_EN 后 EN A 形停火', () => {
  const inj = { CONNECT_EN: [] };
  assert.strictEqual(checkHaloEffect(ATTACK_EN[2], inj).hit, false, 'A-only EN 应停火');
  assert.strictEqual(checkHaloEffect(ATTACK_EN[0], inj).hit, true, 'B 形 EN 不应被误停');
});

// ─── 陷阱样本：豁免在承重（抹掉豁免后必须转为命中）──────────────────
t('陷阱：对比/维度分离抹掉 CONTRAST_ZH 后转为命中', () => {
  const trap = '这家商场装修高档，购物体验肯定也差不了，但体验不代表商品质量。';
  assert.strictEqual(checkHaloEffect(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkHaloEffect(trap, { CONTRAST_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：EN 维度分离抹掉 CONTRAST_EN 后转为命中', () => {
  const trap = 'The office looks stunning, so the engineering must be top-notch, but looks have nothing to do with code quality.';
  assert.strictEqual(checkHaloEffect(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkHaloEffect(trap, { CONTRAST_EN: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：概念转述抹掉 META_ZH 后转为命中', () => {
  const trap = '他给我们讲了光环效应：因为一个人长得好看，就认定他的人品也一定好，这就是以貌取人。';
  assert.strictEqual(checkHaloEffect(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkHaloEffect(trap, { META_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：EN 概念转述抹掉 META_EN 后转为命中', () => {
  const trap = 'The halo effect means a beautiful face, so people judge his character must be good.';
  assert.strictEqual(checkHaloEffect(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkHaloEffect(trap, { META_EN: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：对冲抹掉 HEDGE_ZH 后转为命中', () => {
  // 刻意不含「不过」——「不过」属 CONTRAST_ZH 转折豁免，混入会让本陷阱
  // 测不到 HEDGE（r181 实测抓出的串台：首版样本同时被两个豁免罩住）。
  const trap = '这位嘉宾人气很高，节目效果应该也不会差，目前还说不准。';
  assert.strictEqual(checkHaloEffect(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkHaloEffect(trap, { HEDGE_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：EN 对冲抹掉 HEDGE_EN 后转为命中', () => {
  // 同理不含 though/but——那属 CONTRAST_EN。
  const trap = 'He is handsome, so his judgment is surely sound; this might just be a first impression.';
  assert.strictEqual(checkHaloEffect(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkHaloEffect(trap, { HEDGE_EN: [] }).hit, true, '抹豁免后应命中');
});

// ─── 结构性区分专测 ───────────────────────────────────────────────
t('无迁移情态（「也」并列陈述）不判', () => {
  assert.strictEqual(checkHaloEffect('她长得漂亮，成绩也很好。').hit, false);
});
t('结论名词在场但无肯定情态不判', () => {
  assert.strictEqual(checkHaloEffect('他很有名，作品也很多。').hit, false);
});
t('资质类特征不收（已知边界：归 appeal_to_authority 射程）', () => {
  assert.strictEqual(checkHaloEffect('她是名校博士毕业，说的话一定更有道理。').hit, false);
});
t('疑问句不判', () => {
  assert.strictEqual(checkHaloEffect('他长得帅，人品就一定好吗？').hit, false);
});
t('A 形顺序腿：特征在迁移断言之后不判', () => {
  assert.strictEqual(checkHaloEffect('所以他的专业能力肯定也没问题，毕竟他长得帅。').hit, false);
});

// ─── 登记断言 ─────────────────────────────────────────────────────
t('dimensions 键数 179 且含 halo_effect', () => {
  const dims = gate('测试').dimensions || {};
  assert.strictEqual(Object.keys(dims).length, 179, '维度总数应为 179，实测 ' + Object.keys(dims).length);
  assert.ok('halo_effect' in dims, 'dimensions 应含 halo_effect');
});
t('index.js 导出 checkHaloEffect 且 VERIFY_DIMS 源登记在位', () => {
  const fs = require('fs');
  const path = require('path');
  const idx = require('../src/index.js');
  assert.strictEqual(typeof idx.checkHaloEffect, 'function', 'index.js 应导出 checkHaloEffect');
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(src.includes("    'halo_effect',"), "VERIFY_DIMS 应登记 'halo_effect',");
});

// ─── 变体矩阵：真实 gate() 复量（161 轮教训强制项）─────────────────
// 同族 ≥5 变体（中英双语、裸名词、带修饰、倒装、长句）必须全部非 pass；
// ≥5 良性（含边缘良性）必须全部 pass。
(async () => {
  const VARIANTS = [
    '他长得这么帅，人品肯定也没问题。',                              // 原型（带修饰）
    '他长得帅，人品肯定也没问题。',                                  // 裸名词短句
    '这家公司装修得这么高档，产品技术肯定是一流的。',                // 包装装修族长句
    '他口才这么好，做事能力一定也很强。',                            // 口才族（修饰语插入）
    '一位身材高挑、面容姣好的候选者，其专业能力想必也十分出色。',    // 倒装/长句
    '张总是省台首席主播，声音磁性、台风稳健，课程的专业度想必也不会低。', // 长句多特征
    '这包装精美得像个艺术品，里面的东西质量肯定也差不了。',          // 超长间隔 B 形
    'He is tall and handsome, so his judgment must be sound.',       // EN 原型
    'She is famous, so her advice must be reliable.',                // EN 名气族
    'He is tall and handsome and widely admired, therefore his judgment on this matter must be sound.', // EN 长句 A 形
  ];
  const VARIANTS_BENIGN = [
    '虽然他口才好，但这和方案质量是两回事，还是要看数据。',          // 边缘良性：维度分离
    '她长得漂亮，成绩也很好。',                                      // 边缘良性：并列陈述无迁移情态
    '这家商场装修高档，购物体验肯定也差不了，但体验不代表商品质量。', // 边缘良性：自建豁免
    '她是凭实力入选的，外貌只是附加项，不代表专业水平。',          // 边缘良性：资质与外貌分离
    '这位嘉宾人气很高，节目效果应该也不会差，不过现在还说不准。',    // 边缘良性：对冲弱化
    'His charm is irrelevant to whether the numbers add up.',        // EN 边缘良性：irrelevant
    'She is beautiful, and her work is also excellent.',             // EN 边缘良性：并列陈述
  ];

  for (const s of VARIANTS) {
    const r = await gate(s);
    t('变体命中: ' + s.slice(0, 18) + ' → ' + r.gate.action, () => {
      assert.notStrictEqual(r.gate.action, 'pass', '变体应被拦截: ' + s.slice(0, 30));
    });
  }
  for (const s of VARIANTS_BENIGN) {
    const r = await gate(s);
    t('良性放行: ' + s.slice(0, 18) + ' → ' + r.gate.action, () => {
      assert.strictEqual(r.gate.action, 'pass', '良性应放行: ' + s.slice(0, 30));
    });
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
