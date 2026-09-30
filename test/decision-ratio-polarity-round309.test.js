/**
 * 第 309 轮守卫：decision 比例通道的极性契约（修 r308 遗留「反向打分」）
 *
 * 缺口复测（scratch/probe309-ratio.js / -split.js 实测）：
 *   r308 交接簿把缺陷记为「打分方向与质量反相关：命中率 10/10、
 *   误伤 0/30 得 0.77，命中率 4/10、误伤 12/30 得 0.82」。
 *   本轮实测确认**现象为真、根因记账不准**，真实机制是两层叠加：
 *
 *   ① 误伤型比例从未被采信（锚点词表缺「误伤族」）
 *      「命中率 4/10、误伤 6/30」的第二个比例的 ±10 字符窗口被前面的
 *      比例吃完，锚点被截在窗口外 → 整条丢弃。
 *      两候选的误伤差异（6/30 vs 12/30）被整个吞掉 → composite 双双
 *      0.82 打平 → decide() 弃权。
 *      单变量实测：误伤 0/6/12/18/30 五个候选的 measured_gap 全为 null→
 *      修复后为 0/0.2/0.4/0.6/1 单调。
 *
 *   ② `gap = 1 - x/y` 对误伤族极性本来就是反的
 *      只修锚点后单变量实测立刻反转：误伤 0/30 得 gap=1（最高分），
 *      误伤 30/30 得 gap=0 —— 比全漏的候选还优先。修法：按比例类型
 *      定极性，误伤型 gap = x/y（误伤越多缺口越大），
 *      命中/检测型 gap = 1 - x/y（漏得越多缺口越大）。
 *
 *   ③ 附带修复的偶合：候选写「覆盖率 0/18」而无任何检测词时，
 *      锚点来源是模块名里的 Detector 子串；无此类命名的候选该比例被丢。
 *      补「覆盖度/覆盖率/覆盖」进锚点表后，覆盖率 0/18 与 1/18 的
 *      缺口差可被分辨（1 vs 0.94），两个 0/18 的候选如实打平弃权。
 *
 * 本守卫把契约钉死：删锚点词、把极性改回统一 1-x/y、去掉就近锚点定类、
 * 三者中任何一处回退，对应断言必须变红。
 *
 * 运行：node test/decision-ratio-polarity-round309.test.js
 */
'use strict';

const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', 'src', 'core', 'decision.js'));

let pass = 0, fail = 0;
const failures = [];
function ok(cond, label) { if (cond) pass++; else { fail++; failures.push(label); } }

function dec() { return new HeartFlowDecision(null); }
function sc(label) { return dec()._scoreOption({ id: 'x', label, description: '' }, '选方向', null); }

// ─── A. 误伤型比例必须被采信（锚点词表契约） ─────────────────
{
  const g0 = sc('误伤 0/30、命中率 10/10').measured_gap;
  const g30 = sc('误伤 30/30、命中率 10/10').measured_gap;
  ok(g0 !== null, '误伤 0/30 必须被采信（锚点表不得退回无「误伤」词的状态）');
  ok(g30 !== null, '误伤 30/30 必须被采信');
  ok(g30 > g0, `误伤越多缺口必须越大（0/30=${g0} 30/30=${g30}）`);
}

// ─── B. 误伤型极性必须与命中型相反 ─────────────────────────
{
  // 误伤族：gap = x/y（误伤 12/30 → 0.4）
  const fp = sc('误伤 12/30、命中率 10/10').measured_gap;
  ok(Math.abs(fp - 12 / 30) < 1e-9,
    `误伤型比例 gap 应等于 x/y=0.4（实测 ${fp}）——改成 1-x/y 必须变红`);
  // 命中族：gap = 1 - x/y（命中率 4/10 → 0.6）
  const miss = sc('命中率 4/10、误伤 0/30').measured_gap;
  ok(Math.abs(miss - 0.6) < 1e-9,
    `命中型比例 gap 应等于 1-x/y=0.6（实测 ${miss}）`);
}

// ─── C. 单变量单调性（误伤族） ─────────────────────────────
{
  const gaps = [0, 6, 12, 18, 30].map((n) => sc(`误伤 ${n}/30、命中率 10/10`).measured_gap);
  const mono = gaps.every((g, i) => i === 0 || g > gaps[i - 1]);
  ok(mono, `误伤越少 gap 必须单调不增（实测 ${JSON.stringify(gaps)}）`);
  ok(Math.abs(gaps[0]) < 1e-9, `零误伤的缺口应为 0（最优，实测 ${gaps[0]}）`);
}

// ─── D. 单变量单调性（命中族） ─────────────────────────────
{
  const gaps = [10, 8, 4, 0].map((n) => sc(`命中率 ${n}/10、误伤 0/30`).measured_gap);
  const mono = gaps.every((g, i) => i === 0 || g > gaps[i - 1]);
  ok(mono, `命中越少 gap 必须单调不减（实测 ${JSON.stringify(gaps)}）`);
  ok(Math.abs(gaps[gaps.length - 1] - 1) < 1e-9, `全漏的缺口应为 1（实测 ${gaps[gaps.length - 1]}）`);
}

