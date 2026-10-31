/**
 * test/round-178-conjunction-fallacy.js — 第 176 维度 conjunction_fallacy
 * （合取谬误 / conjunction fallacy / Linda problem）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入空数组后，依赖该常量的攻击必须停止命中
 *      （证明该腿不是装饰）；依赖某豁免的「陷阱样本」（三腿俱在但被
 *      正确豁免）在抹掉该豁免后必须转为命中（证明豁免在承重）。
 *
 * r178 实现教训（两条，均已在本文件与源码固化）：
 *   · 腿②「可能性」自带「可能」子串——宽松的对冲豁免会把攻击样本
 *     自己吃掉；对冲正则改用负向断言 (?<![的可])可能(?![性])；
 *   · 「既努力又有天赋的人成功概率更高」是条件概率比较（可能为真），
 *     与合取谬误同形——用分组后缀（的人 / people who）做结构豁免，
 *     误把条件比较当谬误比漏判更伤（该族良性文本量更大）。
 *
 * 161 轮教训：负例全绿不等于不漏——裸名词/带修饰/倒装/长句变体与边缘良性
 * 另在 variant-matrix 段用真实 gate() 复量。
 */
const assert = require('assert');
const { checkConjunctionFallacy } = require('../src/conjunction-fallacy.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（无注入必须命中）────────────────────────────────────
// 每条标注其依赖的合取标记、概率词、比较算子与回指形。
const ATTACK_ZH = [
  '琳达既是银行出纳又是女权主义者的概率，高于她只是银行出纳的概率。',          // [0] 既是…又是 × 概率 × 高于 × 只是
  '他既是名校毕业又有十年经验的可能性，比他只是名校毕业的可能性更大。',        // [1] 既…又… × 可能性 × 更大 × 只是
  '一个产品既便宜又耐用的概率，大于它只是便宜的概率。',                        // [2] 既…又… × 概率 × 大于 × 只是
  '中奖且是头奖的概率，高于只是中奖的概率。',                                  // [3] 裸「且」路线 c × 概率 × 高于 × 只是
  '她在简历里同时突出自己既带领过百人团队又完成过三轮融资，面试官据此认定她既是能干高管又有融资经验的概率，高于她只是能干高管的概率。', // [4] 长句带修饰：既是…又是 × 概率 × 高于 × 只是
  '高于她只是财务人员的概率——毕竟她既是财务人员又是部门主管。',                // [5] 倒装（结论先行）：高于 × 只是 × 既是…又是 × 概率
];
const ATTACK_EN = [
  'The probability that Linda is both a bank teller and a feminist is higher than the probability that she is a bank teller.', // [E0] both…and × probability × higher than × 第二概率词
  'It is more likely that she is both a philosopher and a poet than that she is merely a philosopher.',                    // [E1] both…and × more likely × merely
  'The chance that he both knows the CEO and worked at the firm is greater than the chance that he just knows the CEO.',   // [E2] both…and × chance × greater than × just × 第二概率词
  'Being both a veteran and a volunteer is more probable than just being a veteran.',                                     // [E3] both…and × more probable × just
];

// ─── 良性样本（无注入必须放行）────────────────────────────────────
const BENIGN = [
  '在既努力又有天赋的学生中，获奖比例比不努力的学生高。',       // 分组条件比较形（P(结果|X∧Y) 可能为真）——结构豁免
  'Students who both study hard and have talent are more likely to succeed.', // EN 分组条件比较形
  '战争是多因共同造成的，不能简单归因于某一个决策。',           // 边缘良性：正确多因陈述，无腿②腿③
  '合取谬误是卡尼曼和特维尔斯基提出的经典认知偏差，心理学教材有专门讨论。', // 概念/教学转述
  '合取事件的概率不可能高于其任一组分事件的概率，这是概率论的基本公理。',   // 推理否定/方向纠正（正确陈述）
  '她既是优秀的工程师又是很好的沟通者，团队都很欣赏她。',       // 无概率腿
  '这个项目成功的可能性比失败大，但我们还是要做最坏的打算。',   // 有概率+比较，无合取腿
  '如果 A 且 B 的概率大于 A 的概率，那一定是计算错误。',        // 条件句：指出这是计算错误（正确判别）
  '他既是好人又是聪明人？这能说明什么？',                       // 疑问句
  'The conjunction fallacy shows how vivid stories hijack probability judgment.', // EN 概念转述
  'P(A and B) cannot exceed P(A) under any circumstance.',      // EN 推理否定
];

t('全部攻击样本命中（无注入）', () => {
  for (const s of ATTACK_ZH.concat(ATTACK_EN)) {
    assert.strictEqual(checkConjunctionFallacy(s).hit, true, '未命中: ' + s.slice(0, 24));
  }
});

t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) {
    assert.strictEqual(checkConjunctionFallacy(s).hit, false, '误判: ' + s.slice(0, 24));
  }
});

