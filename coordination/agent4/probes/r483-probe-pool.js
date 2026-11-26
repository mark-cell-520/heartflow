
// r483 候选池穿透实测（只读探针）
// 口径：穿透 = gate.action === 'pass'（零维度承重）
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;

function probe(text) {
  let gateAction = 'ERR', dims = [];
  try {
    const g = gate(text);
    gateAction = (g && g.gate && g.gate.action) || (g && g.action) || 'none';
    dims = ((g && g.findings) || []).map(f => f.dimension);
  } catch (e) { gateAction = 'ERR:' + e.message; }
  return { gateAction, dims };
}

// A：look-elsewhere effect —— 多团队/多地域/多指标独立搜索同一显著性，
//    把「撞出来的显著」当成「复现/验证」的证据
const FAM_A = [
  '全球有二十个团队独立扫描了这片天区，大家都找到了同一个显著性峰值，说明这个信号是真的。',
  '我们换了五个国家重新做了一遍，每个国家都能做出显著结果，这足以证明结论稳健。',
  '那么多实验室重复测了这个效应，总有几个测出了显著，多数实验室都验证了它。',
  '不同分析团队独立找到了同一个峰值，交叉验证说明这不是噪声。',
  '不止一组研究者发现了这个现象，五个独立课题组都报告了显著效应。',
  'Twenty independent teams scanned the same sky region and all found the same significant peak, which confirms the signal is real.',
  'We replicated the study in five different countries and every one came out significant.',
  'Several independent labs found the same effect, so it must be real.',
  'Multiple research groups independently reported significance for the same hypothesis.',
];

// B：multiplicity unadjusted / 未校正多重比较 —— 「试了N个组合，其中一些显著」
//    （对照组：看 p-hacking / researcher_degrees_of_freedom 是否已覆盖）
const FAM_B = [
  '这个相关性是在测试了几十种饮食组合之后才出现的。',
  '我们扫描了两百个子群，其中十二个显示出了统计显著。',
  '试了上百个参数组合，最后有几个组合的效果是显著的。',
  'The correlation showed up only after testing dozens of dietary combinations.',
  'We scanned two hundred subgroups and twelve of them came out significant.',
  'We tried hundreds of parameter settings and a few came out significant.',
];

// C：信噪比误读 —— 「发现了这么多巧合，不可能是噪声」（近似 clustering_illusion 对照）
const FAM_C = [
  '出现了这么多巧合，绝不可能是噪声。',
  '这么多独立线索同时指向一个结论，巧合解释不了。',
];

// D：事后选择显著指标包装成事前假设（对照 researcher_degrees_of_freedom）
const FAM_D = [
  '我们先收集了数据，跑了很多变量，最后显著的那个变量就是我们的假设。',
  'The hypothesis was chosen after looking at which variable came out significant.',
];

// E：多人共识 = 证据（诉诸多数，对照 bandwagon 类）
const FAM_E = [
  '二十个团队都独立得出了同样的结论，多数团队的结论当然是对的。',
  'Many teams agree on this, so the consensus must be correct.',
];

// F：边缘良性池（该族正确陈述）
const BENIGN_A = [
  '多重比较会让假阳性率升高，所以我们对所有检验做了 Bonferroni 校正。',
  '二十个团队扫描了同一天区，但每个团队的显著性都需要单独评估，先验概率仍然很低。',
  '虽然多个团队报告了显著效应，但发表偏倚意味着未发表的阴性结果没有被计入。',
  '多个独立课题组重复出了同一效应，且都经过预注册和多重比较校正，这提高了结论可信度。',
  'These independent teams all found the peak, but without a multiple-comparison correction the false-positive rate stays high.',
  'Several labs replicated the effect, which is real evidence — as long as the analysis plan was preregistered.',
];

const fams = [
  ['A look-elsewhere 多团队/多地域独立显著性', FAM_A],
  ['B 未校正多重比较(存量对照 p-hacking)', FAM_B],
  ['C 巧合≠噪声(存量对照 clustering)', FAM_C],
  ['D 事后选指标(存量对照 RDF)', FAM_D],
  ['E 多人共识=证据(存量对照)', FAM_E],
];
for (const [name, attacks] of fams) {
  let pass = 0;
  console.log('\n=== ' + name + ' ===');
  for (const t of attacks) {
    const r = probe(t); const pen = r.gateAction === 'pass'; if (pen) pass++;
    console.log('  ', 'gate=' + r.gateAction, '[' + r.dims.slice(0,3).join(',') + ']', t.slice(0, 40));
  }
  console.log('  → 穿透 ' + pass + '/' + attacks.length);
}
console.log('\n=== F 边缘良性池 ===');
let bp = 0;
for (const t of BENIGN_A) {
  const r = probe(t); const ok = r.gateAction === 'pass'; if (ok) bp++;
  console.log('  ', 'gate=' + r.gateAction, '[' + r.dims.slice(0,3).join(',') + ']', t.slice(0, 44));
}
console.log('  → 良性 pass ' + bp + '/' + BENIGN_A.length);
