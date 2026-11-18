/**
 * test/round-734-illusion-of-control-daily-chance.test.js
 *
 * [r734] 第 256 维度 illusion_of_control（控制幻觉）新增第 5 链
 * 「日常生活与人生机遇场景控制幻觉族」（真升级②——既有维度全新措辞
 * 家族；src/index.js 零改动、dimMap 键数不变、模块 inject 支持既有）。
 *
 * 立项依据（scripts/round-734/probe-pool.js + probe-daily-chance.js，
 * HEAD 6.8.196 实测）：四候选家族同池定拨——F1 考试/面试幸运仪式
 * 5/8 穿透（3 误伤全存量）、F2 ad_hoc_rescue 3/8（monocausal 粘连）、
 * F3 诉诸定义 6/8（全新维度需 1 号接线，报候选不落地）、F4 日常
 * 随机事件 6/8（2 误伤全存量）。F1+F4 合并为本族：存量四链（经典
 * 赌博 + r315 体育 + r323 现代游戏）对人生机遇（考试/面试/评审/
 * 评职称）与日常偶遇（红灯/排队/取号/打车/点名）场景 11/17 穿透，
 * 良性零新增误伤。海外扫描（arXiv parse-fail / GitHub 0 / S2 15 条
 * 背景文献无可集成纯规则方案）空返，按既有形态自建。
 *
 * 第 5 链判据（三腿共现，与存量链同构）：
 *   腿① A_ZH5/A_EN5 机遇/日常偶遇锚点（面试/考研/上岸/红灯/排队/
 *     取号/打车/点名；EN exam/interview/promotion/queue/checkout/
 *     taxi/roll call，r734b 补 title evaluation）
 *   腿② B_ZH5/B_EN5 主观控制行为扩展（幸运领带/锦鲤/红衬衫/固定
 *     周三/同一条路/同一个座位/翻正硬币/拜一拜；EN lucky tie/koi/
 *     same route/same seat/flip my coin upright/pray）
 *   腿③ C_ZH5/C_EN5 机遇影响断言（概率明显更大/运气总会更好/被点到
 *     的几率仿佛都会小一些/通过率就是会提升；EN improves my chances
 *     of / are always higher / my luck gets better）
 *
 * 覆盖：模块层攻击全腿命中 / 良性零新增误伤（5 条存量 FP 实证与本族
 * 无关）/ 精度保持（存量四链回归）/ 逐常量注入删条负例 / 加性证明 /
 * gate 层端到端归因 / 接线零改动纪律。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { detectIllusionOfControl } = require(path.join(HF, 'src/illusion-of-control.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

const NEVER = '__r734_negtest_never__';
const dead = [new RegExp(NEVER)];

// ─── A. 模块层：第 5 链攻击全腿命中 ───────────────────────────
const ATTACKS_ZH = [
  '每次面试我都戴那条幸运领带，拿到 offer 的概率明显更大。',   // ①面试 ②幸运领带 ③概率更大
  '考前摸一摸班主任送的幸运币，考试成绩往往会更好。',           // ①考试 ②幸运币 ③成绩更好
  '我每次评职称前都拜一拜，评上的希望一直很大。',               // ①评职称 ②拜一拜 ③希望很大
  '考前转发锦鲤，上岸的概率真的会变高。',                       // ①上岸 ②转发锦鲤 ③概率变高
  '答辩那天穿了那件红衬衫，通过率就是会提升。',                 // ①答辩 ②红衬衫 ③通过率提升
  '坚持固定周三去加油，那天排队最短的概率会高一些。',           // ①排队 ②固定周三 ③概率高
  '出门前我一定把这枚硬币翻正过来，打到车的运气就会更好。',     // ①打到车 ②翻正 ③运气更好
  '考前我总坐同一个座位，被老师点到的几率仿佛都会小一些。',     // ①点到 ②同一个座位 ③几率小
  '抽奖前我把硬币翻正了七八次，中的机会就是会变大。',           // ①抽奖 ②翻正 ③机会变大
  '每天走同一条路，碰到绿灯的运气总会更好一些。',               // ①绿灯 ②同一条路 ③运气更好
  '固定在这个窗口取号，排到前面号码的机会明显更大。',           // ①取号 ②这个窗口 ③机会更大
];
const ATTACKS_EN = [
  'Wearing my lucky tie to the interview improves my chances of getting the offer.',
  'Rubbing my lucky coin before the exam raises my odds of a good grade.',
  'I always pray before the title evaluation; my chances of promotion are always higher.',
  'Forwarding the lucky koi before the exam really raises my odds of passing.',
  'Choosing the same checkout lane every day improves my odds of a shorter queue.',
  'I flip my coin upright before heading out, and my luck hailing a taxi gets better.',
];

test('A1 中文人生机遇场景全腿命中（幸运仪物/固定习惯/翻正/仪式动词 × 机遇断言）', () => {
  for (const t of ATTACKS_ZH) assert(detectIllusionOfControl(t).hit, '未命中: ' + t);
});

test('A2 英文人生机遇与日常偶遇场景全腿命中', () => {
  for (const t of ATTACKS_EN) assert(detectIllusionOfControl(t).hit, '未命中: ' + t);
});

// ─── B. 良性：零新增误伤（11 干净放行 + 5 存量实证） ───────────
const BENIGN_CLEAN = [
  // 技能域（② 只收仪式，努力/准备类不满足腿②）
  'Exam preparation improves scores; luck plays no reliable role.',
  // 否定/纠偏形
  '穿正装是对面试的尊重，不代表能提高录取率。',
  '考研前我去孔庙参观，主要是放松心情，跟录取概率无关。',
  '穿什么衣服不影响评审结果，论文质量才是关键。',
  '考试结果取决于实力与准备的积累，而非仪式或运气。',
  'Luck plays no reliable role in exam outcomes; preparation does.',
  'I take the same route daily out of habit, not because of luck.',
  // 机制/实证形（不含机遇名词 × 影响断言）
  '这条路的红灯配时我实测过，确实通行更快。',
  'The queue at this hour is shorter because of the shift change.',
  'The traffic pattern here is well documented; it is not luck.',
  // 习惯无断言形（缺腿③）
  '他总坐那个座位，是因为光线好。',
  // 概念教学形（CONCEPT 豁免）
  '祈福是心理安慰，真正决定结果的是实力和准备。',
  '控制幻觉的经典实验表明，人们会高估自己对随机事件的影响力。',
];

test('B1 gate 层良性干净放行（技能域/否定形/机制形/习惯无断言/概念形）', () => {
  for (const t of BENIGN_CLEAN) {
    const g = gate.gate(t);
    assert(g.gate && g.gate.action === 'pass', '良性应 pass: ' + t + ' action=' + (g.gate && g.gate.action));
  }
});

// 存量 FP 实证：这 5 条在本轮改动前即非 pass（基线探针实测），与本族无关
const BENIGN_STOCK_FP = [
  { t: '充分准备确实能提高面试通过率，这是技能与匹配度因素。', dim: 'standard_shift' },
  { t: '面试前调整作息、多做模拟练习，通过率当然会提高。', dim: 'standard_shift' },
  { t: '他总坐同一个座位，只是因为那个位置光线好。', dim: 'monocausal_attribution' },
  { t: '固定窗口取号只是个人习惯，与号码先后无关。', dim: 'monocausal_attribution' },
  { t: '实力和准备决定考试结果，仪式不进入概率结构。', dim: 'illusion_of_control(存量链①)' },
];

test('B2 存量 FP 与本族无关——杀全部新常量后模块层命中状态不变', () => {
  const killed = { A_ZH5: dead, B_ZH5: dead, C_ZH5: dead, A_EN5: dead, B_EN5: dead, C_EN5: dead };
  for (const { t } of BENIGN_STOCK_FP) {
    const live = detectIllusionOfControl(t);
    const deadRun = detectIllusionOfControl(t, killed);
    assert(live.hit === deadRun.hit,
      '新链不应改变存量行为: ' + t + ' live=' + live.hit + ' killed=' + deadRun.hit);
  }
});

test('B3 存量 FP 实证：5 条基线非 pass 全部由存量维度承重（非本族增量）', () => {
  for (const { t, dim } of BENIGN_STOCK_FP) {
    const g = gate.gate(t);
    assert(g.gate && g.gate.action !== 'pass', '应仍非 pass（存量）: ' + t);
    if (dim === 'illusion_of_control(存量链①)') {
      assert((g.findings || []).some((f) => f.dimension === 'illusion_of_control'), '存量链 FP 应在: ' + t);
    } else {
      assert((g.findings || []).some((f) => f.dimension === dim), '存量维度 ' + dim + ' 应在: ' + t);
    }
  }
});

// ─── C. 精度保持：存量四链回归 ─────────────────────────────────
const REGRESSION = [
  // 第一链 经典赌博
  '买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的。',
  'Picking your own lottery numbers gives better odds than a quick pick.',
  // r315 体育幸运仪式（round-315 轮测真样本）
  '她坚信赛前摸一摸队徽能带来胜利，这种仪式让夺冠的机会更大',
  '每次决赛我都穿那件幸运球衣，朋友说我看球这么虔诚，主队获胜的概率会更高',
  // r323 现代游戏/抽奖（round-323 轮测真样本）
  '抽卡前我先垫几发养号，玄学能提高出金率，我掌控着爆率的时刻',
  '开箱有玄学，垫刀垫抽能拉高出金率，我觉得垫够了爆率就上去了',
  // r331 既有（存量链①同样承重，兼作双承重实证）
  '考研前特意去孔庙烧了香，上岸的几率总会更高一些。',
  'Praying at the temple before the exam raises my odds of passing.',
];

test('C1 存量四链精度保持（经典赌博/r315 体育/r323 游戏/r331 既有全仍命中）', () => {
  for (const t of REGRESSION) assert(detectIllusionOfControl(t).hit, '存量回归未命中: ' + t);
});

// ─── D. 负例注入删条：逐常量删后守卫必须变红（miss） ───────────
test('D1 删 A_ZH5——11 条中文攻击转 miss', () => {
  for (const t of ATTACKS_ZH) assert(!detectIllusionOfControl(t, { A_ZH5: dead }).hit, '删 A_ZH5 后应 miss: ' + t);
});

test('D2 删 B_ZH5——11 条中文攻击转 miss', () => {
  for (const t of ATTACKS_ZH) assert(!detectIllusionOfControl(t, { B_ZH5: dead }).hit, '删 B_ZH5 后应 miss: ' + t);
});

test('D3 删 C_ZH5——11 条中文攻击转 miss', () => {
  for (const t of ATTACKS_ZH) assert(!detectIllusionOfControl(t, { C_ZH5: dead }).hit, '删 C_ZH5 后应 miss: ' + t);
});

test('D4 删 A_EN5——5 条独占英文攻击转 miss', () => {
  const sole = ATTACKS_EN.filter((t) => t !== 'Rubbing my lucky coin before the exam raises my odds of a good grade.');
  for (const t of sole) assert(!detectIllusionOfControl(t, { A_EN5: dead }).hit, '删 A_EN5 后应 miss: ' + t);
});

test('D5 删 B_EN5——5 条独占英文攻击转 miss', () => {
  const sole = ATTACKS_EN.filter((t) => t !== 'Rubbing my lucky coin before the exam raises my odds of a good grade.');
  for (const t of sole) assert(!detectIllusionOfControl(t, { B_EN5: dead }).hit, '删 B_EN5 后应 miss: ' + t);
});

test('D6 删 C_EN5——5 条独占英文攻击转 miss', () => {
  const sole = ATTACKS_EN.filter((t) => t !== 'Rubbing my lucky coin before the exam raises my odds of a good grade.');
  for (const t of sole) assert(!detectIllusionOfControl(t, { C_EN5: dead }).hit, '删 C_EN5 后应 miss: ' + t);
});

// ─── E. 加性证明：杀全部新常量，存量链不受影响 ─────────────────
test('E1 加性——杀全部新常量，存量四链回归样本仍命中', () => {
  const killed = { A_ZH5: dead, B_ZH5: dead, C_ZH5: dead, A_EN5: dead, B_EN5: dead, C_EN5: dead };
  for (const t of REGRESSION) assert(detectIllusionOfControl(t, killed).hit, 'R5 是补丁非替换——存量链应仍命中: ' + t);
});

test('E2 双承重实证——Rubbing my lucky coin 样本由存量链①同样承重（删任一单常量不 miss）', () => {
  const t = 'Rubbing my lucky coin before the exam raises my odds of a good grade.';
  assert(detectIllusionOfControl(t).hit, '基线应命中');
  for (const k of ['A_ZH5', 'B_ZH5', 'C_ZH5', 'A_EN5', 'B_EN5', 'C_EN5']) {
    const inj = {}; inj[k] = dead;
    assert(detectIllusionOfControl(t, inj).hit, '双承重样本删 ' + k + ' 后应仍命中（存量链兜底）');
  }
});

// ─── F. gate 层端到端归因 ─────────────────────────────────────
test('F1 gate 层 19 条攻击非 pass 且 illusion_of_control finding 在场', () => {
  const all = ATTACKS_ZH.concat(ATTACKS_EN).concat(REGRESSION);
  for (const t of all) {
    const g = gate.gate(t);
    assert(g.gate && g.gate.action && g.gate.action !== 'pass', 'gate 层放行: ' + t + ' action=' + (g.gate && g.gate.action));
    assert((g.findings || []).some((f) => f.dimension === 'illusion_of_control'),
      '缺 illusion_of_control finding: ' + t);
  }
});

test('F2 gate 层干净良性 pass（锁死精度）', () => {
  for (const t of BENIGN_CLEAN) {
    const g = gate.gate(t);
    assert(g.gate && g.gate.action === 'pass', '良性应 pass: ' + t + ' action=' + (g.gate && g.gate.action));
  }
});

// ─── G. 接线零改动纪律（②：不新增 dimMap 键） ───────────────────
test('G1 src/index.js 接线零改动 + discriminate 命中 illusion_of_control', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert((src.match(/illusion_of_control: ioc,/g) || []).length === 3,
    'illusion_of_control 聚合登记应仍为 3 处（② 不新增键）');
  assert(!/detectIllusionOfControl\(_normText,/.test(src),
    'index.js 调用点不应传 inject（零改动）');
  const disc = gate.discriminate('每次面试我都戴那条幸运领带，拿到 offer 的概率明显更大。');
  assert((disc.findings || []).some((f) => f.dimension === 'illusion_of_control'),
    'discriminate 层应命中 illusion_of_control');
});

// ─── 汇总 ────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
for (const r of results) console.log((r.ok ? 'PASS' : 'FAIL') + '  ' + r.name);
if (failed.length) {
  for (const r of failed) console.log('  ✗ ' + r.name + ': ' + r.err);
  console.log(`\n${failed.length}/${results.length} 失败`);
  process.exit(1);
}
console.log(`\n全部 ${results.length} 项断言通过`);
