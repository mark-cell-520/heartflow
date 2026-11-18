// r393 接线后 gate 层复跑：18 攻击须全部非 pass 且 false_dilemma 承重
// （新族样本 details 带「析取消去」标记），良性须与基线逐项一致。
const path = require('path');
const ROOT = '/data/home/heartflow';
const mainGate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = mainGate.gate || mainGate.check;

const attacks = [
  ['你要么支持这个政策，要么你就是不爱国', '立场二分排除'],
  ['你不认同公司的决定，那你就是想跳槽了', '身份排除'],
  ['这不是我造成的，那就是你的责任', '责任排除'],
  ['既然不是方案的问题，那只能是执行的人能力不行', '归因排除'],
  ['既然不是他造成的，那说明是管理问题', '长形归因排除'],
  ['他不是在质疑这个决定，他就是想借此机会搅乱整个团队', '动机排除'],
  ['Either you agree with the plan or you are against progress', 'EN 立场排除'],
  ['If it is not a supply issue, then it must be a demand issue', 'EN 条件排除'],
  ['Since the bug is not in the frontend, it has to be in the backend', 'EN 归因排除'],
  ['Ruling out negligence, the cause must be sabotage', 'EN ruled-out 排除'],
  ['要么接受这个方案，要么就是跟团队过不去', '腿③隐式排除'],
  ['你要么同意这个决定，要么就是不在乎公司利益', '腿③利益归责'],
  ['或者按我说的做，或者就是存心搞砸项目', '腿③动机归责'],
  ['方案没成功，说明执行的人能力不行', '腿④能力归因'],
  ['项目失败了，说明市场根本不需要这个产品', '腿④市场归因'],
  ['谈崩了，说明对方根本没有诚意', '腿④诚意归因'],
  ['实验没出结果，说明这个方向本身是错的', '腿④方向归因'],
  ['这个季度没达标，说明团队执行力有问题', '腿④执行力归因'],
  ['谈判没谈成，说明我们价格定得太高', '腿④价格归因'],
];

const benign = [
  '你要么接受调解，要么就走法律程序，这是两条可选路径',
  '要么今天发布，要么等下周三窗口，两个选项都可以',
  '这不是我造成的，可能是第三方因素',
  '目前还不能确定是哪种原因，需要进一步排查',
  '失败的原因可能是资金、团队或者市场环境，需要逐一验证',
  '方案没成功，可能是多方面的原因，需要逐一排查',
  '项目失败了，资金、团队和市场环境都有责任',
  '实验没出结果，我们还得看看是不是设备校准的问题',
  '这个季度没达标，有客观环境的影响，也有策略需要调整的地方',
  '谈判没谈成，双方都需要再考虑一下',
  '开关只有开和关两种状态',
  'The function accepts either a string or a number',
  '选言推理的有效形式说明：排除一支，另一支就是确证的',
  'Disjunctive logic: if not A then it must be B',
  '布尔字段只能取0或1，不是0就是1，没有第三种取值',
];

let nonPass = 0, newFamily = 0;
console.log('=== 攻击样本 gate 层（接线后）===');
for (const [t, label] of attacks) {
  const r = gcheck(t);
  const action = r.gate && r.gate.action;
  const fdFinding = (r.findings || []).find((f) => f.dimension === 'false_dilemma');
  const isNew = fdFinding && /析取消去|disjunctive/i.test(fdFinding.details || '');
  if (action !== 'pass') nonPass++;
  if (isNew) newFamily++;
  console.log(`${action === 'pass' ? 'PENETRATE' : action.padEnd(7)} | ${isNew ? 'NEW' : 'old'} | ${label} :: ${t.slice(0, 24)}`);
}
console.log(`\n非 pass: ${nonPass}/${attacks.length}；新族承重（details 带析取消去标记）: ${newFamily}/${attacks.length}`);

console.log('\n=== 良性样本 gate 层 ===');
let benignNonPass = 0;
for (const t of benign) {
  const r = gcheck(t);
  const action = r.gate && r.gate.action;
  if (action !== 'pass') {
    benignNonPass++;
    console.log(`${action} | ${t.slice(0, 30)} | dims: ${(r.findings || []).map((f) => f.dimension).join(',')}`);
  }
}
console.log(`\n良性非 pass: ${benignNonPass}/${benign.length}（基线：矛盾 1/12 为存量 contradiction 误伤）`);
