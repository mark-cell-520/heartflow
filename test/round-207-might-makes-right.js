/**
 * test/round-207-might-makes-right.js — 第 204 维度
 * might_makes_right（强权即公理：might makes right / 成王败寇 /
 * 强权政治——实力胜负腿×是非裁量腿两腿结构 + 自足习语分支）负例注
 * 入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中；依赖某豁免
 *      的陷阱样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良
 * 性另在 variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部
 * gate.action 非 pass 且 might_makes_right 维度承重，≥5 良性全部
 * pass）。本族枚举刻意收裸词形态（拳头/实力/胜利者 去后缀仍命中）；
 * 「拳头大就是硬道理/成王败寇/might makes right」等习语单式自足
 * （习语本身同时包含力量与「力即理」）。
 *
 * 立项证据：r207 族探针（/tmp/hf-probe-r207.js + /tmp/hf-probe-r207b.js）
 * 在当前引擎（v6.8.135，203 维）复测——攻击 4 条中 3 条 gate.action
 * =pass（真零命中，含中英双语/带修饰/长句变体）、良性 1/1 pass（零
 * 误伤）；13 个候选族中唯一 3/4 缺口且良性零误伤。与
 * instrumental_reasoning（既有 REWRITE 维度：手段选择压倒价值判断）
 * 边界实测：本族 3/4 攻击样本它零命中。外部搜索（HN Algolia ×2 /
 * Semantic Scholar ×2 / GitHub API ×2 关键词）全部无可用命中，如实
 * 记录——判据为心虫自有纯规则实现（强权即公理为经典非形式谬误目录
 * 常备条目，文献仅作分类学参考）。
 */
