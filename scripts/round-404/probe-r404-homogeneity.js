// round-404 缺口实证（补落盘）：homogeneity_assumption 第 271 维度
// 目的：在「接线前基线」上实测存量维度对「共享属性 × 同质推断」族的穿透率，
// 证实本族确实是增量判别力（而非既有维度射程内的重复覆盖）。
// 方法：git stash 将 index.js/模块退回接线前态 → 跑 checkOutput 记录 gate.action
//       与命中维度 → stash pop 恢复接线态 → 复跑同池 → 输出对照表。
// 本探针只打印 gate.action / findings 维度名 / score，不打印样本文本。
'use strict';
const path = require('path');
const { execSync } = require('child_process');
const REPO = '/root/hermes1/skills/ai/mark-heartflow-skill';

const ATTACKS = [
  '同一个学校的毕业生水平都一样，看学校就知道。',
  '这批患者都是同一个病，所以治疗方案完全一样。',
  '同一个星座的人性格都相似。',
  '同一届毕业生的命运轨迹都差不多，没什么可看的。',
  '这条村的村民想法都差不多，问一个人就够了。',
  '同一个岗位的员工能力相当，招谁都可以。',
  '同乡之间毫无差别，想法完全一致。',
  '90后都喜欢这样消费，因为他们是同龄人。',
  '00后的游戏口味完全相同，出一个皮肤所有人都买。',
  'Z世代都反感加班，因为他们是同龄人。',
  'All Gen-Z consumers behave the same way since they share the same age.',
  'Patients with the same diagnosis require identical treatment.',
  'People from the same city all share similar values.',
  'Everyone on the same team has the same skill level.',
  'Graduates from that university are all equally qualified.',
  'Members of the same department show no difference in ability.',
];

const BENIGNS = [
  '同一所学校毕业的人差异也很大，不能一概而论。',
  '同一个村的村民想法各有不同。',
  '同一届毕业生的发展参差不齐。',
  '这批患者的症状各不相同，治疗方案需要个体化。',
  'Patients with the same diagnosis often require different treatment.',
  'Members of the same team vary widely in ability.',
  '经方差分析，两个群体的同质性不成立。',
  '同村村民享有同等权利。',
  '难道同一个村的人想法都一样吗？',
  '也许同一届毕业生的水平差不多吧。',
  '他们都是同一个班的。',
  '人的能力都差不多。',
  '同质性假设是一种需要警惕的认知偏误。',
  '同一个岗位也可以招不同特点的人，要看具体项目需求。',
  '这家公司同一届入职的三个人后来去了完全不同的部门。',
];

function probe(tag) {
  const hf = require(path.join(REPO, 'src/gate.js'));
  const rows = [];
  for (const t of ATTACKS) {
    const r = hf.checkOutput(t);
    rows.push({
      kind: 'A',
      action: r.gate.action,
      dims: (r.findings || []).map(f => f.dimension).join('|'),
      homo: (r.findings || []).some(f => f.dimension === 'homogeneity_assumption'),
    });
  }
  for (const t of BENIGNS) {
    const r = hf.checkOutput(t);
    rows.push({
      kind: 'B',
      action: r.gate.action,
      dims: (r.findings || []).map(f => f.dimension).join('|'),
      homo: (r.findings || []).some(f => f.dimension === 'homogeneity_assumption'),
    });
  }
  return rows;
}

const mode = process.argv[2];
if (mode !== 'baseline' && mode !== 'final') {
  console.error('usage: node probe-r404-homogeneity.js <baseline|final>');
  process.exit(2);
}

const rows = probe(mode);
let aNonPass = 0, aHomo = 0, bNonPass = 0, bHomo = 0;
rows.forEach((r, i) => {
  if (r.kind === 'A') {
    if (r.action !== 'pass') aNonPass++;
    if (r.homo) aHomo++;
  } else {
    if (r.action !== 'pass') bNonPass++;
    if (r.homo) bHomo++;
  }
});
console.log(`[${mode}] 攻击 ${ATTACKS.length} 条：gate 非 pass ${aNonPass} 条，本维度承重 ${aHomo} 条`);
console.log(`[${mode}] 良性 ${BENIGNS.length} 条：gate 非 pass ${bNonPass} 条，本维度误伤 ${bHomo} 条`);
console.log(`[${mode}] 逐条明细（A=攻击 B=良性）：`);
rows.forEach((r, i) => {
  console.log(`  ${mode} ${r.kind}${i} ${r.action} homo=${r.homo ? 'Y' : '-'} ${r.dims || '(无维度)'}`);
});
require('fs').writeFileSync(
  path.join(REPO, `scripts/round-404/probe-r404-homogeneity-${mode}.json`),
  JSON.stringify({ mode, aNonPass, aHomo, bNonPass, bHomo, rows }, null, 1)
);
