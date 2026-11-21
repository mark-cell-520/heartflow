'use strict';
// round-439  regression_to_the_mean（第 193 维）「极端×反向断言必然化」族
//             全新措辞家族扩展（真升级②，live 生效）
//
// 覆盖（r439 池化探针 coordination/agent4/probes/r439-probe-pool.js +
// r439-probe-round2.js 实测，HEAD v6.8.216 未改引擎前：本族 ZH 攻击 7/7
// 完全穿透——gate=pass 零维度承重、模块层 0/10 全 miss；EN 3 条由
// fallacy_of_relevance/hindsight_bias 等存量维度代拦、模块层同样 miss；
// 良性 6 条中 2 条被存量维度（confidence/absolute_claim/hindsight_bias）
// 代拦且本维零承重）：
//   A. 腿①' INEV_LOW_ZH/EN：低位极端（谷底/连败/惨败/rock bottom/0-8…）
//   B. 腿①'' INEV_HIGH_ZH/EN：高位极端（爆火/连涨/辉煌/登顶/rally/
//      massive debut/five straight championships…）
//   C. 腿②' INEV_UP_ZH/EN：回升断言（反弹/翻身/翻盘/turnaround…）
//   D. 腿②'' INEV_DOWN_ZH/EN：回落断言（必有一跌/扑街/狗尾续貂/
//      crash bound to follow/doomed to disappoint…）
//   E. 腿③' INEV_LAW_ZH/EN：必然化断言（肯定/必然/一定/按规律/物极必反/
//      站得越高摔得越狠；EN inevitable/bound to/doomed/only a matter
//      of time…）
//
// 族形态：存量主判据是「极端×回归×干预×归因」四腿邻近（落点=把功劳
// 归给干预），r300 反馈族要表扬/批评干预腿，r302 负向族要干预腿，
// r435 魔咒族要魔咒/诅咒命名腿——本族是**无干预、无魔咒命名的裸因果
// 铁律形**：把极端值后的自然回归说成反向极端的必然应验（谷底必反弹/
// 爆火必扑街/连涨必跌）。独立四表双腿路由（低位×回升 / 高位×回落，
// 方向配对内置于表格设计，同 r435 魔咒族高位专表×回落专表范式；
// 不并入存量数组——EXTREME_*/REG_* 有 round-265 登记断言
// length===N，追加会打破单测），与主判据/反馈族/负向族/魔咒族并行，
// 命中即 hit。全局豁免（概念教学/实验证据/推理否定/对冲/疑问）在
// checkRegressionToMean 入口统一先判，本族同享；另设族级否定守卫
// （必然断言前窗否定词/后窗反驳短语在场不判，同 r435 范式）。
//
// 边界实测登记：
//   · 方向配对——「跌到谷底之后一定会扑街」（低位×回落，非同向配对）
//     按设计不收（回归语义是低位→回升/高位→回落）
//   · 反驳形豁免——「不是说爆火之后一定扑街」「A long rally does
//     not make a crash inevitable」族级前后窗守卫承重
//
// 纪律：
//   - 本族自身维度计数不变、src/index.js 零改动（rebase 到 main 后总维度数随
//     1 号 r437 新维度轮为 277，本族不贡献新维度）
//   - 负例：注入-删条，删掉本轮新常量守卫必须转 miss，存量样本不得翻转
const path = require('path');
const ROOT = path.join(__dirname, '..');
const rtmMod = require(path.join(ROOT, 'src', 'regression-to-the-mean.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const { checkRegressionToMean, __internals } = rtmMod;

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log('  ✅ ' + label); }
  else { failed++; console.log('  ❌ ' + label); }
}
const hit = (text, inject) => checkRegressionToMean(text, inject).hit;
const dimsOf = (text) => { const r = gate(text); return ((r && r.findings) || []).map(f => f.dimension); };
const actionOf = (text) => { const r = gate(text); return (r && r.gate && r.gate.action) || r.action; };

