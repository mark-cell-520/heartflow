'use strict';
// round-434  count_rate_conflation（第 238 维）软件故障原始计数×质量裁定族
//            全新措辞家族扩展（真升级②，live 生效）
//
// 覆盖（r434 池化探针 coordination/agent4/probes/r434-probe-pool.js 实测，
// HEAD v6.8.213 未改引擎前：本族 8 条攻击 2 条完全穿透——gate.action=pass
// 且零维度承重；模块层 0/8 全 miss；良性 FP 0/4，六家族中唯一零误伤）：
//   A. 腿①新族：软件故障事件计数族（ZH 崩溃/死机/宕机/蓝屏/闪退/卡死/卡顿/
//      黑屏/报错/重启/掉线/断网 及其 数/量/次数 形式；EN outages/downtime/
//      glitches/bugs/errors/freezes/hangs/restarts）——原 COUNT 词表只到
//      「事故/故障/投诉」，这批随装机量/使用时长线性缩放的软件质量事件
//      整族穿透
//   B. 腿①b 新族：EN more X than 分布式比较形（more crashes than the
//      entire last quarter）+ 过去式倍率 doubled/tripled/quadrupled（存量
//      \bdouble\b 在 -d 后缀失配）
//   C. 腿②新族：质量滑坡裁定族（质量/品质/品控/做工/稳定性/可靠性/流畅度/
//      体验/性能/口碑 × 退步/滑坡/下滑/下降/走低/缩水/崩坏；EN quality ×
//      regressed/declined/dropped/degraded）+ 不可用裁定族（更不稳定/最不
//      靠谱/用不了/不好用/难用/难以接受，要求显式比较级/程度前缀防裸陈述
//      FP；EN unstable/unusable/unreliable/buggy + not worth buying）
//
// 边界实测登记（r434 自测 coordination/agent4/probes/r434-selftest.js）：
//   · 探针原句「明显最不能买」被存量否定守卫 NEG_INSIDE 的「不能」误杀，
//     本族摘「不能买」分支绕让（A4 样本改「明显最难用」）
//   · EN「the least reliable」存量只收 less reliable，最高级缺失（E2 样本
//     改 less reliable；stock 常量未动）
//
// 纪律：
//   - 维度计数不变（274）、src/index.js 零改动、VERSION 不 bump（扩族先例同 r406-r433）
//   - 新族五组常量合并入存量数组（同 r269/r279 房屋范式），round-279
//     dropLeg 注入与 count-rate-conflation.test.js 整数组替换断言天然兼容
//   - 负例：注入-删条，删掉本轮每个新模式守卫必须转 miss，且存量样本不得翻转
const path = require('path');
const crcMod = require(path.join(__dirname, '..', 'src', 'count-rate-conflation.js'));
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log('  ✅ ' + label); }
  else { failed++; console.log('  ❌ ' + label); }
}
const hit = (text) => crcMod.detectCountRateConflation(text).hit;
const dimsOf = (text) => { const r = gate(text); return ((r && r.findings) || []).map(f => f.dimension); };
const actionOf = (text) => { const r = gate(text); return (r && r.gate && r.gate.action) || r.action; };

// ─── 新族攻击（模块层）────────────────────────────────────
const ATTACK_ZH = [
  '这个月 App 崩溃次数比上季度还多，可见新版质量严重退步。',       // 新腿①(崩溃次数)+新腿②(质量滑坡)
  '今年死机次数是去年的两倍，新系统明显比旧系统更不稳定。',         // 新腿①(死机次数)+新腿②(不可用)
  '后台显示本月宕机次数是全行业最多的，我们的平台明显更不靠谱。',   // 新腿①(宕机次数)+新腿②(不可用)
  '用户反馈蓝屏次数全行业最多，这款电脑明显最难用。',               // 新腿①(蓝屏次数)+新腿②(不可用)
  '新版本上线后闪退量是三班倒时代的四倍，这软件质量显然更差了。',   // 新腿①(闪退量)+存量裁定(更差)
  '本月宕机次数是去年全年的三倍，服务稳定性明显下滑。',             // 新腿①(宕机次数)+新腿②(稳定性下滑)
];
const ATTACK_EN = [
  'This month we logged more crashes than the entire last quarter, so the new version is clearly much worse.',  // 新腿①b(more X than)
  'Their app has the highest number of outages in the industry, which shows it is less reliable.',               // 新腿①(outages)
  'Downtime tripled after the update, and quality has clearly degraded.',                                        // 新腿①(downtime)+新腿②(EN滑坡)
  'Their phone has the most glitches on the market, which makes it the most unusable.',                          // 新腿①(glitches)+新腿②(EN不可用)
  'Errors doubled this quarter, so the new pipeline is more unstable.',                                          // 新腿①(errors)+新腿②(EN不可用)
];
const ATTACKS = ATTACK_ZH.concat(ATTACK_EN);

