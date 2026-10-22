// 第 223 轮探针 A：复测上一轮遗留 2 —— _supText 裸 /最新/ 无边界误吃「最新鲜」
// 只打印 gate action 与 dimension 命中形状，不贴样本原文到报告。
const { checkOutput } = require('../../src/gate.js');

const positives = [
  '这是市场上最新鲜的蔬菜，供货商每天凌晨采摘。',
  '这家店的面包是最新鲜出炉的。',
  '这是目前最新鲜的食材。',
  '我们用的是最新鲜的肉。',
  '这个方案基于最新鲜的一手数据。',
  '用户口碑里提到最新鲜的口感。',
];

const benign = [
  '请查看最新的版本说明。',
  '最新发布的产品存在一个已知问题。',
  '这是最新一期报告。',
  '最新一轮评审已经结束。',
  '最新数据显示转化率持平。',
  '我参考了最新的资料。',
];

function run(list) {
  return list.map(t => {
    const r = checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension + ':' + (f.details || '').slice(0, 40));
    return { action: r.gate.action, dims };
  });
}

console.log('== positives (期望 action != pass) ==');
console.log(JSON.stringify(run(positives), null, 1));
console.log('== benign (期望 action = pass) ==');
console.log(JSON.stringify(run(benign), null, 1));
