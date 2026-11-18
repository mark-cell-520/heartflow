/**
 * test/round-393-disjunctive-fallacy.test.js
 * r393 轮单测：第 65 维 false_dilemma 新增「析取消去谬误」措辞家族
 * （非穷尽析取 × 排除确证，推理层补腿）
 *
 * 轮次背景（r393 接手轮，如实记录）：
 *   r392 掉线 WIP 被远端以 188954e 固化——但该 commit 只提交了
 *   src/disjunctive-fallacy.js + 轮测 + 探针脚本，commit message 声称的
 *   「dimMap 265→266 / src/index.js 八处接线 / VERSION 6.8.194 /
 *   四门禁全绿」均不在 diff 内（overclaim）。r393 sync 后核实：
 *     · 立项探针 scripts/round-393/probe-takeover.js（合并树 188954e）：
 *       18 条攻击 gate 层 **14/18 穿透**，良性 1/12 非 pass
 *       （contradiction 存量基线）——缺口为真，值得落地。
 *     · 但新 dimMap 键须改 src/index.js（1 号独占接线区，agent-4 红线
 *       不碰），故**重定 scope**：以「既有第 65 维 false_dilemma 新增
 *       措辞家族」形式接入（真升级②）——src/false-dilemma.js 路由⑩
 *       调用 src/disjunctive-fallacy.js detect()，union 语义。
 *   r392 自测暴露的 2 条漏判由 r393 腿③/腿④ 承接（A4 隐式对立归责 /
 *   A7 结果归因排除，探针 scripts/round-393/probe-legs34.js：腿③ 4/4、
 *   腿④修正后 6/6、良性 0 误伤）。
 *
 * 判定：真升级②（既有维度全新措辞家族——红队漏判实证 A4/A7 + gate 层
 * 14/18 穿透）。
 *
 * 验证层次：
 *   1. 模块级 detect 直接调用（全腿 + 豁免 + 守卫）
 *   2. checkFalseDilemma 层归属（R.DSF 全删 → 新族承重样本转 miss）
 *   3. gate 层 mainGate.gate 归因（findings 带 false_dilemma、action 非 pass）
 *   4. 负例注入-删条（句子级 + 常量级两级）
 *   5. 良性样本 gate 层零增量误伤
 */
'use strict';

const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const mainGate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = mainGate.gate || mainGate.check;
const mod = require(path.join(ROOT, 'src', 'disjunctive-fallacy.js'));
const { checkFalseDilemma } = require(path.join(ROOT, 'src', 'false-dilemma.js'));

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
  ['既然不是他造成的，那说明是管理问题', '长形归因排除（紧凑腿不覆盖形）'],
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

// ─── B. 腿③/腿④ 常量级验证（r393 新腿的判据腿可独立复现）──────
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
  ['选言推理的有效形式说明：排除一支，另一支就是确证的', 'ZH 概念教学（推理+有效）'],
  ['Disjunctive logic: if not A then it must be B', 'EN 概念教学（disjunctive logic）'],
  ['布尔字段只能取0或1，不是0就是1，没有第三种取值', 'ZH 程序性二元（字段+0/1）'],
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

// ─── E. gate 层归因：findings 带 false_dilemma + action 非 pass ──
section('E. gate 层归因（verify/rewrite 级 + findings 维度名）');
let gateFd = 0;
for (const [t] of attacks) {
  const r = gcheck(t);
  const dims = (r.findings || []).map((f) => f.dimension);
  if (dims.includes('false_dilemma')) gateFd++;
}
ok(gateFd === attacks.length, `gate 层全部攻击样本 findings 带 false_dilemma（实测 ${gateFd}/${attacks.length}）`);
let nonPass = 0;
for (const [t] of attacks) {
  const r = gcheck(t);
  if (r.gate && r.gate.action !== 'pass') nonPass++;
}
ok(nonPass === attacks.length, `gate 层全部攻击样本非 pass（实测 ${nonPass}/${attacks.length}）`);

// ─── F. 负例注入-删条（句子级）：删掉句中模式即转 miss ───────
section('F. 负例注入-删条·句子级（承重证明）');
const f1 = mod.detect('要么接受这个方案，要么跟团队过不去，这两条路都可以选');
ok(f1.hit === false, '腿③删条：去掉「就是」确证收尾后转 miss（纯并列）');
const f2 = mod.detect('方案没成功，原因是多方面的');
ok(f2.hit === false, '腿④删条：去掉单支归因推出后转 miss');
const f3 = mod.detect('大家要说明执行的人能力不行，这需要证据');
ok(f3.hit === false, '腿④删条：去掉结果失败锚后转 miss');
const f4 = mod.detect('既然不是方案的问题，那未必是执行的人能力不行');
ok(f4.hit === false, '守卫：推出支显式对冲（未必是）不判');
const f5 = mod.detect('不支持就是反对，这是一种误解');
ok(f5.hit === false, '守卫：对冲短语共现（讨论谬误本身）不判');

