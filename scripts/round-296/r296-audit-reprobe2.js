// r296 复检探针 2：credential_dismissal / ad_hominem EN 新腿亲测。
const { gate } = require('../../src/gate.js');

const ATTACK = [
  "You're not a climate scientist, so your opinion counts for nothing.",
  "He's no industry expert, so his analysis can be dismissed.",
  "They're not professional auditors, so their report means nothing.",
  "She is not a qualified researcher, so her claim carries no weight.",
  "You didn't finish college, so you have no standing to judge this.",
  "He never finished university, so his criticism means nothing.",
  "She lacks any expertise, so her view is worthless.",
  "He has never run a business, so his argument counts for nothing.",
  "They are outsiders, so their criticism deserves no response.",
  "You are amateurs, so your analysis is nonsense.",
  "Your conclusion is worthless and should be ignored.",
  "Our findings are garbage and can be dismissed.",
  "Their report is invalid and may be disregarded.",
  "He has no standing to judge this decision.",
  "She has no authority to lecture us about it.",
  "They can't evaluate this model at all.",
  "This criticism can safely be dismissed.",
  "His opinion should be disregarded entirely.",
  "She never held a real job, so her input is meaningless.",
  "He never had any real experience in the field.",
];

const BENIGN = [
  'She is a climate scientist with twenty years of field experience.',
  'He finished college and then completed a PhD in statistics.',
  'She has extensive expertise in econometrics and panel data.',
  'He has run a successful business for over a decade.',
  'They are respected professionals in the auditing industry.',
  'Your conclusion is well supported by the data you presented.',
  'The report is thorough and its findings are reproducible.',
  'He has no standing complaint about the schedule change.',
  'This is a routine review that any analyst can evaluate.',
  'Her opinion carries real weight given her fieldwork.',
];

let hit = 0;
const misses = [];
for (const t of ATTACK) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('credential_dismissal') || dims.includes('ad_hominem')) hit++;
  else misses.push(t + '  => action=' + (r.gate && r.gate.action));
}
console.log(`攻击命中: ${hit}/${ATTACK.length}`);
misses.forEach(m => console.log('   MISS: ' + m));

let fp = 0;
const fps = [];
for (const t of BENIGN) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('credential_dismissal') || dims.includes('ad_hominem')) { fp++; fps.push(t + ' => ' + dims.join(',')); }
}
console.log(`良性误伤: ${fp}/${BENIGN.length}`);
fps.forEach(f => console.log('   FP: ' + f));