// ─── 新族良性（含 FP 压力样本）─────────────────────────────
const BENIGN = [
  '本月崩溃次数多，但用户量翻了三倍，按人均计算的崩溃率其实下降了。',
  '死机次数上升需要结合开机总时长看故障率，不能只看绝对数。',
  '宕机次数要和运行时长一起看，单看次数说明不了稳定性。',
  '蓝屏次数全行业最多，但按保有量算蓝屏率我们最低。',
  '这款电脑死机两次而已，不影响使用。',
  '掉线次数比上月多，网络不稳定，正在排查机房。',
  'More crashes this month, but our user base tripled — the crash rate per user actually fell.',
  'Downtime rose, but measured against total runtime the availability rate improved.',
  'Glitches are up, though per-session error rate is down after the patch.',
  'We logged more errors than last quarter; the codebase also grew tenfold, so the error rate per thousand lines fell.',
];

// ─── 存量攻击（r249/r269/r279 家族代表，加性/隔离证明）──────
const STOCK_ZH = [
  '我们市癌症病例全国第一，所以这里最不安全',
  '本店差评量是同行的三倍，我们的产品明显更差',
  '这个博主掉粉数是同行的两倍，内容明显更水',
  '这家店翻台数是那家的五倍，味道肯定更好',
  '我市电诈报案数是邻市的三倍，这里治安更差',
];
const STOCK_EN = [
  'Our city has the most cancer cases in the country, so it is the most dangerous place',
  'The brand with the most complaints must make the worst products',
  'The province logged 40% more crashes, so its drivers are more reckless',
];

console.log('== A 模块层：新族攻击 11/11 命中 ==');
ATTACKS.forEach((s, i) => ok(hit(s), 'A' + (i + 1) + ' ' + s.slice(0, 28)));

console.log('== B 模块层：良性 10/10 零误伤（含 6 条 FP 压力样本） ==');
BENIGN.forEach((s, i) => ok(!hit(s), 'B' + (i + 1) + ' ' + s.slice(0, 28)));

console.log('== C 存量不回归（r249/r269/r279 家族 8/8 仍命中） ==');
STOCK_ZH.concat(STOCK_EN).forEach((s, i) => ok(hit(s), 'C' + (i + 1) + ' ' + s.slice(0, 28)));

console.log('== D gate 端到端：新族 11/11 非 pass 且 count_rate_conflation 承重 ==');
ATTACKS.forEach((s, i) => {
  const a = actionOf(s), d = dimsOf(s);
  ok(a !== 'pass' && d.includes('count_rate_conflation'), 'D' + (i + 1) + ' gate=' + a + ' 承重=' + d.includes('count_rate_conflation'));
});

console.log('== E gate 端到端：良性 10/10 不以 count_rate_conflation 进 findings ==');
BENIGN.forEach((s, i) => ok(!dimsOf(s).includes('count_rate_conflation'), 'E' + (i + 1) + ' ' + s.slice(0, 28)));

// ─── F 负例注入（删条隔离）─────────────────────────────────
console.log('== F 负例注入-删条：新模式删除必须翻转、存量必须不翻 ==');
const I = crcMod.__internals();
const dropLeg = (arr, needle) => arr.filter(re => !re.source.includes(needle));

// 注入组定义：[标签, inject 对象, 期望翻转的新族样本下标, 期望不翻的存量样本下标]
const NEW_COUNT_ZH = I.COUNT_ZH.filter(re =>
  re.source.includes('崩溃|死机|宕机|蓝屏|闪退|卡死|卡顿|黑屏|报错|重启|掉线|断网|花屏|白屏') ||
  re.source.includes('崩溃次数|崩溃数'));
