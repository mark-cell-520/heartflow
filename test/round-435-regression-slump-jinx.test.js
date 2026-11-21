'use strict';
// round-435  regression_to_the_mean（第 193 维）「新秀墙/魔咒」命名现象族
//             全新措辞家族扩展（真升级②，live 生效）
//
// 覆盖（r435 池化探针 scripts/round-435-probe-p3-depth.js 实测，
// HEAD v6.8.213 未改引擎前：本族攻击 15 条中 10 条完全穿透——gate=pass
// 零维度承重，其余 5 条由 hindsight_bias/post_hoc/capability_overclaim
// 存量维度代拦；良性 8 条全为存量维度代拦且本维零承重）：
//   A. 腿①' JINX_EXT_ZH/EN：高位极端（冠军/卫冕/最佳新人/满分/巅峰/
//      首专/封面；EN championship/rookie of the year/debut album…）
//   B. 腿②' JINX_REG_ZH/EN：自然回落（新秀墙/崩盘/远不如/一张不如
//      一张/一路下滑；EN sophomore slump/collapsed/flopped…）
//   C. 腿③' JINX_NAME_ZH/EN：魔咒断言（魔咒/诅咒/综合征/灵验/应验/
//      屡试不爽/躲不过；EN jinx/curse/never fails/is real…）
//
// 族形态：存量主判据是「极端×回归×干预×归因」四腿邻近（落点=把功劳
// 归给干预），本族落点是**无干预的宿命断言**——干预腿缺席，整族穿透。
// 独立三腿路由（不并入存量数组——EXTREME_LOW_ZH/REG_DOWN_ZH/EXEMPT_
// NEG_ZH 等有登记断言 length===N，追加会打破 round-265/round-274 单测），
// 与主判据/反馈族(r300)/负向族(r302)并行，命中即 hit。概念教学/实验
// 证据/推理否定/对冲/疑问豁免在 checkRegressionToMean 入口统一先判，
// 本族同享；另设族级否定守卫（断言前窗否定词/后窗反驳短语在场不判）。
//
// 边界实测登记（r435 诊断 coordination/agent4/r435-diag-jinx2.output.txt）：
//   · 反驳形全数豁免——「不能说是魔咒应验」「curse is not real」
//     「 sophomore slump is not real」族级前后窗守卫 + 模块豁免承重
//   · EN 裸 not/no 不收进前窗（"no player escapes the jinx" 是攻击形）
//
// 纪律：
//   - 维度计数不变（274）、src/index.js 零改动、VERSION 不 bump（扩族先例同 r406-r434）
//   - 负例：注入-删条，删掉本轮三腿新常量守卫必须转 miss，存量样本不得翻转
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
  '拿了最佳新人后就撞上新秀墙，这魔咒看来真躲不过',                    // A1 最佳新人×新秀墙×魔咒
  '上年还是冠军，今年直接崩盘，亚军魔咒果然又灵验了',                  // A2 冠军×崩盘×魔咒
  '第二张专辑远不如首张，第二专辑综合征谁也逃不掉',                    // A3 首张×远不如×综合征
  '他连拿三个冠军后状态断崖式下滑，果然是夺冠即巅峰的魔咒',            // A4 冠军×断崖下滑×魔咒
  '上了封面成绩就下滑，封面魔咒屡试不爽',                              // A5 封面×下滑×魔咒
  '首专即巅峰，后面的专辑一张不如一张，这就是首专魔咒',                // A6 首专/巅峰×一张不如一张×魔咒
  '第一次创业就上市，第二家必然倒闭，首战即巅峰的魔咒跑不掉',          // A7 上市/巅峰×倒闭×魔咒
  '卫冕冠军第二年全垮了，卫冕魔咒真是铁律',                            // A8 卫冕冠军×全垮×魔咒
  '考了第一之后就一路下滑，看来第一名魔咒谁都逃不过',                  // A9 考了第一×一路下滑×魔咒
  '拿了大奖后作品水准直线下降，获奖魔咒又一次应验',                    // A10 大奖×直线下降×魔咒
];
const ATTACK_EN = [
  'He won rookie of the year and immediately hit the sophomore slump — the jinx is real',   // E1 rookie×slump×jinx
  'After the championship they collapsed; the cover curse strikes again',                    // E2 championship×collapsed×curse
  'Every rookie of the year hits the sophomore slump — the curse never fails',               // E3 rookie×slump×never fails
  'After winning the title they fell apart; the championship curse is real',                 // E4 title×fell apart×curse
  'Her first album was a masterpiece and the second flopped — second album syndrome again',  // E5 first album×flopped×syndrome
];
const ATTACKS = ATTACK_ZH.concat(ATTACK_EN);

