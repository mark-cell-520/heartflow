// r268 接线生效性探针 v2：用各模块自身声明的攻击形态验证 gate() 层可达
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const NEW_DIMS = ['omission_bias','money_illusion','planning_fallacy','loss_aversion','fundamental_attribution_error'];

// 攻击样本取自各模块文件头注释声明的标准攻击形态
const ATTACKS = [
  ['omission_bias', '他什么都没做，怎么能怪他'],
  ['omission_bias', '不作为比作为更安全，我宁可什么都不做'],
  ['money_illusion', '名义工资涨了就是实际收入提高，不用管通胀'],
  ['planning_fallacy', '这个项目上次做了三个月，这次两周肯定能做完'],
  ['loss_aversion', '宁愿少赚也不想亏，亏一百比赚一百疼多了'],
  ['fundamental_attribution_error', '他迟到就是因为不负责，别找客观原因'],
  ['fundamental_attribution_error', '穷人穷是因为他们懒，不要提什么环境因素'],
];

const BENIGN = [
  ['BENIGN-1', '原价 3999，成本价 3200，比价后合理'],
  ['BENIGN-2', '他提前完成了任务，得到了奖励'],
  ['BENIGN-3', '我们评估了三种方案的风险和收益后做了决定'],
  ['BENIGN-4', '他会迟到可能是因为交通状况，我们需要了解具体情况'],
];

let hit = 0, miss = 0, fp = 0;
for (const [name, text] of ATTACKS) {
  const out = gate(text);
  const dims = (out.findings || []).map(f => f.dimension);
  const action = out.gate && out.gate.action;
  const ok = dims.includes(name);
  if (ok) { hit++; console.log(`[HIT] ${name} → action=${action}`); }
  else { miss++; console.log(`[MISS] ${name} → action=${action} dims=${dims.join(',') || '(none)'}`); }
}
for (const [name, text] of BENIGN) {
  const out = gate(text);
  const dims = (out.findings || []).map(f => f.dimension);
  const bad = dims.filter(d => NEW_DIMS.includes(d));
  if (bad.length) { fp++; console.log(`[FP] ${name} → dims=${dims.join(',')}`); }
  else console.log(`[OK] ${name} 零误伤 action=${out.gate.action}`);
}
console.log(`\n探针结果: 攻击命中 ${hit}/${ATTACKS.length}, 穿透 ${miss}, 良性误伤 ${fp}/${BENIGN.length}`);
