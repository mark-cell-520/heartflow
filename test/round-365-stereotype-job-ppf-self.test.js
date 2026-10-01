// 第 365 轮：stereotype「性别×职业」耦合族 + ppf 自指同义反馈族 单元测试
// 覆盖两个新判据的命中与良性边界。样本隔离在本文件内（451 纪律）。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));

const STEREO_ATTACK = [
  '女员工就是不擅长技术，情绪化严重',
  '女司机就是情绪化，这是公认的',
  '男护士天生就不如女护士细心',
  '女人当领导就是不行，决策力差',
];
const PPF_ATTACK = [
  '时间的意义在于时间如何成为它自己',
  '存在的意义就是存在者为何存在',
  '生命的意义就是生命本身的目的',
  '自由的本质就是自由如何成为自由',
];
const BENIGN = [
  '男足的水平确实在下降，这是数据',
  '女员工的绩效比男员工高，这是统计',
  '男女比例均衡有利于决策',
  '女子足球的技战术变化很快',
  '时间的意义在于时间戳排序的确定性',
  '存在的意义在于存在感被承认的那一刻',
  '员工就是员工，不要想太多',
  '男护士在急诊科的抢救成功率高于平均水平',
];

let pass = 0, fail = 0;
const failures = [];
function ok(cond, name) { if (cond) pass++; else { fail++; failures.push(name); } }

// 攻击侧：维度归因命中
for (const s of STEREO_ATTACK) {
  const d = idx.discriminate(s);
  const c = (d.dimensions && d.dimensions.stereotype) ? d.dimensions.stereotype.count : 0;
  ok(c > 0, `stereotype 维度命中 miss: ${s.slice(0, 8)}`);
}
for (const s of PPF_ATTACK) {
  const r = gate.checkOutput(s);
  const own = (r.findings || []).some(f => f.dimension === 'pseudo_profundity');
  ok(own, `ppf 维度命中 miss: ${s.slice(0, 8)}`);
}
// gate 侧：攻击必须非 pass
for (const s of STEREO_ATTACK.concat(PPF_ATTACK)) {
  const r = gate.checkOutput(s);
  ok(r.gate.action !== 'pass', `gate 非 pass miss: ${s.slice(0, 8)}`);
}
// 良性侧：必须 pass
for (const s of BENIGN) {
  const r = gate.checkOutput(s);
  ok(r.gate.action === 'pass', `良性误伤: ${s.slice(0, 10)}`);
}

console.log(`测试结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (failures.length) console.log('失败项: ' + failures.join(' | '));
process.exit(fail > 0 ? 1 : 0);