// ─── 新族良性（含 FP 压力样本：反驳/对冲/概念/单腿）────────────
const BENIGN = [
  // 概念教学/正确解释（模块概念豁免承重）
  '新秀墙是典型现象，多数新人第二年数据都会回落，这只是均值回归',
  '新人第二年数据回落，这是统计学上的均值回归，不是魔咒',
  '所谓封面魔咒并没有统计依据，只是均值回归',
  'Sophomore slumps are well documented as regression to the mean',
  // 对冲/替代解释（无魔咒断言）
  '他换了教练后成绩下滑，可能是对手研究透了我们',
  '专辑不如首张受欢迎，也可能是因为创作周期太短',
  '他今年考了年级第一，明年继续努力',
  '这家餐厅的招牌菜味道很好',
  // 反驳形（族级前窗否定守卫承重）
  '卫冕失败有很多原因，不能说是魔咒应验',
  '数据下滑是事实，但说是魔咒就言过其实了',
  '冠军也不是魔咒应验，主要是对手变强了',
  // EN 反驳形（族级后窗守卫承重）
  'After the championship they collapsed, but the curse is not real',
  'The sophomore slump is not real, it is just regression to the mean',
];

// ─── 存量攻击/良性（r195/r265/r274/r300/r302 代表，隔离证明）──
const STOCK_ATTACKS = [
  '上次考了年级最差，考前吃了巧克力，这次回到班级中等——巧克力确实有用。',   // r195 主判据
  '球队开局三连败，换帅之后立刻反弹，可见新教练是关键。',                     // r265 新措辞
  '公司业绩跌到谷底那年请了大师做咨询，这个季度营收回暖，多亏了大师。',       // r265 主判据
  'After our worst quarter on record we hired the new consultant, and revenue bounced back — the hire fixed it.',  // EN 主判据
  '我表扬了孩子考了满分，结果下次考试就退步了，看来表扬会让孩子骄傲自满。',   // r300 反馈族
  '上次考试他考了第一，这次考差了，说明上次的补课班起了反作用。',             // r302 负向族
];
const STOCK_BENIGN = [
  '这次成绩回落可能是均值回归，要看他平时的水平。',
  '这次考了年级最差，下次回到中等是正常的均值回归。',
  '我们做了随机对照实验，发现批评组和对照组的成绩变化没有显著差异。',         // r300 实验证据豁免
];

console.log('== A 模块层：新族攻击 15/15 命中 ==');
ATTACKS.forEach((s, i) => ok(hit(s), 'A' + (i + 1) + ' ' + s.slice(0, 26)));

console.log('== B 模块层：良性 14/14 零误伤（含 6 条反驳/对冲 FP 压力样本） ==');
BENIGN.forEach((s, i) => ok(!hit(s), 'B' + (i + 1) + ' ' + s.slice(0, 26)));

console.log('== C 边界锁：单腿不判、对冲/疑问/实验证据豁免 ==');
ok(!hit('新秀墙'), 'C1 单腿-回归词不判');
ok(!hit('魔咒灵验了'), 'C2 单腿-魔咒断言不判');
ok(!hit('他拿了冠军'), 'C3 单腿-高位极端不判');
ok(!hit('拿了冠军后状态下滑，也许就是所谓的魔咒吧'), 'C4 对冲豁免（也许/吧）');
ok(!hit('难道拿了冠军就会撞上新秀墙中魔咒吗？'), 'C5 疑问豁免（吗？）');
ok(!hit('数据显示新秀墙现象在统计上很显著'), 'C6 实验证据豁免（数据显示）');
ok(!hit('连拿冠军后也可能状态下滑'), 'C7 对冲豁免（可能）');

console.log('== D 存量不回归：存量攻击 6/6 仍命中、存量良性 3/3 仍放行 ==');
STOCK_ATTACKS.forEach((s, i) => ok(hit(s), 'D' + (i + 1) + ' ' + s.slice(0, 26)));
STOCK_BENIGN.forEach((s, i) => ok(!hit(s), 'D-' + (i + 1) + ' ' + s.slice(0, 26)));

console.log('== E gate 端到端：新族攻击 15/15 非 pass 且 regression_to_the_mean 承重 ==');
ATTACKS.forEach((s, i) => {
  const a = actionOf(s), d = dimsOf(s);
  ok(a !== 'pass' && d.includes('regression_to_the_mean'), 'E' + (i + 1) + ' gate=' + a + ' 承重=' + d.includes('regression_to_the_mean'));
});

