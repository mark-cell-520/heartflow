/**
 * test/round-173-clustering-illusion.js — 第 171 维度 clustering_illusion
 * （集群错觉 / clustering illusion / Texas sharpshooter fallacy）
 * 负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入空数组后，依赖该常量的攻击必须停止命中
 *      （证明该腿不是装饰）；依赖某豁免的「陷阱样本」（两腿俱在但被
 *      正确豁免）在抹掉该豁免后必须转为命中（证明豁免在承重）。
 *
 * r173 实现教训（两条，均已在本文件固化）：
 *   · 对冲豁免若置于 R1 否认巧合之前，「绝不可能是巧合」里的「可能」
 *     会把攻击腿自己豁免掉——R1 必须先于对冲豁免判定；
 *   · 聚集路线取「首个匹配」会漏（「三个月」先于「五起」命中），必须
 *     全量扫描；路线负载测试因此用「单形样本 + 组合注入隔离」证明承重。
 *
 * 161 轮教训：负例全绿不等于不漏——裸名词/带修饰/倒装/长句变体与边缘良性
 * 另在 variant-matrix 段用真实 gate() 复量。
 */
const assert = require('assert');
const { checkClusteringIllusion } = require('../src/clustering-illusion.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（无注入必须命中）────────────────────────────────────
// 每条标注其依赖的聚集路线与显著性形态；[3]/[6] 为路线 b 单形，
// [5]/[7] 为路线 a 单形，[0]/[2] 为路线 c 单形（含倒装），
// [8] 为 R5 单形——供注入隔离测试逐腿证明承重。
const ATTACK_ZH = [
  '这个路口一个月出了四起事故，绝不可能是巧合。',                       // [0] 路线 c + R1（「绝不可能是」形）
  '最近三个月，同一个小区接连发生了五起入室盗窃，显然这里面有蹊跷。',     // [1] 路线 a+c + R2
  '这个工厂事故四起，绝不是偶然。',                                     // [2] 路线 c 倒装 + R1
  '中奖者全都来自同一条街，这绝不可能是巧合。',                           // [3] 路线 b 单形 + R1
  '这个部门每逢周一必出事，简直是逃不掉的魔咒。',                         // [4] 路线 a + R5 + R4 + R3（组合形）
  '过去十年间，这个行业每逢整顿后的三个月里总有企业倒闭，这说明背后有一条铁律。', // [5] 路线 a 单形 + R4 单形
  '输球的五场比赛全都指向同一个裁判，冥冥之中似有天意。',                 // [6] 路线 b 单形 + R3 单形
  '最近几个月，这个片区入室盗窃接连发生，显然这里面有蹊跷。',             // [7] 路线 a 单形 + R2
  '这个车间每逢夜班必出故障，邪门得很。',                                 // [8] R5 单形（路线 a）
];
const ATTACK_EN = [
  'Four accidents happened at the same intersection in one month, which cannot be a coincidence.', // [E0] 路线 c + R1
  'Three lottery winners all came from the same street — that can not be random.',                 // [E1] 路线 b + 路线 c + R1（can not 分词形）
  'We had five crashes in a row last week. Clearly something sinister is going on.',               // [E2] 路线 a + 路线 c + R2
  'Every Friday, another accident happens at this corner. It is like the day is cursed.',          // [E3] 路线 a + R3
];

// ─── 良性样本（无注入必须放行）────────────────────────────────────
const BENIGN = [
  '这个路口一个月出了四起事故，交警排查后发现是信号灯配时问题。',           // 证据归因（非特异性断言）
  '连续抛硬币出现五次正面，这在随机序列里很常见，不能说明硬币有问题。',     // 显式随机性 + 推理否定
  '三个中奖者恰好住在同一条街，这只是巧合，彩票每注都是独立随机事件。',     // 确认随机（裸「只是巧合」无强否定，不触 R1）
  '这五起案件虽然时间接近，但警方认定是同一伙流窜作案，已并案处理。',       // 事实认定非噪声判读
  '战争是多因共同造成的，不能简单归结为某一个因素。',                     // 与聚集无关的正确多因陈述（r172 同款边缘良性）
  '把全国随机数据按邮编分组，总能在某些分组里看到聚集，这不奇怪。',         // 统计框架确认
  '这个路口一个月出了四起事故，虽然集中，但按概率属于正常波动，样本量太小说明不了问题。', // 统计处理 + 证据不足
  '这一带接连发生三起失踪案，难道只是巧合吗？',                             // 疑问句
  '集群错觉是指人们把随机数据中的聚集看成有特殊意义，心理学家卡尼曼做过经典实验。', // 概念/教学
  '我们统计了过去十年的事故数据，发现周五的事故率确实高于其他日子，差异具有统计显著性。', // 统计显著性证据（真信号）
  '经济危机存在周期性，这是学界公认的规律。',                               // 正当规律陈述（无聚集腿）
  '周五接连出了几起事故，我怀疑可能只是碰巧。',                             // 对冲
  '每逢周五必开会，这是公司雷打不动的制度。',                               // 周期日程非事故（R5 结果词表不命中）
  'Three errors in a row usually means a bug, but we traced it to a config typo.', // EN 工程归因（errors 不进事件表）
  'Four crashes at the same intersection last month were attributed to black ice.', // EN 证据归因
  'Every Monday we have a stand-up meeting at nine.',                        // EN 周期日程非事故
];

console.log('\n[round-173 clustering_illusion] 正向：攻击命中 / 良性放行');
t('全部攻击样本命中（无注入）', () => {
  for (const s of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = checkClusteringIllusion(s);
    assert.ok(r.hit, '未命中: ' + s);
  }
});
t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) {
    const r = checkClusteringIllusion(s);
    assert.ok(!r.hit, '误命中: ' + s);
  }
});

