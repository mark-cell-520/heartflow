// r413 最终版候选：加两条已完成动作豁免锚点，压掉良性 #6/#8 误伤
// 良性 #6「a decision is expected Friday」、#8「respond to our inquiry」的共同点：
// 带了**已推进/有明确对象**的收尾 → 中文侧同源分界线（已公开/已答复/可验证）
const BRANCHES = [
  ['A', /\b(?:the\s+)?(?:relevant|responsible|related|concerned)\s+(?:department|departments|authority|authorities|agency|agencies|official|officials)\s+(?:are|is)\s+(?:still\s+|yet\s+to\s+|currently\s+)?(?:looking|reviewing|studying|investigating|examining|working|handling|processing|considering|checking|evaluating|assessing)\b(?!.{0,40}(?:decision|expected|confirmed|published|resolved|completed|approved|issued|statement))/i],
  ['A2', /\bdepartment\s+concerned\s+(?:is|are)\b(?!.{0,40}(?:already|confirmed|published|resolved|completed|approved|issued|statement|reply|replied))/i],
  ['B', /\b(?:the\s+)?(?:relevant|responsible|related|concerned)\s+(?:department|departments|authority|authorities|agency|agencies|officials?)\s+(?:have|has)\s+(?:yet\s+to|not\s+yet)\s+(?:respond|give|provide|issue|release|offer|deliver|publish|comment|reply)\b/i],
  ['C', /\b(?:the\s+)?(?:officials?|authorities)\s+(?:are|is)\s+(?:still\s+|currently\s+)?(?:investigating|looking|reviewing|studying|examining|working|handling|considering|evaluating|assessing)\b(?!.{0,40}(?:decision|expected|confirmed|published|resolved|completed|approved|issued|statement))/i],
];

const ATTACK = [
  'The relevant department is looking into this issue.',
  'The relevant authorities have yet to respond.',
  'A related department is currently reviewing it.',
  'Officials are investigating.',
  'The responsible department is still looking into it.',
  'Relevant authorities have yet to give an explanation.',
  'The department concerned is handling the case.',
  'Authorities are studying the matter.',
];
const BENIGN = [
  'Please submit the documents to the relevant department.',
  'The department replies were published yesterday.',
  'This matter has been transferred to the relevant department and a receipt was issued.',
  'Contact details for the relevant department are on the official website.',
  'The relevant departments annual report lists three violations.',
  'Relevant departments are listed in appendix B.',
  'The relevant authorities approved the permit last week.',
  'Officials have confirmed the investigation results.',
  'The relevant department replied within three business days.',
  'We contacted the relevant authority and got a written answer.',
  'The relevant department confirmed the outage was resolved.',
  'Relevant authorities issued a statement on Monday.',
  'Officials inspected the site and published their findings.',
  'The responsible agency approved the license in May.',
  'The department concerned has already sent its reply.',
  'Authorities are still reviewing the guidance, but a decision is expected Friday.',
  'The relevant team is currently handling your request.',
  'Relevant authorities have not yet responded to our inquiry.',
];

for (const [name, re] of BRANCHES) {
  const a = ATTACK.filter(t => re.test(t)).length;
  const b = BENIGN.filter(t => re.test(t)).length;
  console.log(`${name}: 攻击 ${a}/${ATTACK.length}  良性误伤 ${b}/${BENIGN.length}`);
}
const combo = new RegExp(BRANCHES.map(c => c[1].source).join('|'), 'i');
console.log(`组合: 攻击 ${ATTACK.filter(t => combo.test(t)).length}/${ATTACK.length}  良性误伤 ${BENIGN.filter(t => combo.test(t)).length}/${BENIGN.length}`);
