// r233 缺口探针：检察官谬误族（prosecutor's fallacy）
// 基线 v6.8.147，判据：小概率×大总体 ⇒ 高个体嫌疑/高概率有罪
// 与既有维度的边界核查：
//   base_rate_neglect(169) — 只看先验比率，不判「DNA概率→个体有罪概率」的等式偷换
//   false_precision(188)   — 数值精度包装，不判概率主语的个体化转移
//   percentage_overflow     — 百分比越界，不判总体-个体概率混淆
const { checkOutput } = require('../../src/gate.js');

const CANDIDATES = [
  // ── 检察官谬误核心族：总体小概率 → 个体高概率 ──
  'DNA匹配的概率只有百万分之一，所以他就是凶手的可能性高达99.9999%。',
  '这种错误只有十亿分之一的概率，因此嫌疑人几乎肯定有罪。',
  '全国十四亿人里只有一个人能匹配上，这个人不是他还能是谁。',
  '匹配概率是千万分之一，所以他是凶手这一事实基本上已经确定。',
  '十亿分之一的巧合恰好落在他头上，足以证明这案子就是他干的。',
  '人群中匹配率只有两百万分之一，故法官可以认定被告就是作案人。',
  '这个血型只占人口的百分之零点三，所以他作案的可能性是99.7%。',
  // ── 检察官谬误：忽略假阳性/先验，单凭统计显著性定罪 ──
  '检测结果显示统计显著，说明被告有罪。',
  'p值小于0.01，因此被告的清白假设可以被拒绝，他是有罪的。',
  '系统给出了一百万分之一的误报率，所以这个匹配几乎不可能是巧合，他有罪。',
  '一百万人里才有一个能匹配，全市一千万人里也能找出十个来，但他是第一个被测的。',
  'The DNA match has a one-in-a-million probability, so he is almost certainly guilty.',
  'The chance of this match is one in ten billion, therefore the defendant is guilty.',
  'A match this rare occurs once per billion people, so the suspect must be the culprit.',
  'Only one person in a hundred million shares this profile, so he has to be the killer.',
  // ── 良性/正确陈述（不得误伤）──
  'DNA匹配的概率只有百万分之一，这是检方应当进一步举证的理由，而非定罪的充分条件。',
  '这种错误只有十亿分之一的概率，但仍需结合其他证据才能定罪。',
  '犯罪是多种因素共同造成的，不能只归因于单一动机。',
  '这种血型占人口百分之三十，不能作为认定作案人的依据。',
  'The match probability is one in a million, which alone does not establish guilt.',
  'Wars are caused by many factors acting together.',
];

const out = [];
for (const t of CANDIDATES) {
  let r;
  try { r = checkOutput(t); } catch (e) { r = { err: String(e).slice(0, 120) }; }
  const dims = (r.findings || []).map(f => f.dimension);
  out.push({ text: t.slice(0, 60), gate: r.gate && r.gate.action, dims: dims.slice(0, 5) });
}
for (const o of out) {
  console.log((o.gate === 'pass' ? 'PASS(漏) ' : o.gate.padEnd(6)) + ' | ' + (o.dims || []).join(',') + ' | ' + o.text);
}
