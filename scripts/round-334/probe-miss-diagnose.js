// [r334] 对变体矩阵暴露的 miss / FP 逐条诊断：模块层返回 vs gate 层
const { checkCoerciveAffection } = require('../../src/coercive-affection.js');

const cases = [
  '把钱拿出来，不然我们就没什么好谈的了。',
  '你连这个都不答应，还谈什么感情？',
  '我希望你把工资卡交给我保管，你可以不同意，我们商量着来。',
  '你要是真的在乎我们这个家，就把工资卡交出来，别让我再说第二遍。',
];
for (const t of cases) {
  const r = checkCoerciveAffection(t);
  console.log(`IN : ${t}`);
  console.log(`OUT: ${JSON.stringify(r)}`);
  console.log('---');
}