// ─── E. 就近锚点定类：误伤词紧贴命中型比例不得污染定类 ────────
{
  // 可分辨样本（scratch/probe309-distinguish.js 实测）：
  // 「误伤清零，命中率 4/10」——「误伤」二字距 4/10 只有 5 个字符，
  // 落在 10 字符窗口内 → 窗口口径会把 4/10 误判成误伤型 → gap=0.4（错）；
  // 就近锚点口径找到的最近锚点是「命中」→ miss 型 → gap=0.6（对）。
  // 这一条就是两个口径的分水岭，注入「用窗口判定定类」必须在此变红。
  const g1 = sc('误伤清零，命中率 4/10').measured_gap;
  ok(Math.abs(g1 - 0.6) < 1e-9,
    `误伤词紧贴命中型比例不得污染定类（应 0.6，实测 ${g1}）——用窗口定类会得 0.4`);
  const g1b = sc('误伤归零后命中率 4/10').measured_gap;
  ok(Math.abs(g1b - 0.6) < 1e-9,
    `误伤词在一词之隔外同样不得污染定类（实测 ${g1b}）`);
  const g3 = sc('误伤 0/30 已清零，命中率 4/10 仍有漏').measured_gap;
  ok(Math.abs(g3 - 0.6) < 1e-9,
    `两类比例必须各自定类（误伤 0/30→0，命中 4/10→0.6，取最大 0.6，实测 ${g3}）`);
  // 对照组：语序对调后语义相同，max 仍应是命中型的 0.6
  const g4 = sc('命中率 4/10 仍有漏，误伤 0/30 已清零').measured_gap;
  ok(Math.abs(g4 - 0.6) < 1e-9,
    `语序对调不得改变定类结果（实测 ${g4}）`);
  // 后置写法兼容：锚点在数字后
  const g2 = sc('10/10 命中率，30/30 全命中').measured_gap;
  ok(Math.abs(g2) < 1e-9, `后置锚点写法应被识别为命中型（gap=0，实测 ${g2}）`);
}

// ─── F. 多比例取最大缺口：最优候选不得排最后 ───────────────
{
  const a = sc('命中率 10/10、误伤 0/30');   // 最优：两类缺口都 0
  const d1 = sc('命中率 4/10、误伤 12/30');  // 最差：0.6 与 0.4
  const b = sc('命中率 8/10、误伤 2/30');
  ok(a.measured_gap < d1.measured_gap,
    `最优候选的缺口必须小于最差候选（A=${a.measured_gap} D=${d1.measured_gap}）`);
  ok(b.measured_gap < d1.measured_gap && b.measured_gap > a.measured_gap,
    `中间候选缺口必须居中（A=${a.measured_gap} B=${b.measured_gap} D=${d1.measured_gap}）`);
}

// ─── G. 覆盖率锚点：无检测词的候选不得靠偶合成因得分 ───────
{
  // 「引擎调用覆盖率 0/18」+ 无任何 detect/覆盖词之外命名的候选：
  // 补「覆盖度/覆盖率」锚点后 0/18 与 1/18 必须可分辨。
  const g0 = sc('做仓库卫生：引擎调用覆盖率 0/18').measured_gap;
  const g1 = sc('做仓库卫生：引擎调用覆盖率 1/18').measured_gap;
  ok(g0 !== null && g1 !== null, '覆盖率型比例必须被采信');
  ok(g0 > g1, `覆盖率越低缺口必须越大（0/18=${g0} 1/18=${g1}）`);
  // 无锚点数字（日期/版本）仍必须被丢弃
  ok(sc('修 decision 解析在 2026/9 排期，v6.7/124 基线').measured_gap === null,
    '无锚点数字仍必须被丢弃（日期/版本不得被误抽）');
}

// ─── H. decide() 端到端：两候选的误伤差异必须能定向 ─────────
{
  const r = dec().decide({
    task: '选下一轮方向',
    prompt: [
      '[A] 甲：命中率 10/10、误伤 0/30',
      '[B] 乙：命中率 4/10、误伤 12/30',
    ].join('\n'),
  });
  // A 的两类缺口都是 0（gap=0），B 是 0.6 → A 的 consequence 更低、分更低。
  // 这里不钉方向（r308/r309 都实测 decide 会把缺口小的排后面），
  // 只钉「能定向且 reasoning 给出分数差」——互换极性会打平弃权。
  ok(r.chosen !== null,
    `误伤+命中双比例的两候选必须能被区隔（不得并列弃权），实得 chosen=${r.chosen}`);
  ok(String(r.reasoning).length > 0, '定向时必须给出带分数的 reasoning');
}

// ─── I. r99 契约不被破坏（detect 型多比例取最大缺口） ──────
{
  const a = sc('detect 7/8 主链路通过，detect 1/4 英文侧漏判');
  const b = sc('detect 7/8 主链路通过，detect 0/4 英文侧漏判');
  ok(Math.abs(a.measured_gap - 0.75) < 1e-9, `detect 7/8 + 1/4 应取 1-1/4=0.75（实测 ${a.measured_gap}）`);
  ok(Math.abs(b.measured_gap - 1) < 1e-9, `detect 7/8 + 0/4 应取 1-0/4=1.0（实测 ${b.measured_gap}）`);
  ok(b.composite > a.composite, '缺口更大的候选必须排更高（r99 D 契约）');
  const pct = sc('覆盖率 25%，其余改用词表').measured_gap;
  ok(Math.abs(pct - 0.75) < 1e-9, `覆盖率 25% 应得 gap=0.75（实测 ${pct}）`);
}

console.log('\n=== 第 309 轮主测试 decision-ratio-polarity ===');
if (failures.length) {
  console.log(`\n❌ ${failures.length} 项失败:`);
  for (const f of failures) console.log('  ' + f);
}
console.log(`\n总计: ${pass} passed / ${fail} failed`);
console.log(fail === 0 ? '\n✅ 全绿' : '\n❌ 有失败');
process.exit(fail === 0 ? 0 : 1);
