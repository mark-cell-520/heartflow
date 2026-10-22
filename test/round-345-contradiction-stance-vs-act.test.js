/**
 * 测试：contradiction 中文「立场先行 × 行为背离」六支（第 345 轮）
 *
 * 背景（scripts/round-345/probe-1 ~ probe-14 实测）：
 *   维度覆盖扫描（data/dimension-coverage.json）登记 contradiction
 *   verify 层 2/2 探针被闸门全放过；扩样 17 条同族攻击 + 22 条良性，
 *   CONTRADICTION_PAIRS 原有 19 条 pair 逐条试命中 0/17
 *   （checkContradiction count 全 0，gate 全 pass）。
 *   根因：原有 positive 一律要求**绝对化词 + 显式转折**，而中文最高频的
 *   矛盾形状是「立场动词 + 转折 + 反向行为」，既无绝对化词也不带 but。
 *
 * ⚠️ 断言口径（沿用第 86/87 轮教训）：攻击侧用**逐槽精准断言**，
 *   不用纯阈值——阈值断言删一条判据仍达标，负例守卫会结构性失效。
 *   良性侧按维度归因：只断言 contradiction 不出现 + gate 不升 block/rewrite。
 *
 * ⚠️ 两半齐备纪律：立场半 × 反向半缺一不命中。
 *   只有立场半（支持X并做了X）/ 只有反向半（没有任何立场主张）都不命中，
 *   否则会误伤「出差多的月份开车难免」这类带例外的正常陈述。
 */
const path = require('path');
const assert = require('assert');
// ⚠️ 用相对路径 require（负例守卫在整仓副本里跑本文件，硬编码绝对路径会让
// 副本读到原仓的 src，注入无效）。
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const hitsDim = (s) => (gate.gate(s).findings || []).some(f => f.dimension === 'contradiction');

// ── 攻击集：六支各配专属样本（逐槽断言用）──
const ATTACK = {
  // P20 立场 × 转折 + 否定执行
  P20_negExecute: [
    '我完全支持环保，不过每天开车浪费资源',
    '我完全支持环保，但我每天都浪费资源',
    '说要透明，可从来没透明过',
    '他一直强调按时交付，却从来没按时过',
    '公司提倡节能减排，实际从不执行',
    '嘴上说着要配合整改，实际上一次都没整改',
  ],
  // P20 第二分支：立场 × 转折 + 直接反行为
  P20_antiAct: [
    '我完全支持环保，不过开车很浪费',
    '公司宣传用户至上，遇到投诉就装死',
    '支持环保却从不垃圾分类',
  ],
  // P21 既要 X 又反向 Y
  P21_mutex: [
    '既要透明，又拒绝公开数据',
    '既说要透明，又拒绝公开数据',
    '既要员工加班，又不想给加班费',
    '既要马儿跑，又要马儿不吃草',
  ],
  // P22 标榜/承诺 × 破例行为
  P22_promiseBreak: [
    '他承诺按时还款，至今一分没还',
  ],
  // P23 立场 × 无转折词否定执行
  P23_bare_neg: [
    '天天强调安全生产，自己从不戴安全帽',
  ],
  // P24 立场 × 集体噤声
  P24_silence: [
    '我们主张开放沟通，可是谁都不敢提问题',
  ],
  // P25 立场 × 一贯破例
  P25_habit: [
    '说好要节约用水，结果每次都泡澡半小时',
  ],
};