// ─── G. 常量级注入-删条：注入 /$^/ 替换整个模式 ─────────────
section('G. 负例注入-删条·常量级（detect(text, inject)）');
const injCases = [
  // 腿①②长形删条——用「造成」类动词样本（紧凑腿 NEGATE 形不覆盖，
  // 否则删 NEG/INFER 后紧凑腿兜底，union 语义下翻不掉）
  ['DISJ_ZH', '既然不是他造成的，那说明是管理问题', false],
  ['NEG_BRANCH_ZH', '既然不是他造成的，那说明是管理问题', false],
  ['INFER_BRANCH_ZH', '既然不是他造成的，那说明是管理问题', false],
  // 腿③/腿④/EN 删条
  ['DISJ_BLAME_ZH', '要么接受这个方案，要么就是跟团队过不去', false],
  ['RESULT_FAIL_ZH', '方案没成功，说明执行的人能力不行', false],
  ['BLAME_INFER_ZH', '方案没成功，说明执行的人能力不行', false],
  ['EXCLUDE_INFER_EN', 'If it is not a supply issue, then it must be a demand issue', false],
  // 豁免承重：删豁免常量 → 默认豁免样本转命中
  ['CONCEPT_ZH', '选言推理的有效形式说明：排除一支，另一支就是确证的', true],
  ['CONCEPT_EN', 'Disjunctive logic: if not A then it must be B', true],
  ['FACTUAL_ZH', '布尔字段只能取0或1，不是0就是1，没有第三种取值', true],
];
for (const [key, sample, expectHit] of injCases) {
  const inj = {}; inj[key] = /$^/;
  const r = mod.detect(sample, inj);
  ok(r.hit === expectHit, `注入删 ${key} → ${expectHit ? '转命中（豁免承重）' : '转 miss（腿承重）'} :: ${sample.slice(0, 20)}`);
}

// ─── H. 归属证明：checkFalseDilemma 层 R.DSF 全删 ───────────
section('H. 归属证明（checkFalseDilemma + R.DSF 全删 → 新族承重转 miss）');
const DELETE_ALL_DSF = {
  DSF: {
    DISJ_ZH: /$^/, DISJ_EN: /$^/, NEG_BRANCH_ZH: /$^/, INFER_BRANCH_ZH: /$^/,
    EXCLUDE_INFER_EN: /$^/, NEGATE_ZH: /$^/, DISJ_BLAME_ZH: /$^/,
    RESULT_FAIL_ZH: /$^/, BLAME_INFER_ZH: /$^/,
  },
};
let dsfCarried = 0;
for (const [t] of attacks) {
  const base = checkFalseDilemma(t);
  const del = checkFalseDilemma(t, DELETE_ALL_DSF);
  if (base.hit && !del.hit) dsfCarried++;
}
// 18/19 新族承重：唯一例外「要么接受这个方案，要么就是跟团队过不去」
// 由 false_dilemma 既有路由⑨a（要么-frame×贬损标签）兜底——union 先例。
ok(dsfCarried >= 18, `checkFalseDilemma 层新族承重 ≥18/19（实测 ${dsfCarried}/${attacks.length}，1 条既有路由兜底属 union 先例）`);

// ─── I. 良性样本：gate 层零增量误伤 ────────────────────────
section('I. 良性样本 gate 层检查');
const benignGate = [
  '你要么接受调解，要么就走法律程序，这是两条可选路径',
  '要么今天发布，要么等下周三窗口，两个选项都可以',
  '这不是我造成的，可能是第三方因素',
  '失败的原因可能是资金、团队或者市场环境，需要逐一验证',
  '方案没成功，可能是多方面的原因，需要逐一排查',
  '实验没出结果，我们还得看看是不是设备校准的问题',
  '开关只有开和关两种状态',
  'The function accepts either a string or a number',
  '选言推理的有效形式说明：排除一支，另一支就是确证的',
  'Disjunctive logic: if not A then it must be B',
  '布尔字段只能取0或1，不是0就是1，没有第三种取值',
];
let benignPass = 0;
const benignNonPass = [];
for (const t of benignGate) {
  const r = gcheck(t);
  if (r.gate && r.gate.action === 'pass') benignPass++;
  else benignNonPass.push(`${r.gate.action}:${(r.findings || []).map((f) => f.dimension).join(',')} :: ${t.slice(0, 20)}`);
}
ok(benignPass >= 10, `良性 gate 层 pass（实测 ${benignPass}/${benignGate.length}，非 pass 项须归因既有维度）`);
benignNonPass.forEach((s) => console.log(`  [benign-nonpass] ${s}`));

// ─── J. 接线完整性：false-dilemma.js 路由⑩ + scope 纪律 ─────
section('J. 接线完整性与 scope 纪律');
const fdSrc = require('fs').readFileSync(path.join(ROOT, 'src', 'false-dilemma.js'), 'utf8');
ok(fdSrc.includes("require('./disjunctive-fallacy.js')"), 'false-dilemma.js require 接线存在');
ok(/disjunctiveFallacy\.detect\(text, R\.DSF/.test(fdSrc), 'false-dilemma.js 路由⑩ detect 调用存在（R.DSF 命名空间）');
ok(checkFalseDilemma('方案没成功，说明执行的人能力不行').hit === true, '功能接线：checkFalseDilemma 对新族样本 hit');
ok(/析取消去/.test(checkFalseDilemma('方案没成功，说明执行的人能力不行').detail), '功能接线：detail 带「析取消去」家族标记');
// scope 纪律：src/index.js 零改动（新 dimMap 键须 1 号接线，agent-4 红线）
const idxSrc = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
ok(!idxSrc.includes('disjunctive_syllogism_fallacy'), 'scope 纪律：src/index.js 无新 dimMap 键（dimMap 键数不变）');
ok(!idxSrc.includes('disjunctive-fallacy'), 'scope 纪律：src/index.js 无本模块直接 require（经 false-dilemma.js 中转）');

// ─── 汇总 ──────────────────────────────────────────────────
console.log(`\n# 汇总: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.log('FAIL');
  process.exit(1);
} else {
  console.log('PASS');
  process.exit(0);
}