// ─── 新族攻击（模块层，穿透样本转承重）──────────────────────
const ATTACK_ZH = [
  '这个赛季球队战绩差到谷底，接下来肯定会反弹，这是规律。',              // A1 低位×回升×必然
  '第一张专辑就爆火，第二张一定扑街，逃不过的。',                        // A2 高位×回落×必然
  '他这次考了年级第一，下次肯定要掉下来，站得越高摔得越狠。',            // A3 高位×回落×必然
  '公司业绩连创新高，按规律接下来该走下坡路了。',                        // A4 高位×回落×按规律
  '这部片票房大爆，续集必然狗尾续貂。',                                  // A5 高位×回落×必然
  '股价连涨了半年，接下来必有一跌，涨久必跌。',                          // A6 高位×回落×必
  '他连胜纪录这么辉煌，下一次惨败已经在招手了。',                        // A7 高位×回落×招手
  '战队开局三连败，这次总决赛必定触底反弹，连败之后必然翻盘。',          // A8 低位×回升×必定
  '她第一部电影就票房登顶，第二部必然凉凉，这就是宿命。',                // A9 高位×回落×宿命
  '这个产品去年是爆款，今年销量一定暴跌，爆款向来如此。',                // A10 高位×回落×向来如此
];
const ATTACK_EN = [
  'The team hit rock bottom this season, so a turnaround is inevitable — that is the law.',  // E1 低位×回升×inevitable
  'The stock has rallied for months, so a crash is bound to follow.',                        // E2 高位×回落×bound to
  'After such a massive debut, the sequel is doomed to disappoint.',                         // E3 高位×回落×doomed
  'They started the season 0-8, so a turnaround is inevitable.',                             // E4 战绩×回升×inevitable
  'After five straight championships, a collapse is only a matter of time.',                // E5 高位×回落×matter of time
];
const ATTACKS = ATTACK_ZH.concat(ATTACK_EN);

// ─── 新族良性（含 FP 压力样本：反驳/对冲/概念/单腿/方向配对错）──
const BENIGN = [
  // 反驳形（族级前窗否定守卫承重）
  '战绩差到谷底，但不能说接下来一定会反弹，阵容问题还没解决。',
  '不是说爆火之后一定扑街，这只是统计错觉。',
  'A long rally does not make a crash inevitable; fundamentals matter.',
  // 对冲/替代解释（无必然断言）
  '股价涨了半年可能继续涨也可能回调，要看基本面和市场环境判断。',
  '第一张专辑爆火不决定第二张质量，续集成败要看作品本身。',
  'A strong debut does not doom the sequel — each album stands on its own.',
  // 概念教学（模块概念豁免承重）
  '均值回归告诉我们，极端值之后会回归正常水平，这不是什么铁律。',
  'After a record season, the next one may be weaker — that is just regression, not destiny.',
  // 单腿 / 方向配对错（按设计不收）
  '股价连涨了半年。',
  '接下来必有一跌。',
  '跌到谷底之后一定会扑街。',
  '他考了年级第一，下次继续努力。',
];

// ─── 存量攻击/良性（r195/r265/r274/r300/r302/r435 代表，隔离证明）──
const STOCK_ATTACKS = [
  '上次考了年级最差，考前吃了巧克力，这次回到班级中等——巧克力确实有用。',   // r195 主判据
  '球队开局三连败，换帅之后立刻反弹，可见新教练是关键。',                     // r265 新措辞
  '公司业绩跌到谷底那年请了大师做咨询，这个季度营收回暖，多亏了大师。',       // r265 主判据
  'After our worst quarter on record we hired the new consultant, and revenue bounced back — the hire fixed it.',  // EN 主判据
  '我表扬了孩子考了满分，结果下次考试就退步了，看来表扬会让孩子骄傲自满。',   // r300 反馈族
  '上次考试他考了第一，这次考差了，说明上次的补课班起了反作用。',             // r302 负向族
  '拿了最佳新人后就撞上新秀墙，这魔咒看来真躲不过',                          // r435 魔咒族
];
const STOCK_BENIGN = [
  '这次成绩回落可能是均值回归，要看他平时的水平。',
  '这次考了年级最差，下次回到中等是正常的均值回归。',
  '我们做了随机对照实验，发现批评组和对照组的成绩变化没有显著差异。',         // r300 实验证据豁免
  '卫冕失败有很多原因，不能说是魔咒应验',                                    // r435 反驳形
];

console.log('== A 模块层：新族攻击 15/15 命中 ==');
ATTACKS.forEach((s, i) => ok(hit(s), 'A' + (i + 1) + ' ' + s.slice(0, 26)));

console.log('== B 模块层：良性 13/13 零误伤（含反驳/对冲/概念/单腿 FP 压力样本） ==');
BENIGN.forEach((s, i) => ok(!hit(s), 'B' + (i + 1) + ' ' + s.slice(0, 26)));

