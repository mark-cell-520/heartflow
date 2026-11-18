// r393 归属证明：checkFalseDilemma 层注入 R.DSF 全删 → 新族承重样本须转 miss；
// 仍 hit 的样本由 false_dilemma 既有路由承重（union 先例，非本轮增量）。
const path = require('path');
const ROOT = '/data/home/heartflow';
const { checkFalseDilemma } = require(path.join(ROOT, 'src', 'false-dilemma.js'));

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

// 全删新族全部腿（DSF 命名空间）
const DELETE_ALL = {
  DSF: {
    DISJ_ZH: /$^/, DISJ_EN: /$^/, NEG_BRANCH_ZH: /$^/, INFER_BRANCH_ZH: /$^/,
    EXCLUDE_INFER_EN: /$^/, NEGATE_ZH: /$^/, DISJ_BLAME_ZH: /$^/,
    RESULT_FAIL_ZH: /$^/, BLAME_INFER_ZH: /$^/,
  },
};

let dsfCarried = 0, preexisting = 0;
console.log('=== 新族承重归属（checkFalseDilemma 层）===');
for (const [t, label] of attacks) {
  const base = checkFalseDilemma(t);
  const del = checkFalseDilemma(t, DELETE_ALL);
  const carrier = base.hit && !del.hit ? 'DSF(新族)' : (base.hit && del.hit ? '既有路由' : 'MISS?!');
  if (carrier === 'DSF(新族)') dsfCarried++;
  else if (carrier === '既有路由') preexisting++;
  console.log(`${carrier.padEnd(10)} | ${label} :: ${t.slice(0, 24)}`);
}
console.log(`\n新族承重: ${dsfCarried}/${attacks.length}；既有路由兜底（union 先例）: ${preexisting}/${attacks.length}`);
