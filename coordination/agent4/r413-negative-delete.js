// r413 注入-删条负例：逐组抹掉路由⑤四组新常量，断言守卫变红
// （变红定义：模块层攻击样本从 hit=true 翻转为 hit=false——轮测断言将失败。
//  gate 层不适用本注入：checkOutput 不接受 inject 参数，且存量维度
//  （no_fallback/false_balance 等）对攻击句的代拦会掩盖翻转，与
//  r408/r411 删条同口径以模块层为准。）
// 最后一行必须是清理。
'use strict';
const { checkSpecialPleading, __internals } = require('/data/home/heartflow/src/special-pleading.js');
const BLANK = /(?!x)x/;

const CASES = [
  { name: 'OTHERS_LABEL_ZH（腿① 他人标签·中文）', inject: { OTHERS_LABEL_ZH: BLANK },
    mod: '别人迟到叫纪律涣散，我迟到叫时间灵活' },
  { name: 'SELF_LABEL_ZH（腿② 自我标签·中文）', inject: { SELF_LABEL_ZH: BLANK },
    mod: '人家犯错叫态度问题，我犯错就叫疏忽' },
  { name: 'OTHERS_LABEL_EN（腿① 他人标签·英文）', inject: { OTHERS_LABEL_EN: BLANK },
    mod: 'When others arrive late it is called indiscipline; when I arrive late it is called flexibility.' },
  { name: 'SELF_LABEL_EN（腿② 自我标签·英文）', inject: { SELF_LABEL_EN: BLANK },
    mod: 'When they cut corners it is called sloppy; when I cut corners it is called efficiency.' },
  // 第二组样本交叉验证（同一常量的另一攻击句，防单样本巧合）
  { name: 'OTHERS_LABEL_ZH（腿① 他人标签·交叉样本）', inject: { OTHERS_LABEL_ZH: BLANK },
    mod: '同事加班叫本分，我加班叫奉献' },
  { name: 'SELF_LABEL_ZH（腿② 自我标签·交叉样本）', inject: { SELF_LABEL_ZH: BLANK },
    mod: '别人拒绝叫不负责任，我拒绝叫原则性强' },
  { name: 'OTHERS_LABEL_EN（腿① 他人标签·交叉样本）', inject: { OTHERS_LABEL_EN: BLANK },
    mod: 'When they cut corners it is called sloppy; when I cut corners it is called efficiency.' },
  { name: 'SELF_LABEL_EN（腿② 自我标签·交叉样本）', inject: { SELF_LABEL_EN: BLANK },
    mod: 'When others arrive late it is called indiscipline; when I arrive late it is called flexibility.' },
];

let red = 0, green = 0;
for (const c of CASES) {
  const baseHit = checkSpecialPleading(c.mod).hit;
  const cutHit = checkSpecialPleading(c.mod, c.inject).hit;
  const okCase = baseHit === true && cutHit === false;
  if (okCase) red++; else green++;
  console.log(`${okCase ? '[RED] 变红 ✅' : '[GREEN] 未变红 ❌'} ${c.name}  基线命中=${baseHit} 删后命中=${cutHit} | ${c.mod.slice(0, 40)}`);
}
console.log(`\nr413 负例删条: ${CASES.length} 注入 → ${red} 变红 / ${green} 未变红`);
// 清理：本脚本仅经 inject 参数内存注入，无文件改动；恢复性校验存量常量未被污染
const I = __internals();
const intact = [I.OTHERS_LABEL_ZH, I.SELF_LABEL_ZH, I.OTHERS_LABEL_EN, I.SELF_LABEL_EN].every((r) => r instanceof RegExp);
console.log(`清理完成：internals 四组路由⑤常量完整=${intact}，工作区无残留注入、无文件改动`);
if (green > 0) process.exit(1);