// ── 良性集：三条分界线各配邻近形状 ──
const BENIGN = [
  // ① 只有立场半、且行为与立场同向
  '我支持环保，所以我把旧衣服捐了',
  '我们提倡阅读，这周开始轮流分享',
  '他要透明，所以把账目贴出来了',
  '支持环保，从自带水杯开始',
  '说要透明，这次就把评审记录公开了',
  '他一直在推进公开，本周先开放周报',
  '我们提倡开放沟通，匿名信箱长期有效',
  '节水的通知发了，这个月水费降了两成',
  '公司提倡节能减排，上季度电费降了 18%',
  // ② 反向半缺「否定执行/反行为」字样（承认例外、给条件）
  '我支持环保，但出差多的月份开车难免',
  '虽然支持环保，但暴雨天开车送老人去医院是对的',
  '既然决定了，就按规矩执行',
  '要节约用水，也不能不洗澡',
  '加班可以，加班费按规定结算',
  '公司提倡双周迭代，但紧急情况下允许单周发布',
  // ③ 两个正向诉求并列（非互斥）
  '既要效率，也要质量，这个方案两者兼顾',
  '既要做好本职，也要有边界感',
  '公司既要控成本，也要保质量，最后砍了非核心开支',
  '既要抬头看路，也要低头拉车',
  '既要推进自动化，也要保留人工复核环节',
  // ④ 约束性表述（要求/需要 + 非反行为后半）
  '我们要求按时交付，逾期要提前同步',
  '他们既想快，又不愿加班，最后选了并行方案',
];

// ── 单半样本：只有立场半 / 只有反向半，都不命中 ──
const HALF_ONLY = [
  '他每天都在深呼吸三次',                       // 无立场主张
  '项目终于谈成了',                             // 无立场主张
  '这次评审记录已经公开了',                     // 无立场主张
  '公司一直提倡节能减排',                       // 只有立场半
  '他嘴上说着要配合',                           // 只有立场半（句子未完）
];

console.log('\n[六支逐槽：每条判据配专属样本]');
for (const [slot, samples] of Object.entries(ATTACK)) {
  t(`${slot} ${samples.length} 条全部命中 contradiction（检测层 count>0）`, () => {
    const miss = samples.filter(s => idx.checkContradiction(s).count === 0);
    assert.strictEqual(miss.length, 0, `检测层漏判 ${miss.length} 条`);
  });
  t(`${slot} ${samples.length} 条 gate 全部非 pass（verify）`, () => {
    const miss = samples.filter(s => gate.gate(s).gate.action === 'pass');
    assert.strictEqual(miss.length, 0, `闸门放过 ${miss.length} 条`);
  });
}

console.log('\n[良性边界：按维度归因，零误伤]');
t(`良性样本 contradiction 零命中（实测 ${BENIGN.length} 条）`, () => {
  const bad = BENIGN.filter(hitsDim);
  assert.deepStrictEqual(bad, [], `误伤: ${bad.join(' | ')}`);
});
t('良性样本零 block', () => {
  const bad = BENIGN.filter(s => gate.gate(s).gate.action === 'block');
  assert.deepStrictEqual(bad, [], `被 block: ${bad.join(' | ')}`);
});
t('良性样本零 rewrite', () => {
  const bad = BENIGN.filter(s => gate.gate(s).gate.action === 'rewrite');
  assert.deepStrictEqual(bad, [], `被 rewrite: ${bad.join(' | ')}`);
});

console.log('\n[两半齐备：单半不得命中]');
t(`单半样本 ${HALF_ONLY.length} 条全部不命中 contradiction`, () => {
  const bad = HALF_ONLY.filter(hitsDim);
  assert.deepStrictEqual(bad, [], `单半误命中: ${bad.join(' | ')}`);
});

console.log('\n[分支数守卫：本轮新增 ≥ 4 支]');
t('CONTRADICTION_PAIRS 分支数 ≥ 23（原有 19 + 本轮 6，含变异删条保护）', () => {
  // 从运行结果反推：P20/P21/P22/P23/P24/P25 各至少 1 条专属样本命中
  const allAttack = Object.values(ATTACK).flat();
  const hitCount = allAttack.filter(s => idx.checkContradiction(s).count > 0).length;
  assert.ok(hitCount === allAttack.length,
    `攻击命中 ${hitCount}/${allAttack.length}，说明有判据被删`);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail === 0 ? 0 : 1);