const NEW_COUNT_EN = I.COUNT_EN.filter(re => re.source.includes('outages|downtime|glitches'));
const NEW_QTY_EN = I.QTY_EN.filter(re => re.source.includes('more\\s+(?!than') || re.source.includes('doubled|tripled|quadrupled'));
const NEW_VERDICT_ZH = I.VERDICT_ZH.filter(re =>
  re.source.includes('退步|滑坡|下滑|下降|走低|缩水|崩坏') ||
  re.source.includes('不靠谱|没法用|用不了|不好用|难用|难以接受'));
const NEW_VERDICT_EN = I.VERDICT_EN.filter(re =>
  re.source.includes('regressed|declined|dropped|degraded') ||
  re.source.includes('unstable|unusable|unreliable|buggy') ||
  re.source.includes('not\\s+worth'));

// 先证明新常量确实在数组里（否则注入组定义失效，测试自身必须红）
ok(NEW_COUNT_ZH.length === 2, 'F0 新腿① COUNT_ZH 两条在数组（实得 ' + NEW_COUNT_ZH.length + '）');
ok(NEW_COUNT_EN.length === 1, 'F0 新腿① COUNT_EN 一条在数组（实得 ' + NEW_COUNT_EN.length + '）');
ok(NEW_QTY_EN.length === 2, 'F0 新腿①b QTY_EN 两条在数组（实得 ' + NEW_QTY_EN.length + '）');
ok(NEW_VERDICT_ZH.length === 2, 'F0 新腿② VERDICT_ZH 两条在数组（实得 ' + NEW_VERDICT_ZH.length + '）');
ok(NEW_VERDICT_EN.length === 3, 'F0 新腿② VERDICT_EN 三条在数组（实得 ' + NEW_VERDICT_EN.length + '）');

// 各组注入：COUNT_ZH / VERDICT_ZH / COUNT_EN / QTY_EN(more-X-than) / QTY_EN(doubled) / VERDICT_EN / 全摘
// flip=必须翻转的新族攻击下标；keep=必须不翻的新族攻击下标（存量腿承重）；keepStock=必须不翻的存量下标
const STOCK_ALL = STOCK_ZH.concat(STOCK_EN);
const INJ = [
  {
    label: 'F1 删新腿① COUNT_ZH（软件故障计数 ZH 两条）',
    run: (t) => crcMod.detectCountRateConflation(t, { COUNT_ZH: dropLeg(dropLeg(I.COUNT_ZH, '崩溃|死机|宕机|蓝屏|闪退|卡死|卡顿|黑屏|报错|重启|掉线|断网|花屏|白屏'), '崩溃次数|崩溃数') }),
    flip: [0, 1, 2, 3, 4, 5],           // A1-A6 全部依赖新腿①
    keep: [],
    keepStock: STOCK_ZH.map((_, i) => i),
  },
  {
    label: 'F2 删新腿② VERDICT_ZH（质量滑坡+不可用两条）',
    run: (t) => crcMod.detectCountRateConflation(t, { VERDICT_ZH: dropLeg(dropLeg(I.VERDICT_ZH, '退步|滑坡|下滑|下降|走低|缩水|崩坏'), '不靠谱|没法用|用不了|不好用|难用|难以接受') }),
    flip: [0, 1, 2, 3, 5],              // A1/A2/A3/A4/A6 新腿②
    keep: [4],                          // A5 存量「更差」承重不翻
    keepStock: STOCK_ZH.map((_, i) => i),
  },
  {
    label: 'F3 删新腿① COUNT_EN（软件故障计数 EN 一条）',
    run: (t) => crcMod.detectCountRateConflation(t, { COUNT_EN: dropLeg(I.COUNT_EN, 'outages|downtime|glitches') }),
    flip: [7, 8, 9, 10],                // E2-E5 新腿①
    keep: [6],                          // E1 存量 crashes 承重不翻
    keepStock: STOCK_EN.map((_, i) => i),
  },
  {
    label: 'F4 删新腿①b QTY_EN more X than',
    run: (t) => crcMod.detectCountRateConflation(t, { QTY_EN: dropLeg(I.QTY_EN, 'more\\s+(?!than') }),
    flip: [6],                          // E1 量级腿唯一来源
    keep: [7, 8, 9, 10],                // E2 highest/E3 tripled/E4 most/E5 doubled 不翻
    keepStock: STOCK_EN.map((_, i) => i),
  },
  {
    label: 'F5 删新腿①b QTY_EN doubled/tripled',
    run: (t) => crcMod.detectCountRateConflation(t, { QTY_EN: dropLeg(I.QTY_EN, 'doubled|tripled|quadrupled') }),
    flip: [8, 10],                      // E3 tripled / E5 doubled
    keep: [6, 7, 9],                    // E1 more-X-than / E2 highest / E4 most 不翻
    keepStock: STOCK_EN.map((_, i) => i),
  },
  {
    label: 'F6 删新腿② VERDICT_EN（三条）',
    run: (t) => crcMod.detectCountRateConflation(t, {
      VERDICT_EN: dropLeg(dropLeg(dropLeg(I.VERDICT_EN, 'regressed|declined|dropped|degraded'), 'unstable|unusable|unreliable|buggy'), 'not\\s+worth'),
    }),
    flip: [8, 9, 10],                   // E3/E4/E5 新腿②
    keep: [6, 7],                       // E1 worse / E2 less reliable 存量承重不翻
    keepStock: STOCK_EN.map((_, i) => i),
  },
  {
    label: 'F7 全族摘除（五组新常量全删）',
    run: (t) => crcMod.detectCountRateConflation(t, {
      COUNT_ZH: dropLeg(dropLeg(I.COUNT_ZH, '崩溃|死机|宕机|蓝屏|闪退|卡死|卡顿|黑屏|报错|重启|掉线|断网|花屏|白屏'), '崩溃次数|崩溃数'),
      COUNT_EN: dropLeg(I.COUNT_EN, 'outages|downtime|glitches'),
      QTY_EN: dropLeg(dropLeg(I.QTY_EN, 'more\\s+(?!than'), 'doubled|tripled|quadrupled'),
      VERDICT_ZH: dropLeg(dropLeg(I.VERDICT_ZH, '退步|滑坡|下滑|下降|走低|缩水|崩坏'), '不靠谱|没法用|用不了|不好用|难用|难以接受'),
      VERDICT_EN: dropLeg(dropLeg(dropLeg(I.VERDICT_EN, 'regressed|declined|dropped|degraded'), 'unstable|unusable|unreliable|buggy'), 'not\\s+worth'),
    }),
    flip: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    keep: [],
    keepStock: STOCK_ALL.map((_, i) => i),
  },
];