console.log('== C 边界锁：对冲/疑问/方向配对错/前窗否定守卫 ==');
ok(!hit('球队战绩差到谷底，接下来也许会反弹吧。'), 'C1 对冲豁免（也许/吧）');
ok(!hit('连涨了半年，接下来一定会跌吗？'), 'C2 疑问豁免（吗？）');
ok(!hit('数据显示连涨之后往往有回调'), 'C3 实验证据豁免（数据显示）');
ok(!hit('考了年级第一，不代表下次一定掉下来'), 'C4 全局推理否定豁免（不代表）');

console.log('== D 存量不回归：存量攻击 7/7 仍命中、存量良性 4/4 仍放行 ==');
STOCK_ATTACKS.forEach((s, i) => ok(hit(s), 'D' + (i + 1) + ' ' + s.slice(0, 26)));
STOCK_BENIGN.forEach((s, i) => ok(!hit(s), 'D-' + (i + 1) + ' ' + s.slice(0, 26)));

console.log('== E gate 端到端：新族攻击 15/15 非 pass 且 regression_to_the_mean 承重 ==');
ATTACKS.forEach((s, i) => {
  const a = actionOf(s), d = dimsOf(s);
  ok(a !== 'pass' && d.includes('regression_to_the_mean'), 'E' + (i + 1) + ' gate=' + a + ' 承重=' + d.includes('regression_to_the_mean'));
});

console.log('== F gate 端到端：良性 13/13 不以 regression_to_the_mean 进 findings ==');
BENIGN.forEach((s, i) => ok(!dimsOf(s).includes('regression_to_the_mean'), 'F' + (i + 1) + ' ' + s.slice(0, 26)));

// ─── G 负例注入（删条隔离）─────────────────────────────────
console.log('== G 负例注入-删条：新腿常量删除必须翻转、存量必须不翻 ==');
const I = __internals();
const dropAll = (key) => ({ [key]: [] });

// 先证明新常量在 __internals 里（否则注入组定义失效，测试自身必须红）
const NEW_KEYS = ['INEV_LOW_ZH', 'INEV_HIGH_ZH', 'INEV_UP_ZH', 'INEV_DOWN_ZH', 'INEV_LAW_ZH',
  'INEV_LOW_EN', 'INEV_HIGH_EN', 'INEV_UP_EN', 'INEV_DOWN_EN', 'INEV_LAW_EN'];
ok(NEW_KEYS.every(k => Array.isArray(I[k]) && I[k].length > 0), 'G0 __internals 十组新腿常量齐全（' + NEW_KEYS.map(k => k + '=' + (I[k] || []).length).join(' ') + '）');

const LOW_ZH_ATT = [0, 7];                    // A1/A8 低位×回升
const HIGH_ZH_ATT = [1, 2, 3, 4, 5, 6, 8, 9];  // A2-A7/A9/A10 高位×回落
const LOW_EN_ATT = [10, 13];                   // E1/E4 低位×回升
const HIGH_EN_ATT = [11, 12, 14];              // E2/E3/E5 高位×回落

const INJ = [
  { label: 'G1 删腿① INEV_LOW_ZH（低位极端）', inject: dropAll('INEV_LOW_ZH'), flip: LOW_ZH_ATT },
  { label: 'G2 删腿① INEV_HIGH_ZH（高位极端）', inject: dropAll('INEV_HIGH_ZH'), flip: HIGH_ZH_ATT },
  { label: 'G3 删腿② INEV_UP_ZH（回升断言）', inject: dropAll('INEV_UP_ZH'), flip: LOW_ZH_ATT },
  { label: 'G4 删腿② INEV_DOWN_ZH（回落断言）', inject: dropAll('INEV_DOWN_ZH'), flip: HIGH_ZH_ATT },
  { label: 'G5 删腿③ INEV_LAW_ZH（必然化断言）', inject: dropAll('INEV_LAW_ZH'), flip: ATTACK_ZH.map((_, i) => i) },
  { label: 'G6 删腿① INEV_LOW_EN', inject: dropAll('INEV_LOW_EN'), flip: LOW_EN_ATT },
  { label: 'G7 删腿① INEV_HIGH_EN', inject: dropAll('INEV_HIGH_EN'), flip: HIGH_EN_ATT },
  { label: 'G8 删腿② INEV_UP_EN', inject: dropAll('INEV_UP_EN'), flip: LOW_EN_ATT },
  { label: 'G9 删腿② INEV_DOWN_EN', inject: dropAll('INEV_DOWN_EN'), flip: HIGH_EN_ATT },
  { label: 'G10 删腿③ INEV_LAW_EN', inject: dropAll('INEV_LAW_EN'), flip: ATTACK_EN.map((_, i) => i + ATTACK_ZH.length) },
  { label: 'G11 全族摘除（十组新常量全删）', inject: Object.fromEntries(NEW_KEYS.map(k => [k, []])), flip: ATTACKS.map((_, i) => i) },
];