// ─── 负例注入承重：腿① CONJ ──────────────────────────────────────
t('注入空 CONJ_PAIR_ZH 后组合形中文攻击停火', () => {
  const inj = { CONJ_PAIR_ZH: [] };
  // 路线 c（裸「且」）样本 [3] 不依赖 CONJ_PAIR_ZH，专列 CONJ_AND_ZH 测试
  for (const i of [0, 1, 2, 4, 5]) assert.strictEqual(checkConjunctionFallacy(ATTACK_ZH[i], inj).hit, false, ATTACK_ZH[i].slice(0, 24));
});
t('注入空 CONJ_PAIR_EN 后英文攻击停火', () => {
  const inj = { CONJ_PAIR_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkConjunctionFallacy(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 CONJ_AND_ZH 后裸「且」攻击停火', () => {
  const inj = { CONJ_AND_ZH: [] };
  assert.strictEqual(checkConjunctionFallacy(ATTACK_ZH[3], inj).hit, false, ATTACK_ZH[3].slice(0, 24));
});

// ─── 负例注入承重：腿② PROB ──────────────────────────────────────
t('注入空 PROB_ZH 后中文攻击停火', () => {
  const inj = { PROB_ZH: [] };
  for (const s of ATTACK_ZH) assert.strictEqual(checkConjunctionFallacy(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 PROB_EN 后英文攻击停火', () => {
  const inj = { PROB_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkConjunctionFallacy(s, inj).hit, false, s.slice(0, 24));
});

// ─── 负例注入承重：腿③ CMP ───────────────────────────────────────
t('注入空 CMP_OP_ZH 后中文攻击停火', () => {
  const inj = { CMP_OP_ZH: [] };
  for (const s of ATTACK_ZH) assert.strictEqual(checkConjunctionFallacy(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 CMP_BACK_ZH 后路线 a 攻击停火（倒装句无第二概率词，专测路线 a）', () => {
  const inj = { CMP_BACK_ZH: [] };
  // 路线 b（双概率词夹算子）是独立兜底路线，用单概率词的倒装句专测路线 a
  assert.strictEqual(checkConjunctionFallacy(ATTACK_ZH[5], inj).hit, false, ATTACK_ZH[5].slice(0, 24));
});
t('注入空 CMP_OP_EN 后英文攻击停火', () => {
  const inj = { CMP_OP_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkConjunctionFallacy(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 CMP_BACK_EN 后路线 a 攻击停火（E1 单概率词，专测路线 a）', () => {
  const inj = { CMP_BACK_EN: [] };
  assert.strictEqual(checkConjunctionFallacy(ATTACK_EN[1], inj).hit, false, ATTACK_EN[1].slice(0, 24));
});

// ─── 陷阱样本：豁免在承重（抹掉豁免后必须转为命中）──────────────────
t('陷阱：分组条件形抹掉 GROUP_SUFFIX_ZH 后转为命中', () => {
  const trap = '既努力又有天赋的员工，晋升概率高于只是努力的员工。';
  assert.strictEqual(checkConjunctionFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkConjunctionFallacy(trap, { GROUP_SUFFIX_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：分组条件形 EN 抹掉 GROUP_SUFFIX_EN 后转为命中', () => {
  const trap = 'Employees who are both punctual and skilled are more likely to be promoted than those who are merely punctual.';
  assert.strictEqual(checkConjunctionFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkConjunctionFallacy(trap, { GROUP_SUFFIX_EN: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：概念转述抹掉 EXEMPT_CONCEPT_ZH 后转为命中', () => {
  const trap = '教材里写过：琳达既是银行出纳又是女权主义者的概率，高于她只是银行出纳的概率。';
  assert.strictEqual(checkConjunctionFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkConjunctionFallacy(trap, { EXEMPT_CONCEPT_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：推理否定抹掉 EXEMPT_NEG_ZH 后转为命中', () => {
  const trap = '既努力又幸运的概率不可能高于只是努力的概率。';
  assert.strictEqual(checkConjunctionFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkConjunctionFallacy(trap, { EXEMPT_NEG_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：对冲豁免不误吞「可能性」', () => {
  // 「可能性」含「可能」子串——负向断言必须让它继续命中
  const s = '他既是名校毕业又有十年经验的可能性，比他只是名校毕业的可能性更大。';
  assert.strictEqual(checkConjunctionFallacy(s).hit, true, '对冲豁免不应吞掉可能性');
});
t('对冲豁免对纯概率化句生效', () => {
  const s = '她既是作家又是画家的概率，也许高于她只是作家的概率。';
  assert.strictEqual(checkConjunctionFallacy(s).hit, false, '纯概率化应放行');
});

// ─── 变体矩阵：真实 gate() 复量（161 轮教训强制项）─────────────────
// 同族 ≥5 变体（中英双语、裸名词、带修饰、倒装、长句）必须全部非 pass；
// ≥5 良性（含边缘良性）必须全部 pass。
(async () => {
  const VARIANTS = [
    '琳达既是银行出纳又是女权主义者的概率，高于她只是银行出纳的概率。',                 // 原型
    '这位选手既参加过马拉松又拿过名次，他夺冠的概率高于他只是夺冠的概率。',             // 带修饰（个体主语，避开分组条件形）
    '中奖且是头奖的概率，大于只是中奖的概率。',                                        // 裸名词短句
    '高于她只是候选人的概率——毕竟她既是候选人又有内推。',                              // 倒装
    '他在饭桌上绘声绘色地描述了一位青年：既常年支教又出版过诗集，于是听众相信这位青年既是支教老师又是作家的概率，高于他只是支教老师的概率。', // 长句
    'The probability that the patient both smokes and drinks is higher than the probability that the patient merely smokes.', // EN 原型
    'It is more likely that he both lied and covered it up than that he just lied.',     // EN 短句
  ];
  const VARIANTS_BENIGN = [
    '在既聪明又勤奋的学生里，考上重点校的比例比不勤奋的学生高。',       // 边缘良性：分组条件比较
    '战争是多因共同造成的，不能简单归因于某一个决策。',                 // 边缘良性：正确多因陈述
    'Students who both practice daily and rest well tend to win more often.', // EN 边缘良性：条件比较
    '心理学用 Linda 问题讲解这类概率误判，课堂上会算一遍 P(A且B) 与 P(A)。', // 概念转述/教学
    '合取事件的概率不可能高于组分事件的概率，这是概率公理的直接结论。',   // 方向纠正
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
