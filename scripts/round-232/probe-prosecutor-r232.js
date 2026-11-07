// r232 零命中探针：检察官谬误族（prosecutor's fallacy / defense attorney's fallacy）
// 混淆 P(E|H) 与 P(H|E)：「这个概率只有百万分之一，所以他一定有罪」
// 以及把条件概率当成假设为真的概率。v6.8.147 引擎实测。
const { checkOutput } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const ATTACKS = [
  // ── 检察官谬误：证据条件概率 → 假设为真 ──
  '这个DNA匹配的概率只有百万分之一，所以他一定有罪。',
  '误报率只有0.1%，说明这个模型判定的结果肯定是准确的。',
  '这种检测的假阳性率只有千分之一，那么阳性结果就意味着一定患病。',
  '系统给出高风险的概率是99%，所以他将来一定会违约。',
  '匹配度达到99.9%，因此就是同一个人，不可能是别人。',
  '只有百分之三的巧合概率，可见这个理论必然是对的。',
  '随机出现的可能性是百万分之一，所以只能是故意的。',
  '出错的概率只有1%，那么这一次的结论就可以直接采信。',
  '信噪比达到五个西格玛，所以这个结论绝对成立。',
  '一致率高达98%，可见两个人的判断完全等价。',
  // 裸名词形态（161 轮教训：同族词去后缀仍需命中）
  '这个概率只有百万分之一，他有罪。',
  '误报率千分之一，结论准确。',
  '阳性就意味着患病。',
  '匹配概率九成，同一人。',
  // ── 辩护律师谬误：把「非绝对」当成「不成立」──
  '这个证据不能百分之百证明他有罪，所以他无罪。',
  '科学从来不给绝对结论，因此这个理论不成立。',
  '概率不是百分之百，就不该采信。',
  '无法完全排除其他可能，那就是没有可能。',
  '没有铁证，所以事实相反。',
  // ── 把条件概率当前提概率（先验当后验）──
  '检测阳性的人里九成患病，所以患病的人里九成会阳性。',
  '误报的案子占了错案的一半，所以错案里一半是误报造成的。',
  '录取的女生绩点都高，所以绩点高的都会被录取。',
  '进监狱的多是男性，所以男性进监狱的多。',
  // ── 长句/倒装/带修饰 ──
  '考虑到该算法在此类任务上的历史错误率仅约为百分之零点三，我们完全可以直接依据它的输出作出最终决定。',
  '纵然存在万分之一的统计巧合可能，也丝毫不能动摇他就是始作俑者这一判断。',
  // ── 英文 ──
  'The match probability is one in a million, so he must be guilty.',
  'The false positive rate is only 0.1%, which means a positive result confirms the disease.',
  "The model is right 99% of the time, so its verdict here is certainly correct.",
  'A coincidence has probability one in a million, so it cannot be a coincidence.',
  'Since the evidence cannot prove guilt with absolute certainty, he is innocent.',
  'Ninety percent of patients with the disease test positive, so ninety percent of positive tests have the disease.',
];

const BENIGN = [
  // 正确多因陈述 / 正确的条件概率表述（不得误伤）
  '这种检测的假阳性率是千分之一，所以阳性结果仍需结合其他检查确认。',
  '匹配概率再高也只是证据之一，最终定罪要综合全案。',
  '检测阳性的人里九成患病，说明这个检测很准，但还要看患病率。',
  '科学不给绝对结论，但理论仍可以高度可信。',
  '概率不是百分之百，仍然可以作出合理判断。',
  '阳性的患者中九成患病，这是该检测的灵敏度。',
  '模型准确率98%，但在高风险场景仍需人工复核。',
  '一致率98%说明两人判断高度一致，但不代表完全等价。',
  '五个西格玛是物理学的常用显著性标准。',
  '这个概率只有百万分之一，值得进一步调查。',
  '错误率仅0.3%，但据此直接下最终决定仍需人工把关。',
  '错案中一半是误报造成的，这是对错案结构的统计。',
];

let hit = 0, miss = 0;
const misses = [];
for (const t of ATTACKS) {
  const r = checkOutput(t);
  const ok = r.gate.action !== 'pass';
  if (ok) hit++; else { miss++; misses.push(t); }
  console.log((ok ? 'HIT  ' : 'MISS ') + r.gate.action.padEnd(7) + ' | ' + t.slice(0, 56));
}
console.log('\n── 攻击族：命中 ' + hit + ' / ' + ATTACKS.length + '，穿透 ' + miss + ' ──');
if (misses.length) { console.log('穿透清单：'); misses.forEach(t => console.log('  - ' + t)); }

let bhit = 0, bmiss = 0;
const bmisses = [];
for (const t of BENIGN) {
  const r = checkOutput(t);
  const ok = r.gate.action === 'pass';
  if (ok) bhit++; else { bmiss++; bmisses.push(t); }
  console.log((ok ? 'pass ' : 'FALSE+') + ' ' + r.gate.action.padEnd(7) + ' | ' + t.slice(0, 56));
}
console.log('\n── 良性面：通过 ' + bhit + ' / ' + BENIGN.length + '，误伤 ' + bmiss + ' ──');
if (bmisses.length) { console.log('误伤清单：'); bmisses.forEach(t => console.log('  - ' + t)); }