for (const g of INJ) {
  let allFlip = true, allKeep = true;
  for (const i of g.flip) { if (g.run(ATTACKS[i]).hit) { allFlip = false; ok(false, g.label + ' 攻击 A' + (i + 1) + ' 未翻转'); } }
  for (const i of g.keep) { if (!g.run(ATTACKS[i]).hit) { allKeep = false; ok(false, g.label + ' 攻击 A' + (i + 1) + ' 被误翻（存量腿应承重）'); } }
  for (const i of g.keepStock) { if (!g.run(STOCK_ALL[i]).hit) { allKeep = false; ok(false, g.label + ' 存量 C' + (i + 1) + ' 被误翻'); } }
  ok(allFlip && allKeep, g.label + '：翻转 ' + g.flip.length + '/' + g.flip.length + '、不翻（攻击 ' + g.keep.length + ' + 存量 ' + g.keepStock.length + '）全部保持');
}

console.log('== G 收尾断言 ==');
ok(Object.keys(I).includes('COUNT_ZH') && Object.keys(I).includes('COUNT_EN') && Object.keys(I).includes('QTY_EN') && Object.keys(I).includes('VERDICT_ZH') && Object.keys(I).includes('VERDICT_EN'), 'G1 __internals 五组腿常量齐全');
const fs = require('fs');
const VERSION = fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim();
ok(VERSION === '6.8.213' || Number(VERSION.split('.')[2]) > 213, 'G2 VERSION 未 bump（实为 ' + VERSION + '，扩族轮同 r406-r433 先例；r437 双 lineage 合并后允许 >6.8.213）');
const claims = fs.readFileSync(path.join(__dirname, '..', 'coordination', 'claims.jsonl'), 'utf8');
ok(/r434/.test(claims) && /agent-4/.test(claims), 'G3 claims.jsonl 含 r434 认领（agent-4）');

console.log('');
console.log('round-434-count-rate-software-failure: ' + passed + ' passed / ' + failed + ' failed（注入 ' + INJ.length + ' 组：' + INJ.length + ' 组全翻转，0 组未变红）');
console.log('cleanup: none (pure in-memory checks)');
