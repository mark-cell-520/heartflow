// r393 模块改写后行为回归：攻击全命中 + 良性零误伤 + inject 冒烟
const m = require('/data/home/heartflow/src/disjunctive-fallacy.js');

const atk = [
  '你要么支持这个政策，要么你就是不爱国',
  '你不认同公司的决定，那你就是想跳槽了',
  '这不是我造成的，那就是你的责任',
  '既然不是方案的问题，那只能是执行的人能力不行',
  '他不是在质疑这个决定，他就是想借此机会搅乱整个团队',
  'Either you agree with the plan or you are against progress',
  'If it is not a supply issue, then it must be a demand issue',
  'Since the bug is not in the frontend, it has to be in the backend',
  'Ruling out negligence, the cause must be sabotage',
  '要么接受这个方案，要么就是跟团队过不去',
  '你要么同意这个决定，要么就是不在乎公司利益',
  '或者按我说的做，或者就是存心搞砸项目',
  '方案没成功，说明执行的人能力不行',
  '项目失败了，说明市场根本不需要这个产品',
  '谈崩了，说明对方根本没有诚意',
  '实验没出结果，说明这个方向本身是错的',
  '这个季度没达标，说明团队执行力有问题',
  '谈判没谈成，说明我们价格定得太高',
];
let h = 0;
for (const t of atk) { const r = m.detect(t); if (r.hit) h++; else console.log('MISS:', t); }
console.log('attacks hit:', h + '/' + atk.length);

const ben = [
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
let fp = 0;
for (const t of ben) { const r = m.detect(t); if (r.hit) { fp++; console.log('FP:', t); } }
console.log('benign FP:', fp + '/' + ben.length);

// inject 冒烟：删条须翻转
const cases = [
  // 腿①②（D1×D2）删条——用长形独家样本（紧凑腿 NEGATE 形不覆盖「造成」类动词，
  // 否则删 NEG/INFER 后紧凑腿兜底，union 语义下翻不掉）
  ['DISJ_ZH', '既然不是他造成的，那说明是管理问题', false],
  ['NEG_BRANCH_ZH', '既然不是他造成的，那说明是管理问题', false],
  ['INFER_BRANCH_ZH', '既然不是他造成的，那说明是管理问题', false],
  ['DISJ_BLAME_ZH', '要么接受这个方案，要么就是跟团队过不去', false],
  ['RESULT_FAIL_ZH', '方案没成功，说明执行的人能力不行', false],
  ['BLAME_INFER_ZH', '方案没成功，说明执行的人能力不行', false],
  ['EXCLUDE_INFER_EN', 'If it is not a supply issue, then it must be a demand issue', false],
  ['CONCEPT_ZH', '选言推理的有效形式说明：排除一支，另一支就是确证的', true],
  ['FACTUAL_ZH', '布尔字段只能取0或1，不是0就是1，没有第三种取值', true],
  ['CONCEPT_EN', 'Disjunctive logic: if not A then it must be B', true],
];
let bad = 0;
for (const [k, t, expect] of cases) {
  const inj = {}; inj[k] = /$^/;
  const r = m.detect(t, inj);
  const okk = r.hit === expect;
  if (!okk) bad++;
  console.log(`${okk ? 'ok  ' : 'FAIL'} inject ${k} -> ${r.hit} (expect ${expect}) :: ${t.slice(0, 22)}`);
}
console.log(bad === 0 ? 'INJECT_SMOKE_PASS' : `INJECT_SMOKE_FAIL(${bad})`);
