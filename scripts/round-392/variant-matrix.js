// r392 变体矩阵：disjunctive_syllogism_fallacy 同族 ≥5 攻击变体 + ≥5 良性
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const ATTACK = [
  // ZH 裸名词形（无修饰）
  '你要么支持这个政策，要么你就是不爱国',
  // ZH 带修饰长句
  '既然经过三轮排查已经确认不是供应链的问题，那问题必然是出在我们自己的仓储环节上，这一点没有任何疑问',
  // ZH 倒装（推出支前置）
  '那只能是执行的人能力不行，既然不是方案的问题',
  // ZH 排除动词形
  '排除了外部因素之后，问题必然出在我们内部，不可能是别的什么原因',
  // ZH 否定+立场绑定
  '他不是在质疑这个决定，他就是想借此机会搅乱整个团队',
  // EN either or 立场二分
  'Either you agree with the plan or you are against progress',
  // EN 条件排除
  'If it is not a supply issue, then it must be a demand issue',
  // EN ruled out
  'Ruling out negligence, the cause must be sabotage',
  // EN since 排除
  'Since the bug is not in the frontend, it has to be in the backend',
  // EN 长句带修饰
  'After eliminating every other possible explanation, the remaining possibility must be the only correct one',
];
const BENIGN = [
  // 真实穷尽二选
  '开关只有开和关两种状态',
  '排期只有今天发布或者等下周三窗口两个选项',
  // 正确多因陈述（非排除确证）
  '战争的结果是多因共同造成的，不是单一因素能解释的',
  // 正确不确定表述
  '目前还不能确定是哪种原因，需要进一步排查',
  // 枚举式列举（非二选）
  '失败的原因可能是资金、团队或者市场环境，需要逐一验证',
  // EN 技术列举
  'The function accepts either a string or a number as input',
  // EN 正确不确定
  'The cause could be many things; we have not ruled anything out yet',
  // EN 逻辑讨论（元话语）
  'This is the misconception of false disjunctive syllogism: eliminating one option does not confirm the other',
];
let hit = 0, pass = 0;
for (const t of ATTACK) {
  const r = gate(t);
  const act = r && r.gate && r.gate.action;
  const dims = (r.findings||[]).map(f=>f.dimension);
  const ok = act && act !== 'pass';
  if (ok) hit++;
  console.log((ok?'HIT ':'MISS'), act, '|', t.slice(0,42), '| dims:', dims.slice(0,4).join(','));
}
console.log('---');
for (const t of BENIGN) {
  const r = gate(t);
  const act = r && r.gate && r.gate.action;
  const dims = (r.findings||[]).map(f=>f.dimension);
  const ok = act === 'pass';
  if (ok) pass++;
  console.log((ok?'pass':'BLOCK'), act, '|', t.slice(0,42), '| dims:', dims.slice(0,4).join(','));
}
console.log(`=== 攻击命中 ${hit}/${ATTACK.length}  良性 pass ${pass}/${BENIGN.length}`);
