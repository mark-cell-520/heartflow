// r445 单测：ecological_fallacy「具体个体属性直推」新句式族
// 真升级②：已有维度（第 211 维）的全新句式族——存量腿②只收量化指称
// （每个/人人/every individual）与带限定语指称，「具体个体指称 + 个体层
// 属性断言」整族漏判。r445-a/b 探针实证：平均工资/平均分/平均寿命三组
// ZH 攻击 + 两组 EN 攻击全部 pass 零命中。
// 新增腿族：
//   ZH F=16（连接词+所有格+断言）、F2=17（连接词+指称+数值）、
//      G=18（无连接词成员身份+断言）、G2=19（无连接词属性名词直推）、
//      G3=20（范围代词+都+结论）
//   EN F=12（连接词+具体指称+情状断言）、G=13（无连接词居住/成员动词+断言）
//   AGG_EN 补两条：expectancy/median age 等均值量 + 具体群体形
const assert = require('assert');
const { checkEcologicalFallacy } = require('../src/ecological-fallacy.js');
const { gate } = require('../src/gate.js');

// ── 一、模块层：新腿族逐族承重（每条腿至少一个专属攻击）──────────
const legCases = [
  // F 族：连接词 + 所有格 + 断言副词
  ['F', '这家公司的员工平均工资三万，所以他的月薪肯定三万。'],
  ['F', '该省人均预期寿命78岁，因此她的寿命至少也有78岁。'],
  // F2 族：连接词 + 指称 + 数值尾部
  ['F2', '该团队平均分90分，所以他的得分肯定也在90分左右。'],
  // G 族：无连接词成员身份 + 断言（161 轮纪律：裸名词形）
  ['G', '这家公司的员工平均工资三万，他在这公司上班，月薪肯定三万。'],
  ['G', '这个区平均寿命85岁，他住在这个区，至少能活85。'],
  // G2 族：无连接词属性名词直推
  ['G2', '该班平均分90，他在这个班，分数肯定也高。'],
  // G3 族：范围代词 + 都 + 结论
  ['G3', '全国人均可支配收入三万，他在全国哪儿挣钱都差不多这个数。'],
  // EN F 族
  ['EN-F', 'The average salary at this company is 30k, so he earns about that much.'],
  // EN G 族
  ['EN-G', 'He works at this company where the average salary is 30k, and he earns roughly that.'],
];
for (const [leg, text] of legCases) {
  const r = checkEcologicalFallacy(text);
  assert.strictEqual(r.hit, true, `腿族 ${leg} 未命中: ${text}`);
}

// ── 二、负例注入：良性样本必须不命中（含边缘良性）─────────────────
const negatives = [
  // 个体值明确偏离均值（正确陈述，不是谬误）
  '这家公司的员工平均工资三万，但他本人月薪只有八千。',
  // 均值 + 差异承认
  '该区平均寿命85岁，但个体差异很大，不能直接套到个人头上。',
  // 概念/教学转述
  '区群谬误就是把群体统计特征直接套用到个体。',
  // 无统计量（腿①缺位）
  '他在这家公司上班，月薪三万。',
  // 纯统计陈述（腿②缺位）
  '这家公司的员工平均工资三万。',
  // EN 对冲
  'The average salary here is 30k, but his own pay is much lower.',
  // EN 纯统计
  'The average salary at this company is 30k.',
];
for (const text of negatives) {
  const r = checkEcologicalFallacy(text);
  assert.strictEqual(r.hit, false, `良性样本误判命中: ${text}`);
}

// ── 三、gate 层端到端：攻击非 pass、良性 pass ────────────────────
const gateAttacks = [
  '这家公司的员工平均工资三万，所以他的月薪肯定三万。',
  '这个区平均寿命85岁，他住在这个区，至少能活85。',
  'The average salary at this company is 30k, so he earns about that much.',
  'Life expectancy in this county is 85, so he will live at least that long.',
];
for (const text of gateAttacks) {
  const r = gate(text);
  assert.notStrictEqual(r.gate.action, 'pass', `gate 未拦截: ${text}`);
  assert.ok(
    (r.findings || []).some(f => f.dimension === 'ecological_fallacy'),
    `gate 未归因 ecological_fallacy: ${text}`
  );
}
const gateBenign = [
  '这家公司的员工平均工资三万，但他本人月薪只有八千。',
  '该区平均寿命85岁，但个体差异很大。',
  '他在这家公司上班，月薪三万。',
  'The average salary here is 30k, but his own pay is much lower.',
];
for (const text of gateBenign) {
  const r = gate(text);
  assert.strictEqual(r.gate.action, 'pass', `良性样本被误拦: ${text} -> ${r.gate.action}`);
}

// ── 四、存量族回归：老腿族不因新腿族插入而失效 ───────────────────
const legacy = [
  '这个国家的平均收入很高，所以每个人都是富人。',
  'Neighborhoods with high unemployment have high crime, therefore each person there is a criminal.',
];
for (const text of legacy) {
  const r = checkEcologicalFallacy(text);
  assert.strictEqual(r.hit, true, `存量腿族回归失败: ${text}`);
}

console.log('round-445-ecological-fallacy-individual-family: 全部通过');
