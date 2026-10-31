/**
 * test/round-174-reverse-causation.js — 第 172 维度 reverse_causation
 * （因果倒置 / reverse causation / 反向因果）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入空数组后，依赖该常量的攻击必须停止命中
 *      （证明该腿不是装饰）；依赖某豁免的「陷阱样本」（两腿俱在但被
 *      正确豁免）在抹掉该豁免后必须转为命中（证明豁免在承重）。
 *
 * r174 实现教训（三条，均已在本文件与源码固化）：
 *   · 群体名词的「的」在名词两侧都可能出现——「住院**患者的**死亡率」
 *     （名词+的）与「住院**的**患者」（的+名词）是两种框架，首版只收
 *     「的+名词」导致「住院患者的死亡率明显更高」整句漏判；
 *   · 腿② 目标窗若从因果动词匹配的**终点**起算，「是公司衰败的原因」
 *     这类动词模式会把结果名词整个吞进自己匹配里，窗内只剩句号，
 *     结果腿永远找不到负面结果（改为从**起点**起算 nearFrom）；
 *   · 英文侧缺 attracts/draws/makes/worse 等词形与 the more X … the
 *     worse Y 比较词同族化，整条英文族漏判。
 *
 * 161 轮教训：负例全绿不等于不漏——裸名词/带修饰/倒装/长句变体与边缘良性
 * 另在 variant-matrix 段用真实 gate() 复量。
 */
const assert = require('assert');
const { checkReverseCausation } = require('../src/reverse-causation.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（无注入必须命中）────────────────────────────────────
// 每条标注其依赖的反应型行为、相关框路线与因果动词形，供注入隔离逐腿证明承重。
const ATTACK_ZH = [
  '住院患者的死亡率明显更高，所以住院本身增加了死亡风险。',                 // [0] 住院 × 名词+的 × 增加
  '那些长期接受心理治疗的患者自杀率更高，所以心理治疗会把人推向自杀。',     // [1] 心理治疗 × 的+名词 × 推向
  '所以补习班让孩子成绩更差——报了补习班的孩子成绩确实更差。',             // [2] 补习 × 班的孩子 × 让（倒装：结论先行）
  '从统计数据来看，装防盗窗的家庭被盗的案例明显更多，可见防盗窗反而会吸引小偷上门。', // [3] 防盗窗 × 的家庭 × 吸引
  '报警越多的社区犯罪率越高，这说明报警反而会招来犯罪。',                   // [4] 报警 × 越…越（R-b 单形）× 招来
  '裁员越多的公司效益越差，因此裁员是公司衰败的原因。',                     // [5] 裁员 × 越…越 × 是…的原因
  '吃安眠药的人失眠更严重，因此安眠药是造成失眠的原因。',                   // [6] 安眠药 × 的人 × 造成
  '被约谈的官员更容易落马，所以约谈导致了他们落马。',                       // [7] 约谈 × 的官员 × 导致
  '戴头盔的骑手出车祸更多，这说明戴头盔会引发事故。',                       // [8] 头盔（裸名词）× 的骑手 × 引发
  '投诉越多的商铺问题越多，说明投诉会招来更多问题。',                       // [9] 投诉 × 越…越 × 招来
  '复读的学生落榜率更高，所以复读导致落榜。',                               // [10] 复读 × 的学生 × 导致
  '被封号的账号违规更多，可见封号会引发更多违规。',                         // [11] 封号 × 的账号 × 引发
];
const ATTACK_EN = [
  'Patients who were hospitalized had much higher mortality, so hospitalization itself increases the risk of death.', // [E0] hospitali[sz]ed × patients × increases
  'Areas with more police reports have higher crime, which means reporting crimes actually attracts more crime.',     // [E1] police reports × areas × attracts
  'Children taking tutoring sessions tend to get worse grades, so tutoring makes grades worse.',                     // [E2] tutoring × children × makes/worse
  'The more layoffs a company makes, the worse its performance gets, so layoffs cause decline.',                     // [E3] layoffs × the more…the worse × cause
];

// ─── 良性样本（无注入必须放行）────────────────────────────────────
const BENIGN = [
  '战争是多因共同造成的，不能只归因于某一个因素。',                     // 边缘良性：正确多因陈述
  '住院病人的死亡率更高，是因为重症患者本来就更容易住院。',             // 正确方向（落在「是因为」豁免）
  '戴口罩的人感冒更多，其实是因为生病的人更注意防护。',                 // 正确方向（选择效应被明确承认）
  '补习班的孩子成绩更差，但这不代表补习班导致成绩差。',                 // 推理否定
  '心理治疗显著降低了复发率，这是有随机对照试验支持的。',               // 实验证据语境
  '装监控之后盗窃下降了，所以监控确实起到了震慑作用。',                 // 正向效果（无相关框，且结果为正）
  '看医生的人康复更快，这是及时治疗的结果。',                           // 无因果动词腿
  '住院可能会增加死亡风险，但目前还没有证据能确认这一点。',             // 对冲
  '住院真的会增加死亡风险吗？',                                         // 疑问句
  '老师讲，因果倒置就是把应对行为当成原因，比如住院患者死亡率更高。',   // 概念/教学转述
  '住院患者的死亡率明显更高，需要加强院内感染防控。',                   // 只有相关陈述、无因果归因腿
  '止痛药会损伤肝肾，这是它的药理副作用。',                             // 非应对型动作（直接药理效应）
  '裁员之后公司效益明显好转，这一举措是有效的。',                       // 正向效果 + 无「的」相邻群体名词
  'Wearing masks reduced infections, so masks work as intended.',       // 英文正向效果
];

t('全部攻击样本命中（无注入）', () => {
  for (const s of ATTACK_ZH.concat(ATTACK_EN)) {
    assert.strictEqual(checkReverseCausation(s).hit, true, '未命中: ' + s.slice(0, 24));
  }
});

t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) {
    assert.strictEqual(checkReverseCausation(s).hit, false, '误判: ' + s.slice(0, 24));
  }
});