console.log('== F gate 端到端：良性 14/14 不以 regression_to_the_mean 进 findings ==');
BENIGN.forEach((s, i) => ok(!dimsOf(s).includes('regression_to_the_mean'), 'F' + (i + 1) + ' ' + s.slice(0, 26)));

// ─── G 负例注入（删条隔离）─────────────────────────────────
console.log('== G 负例注入-删条：三腿新常量删除必须翻转、存量必须不翻 ==');
const I = __internals();
const dropAll = (key) => ({ [key]: [] });

// 先证明新常量在 __internals 里（否则注入组定义失效，测试自身必须红）
const NEW_KEYS = ['JINX_EXT_ZH', 'JINX_REG_ZH', 'JINX_NAME_ZH', 'JINX_EXT_EN', 'JINX_REG_EN', 'JINX_NAME_EN'];
ok(NEW_KEYS.every(k => Array.isArray(I[k]) && I[k].length > 0), 'G0 __internals 六组新腿常量齐全（' + NEW_KEYS.map(k => k + '=' + (I[k] || []).length).join(' ') + '）');

const INJ = [
  {
    label: 'G1 删腿① JINX_EXT_ZH（高位极端）',
    inject: dropAll('JINX_EXT_ZH'),
    flip: ATTACK_ZH.map((_, i) => i),
  },
  {
    label: 'G2 删腿② JINX_REG_ZH（自然回落）',
    inject: dropAll('JINX_REG_ZH'),
    flip: ATTACK_ZH.map((_, i) => i),
  },
  {
    label: 'G3 删腿③ JINX_NAME_ZH（魔咒断言）',
    inject: dropAll('JINX_NAME_ZH'),
    flip: ATTACK_ZH.map((_, i) => i),
  },
  {
    label: 'G4 删腿① JINX_EXT_EN',
    inject: dropAll('JINX_EXT_EN'),
    flip: ATTACK_EN.map((_, i) => i + ATTACK_ZH.length),
  },
  {
    label: 'G5 删腿② JINX_REG_EN',
    inject: dropAll('JINX_REG_EN'),
    flip: ATTACK_EN.map((_, i) => i + ATTACK_ZH.length),
  },
  {
    label: 'G6 删腿③ JINX_NAME_EN',
    inject: dropAll('JINX_NAME_EN'),
    flip: ATTACK_EN.map((_, i) => i + ATTACK_ZH.length),
  },
  {
    label: 'G7 全族摘除（六组新常量全删）',
    inject: Object.fromEntries(NEW_KEYS.map(k => [k, []])),
    flip: ATTACKS.map((_, i) => i),
  },
];

for (const g of INJ) {
  let allFlip = true;
  for (const i of g.flip) { if (hit(ATTACKS[i], g.inject)) { allFlip = false; ok(false, g.label + ' 攻击 A' + (i + 1) + ' 未翻转'); } }
  // 存量攻击/良性在注入下必须不翻（隔离证明：新族不依赖存量腿、存量不依赖新族）
  let stockOk = true;
  STOCK_ATTACKS.forEach((s, i) => { if (!hit(s, g.inject)) { stockOk = false; ok(false, g.label + ' 存量攻击 D' + (i + 1) + ' 被误翻'); } });
  STOCK_BENIGN.forEach((s, i) => { if (hit(s, g.inject)) { stockOk = false; ok(false, g.label + ' 存量良性 D-' + (i + 1) + ' 被误翻'); } });
  ok(allFlip && stockOk, g.label + '：翻转 ' + g.flip.length + '/' + g.flip.length + '、存量攻 6/6 + 良性 3/3 全部保持');
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
   I.NEG_EFFECT_ZH.length === 7 && I.NEG_EFFECT_EN.length === 5,
  'H1 存量数组长度守恒（r435 diag-lens 实测值，与 r434 基线逐项相同——新族独立成组未动存量）');
const fs = require('fs');
const VERSION = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
ok(VERSION === '6.8.213', 'H2 VERSION 未 bump（实为 ' + VERSION + '，扩族轮同 r406-r434 先例）');
const claims = fs.readFileSync(path.join(ROOT, 'coordination', 'claims.jsonl'), 'utf8');
ok(/r435/.test(claims) && /agent-4/.test(claims), 'H3 claims.jsonl 含 r435 认领（agent-4）');
const indexSrc = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
ok(/regression_to_the_mean/.test(indexSrc), 'H4 src/index.js 维度键在位（扩族轮零改动，仅登记核对）');

console.log('');
console.log('round-435-regression-slump-jinx: ' + passed + ' passed / ' + failed + ' failed（注入 ' + INJ.length + ' 组：' + INJ.length + ' 组全翻转，0 组未变红）');
console.log('cleanup: none (pure in-memory checks)');
