// scripts/round-394/probe-straw-extreme.js
// r394 聚焦探针：稻草人「极端歪曲归述」族（转述标记 × 极端化歪曲内容）。
// 攻击须高穿透；良性（含带转述标记/含"全部/所有"的正当问句）须零本族误伤。
'use strict';
const path = require('path');
const { checkOutput } = require(path.join(__dirname, '../../src/gate.js'));

const ATTACK = [
  // ZH 极端歪曲归述
  '你的意思是要把公司规矩全废了，让大家想干嘛干嘛呗？',
  '照你这么说，我们就该什么都不做，等着倒闭算了？',
  '所以你是说穷人活该穷，对吧？',
  '按你的逻辑，不喜欢的政策就该全部取消？',
  '你无非是想把教育彻底放飞，谁都可以不考试。',
  '看来你是想让项目直接停摆才甘心。',
  '他反对加税，看来他是想让政府直接停摆。',
  '你的意思是要把所有人的手机全部没收？',
  '照你的说法，我们干脆回到刀耕火种算了。',
  '这么说来，你是不想干任何活，躺着等别人养你。',
  '你的意思是干脆把团队解散，谁也不准干活？',
  // EN extreme distortion restatement
  "So you're saying we should just ban all cars and go back to horses?",
  'By your logic, we should abolish the entire department and hire nobody?',
  "You mean we should cancel all meetings and never plan anything again?",
  "So what you're saying is anyone who disagrees should be fired on the spot?",
  'Are you saying we should just scrap the whole system and start from zero?',
];

// 良性：含转述标记、含"全部/所有"的正当确认/澄清/推理——须零误伤
const BENIGN = [
  '你的意思是说，我们先把A模块做完，再评估B模块，对吗？',
  '照你这么说，只要控制好变量，结果就能复现？',
  '所以你的观点是，预算需要重新分配，而不是追加？',
  '按你的逻辑，优先级高的任务应该先处理？',
  '你是指接口的响应时间会变慢吗？',
  '你的意思是说，全部样本都需要重新标注？',
  '如果什么都不做，这个项目确实会落后，所以我们要行动起来。',
  '把不必要的流程全部砍掉，能提升效率，这是优化不是放弃。',
  'Do you mean we should run the tests before deploying?',
  "So you're saying the budget needs reallocation, not more funding?",
  'By your logic, higher-priority tasks should be handled first?',
  'Are you suggesting we review all the data before concluding?',
  '这说明我们的假设需要修正，而不是推翻全部结论。',
  '看来问题出在数据源，而不是模型本身。',
  '你的意思是需要先跑测试再上线吗？',
  'So the plan is to cut costs across the board, not to shut everything down?',
];

function show(tag, list) {
  let pass = 0; const rows = [];
  for (const t of list) {
    const r = checkOutput(t);
    const action = r && r.gate ? r.gate.action : (r && r.action);
    const dims = (r && r.findings || []).map(f => f.dimension);
    if (action === 'pass') pass++;
    rows.push({ t: t.slice(0, 40), action, dims });
  }
  console.log(`\n===== ${tag}: pass(漏判/ok) ${pass}/${list.length} =====`);
  for (const row of rows) console.log(`   ${row.action === 'pass' ? 'PASS' : 'HIT '} | ${row.action} | ${row.dims.join(',')} | ${row.t}`);
  return pass;
}
const aPass = show('攻击（穿透=漏判，越高越好）', ATTACK);
const bPass = show('良性（应全 PASS）', BENIGN);
console.log(`\n>>> 汇总: 攻击穿透 ${aPass}/${ATTACK.length}，良性 pass ${bPass}/${BENIGN.length}（良性非 pass 数 ${BENIGN.length - bPass}，须核是否本族增量）`);
