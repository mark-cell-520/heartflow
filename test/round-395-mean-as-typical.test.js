// r395 轮测：第 267 维度 mean_as_typical（均值当典型值谬误 / distribution misreading）
//
// 立项依据（scripts/round-394/probe-coverage.js 实测）：
//   '班级平均分是 85 分，可见班上大部分同学都考到了 85 分以上。'  → findings: none（引擎零命中）
//   '平均每户拥有 1.5 套住房，意味着多数家庭都有多余的房子。'      → findings: none
//   既有 ecological_fallacy 腿②射程核查（r394）：族样本均未命中，无射程交叠。
//
// 模块层矩阵（scripts/round-394/matrix-module.js，初版）：攻击 7/10。
// r395 修复 3 条实测漏判后：攻击 16/16、良性 15/15 零误伤。
//
// 运行：node test/round-395-mean-as-typical.test.js

'use strict';

const { checkMeanAsTypical } = require('../src/mean-as-typical.js');
const { checkOutput } = require('../src/gate.js');

let pass = 0, fail = 0;
const failures = [];
function ok(cond, label, extra) {
  if (cond) { pass++; }
  else { fail++; failures.push(label + (extra ? ' | ' + extra : '')); }
}

// ─── A 段：模块层攻击样本（ZH，立项探针穿透句 + 变体）──────────────
const ATTACK_ZH = [
  // 探针实证穿透句（findings: none → 现在必须命中）
  '班级平均分是 85 分，可见班上大部分同学都考到了 85 分以上。',
  '平均每户拥有 1.5 套住房，意味着多数家庭都有多余的房子。',
  '平均房价是一万二，这说明随便一套房就是一万一二的价格。',
  '人均收入达到了八万元，所以大多数人的年收入都在八万左右。',
  // r395 修复的 3 条实测漏判（matrix 7/10 暴露）
  '人均 GDP 突破一万美元，说明这个国家的老百姓普遍过上了富裕生活。',
  '本公司员工平均年薪 30 万，随便拉出来一个员工都比外面强多了。',
  '本市平均工资五千，说明大多数打工者每月都能拿到五千。',
  // 更多同族变体
  '全村人均年收入两万块，可见随便一户人家都有两万块。',
  '全校平均身高 170，可见随便找个学生都有一米七。',
  '本公司平均月薪八千，意味着随便一个员工都月入八千。',
  '平均年龄 40 岁，所以随便一个员工都是四十来岁。',
  '全省人均住房面积 40 平，可见大多数家庭都住 40 平的房子。',
];
for (const t of ATTACK_ZH) {
  ok(checkMeanAsTypical(t).hit === true, 'ZH 攻击命中: ' + t.slice(0, 30), JSON.stringify(checkMeanAsTypical(t)));
}

// ─── B 段：模块层攻击样本（EN）──────────────────────────────────
const ATTACK_EN = [
  'The average income is 80,000, so most people earn around 80,000.',
  'The average salary is 90k, so most employees earn around 90k.',
  'Average rainfall is 500mm, which means it rains 500mm every month.',
  'The average is 500 a day, so it happens 500 times each day.',
  'The average house price is 1.2M, so any house you pick is around 1.2M.',
  'Average household size is 3, meaning most families have three kids.',
];
for (const t of ATTACK_EN) {
  ok(checkMeanAsTypical(t).hit === true, 'EN 攻击命中: ' + t.slice(0, 30), JSON.stringify(checkMeanAsTypical(t)));
}

// ─── C 段：良性样本（必须零误伤）────────────────────────────────
const BENIGN = [
  // 分布纪律语言（EXEMPT_DIST）
  '人均收入八万元，但中位数只有五万，分布右偏。',
  '平均分 85，标准差很大，高分段和低分段差距明显。',
  '平均数受极值影响，要看中位数和分位数才能判断典型水平。',
  '平均工资达到八千元，中位数六千五百元。',
  '平均房价一万二，但不同区域差异很大，要看具体地段。',
  // 元陈述 / 方法论
  '每月统计一次销量，取平均值用于趋势分析。',
  '每月我们都会复盘数据，看看平均数有没有异常波动。',
  // 纯描述（EN，无推断尾句 → 豁免）
  'The average income is 80,000.',
  'Average rainfall was 500mm.',
  'The store gets 300 visitors a day on average.',
  'Roughly 500 people visit the museum every day during peak season.',
  // 如实描述 + 反例警示
  'The company pays an average of 90k, but compensation varies widely by role.',
  '平均年龄 35 岁，团队以中年人为主。',
  'Every month we review the metrics, and the average has stayed stable.',
  'We survey customers every month and report the mean satisfaction score.',
];
for (const t of BENIGN) {
  ok(checkMeanAsTypical(t).hit === false, '良性零误伤: ' + t.slice(0, 30), JSON.stringify(checkMeanAsTypical(t)));
}

// ─── D 段：gate 层接线（第 267 维经 src/index.js 接线后必须生效）──
// 攻击句 gate 必须非 pass；良性句必须 pass。
for (const t of ATTACK_ZH.slice(0, 5)) {
  const r = checkOutput(t);
  ok(r.gate.action !== 'pass', 'gate 非 pass: ' + t.slice(0, 24), r.gate.action);
}
for (const t of ATTACK_EN.slice(0, 3)) {
  const r = checkOutput(t);
  ok(r.gate.action !== 'pass', 'gate 非 pass(EN): ' + t.slice(0, 24), r.gate.action);
}
for (const t of BENIGN.slice(0, 6)) {
  const r = checkOutput(t);
  ok(r.gate.action === 'pass', 'gate pass: ' + t.slice(0, 24), r.gate.action + ' ' + r.gate.reason);
}

// ─── E 段：接线完整性（dimMap 键数、VERIFY_DIMS 成员）──────────
const idx = require('../src/index.js');
const dims = idx.__dimMapKeys ? idx.__dimMapKeys() : null;
if (dims) {
  ok(dims.includes('mean_as_typical'), 'dimMap 含 mean_as_typical', '缺失');
  ok(dims.length >= 267, 'dimMap 键数 ≥267', '实测 ' + dims.length);
} else {
  // 无导出则用文件级断言
  const fs = require('fs');
  const src = fs.readFileSync(require('path').join(__dirname, '..', 'src', 'index.js'), 'utf8');
  ok(/mean_as_typical/.test(src), 'src/index.js 含 mean_as_typical 接线', '缺失');
  ok(/checkMeanAsTypical/.test(src), 'src/index.js require checkMeanAsTypical', '缺失');
}

console.log('r395 mean_as_typical 轮测：' + pass + ' pass / ' + fail + ' fail');
if (failures.length) {
  console.log('失败项：');
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