const assert = require('assert');
const { checkMightMakesRight } = require('../src/might-makes-right.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（中文×8 / 英文×4 / 含裸名词、带修饰、倒装、长句）────────
const ATTACK = [
  '历史是由胜利者书写的，谁赢了谁就代表真理。',                                          // 胜负腿 + 代表真理
  '拳头大就是硬道理，实力决定对错。',                                                    // 自足习语 + 双两腿
  '成王败寇，赢了就是正义，输了说什么都是借口。',                                        // 自足习语（成王败寇）
  '谁胳膊粗谁说了算，谁的拳头硬谁的理就正。',                                            // 实力腿 + 说了算/理正
  '他钱多，所以他说的就是真理，我们只能听着。',                                          // 实力腿（钱多）+ 就是真理
  '在这个丛林里，弱者不配谈条件，强者才有资格定义规则。',                                // 强弱腿 + 定义规则
  '官大一级压死人，位子决定是非，这就是单位的规矩。',                                    // 权力腿 + 决定是非
  '真理在大炮的射程之内，炮火够猛的地方才有公道可言。',                                  // 自足习语（大炮射程）
  'Might makes right — whoever wins the war gets to define what was just.',              // EN 习语 + 双两腿
  'The victors write the history books, so their version is the truth by definition.',    // EN 习语 + truth
  'He who commands the bigger army decides what is just in this land.',                   // EN 实力腿 + decides what is just
  'In their worldview, the stronger party is always right and the weak deserve what they get.', // EN stronger + is right
];

// ─── 良性样本（边缘良性：分离条款/概念批判/规则描述/实力分析）────────
const BENIGN = [
  '实力对比会影响博弈结果，但对错善恶另有标准，不能混为一谈。',                            // 边缘良性：分离条款（对错另有标准）
  '「强权即公理」是典型的逻辑谬误，把力量当成正义恰恰是论证的大忌。',                      // 边缘良性：概念批判
  '战场上输了不代表道理就在对方那边，胜负与是非是两回事。',                                // 边缘良性：否定守卫 + 分离
  '这场比赛采用淘汰制，赢者晋级输者出局，与观点对错无关。',                                // 边缘良性：规则/竞赛描述
  '他的资源确实多，会影响谈判地位，但方案好不好要看数据。',                                // 边缘良性：实力描述止步（缺腿②）
  '评价历史要区分事实与立场，胜利者与失败者的记述都只能作为材料互证。',                    // 边缘良性：史学方法陈述
  'Might makes right is a classic fallacy that every logic course teaches students to avoid.', // EN 概念批判
  'He has more resources, but whether his claim is true depends on the evidence, not his budget.', // EN 分离条款
];

t('攻击样本全部命中（checkMightMakesRight）', () => {
  for (const s of ATTACK) {
    const r = checkMightMakesRight(s);
    assert.ok(r.hit, '应命中: ' + s.slice(0, 26));
    assert.ok(r.score >= 0.5, '分数应 ≥0.5: ' + s.slice(0, 26) + ' → ' + r.score);
  }
});

t('良性样本全部放行（checkMightMakesRight）', () => {
  for (const s of BENIGN) {
    const r = checkMightMakesRight(s);
    assert.ok(!r.hit, '应放行: ' + s.slice(0, 26) + ' → ' + r.detail);
  }
});

// ─── 负例注入承重（r161 纪律：逐常量验证承重）──────────────────────
t('注入 POWER_ZH=[] → 中文两腿攻击停止命中', () => {
  // 选无自足习语样本（拳头大就是硬道理 有 SELF_ZH 兜底，不测两腿承重）
  const twoLeg = [
    '他钱多，所以他说的就是真理，我们只能听着。',
    '官大一级压死人，位子决定是非，这就是单位的规矩。',
  ];
  for (const s of twoLeg) {
    assert.ok(checkMightMakesRight(s).hit, '无注入应命中: ' + s);
    assert.ok(!checkMightMakesRight(s, { POWER_ZH: [] }).hit, 'POWER_ZH 承重: ' + s.slice(0, 20));
  }
});

t('注入 RIGHT_EQ_ZH=[] → 中文等式腿攻击停止命中', () => {
  const twoLeg = [
    '他钱多，所以他说的就是真理，我们只能听着。',
    '官大一级压死人，位子决定是非，这就是单位的规矩。',
  ];
  for (const s of twoLeg) {
    assert.ok(!checkMightMakesRight(s, { RIGHT_EQ_ZH: [] }).hit, 'RIGHT_EQ_ZH 承重: ' + s.slice(0, 20));
  }
});

t('注入 POWER_EN=[] → 英文两腿攻击停止命中', () => {
  // 避开 POWER_ZH A3 英文残片腿（stronger/might 等中英混排兜底词）
  const twoLeg = [
    'He who commands the bigger army decides what is just in this land.',
    'The conquerors of that land get to define what counts as just.',
  ];
  for (const s of twoLeg) {
    assert.ok(checkMightMakesRight(s).hit, '无注入应命中: ' + s);
    assert.ok(!checkMightMakesRight(s, { POWER_EN: [] }).hit, 'POWER_EN 承重: ' + s.slice(0, 20));
  }
});

t('注入 RIGHT_EQ_EN=[] → 英文等式腿攻击停止命中', () => {
  const twoLeg = [
    'He who commands the bigger army decides what is just in this land.',
    'In their worldview, the stronger party is always right and the weak deserve what they get.',
  ];
  for (const s of twoLeg) {
    assert.ok(!checkMightMakesRight(s, { RIGHT_EQ_EN: [] }).hit, 'RIGHT_EQ_EN 承重: ' + s.slice(0, 20));
  }
});

t('注入 SELF_ZH=[] → 纯习语攻击（成王败寇/大炮射程）停止命中', () => {
  const idiomOnly = [
    '成王败寇，这就是世道，没什么好说的。',
    '真理在大炮的射程之内，别的都不用谈。',
  ];
  for (const s of idiomOnly) {
    assert.ok(checkMightMakesRight(s).hit, '无注入应命中: ' + s);
    assert.ok(!checkMightMakesRight(s, { SELF_ZH: [] }).hit, 'SELF_ZH 承重: ' + s);
  }
});

t('注入 SELF_EN=[] → 纯英文习语攻击停止命中', () => {
  const idiomOnly = [
    "Victor's justice is all we will ever get from that tribunal.",
    'The strong do what they can; that is simply how the world works.',
  ];
  for (const s of idiomOnly) {
    assert.ok(checkMightMakesRight(s).hit, '无注入应命中: ' + s);
    assert.ok(!checkMightMakesRight(s, { SELF_EN: [] }).hit, 'SELF_EN 承重: ' + s);
  }
});

t('注入 EXEMPT_META_ZH=[] → 概念批判陷阱转为命中（豁免承重）', () => {
  const trap = '「强权即公理」是典型的逻辑谬误，把力量当成正义恰恰是论证的大忌。';
  assert.ok(!checkMightMakesRight(trap).hit, '无注入应被豁免');
  assert.ok(checkMightMakesRight(trap, { EXEMPT_META_ZH: [] }).hit, 'EXEMPT_META_ZH 承重');
});

t('注入 EXEMPT_META_EN=[] → 英文概念批判陷阱转为命中（豁免承重）', () => {
  const trap = 'Might makes right is a classic fallacy that every logic course teaches students to avoid.';
  assert.ok(!checkMightMakesRight(trap).hit, '无注入应被豁免');
  assert.ok(checkMightMakesRight(trap, { EXEMPT_META_EN: [] }).hit, 'EXEMPT_META_EN 承重');
});

t('注入 EXEMPT_DECOUPLE_ZH=[] → 分离条款陷阱转为命中（豁免承重）', () => {
  const trap = '实力确实决定话语权，但对错善恶另有标准，不能混为一谈。';
  assert.ok(!checkMightMakesRight(trap).hit, '无注入应被豁免');
  assert.ok(checkMightMakesRight(trap, { EXEMPT_DECOUPLE_ZH: [] }).hit, 'EXEMPT_DECOUPLE_ZH 承重');
});

// ─── 变体矩阵（真实 gate() 复量——负例测试之外的强制项）─────────────
t('变体矩阵：攻击变体全部 gate.action 非 pass 且 might_makes_right 承重', () => {
  const variants = [
    '历史是由胜利者书写的，谁赢了谁就代表真理。',                              // 长句双形态
    '拳头大就是硬道理，实力决定对错。',                                        // 自足习语 + 双两腿
    '成王败寇，赢了就是正义，输了说什么都是借口。',                            // 习语前置
    '谁胳膊粗谁说了算，谁的拳头硬谁的理就正。',                                // 对仗口语
    'Might makes right — whoever wins the war gets to define what was just.', // EN 习语 + 双两腿
    'The victors write the history books, so their version is the truth by definition.', // EN 长句
  ];
  for (const s of variants) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass',
      '攻击变体应非 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action);
    const f = (r.findings || []).find(x => x.dimension === 'might_makes_right');
    assert.ok(f, 'might_makes_right 维度应承重: ' + s.slice(0, 24));
  }
});

t('变体矩阵：良性样本全部 gate pass', () => {
  const benign = [
    '实力对比会影响博弈结果，但对错善恶另有标准，不能混为一谈。',          // 边缘良性：分离条款
    '「强权即公理」是典型的逻辑谬误，把力量当成正义恰恰是论证的大忌。',    // 边缘良性：概念批判
    '战场上输了不代表道理就在对方那边，胜负与是非是两回事。',              // 边缘良性：否定守卫
    '这场比赛采用淘汰制，赢者晋级输者出局，与观点对错无关。',              // 边缘良性：规则描述
    'Might makes right is a classic fallacy that every logic course teaches students to avoid.', // EN 概念批判
    'He has more resources, but whether his claim is true depends on the evidence, not his budget.', // EN 分离条款
  ];
  for (const s of benign) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass',
      '良性样本应 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action +
      ' [' + (r.findings || []).map(f => f.dimension).join(',') + ']');
  }
});

console.log('\nround-207 might_makes_right: ' + pass + ' passed / ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
