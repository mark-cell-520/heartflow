/**
 * test/round-393-disjunctive-fallacy.test.js
 * r393 轮单测：第 266 维度 disjunctive_syllogism_fallacy（非穷尽析取消去谬误）
 * + r393 补腿（腿③析取对立归责 / 腿④结果归因排除）
 *
 * 轮次背景：r392 落地第 266 维度（disjunctive_syllogism_fallacy，引擎接线 +
 * VERSION 6.8.194 bump + 文档同步）后会话中断未 commit，r393 开轮 sync 时
 * 以 stash 形式恢复 WIP。按容错条款「本地独有产能优先固化」核实后继续：
 *   · r392 模块自测暴露 2 条漏判——A4「要么接受这个方案，要么就是跟团队过不去」
 *     （D1 命中但缺显式否定支：析取框架自身构成隐式对立归责）与
 *     A7「方案没成功，说明执行的人能力不行」（无析取词无排除动词，纯结果
 *     失败反推单支归因）。
 *   · r393 立项探针 scripts/round-393/probe-legs34.js：腿③ 4/4 命中、
 *     腿④初版 0/6（BLAME_INFER_ZH 正则缺陷）→ 修正后 6/6，良性合计 0 误伤。
 * 判定：真升级②（既有维度补腿——新判别腿/句式族，红队漏判实证 A4/A7）。
 *
 * 四层验证（同 r386/r388/r389/r392 范式）：
 *   1. 模块级 detect 直接调用（全腿 + 豁免 + 守卫）
 *   2. gate 层 mainGate.gate 归因（findings 带 disjunctive_syllogism_fallacy）
 *   3. 负例注入-删条（双腿/双豁免/双腿守卫承重证明）
 *   4. 良性样本 gate 层零误伤（新腿引入后无增量误伤）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const mainGate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = mainGate.gate || mainGate.check;
const mod = require(path.join(ROOT, 'src', 'disjunctive-fallacy.js'));

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`ok ${pass} - ${label}`); }
  else { fail++; console.log(`NOT ok - ${label}`); }
}
function section(name) { console.log(`\n# ${name}`); }

// ─── A. 攻击样本：模块层全腿命中 ───────────────────────────
section('A. 模块层攻击样本（全腿命中）');
const attacks = [
  // 腿①+②（r392 既有）：析取框架 × 否定支×推出支
  ['你要么支持这个政策，要么你就是不爱国', '立场二分排除'],
  ['你不认同公司的决定，那你就是想跳槽了', '身份排除'],
  ['这不是我造成的，那就是你的责任', '责任排除'],
  ['既然不是方案的问题，那只能是执行的人能力不行', '归因排除'],
  ['他不是在质疑这个决定，他就是想借此机会搅乱整个团队', '动机排除'],
  // EN 分支
  ['Either you agree with the plan or you are against progress', 'EN 立场排除'],
  ['If it is not a supply issue, then it must be a demand issue', 'EN 条件排除'],
  ['Since the bug is not in the frontend, it has to be in the backend', 'EN 归因排除'],
  ['Ruling out negligence, the cause must be sabotage', 'EN ruled-out 排除'],
  // 腿③（r393 新增）：析取对立归责（无显式否定词）
  ['要么接受这个方案，要么就是跟团队过不去', '腿③隐式排除'],
  ['你要么同意这个决定，要么就是不在乎公司利益', '腿③利益归责'],
  ['或者按我说的做，或者就是存心搞砸项目', '腿③动机归责'],
  // 腿④（r393 新增）：结果归因排除（无析取词无排除动词）
  ['方案没成功，说明执行的人能力不行', '腿④能力归因'],
  ['项目失败了，说明市场根本不需要这个产品', '腿④市场归因'],
  ['谈崩了，说明对方根本没有诚意', '腿④诚意归因'],
  ['实验没出结果，说明这个方向本身是错的', '腿④方向归因'],
  ['这个季度没达标，说明团队执行力有问题', '腿④执行力归因'],
  ['谈判没谈成，说明我们价格定得太高', '腿④价格归因'],
];
for (const [t, label] of attacks) {
  const r = mod.detect(t);
  ok(r.hit === true && r.family === 'disjunctive_fallacy', `攻击命中：${label} :: ${t.slice(0, 24)}`);
}

// ─── B. 腿③/腿④ 常量级验证（r393 新腿的判据腿可独立复现）─────
section('B. r393 新腿常量级验证');
ok(mod.DISJ_BLAME_ZH.test('要么接受这个方案，要么就是跟团队过不去'), 'DISJ_BLAME_ZH 腿③命中');
ok(mod.RESULT_FAIL_ZH.test('方案没成功') && mod.BLAME_INFER_ZH.test('方案没成功，说明执行的人能力不行'),
  'RESULT_FAIL_ZH × BLAME_INFER_ZH 腿④双腿交叉');

// ─── C. 豁免样本：事实穷尽 / 程序性 / 概念教学 ─────────────
section('C. 豁免样本（不判）');
const exempt = [
  ['开关只有开和关两种状态', '事实二元'],
  ['排期只有今天发布或者等下周三窗口两个选项', '排期二元'],
  ['只能左转或者右转', '道路二元'],
  ['布尔值只能是 0 或 1', '布尔二元'],
  ['The function accepts either a string or a number', 'EN 类型列举'],
  ['This is the misconception of false disjunctive syllogism', 'EN 概念教学'],
];
for (const [t, label] of exempt) {
  const r = mod.detect(t);
  ok(r.hit === false, `豁免：${label} :: ${t.slice(0, 24)}`);
}

// ─── D. 良性样本：模块层零误伤 ─────────────────────────────
section('D. 良性样本（模块层零误伤）');
const benignMod = [
  ['你要么接受调解，要么就走法律程序，这是两条可选路径', '可选项并列'],
  ['要么今天发布，要么等下周三窗口，两个选项都可以', '排期并列'],
  ['这不是我造成的，可能是第三方因素', '对冲否定'],
  ['目前还不能确定是哪种原因，需要进一步排查', '待排查'],
  ['失败的原因可能是资金、团队或者市场环境，需要逐一验证', '多因并列'],
  ['方案没成功，可能是多方面的原因，需要逐一排查', '腿④对冲'],
  ['项目失败了，资金、团队和市场环境都有责任', '腿④多因并列'],
  ['实验没出结果，我们还得看看是不是设备校准的问题', '腿④待排查'],
  ['这个季度没达标，有客观环境的影响，也有策略需要调整的地方', '腿④双因素'],
  ['谈判没谈成，双方都需要再考虑一下', '腿④中性陈述'],
];
for (const [t, label] of benignMod) {
  const r = mod.detect(t);
  ok(r.hit === false, `良性零误伤：${label} :: ${t.slice(0, 24)}`);
}

// ─── E. gate 层归因：findings 带维度名 ─────────────────────
section('E. gate 层归因（verify 级 + findings 维度名）');
let gateHit = 0;
for (const [t, label] of attacks) {
  const r = gcheck(t);
  const dims = (r.findings || []).map((f) => f.dimension);
  if (dims.includes('disjunctive_syllogism_fallacy')) gateHit++;
}
ok(gateHit >= 10, `gate 层归因（新腿至少 10 条 findings 带维度名，实测 ${gateHit}/${attacks.length}）`);
// gate action 必须为非 pass（verify 级）
let nonPass = 0;
for (const [t] of attacks) {
  const r = gcheck(t);
  if (r.gate && r.gate.action !== 'pass') nonPass++;
}
ok(nonPass === attacks.length, `gate 层全部攻击样本非 pass（实测 ${nonPass}/${attacks.length}）`);

// ─── F. 负例注入-删条：删掉双腿即穿透（承重证明）────────────
section('F. 负例注入-删条（双腿承重证明）');
// F1：腿③删「就是」收尾确证词 → 回到纯并列，模块层转 miss
const f1 = mod.detect('要么接受这个方案，要么跟团队过不去，这两条路都可以选');
ok(f1.hit === false, '腿③删条：去掉「就是」确证收尾后转 miss（纯并列）');
// F2：腿④删归因推出锚（说明/表明/意味着 + 责任对象）→ 转 miss
const f2 = mod.detect('方案没成功，原因是多方面的');
ok(f2.hit === false, '腿④删条：去掉单支归因推出后转 miss');
// F3：腿④删结果失败锚 → 转 miss
const f3 = mod.detect('大家要说明执行的人能力不行，这需要证据');
ok(f3.hit === false, '腿④删条：去掉结果失败锚后转 miss');
// F4：守卫——推出支显式对冲
const f4 = mod.detect('既然不是方案的问题，那未必是执行的人能力不行');
ok(f4.hit === false, '守卫：推出支显式对冲（未必是）不判');
// F5：守卫——对冲短语共现（讨论谬误本身）
const f5 = mod.detect('不支持就是反对，这是一种误解');
ok(f5.hit === false, '守卫：对冲短语共现（讨论谬误本身）不判');

// ─── G. 良性样本：gate 层零误伤 ────────────────────────────
section('G. 良性样本 gate 层检查');
const benignGate = [
  '你要么接受调解，要么就走法律程序，这是两条可选路径',
  '要么今天发布，要么等下周三窗口，两个选项都可以',
  '这不是我造成的，可能是第三方因素',
  '失败的原因可能是资金、团队或者市场环境，需要逐一验证',
  '方案没成功，可能是多方面的原因，需要逐一排查',
  '实验没出结果，我们还得看看是不是设备校准的问题',
  '开关只有开和关两种状态',
  'The function accepts either a string or a number',
];
let benignPass = 0;
const benignNonPass = [];
for (const t of benignGate) {
  const r = gcheck(t);
  if (r.gate && r.gate.action === 'pass') benignPass++;
  else benignNonPass.push(`${r.gate.action}:${(r.findings || []).map((f) => f.dimension).join(',')} :: ${t.slice(0, 20)}`);
}
ok(benignPass >= 7, `良性 gate 层 pass（实测 ${benignPass}/${benignGate.length}，非 pass 项须归因既有维度）`);
benignNonPass.forEach((s) => console.log(`  [benign-nonpass] ${s}`));

// ─── H. 接线完整性：index.js dimMap + allDims 双接 ──────────
section('H. 接线完整性');
const idxSrc = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
ok(idxSrc.includes('disjunctive_syllogism_fallacy: dsf'), 'index.js dimMap 已接 disjunctive_syllogism_fallacy');
ok(/name:'disjunctive_syllogism_fallacy'/.test(idxSrc), 'index.js allDims 已接 disjunctive_syllogism_fallacy');
ok(/require\('\.\/disjunctive-fallacy\.js'\)/.test(idxSrc), 'index.js require 接线存在');

// ─── 汇总 ──────────────────────────────────────────────────
console.log(`\n# 汇总: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.log('FAIL');
  process.exit(1);
} else {
  console.log('PASS');
  process.exit(0);
}
