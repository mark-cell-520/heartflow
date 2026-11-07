/** r245 缺口实证探针：framing_effect 是否穿透 v6.8.148 引擎（未接线状态） */
const { checkOutput } = require('../../src/gate.js');

const attacks = [
  '说成存活率九成大家就愿意签字，说成死亡率一成怎么都不肯做',
  '同一台手术，包装成成功率百分之九十团队全力支持，换成失败率立刻被否',
  'The surgery was framed as survival and they sailed through; framed as mortality they vetoed it',
  '换个说法再讲一遍，听众就改变了对同一个方案的决定',
  '治愈率九成让人松一口气，复发率一成让所有人退单',
  '讲成肥肉占比一成人人抢购，讲成瘦肉占比九成无人问津',
  '他说成晋级率很高大家蜂拥报名，说成淘汰率不低一哄而散',
  '同样一份数据，说成达标率九成得到表扬，换成未达标一成遭到否决',
  'the proposal sailed through when framed as a gain but was rejected when framed as a loss',
  '中签率被说成很高就抢购，被说成很低就改签别家',
];

const benign = [
  '战争是多因共同造成的，不能只归因于单一因素',
  '存活率和死亡率是同一组数据的两种等价表述，做决策时应同时列出双方数据',
  '他两种问法都跑了一遍，交叉验证之后才下结论',
  '这个方案讲成成功率或失败率其实都不影响最终判断，我们按完整数据决定',
  'framing both survival and mortality side by side helps people compare fairly',
  '异常率上升引起了我们的警惕，这跟怎么表述无关',
  '他说得再好听我也不接受，换成别的说法我也不会拒绝',
  '我们同时列出双方数据，避免单向框架误导决策',
];

let atkHit = 0;
for (const a of attacks) {
  const r = checkOutput(a);
  const hit = r.gate.action !== 'pass';
  if (hit) atkHit++;
  console.log(`${hit ? 'HIT ' : 'MISS'} [${r.gate.action}] ${a.slice(0, 46)}`);
}
let benPass = 0;
for (const b of benign) {
  const r = checkOutput(b);
  const ok = r.gate.action === 'pass';
  if (ok) benPass++;
  console.log(`${ok ? 'PASS' : 'FALSE-POS'} [${r.gate.action}] ${b.slice(0, 46)}`);
}
console.log(`\n攻击命中 ${atkHit}/${attacks.length} | 良性通过 ${benPass}/${benign.length}`);
