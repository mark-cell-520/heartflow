// r369 探针：r367 断线产能（negative_existential_import + package_deal）接线真实性核实
// 用法：node scripts/round-369/probe-r367-verify.js
const { checkOutput, gate: gateFn } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const ATK_NEI = [
  '没有任何研究显示这个方法有效，所以它一定是无效的。',
  '说不出反对的理由，说明这个方案是对的。',
  '没有科学家能解释这个现象，所以这一定是超自然力量造成的。',
  '至今没有人成功复现这个结果，因此该结果必定真实。',
  '没人反驳过这个观点，说明它已经被所有人接受了。',
  '从来没有人证明过这个理论是错的，因此这个理论就是对的。',
  'No one has ever seen a dragon, so dragons must exist beyond what we have explored.',
  'Nobody has refuted this theory, so it must be true.',
  'No evidence has been found against it, which means it is accepted by everyone.',
  'The study has never been replicated, which means it must be a genuine discovery.',
];

const ATK_PKG = [
  '你要么全盘接受这套方案，要么就是完全不同意，没有中间地带。',
  '支持环保的人必然也支持大政府，这是一整套左翼立场，不能拆开支持。',
  '买这个品牌就得接受它的全部价值观，不能只买产品不认理念。',
  'You have to accept the whole package or reject it entirely; you cannot agree with just one part.',
  'Their platform is a package deal: you must endorse every plank or none of it.',
  '这套世界观是一揽子打包好的，你要么整体接受要么整体拒绝。',
];

const BENIGN = [
  '有些病人报告了这种症状，所以存在这种症状。',
  '调研显示，该地区确实存在这种鸟类。',
  '这几条措施各自独立，可以逐条评估。',
  '宪法修改须遵循特定程序，由全国人大审议。',
  '用户协议需整体接受才能使用，这是服务方的正当要求。',
  '虽然有人反对，但多数委员认为可以提交表决。',
  'Trade is not zero-sum; both sides can gain from exchange.',
  'Each proposal stands on its own merits and was reviewed separately.',
  '尚未复现说明该结果可信度存疑，需要更多独立实验。',
  '没有人能证明这首歌一定好听，所以这只是个人偏好问题。',
];

function run(label, samples, dim) {
  console.log('\n=== ' + label + ' ===');
  let hits = 0;
  for (const t of samples) {
    const r = checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension);
    const hasDim = dims.includes(dim);
    if (r.gate.action !== 'pass') hits++;
    console.log((r.gate.action === 'pass' ? 'PASS  ' : 'NONPASS ') + r.gate.action.padEnd(7) +
      (hasDim ? '[+dim] ' : '      ') + '| ' + t.slice(0, 46) +
      (dims.length ? '  dims=' + dims.join(',') : ''));
  }
  console.log('non-pass: ' + hits + '/' + samples.length);
}

run('ATTACK negative_existential_import', ATK_NEI, 'negative_existential_import');
run('ATTACK package_deal', ATK_PKG, 'package_deal');
run('BENIGN', BENIGN, null);

// 维度计数核实
console.log('\n=== 维度计数 ===');
const idx = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/index.js');
console.log('dimMap keys 需在 gate 结果里数；此处跑 module 直调');
const neiMod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/negative-existential-import.js');
const pkgMod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/package-deal.js');
for (const t of ATK_NEI) {
  const r = neiMod.checkNegativeExistentialImport(t);
  console.log('nei score=' + r.score + ' count=' + r.count + ' | ' + t.slice(0, 34));
}
for (const t of ATK_PKG) {
  const r = pkgMod.checkPackageDeal(t);
  console.log('pkg score=' + r.score + ' count=' + r.count + ' | ' + t.slice(0, 34));
}