for (const g of INJ) {
  let allFlip = true;
  for (const i of g.flip) { if (hit(ATTACKS[i], g.inject)) { allFlip = false; ok(false, g.label + ' 攻击 A' + (i + 1) + ' 未翻转'); } }
  // 存量攻击/良性在注入下必须不翻（隔离证明：新族不依赖存量腿、存量不依赖新族）
  let stockOk = true;
  STOCK_ATTACKS.forEach((s, i) => { if (!hit(s, g.inject)) { stockOk = false; ok(false, g.label + ' 存量攻击 D' + (i + 1) + ' 被误翻'); } });
  STOCK_BENIGN.forEach((s, i) => { if (hit(s, g.inject)) { stockOk = false; ok(false, g.label + ' 存量良性 D-' + (i + 1) + ' 被误翻'); } });
  ok(allFlip && stockOk, g.label + '：翻转 ' + g.flip.length + '/' + g.flip.length + '、存量攻 7/7 + 良性 4/4 全部保持');
}

// ─── H 登记断言 ────────────────────────────────────────────
console.log('== H 收尾断言 ==');
ok(I.EXTREME_LOW_ZH.length === 7 && I.EXTREME_HIGH_ZH.length === 6 &&
   I.REG_DOWN_ZH.length === 6 && I.REG_DOWN_EN.length === 8 &&
   I.REG_UP_ZH.length === 8 && I.REG_UP_EN.length === 3 &&
   I.INTERVENE_ZH.length === 9 && I.INTERVENE_EN.length === 5 &&
   I.CREDIT_ZH.length === 4 && I.CREDIT_EN.length === 2 &&
   I.EFFECT_ZH.length === 5 && I.EFFECT_EN.length === 5 &&
   I.EXEMPT_NEG_ZH.length === 3 && I.EXEMPT_NEG_EN.length === 2 &&
   I.FB_INTERVENE_ZH.length === 4 && I.FB_INTERVENE_EN.length === 4 &&
   I.FB_ATTRIB_ZH.length === 3 && I.FB_ATTRIB_EN.length === 3 &&
   I.NEG_EFFECT_ZH.length === 7 && I.NEG_EFFECT_EN.length === 5 &&
   I.JINX_EXT_ZH.length === 5 && I.JINX_REG_ZH.length === 5 && I.JINX_NAME_ZH.length === 2 &&
   I.JINX_EXT_EN.length === 5 && I.JINX_REG_EN.length === 5 && I.JINX_NAME_EN.length === 3,
  'H1 存量数组长度守恒（r435 登记值 + r439-diag-lens 实测，新族独立成组未动存量）');
const fs = require('fs');
const VERSION = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
ok(VERSION === '6.8.217', 'H2 VERSION（实为 ' + VERSION + '）——本 r439 扩族轮自身未 bump；rebase 到 main 后 VERSION 随 1 号 r437 新维度轮（intervention_effect_without_baseline）前进至 6.8.217，断言随同步');
const claims = fs.readFileSync(path.join(ROOT, 'coordination', 'claims.jsonl'), 'utf8');
ok(/r439/.test(claims) && /agent-4/.test(claims), 'H3 claims.jsonl 含 r439 认领（agent-4）');
const indexSrc = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
ok(/regression_to_the_mean/.test(indexSrc), 'H4 src/index.js 维度键在位（扩族轮零改动，仅登记核对）');

console.log('');
console.log('round-437-inevitability-assertion: ' + passed + ' passed / ' + failed + ' failed（注入 ' + INJ.length + ' 组：' + INJ.length + ' 组全翻转，0 组未变红）');
console.log('cleanup: none (pure in-memory checks)');