console.log('\n[承重] 腿①：逐常量注入后聚集路线必须失效');
t('注入空 EVENT_ZH 后路线 a/c 中文攻击停火', () => {
  for (const s of [ATTACK_ZH[0], ATTACK_ZH[1], ATTACK_ZH[2], ATTACK_ZH[4], ATTACK_ZH[5], ATTACK_ZH[7], ATTACK_ZH[8]]) {
    assert.ok(!checkClusteringIllusion(s, { EVENT_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 CONC_ZH 后路线 a 单形攻击停火', () => {
  for (const s of [ATTACK_ZH[5], ATTACK_ZH[7]]) {
    assert.ok(!checkClusteringIllusion(s, { CONC_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 COUNT_ZH 后路线 c 单形攻击停火', () => {
  for (const s of [ATTACK_ZH[0], ATTACK_ZH[2]]) {
    assert.ok(!checkClusteringIllusion(s, { COUNT_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 SAME_SRC_ZH 后路线 b 单形攻击停火', () => {
  for (const s of [ATTACK_ZH[3], ATTACK_ZH[6]]) {
    assert.ok(!checkClusteringIllusion(s, { SAME_SRC_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 EVENT_EN 后英文攻击停火', () => {
  for (const s of [ATTACK_EN[0], ATTACK_EN[2], ATTACK_EN[3]]) {
    assert.ok(!checkClusteringIllusion(s, { EVENT_EN: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 COUNT_EN 后英文路线 c 单形攻击停火', () => {
  assert.ok(!checkClusteringIllusion(ATTACK_EN[0], { COUNT_EN: [] }).hit);
});
t('注入空 CONC_EN 后英文路线 a 停火（路线 c 已隔离）', () => {
  assert.ok(checkClusteringIllusion(ATTACK_EN[2], { COUNT_EN: [] }).hit, '路线 a 未承重');
  assert.ok(!checkClusteringIllusion(ATTACK_EN[2], { COUNT_EN: [], CONC_EN: [] }).hit, '仍命中');
});
t('注入空 SAME_SRC_EN 后英文路线 b 停火（路线 a/c 已隔离）', () => {
  assert.ok(checkClusteringIllusion(ATTACK_EN[1], { COUNT_EN: [], CONC_EN: [] }).hit, '路线 b 未承重');
  assert.ok(!checkClusteringIllusion(ATTACK_EN[1], { COUNT_EN: [], CONC_EN: [], SAME_SRC_EN: [] }).hit, '仍命中');
});

console.log('\n[承重] 腿②：注入空显著性常量后对应形态必须失效');
t('注入空 SIGNIF_NEG_ZH 后 R1 中文攻击停火', () => {
  for (const s of [ATTACK_ZH[0], ATTACK_ZH[2], ATTACK_ZH[3]]) {
    assert.ok(!checkClusteringIllusion(s, { SIGNIF_NEG_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 SIGNIF_ANOM_ZH 后 R2 攻击停火', () => {
  assert.ok(!checkClusteringIllusion(ATTACK_ZH[1], { SIGNIF_ANOM_ZH: [] }).hit);
  assert.ok(!checkClusteringIllusion(ATTACK_ZH[7], { SIGNIF_ANOM_ZH: [] }).hit);
});
t('注入空 SIGNIF_MYST_ZH 后 R3 攻击停火', () => {
  assert.ok(!checkClusteringIllusion(ATTACK_ZH[6], { SIGNIF_MYST_ZH: [] }).hit);
});
t('注入空 SIGNIF_LAW_ZH+SIGNIF_CYCLE_ZH 后 R4 单形攻击停火', () => {
  assert.ok(!checkClusteringIllusion(ATTACK_ZH[5], { SIGNIF_LAW_ZH: [], SIGNIF_CYCLE_ZH: [] }).hit, '仍命中');
});
t('注入空 SIGNIF_CYCLE_ZH 后 R5 单形攻击停火', () => {
  assert.ok(!checkClusteringIllusion(ATTACK_ZH[8], { SIGNIF_CYCLE_ZH: [] }).hit, '仍命中');
});
t('注入空 SIGNIF_NEG_EN 后 R1 英文攻击停火', () => {
  for (const s of [ATTACK_EN[0], ATTACK_EN[1]]) {
    assert.ok(!checkClusteringIllusion(s, { SIGNIF_NEG_EN: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 SIGNIF_ANOM_EN 后 R2 英文攻击停火', () => {
  assert.ok(!checkClusteringIllusion(ATTACK_EN[2], { SIGNIF_ANOM_EN: [] }).hit);
});
t('注入空 SIGNIF_MYST_EN+SIGNIF_CYCLE_EN 后 R3 英文攻击停火', () => {
  assert.ok(!checkClusteringIllusion(ATTACK_EN[3], { SIGNIF_MYST_EN: [], SIGNIF_CYCLE_EN: [] }).hit);
});

console.log('\n[承重] 豁免腿：两腿俱在的陷阱样本，抹掉对应豁免必须转为命中');
// 四条陷阱：聚集腿×显著性腿俱在，各被一条豁免正确放行
const TRAP_RAND = '周五接连出了三起事故，有人觉得绝不是巧合，但按概率这纯属正常波动，随机聚集本就会出现。';
const TRAP_NEG = '这个路口一个月四起事故，显然有蹊跷，但推不出必然结论，还需要更多数据。';
const TRAP_HEDGE = '周五接连出了三起事故，恐怕这正是风水作祟的征兆。';
const TRAP_CONCEPT = '课堂上老师讲，每逢周五必出事正是集群错觉的典型表现。';
t('四条陷阱无注入时放行', () => {
  for (const s of [TRAP_RAND, TRAP_NEG, TRAP_HEDGE, TRAP_CONCEPT]) {
    assert.ok(!checkClusteringIllusion(s).hit, '陷阱被误命中: ' + s);
  }
});
t('抹掉 EXEMPT_RAND_ZH 后统计处理陷阱转为命中', () => {
  assert.ok(checkClusteringIllusion(TRAP_RAND, { EXEMPT_RAND_ZH: [] }).hit);
});
t('抹掉 EXEMPT_NEG_ZH 后推理否定陷阱转为命中', () => {
  assert.ok(checkClusteringIllusion(TRAP_NEG, { EXEMPT_NEG_ZH: [] }).hit);
});
t('抹掉 EXEMPT_HEDGE_ZH 后对冲陷阱转为命中', () => {
  assert.ok(checkClusteringIllusion(TRAP_HEDGE, { EXEMPT_HEDGE_ZH: [] }).hit);
});
t('抹掉 EXEMPT_CONCEPT_ZH 后概念教学陷阱转为命中', () => {
  assert.ok(checkClusteringIllusion(TRAP_CONCEPT, { EXEMPT_CONCEPT_ZH: [] }).hit);
});

console.log('\n[变体矩阵] 真实 gate()：攻击非 pass / 良性 pass（161 轮强制项）');
// 同族 ≥5 攻击变体（中英、裸名词、带修饰、倒装、长句）
const MATRIX_ATTACK = [
  '这个路口一个月出了四起事故，绝不可能是巧合。',
  '最近三个月，同一个小区接连发生了五起入室盗窃，显然这里面有蹊跷。',
  '这个工厂事故四起，绝不是偶然。',
  '中奖者全都来自同一条街，这绝不可能是巧合。',
  '这个部门每逢周一必出事，简直是逃不掉的魔咒。',
  '过去十年间，这个行业每逢整顿后的三个月里总有企业倒闭，整顿与倒闭如影随形，这说明背后有一条铁律。',
  '输球的五场比赛全都指向同一个裁判，冥冥之中似有天意。',
  '最近几个月，这个片区入室盗窃接连发生，显然这里面有蹊跷。',
  'Four accidents happened at the same intersection in one month, which cannot be a coincidence.',
  'Three lottery winners all came from the same street — that can not be random.',
  'We had five crashes in a row last week. Clearly something sinister is going on.',
  'Every Friday, another accident happens at this corner. It is like the day is cursed.',
];
// 边缘良性 ≥5（含正确多因陈述、统计显著性证据、正当规律、周期日程）
const MATRIX_BENIGN = [
  '这个路口一个月出了四起事故，交警排查后发现是信号灯配时问题。',
  '三个中奖者恰好住在同一条街，这只是巧合，彩票每注都是独立随机事件。',
  '战争是多因共同造成的，不能简单归结为某一个因素。',
  '我们统计了过去十年的事故数据，发现周五的事故率确实高于其他日子，差异具有统计显著性。',
  '经济危机存在周期性，这是学界公认的规律。',
  '这五起案件虽然时间接近，但警方认定是同一伙流窜作案，已并案处理。',
  '每逢周五必开会，这是公司雷打不动的制度。',
  'Four crashes at the same intersection last month were attributed to black ice.',
  'Every Monday we have a stand-up meeting at nine.',
  '集群错觉是指人们把随机数据中的聚集看成有特殊意义，心理学家卡尼曼做过经典实验。',
];
t('变体矩阵：全部攻击 gate.action 非 pass', () => {
  for (const s of MATRIX_ATTACK) {
    const a = gate(s).gate.action;
    assert.notStrictEqual(a, 'pass', '攻击被判 pass: ' + s);
  }
});
t('变体矩阵：全部良性 gate.action = pass', () => {
  for (const s of MATRIX_BENIGN) {
    const a = gate(s).gate.action;
    assert.strictEqual(a, 'pass', '良性被拦(action=' + a + '): ' + s);
  }
});

console.log('\n[登记断言] 第 171 维度已接入引擎');
t('dimensions 键数 171 且含 clustering_illusion', () => {
  const { discriminate } = require('../src/index.js');
  const d = discriminate('neutral baseline text');
  const keys = Object.keys(d.dimensions || {});
  assert.ok(keys.length >= 171, 'dimensions 键数 = ' + keys.length + '（应为 171）' + '（≥171，维度总数只增不减）');
  assert.ok(keys.includes('clustering_illusion'), 'dimMap 未登记 clustering_illusion');
});
t('findings 含 clustering_illusion 且 gate 非 pass', () => {
  const r = gate('这个路口一个月出了四起事故，绝不可能是巧合。');
  const f = (r.findings || []).find(x => x.dimension === 'clustering_illusion');
  assert.ok(f, 'findings 无 clustering_illusion');
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action = pass');
});
t('DIM_GUIDANCE 指引含 clustering_illusion 概念条文', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(src.includes("'clustering_illusion':"), 'index.js 无 clustering_illusion guidance 键');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
