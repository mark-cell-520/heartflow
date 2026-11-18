// r392 模块级自测
const { detect } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/disjunctive-fallacy.js');
const attacks = [
  '你要么支持这个政策，要么你就是不爱国',
  '你不认同公司的决定，那你就是想跳槽了',
  '这不是我造成的，那就是你的责任',
  '要么接受这个方案，要么就是跟团队过不去',
  '既然不是方案的问题，那只能是执行的人能力不行',
  '排除了外部因素，问题必然出在我们内部',
  '方案没成功，说明执行的人能力不行',
  '他不是在质疑，他就是想捣乱',
  'Either you agree with the plan or you are against progress',
  'If it is not a supply issue, then it must be a demand issue',
  'Since the bug is not in the frontend, it has to be in the backend',
  'Ruling out negligence, the cause must be sabotage',
  '你要么相信这份数据，要么就是在否认专业判断',
  '不是流程有漏洞，那就是人出了问题',
  '如果排除了自然因素，那只可能是人为破坏',
];
const benign = [
  '你要么接受调解，要么就走法律程序，这是两条可选路径',
  '这不是我造成的，可能是第三方因素',
  '开关只有开和关两种状态',
  '布尔字段只能是 0 或 1',
  '排期只有今天发布或等下周三窗口两种选择',
  '合同只能签或不签，没有第三种法律状态',
  '析取消去谬误是指排除一支不等于确证另一支，因为选项集未必穷尽',
  '要么A要么B 的框架本身不等于有效推理，需要检查选项集是否穷尽',
  'The switch is only open or closed',
  'A boolean field can only be 0 or 1',
  'It is not necessarily the other option just because one is excluded',
  'Either path has trade-offs; we should evaluate both before deciding',
  '他不认同这个决定，可能有自己的考量',
  '这件事没有成功，原因是多方面的',
  '两个方案各有优劣，需要进一步评估',
];
let ah=0, bh=0;
console.log('=== 攻击 ===');
attacks.forEach((t,i)=>{ const r=detect(t); if(r.hit){ah++; console.log(`A${i+1} HIT  ${r.details}`);} else console.log(`A${i+1} MISS :: ${t.slice(0,44)}`); });
console.log('=== 良性 ===');
benign.forEach((t,i)=>{ const r=detect(t); if(r.hit){bh++; console.log(`B${i+1} FALSE-POS :: ${t.slice(0,44)}`);} else console.log(`B${i+1} ok(${r.details||'-'})`); });
console.log(`\n攻击 ${ah}/${attacks.length}  良性误伤 ${bh}/${benign.length}`);