// ─── 负例注入承重：腿① 反应型行为 ─────────────────────────────────
t('注入空 RESP_ZH 后中文攻击停火', () => {
  const inj = { RESP_ZH: [] };
  for (const s of ATTACK_ZH) assert.strictEqual(checkReverseCausation(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 RESP_EN 后英文攻击停火', () => {
  const inj = { RESP_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkReverseCausation(s, inj).hit, false, s.slice(0, 24));
});

// ─── 负例注入承重：腿① 相关框（R-a 群体名词 / 差异标记 / R-b 越字框）──
t('注入空 GROUP_DE_ZH 后 R-a 单形攻击停火', () => {
  const inj = { GROUP_DE_ZH: [] };
  for (const i of [0, 1, 3, 6, 7, 8, 10, 11]) {
    assert.strictEqual(checkReverseCausation(ATTACK_ZH[i], inj).hit, false, ATTACK_ZH[i].slice(0, 24));
  }
});
t('注入空 DIFF_ZH 后 R-a 攻击停火', () => {
  const inj = { DIFF_ZH: [] };
  for (const i of [0, 1, 3, 6, 7, 8, 10, 11]) {
    assert.strictEqual(checkReverseCausation(ATTACK_ZH[i], inj).hit, false, ATTACK_ZH[i].slice(0, 24));
  }
});
t('注入空 YUE_ZH 后 R-b 单形攻击停火', () => {
  // R-b 单形：句中无「的+群体名词」，只有越…越相关框（否则 R-a 仍会兜住）
  const inj = { YUE_ZH: [] };
  for (const s of ['报警越多，犯罪率越高，这说明报警反而会招来犯罪。',
                   '裁员越多，亏损越严重，因此裁员是公司衰败的原因。']) {
    assert.strictEqual(checkReverseCausation(s).hit, true, '前置检查未命中: ' + s.slice(0, 20));
    assert.strictEqual(checkReverseCausation(s, inj).hit, false, '注入后仍命中: ' + s.slice(0, 20));
  }
});
t('注入空 GROUP_EN 后英文 R-a 攻击停火', () => {
  const inj = { GROUP_EN: [] };
  for (const s of [ATTACK_EN[0], ATTACK_EN[1], ATTACK_EN[2]]) {
    assert.strictEqual(checkReverseCausation(s, inj).hit, false, s.slice(0, 24));
  }
});
t('注入空 DIFF_EN 后英文 R-a 攻击停火', () => {
  // E3 走 the more X … the worse Y 路线（不依赖 DIFF_EN），只验 R-a 三条
  const inj = { DIFF_EN: [] };
  for (const s of [ATTACK_EN[0], ATTACK_EN[1], ATTACK_EN[2]]) {
    assert.strictEqual(checkReverseCausation(s, inj).hit, false, s.slice(0, 24));
  }
});

// ─── 负例注入承重：腿② 因果动词 × 负面结果 ────────────────────────
t('注入空 CAUSE_ZH 后中文攻击停火', () => {
  const inj = { CAUSE_ZH: [] };
  for (const s of ATTACK_ZH) assert.strictEqual(checkReverseCausation(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 RESULT_ZH 后中文攻击停火', () => {
  const inj = { RESULT_ZH: [] };
  for (const s of ATTACK_ZH) assert.strictEqual(checkReverseCausation(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 CAUSE_EN 后英文攻击停火', () => {
  const inj = { CAUSE_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkReverseCausation(s, inj).hit, false, s.slice(0, 24));
});
t('注入空 RESULT_EN 后英文攻击停火', () => {
  const inj = { RESULT_EN: [] };
  for (const s of ATTACK_EN) assert.strictEqual(checkReverseCausation(s, inj).hit, false, s.slice(0, 24));
});

// ─── 豁免陷阱翻转（两腿俱在但被正确豁免；抹掉豁免必须转为命中）─────
const TRAP_META = '课堂上老师讲，因果倒置的典型例子就是：住院患者的死亡率明显更高，所以住院本身增加了死亡风险。';
const TRAP_EVID = '有随机对照试验支持的说法是，住院患者的死亡率明显更高，所以住院本身增加了死亡风险。';
const TRAP_NEG = '住院患者的死亡率明显更高，但这不能说明住院增加了死亡风险。';
const TRAP_HEDGE = '住院患者的死亡率明显更高，所以住院可能增加了死亡风险。';

t('四条陷阱无注入时放行', () => {
  for (const s of [TRAP_META, TRAP_EVID, TRAP_NEG, TRAP_HEDGE]) {
    assert.strictEqual(checkReverseCausation(s).hit, false, '未被豁免: ' + s.slice(0, 24));
  }
});
t('抹掉 EXEMPT_META_ZH 后概念教学陷阱转为命中', () => {
  assert.strictEqual(checkReverseCausation(TRAP_META, { EXEMPT_META_ZH: [] }).hit, true);
});
t('抹掉 EXEMPT_EVID_ZH 后实验证据陷阱转为命中', () => {
  assert.strictEqual(checkReverseCausation(TRAP_EVID, { EXEMPT_EVID_ZH: [] }).hit, true);
});
t('抹掉 EXEMPT_NEG_ZH 后推理否定陷阱转为命中', () => {
  assert.strictEqual(checkReverseCausation(TRAP_NEG, { EXEMPT_NEG_ZH: [] }).hit, true);
});
t('抹掉 EXEMPT_HEDGE_ZH 后对冲陷阱转为命中', () => {
  assert.strictEqual(checkReverseCausation(TRAP_HEDGE, { EXEMPT_HEDGE_ZH: [] }).hit, true);
});
t('疑问句豁免承重：注入空后疑问样本转命中需先摘掉问号腿', () => {
  // 疑问句豁免由 [?？] 直接判定（非常量表），用含问号的攻击形验证其仍在承重
  const q = '住院患者的死亡率明显更高，所以住院本身增加了死亡风险吗？';
  assert.strictEqual(checkReverseCausation(q).hit, false);
});

// ─── 161 轮强制项：gate 层变体矩阵（真实 gate() 复量）──────────────
const MATRIX_ATTACK = [
  '住院患者的死亡率明显更高，所以住院本身增加了死亡风险。',                   // 中文裸名词
  '那些长期接受心理治疗的患者自杀率更高，所以心理治疗会把人推向自杀。',       // 中文带修饰
  '所以补习班让孩子成绩更差——报了补习班的孩子成绩确实更差。',               // 中文倒装（结论先行）
  '从统计数据来看，装防盗窗的家庭被盗的案例明显更多，可见防盗窗反而会吸引小偷上门。', // 中文长句
  '报警越多的社区犯罪率越高，这说明报警反而会招来犯罪。',                     // 中文越字相关框
  'Patients who were hospitalized had much higher mortality, so hospitalization itself increases the risk of death.', // 英文
  'Areas with more police reports have higher crime, which means reporting crimes actually attracts more crime.',     // 英文
];
const MATRIX_BENIGN = [
  '战争是多因共同造成的，不能只归因于某一个因素。',                   // 边缘良性：正确多因陈述
  '住院病人的死亡率更高，是因为重症患者本来就更容易住院。',           // 正确方向
  '戴口罩的人感冒更多，其实是因为生病的人更注意防护。',               // 选择效应被承认
  '补习班的孩子成绩更差，但这不代表补习班导致成绩差。',               // 推理否定
  '心理治疗显著降低了复发率，这是有随机对照试验支持的。',             // 实验证据
  '看医生的人康复更快，这是及时治疗的结果。',                         // 无因果归因腿
  'Wearing masks reduced infections, so masks work as intended.',     // 英文正向
];

t('变体矩阵：全部攻击 gate.action 非 pass 且 findings 含 reverse_causation', () => {
  for (const s of MATRIX_ATTACK) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', '穿过闸门: ' + s.slice(0, 24));
    assert.ok((r.findings || []).some(f => f.dimension === 'reverse_causation'), '无 reverse_causation finding: ' + s.slice(0, 24));
  }
});
t('变体矩阵：全部良性 gate.action = pass 且零 reverse_causation 命中', () => {
  for (const s of MATRIX_BENIGN) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass', '被拦: ' + s.slice(0, 24) + ' → ' + r.gate.action);
    assert.ok(!(r.findings || []).some(f => f.dimension === 'reverse_causation'), '误判: ' + s.slice(0, 24));
  }
});

// ─── 登记断言（接线完整性）────────────────────────────────────────
t('dimensions 键含 reverse_causation', () => {
  const idx = require('../src/index.js');
  const d = idx.discriminate(ATTACK_ZH[0]);
  assert.ok(d.dimensions && d.dimensions.reverse_causation, 'dimensions 缺 reverse_causation 键');
  assert.strictEqual(d.dimensions.reverse_causation.hit, true);
});
t('dimMap 命中可进 findings（allDims 已接）', () => {
  const r = gate(ATTACK_ZH[0]);
  assert.ok((r.findings || []).some(f => f.dimension === 'reverse_causation'), 'findings 为空——allDims 未接');
});
t('summary 含因果倒置命中行', () => {
  const r = gate(ATTACK_ZH[0]);
  assert.ok(JSON.stringify(r.summary || '').indexOf('因果倒置') >= 0, 'summary 无命中行');
});

console.log('\nround-174 reverse_causation: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
