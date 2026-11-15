'use strict';
// r343: leg-level debug for the 3 remaining misses.
const ibs = require('/data/home/heartflow/src/incentive-blind-spot.js');
const I = ibs.__internals();

const cases = [
  '投保的人大多本身底子就弱，出险率高跟投保后放纵生活习惯毫无关系。',
  '医保基金支出连年增加，无非是因为参保的本来就是病人群体，参保后的保健行为没有任何变化。',
  'The payouts went up because the people who signed up were already sicker; post-enrollment behavior is irrelevant.',
];

function showLeg(name, list, text) {
  const out = [];
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      out.push('    ' + name + ' MATCH 「' + m[0] + '」@' + m.index);
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  if (out.length === 0) out.push('    ' + name + ' — no match');
  return out.join('\n');
}

for (const t of cases) {
  console.log('=== ' + t.slice(0, 40) + ' ===');
  console.log('  leg1 zh:'); console.log(showLeg('ADV_ATTR_ZH', I.ADV_ATTR_ZH, t));
  console.log('  leg2 zh:'); console.log(showLeg('MORAL_DENIAL_ZH', I.MORAL_DENIAL_ZH, t));
  console.log('  leg1 en:'); console.log(showLeg('ADV_ATTR_EN', I.ADV_ATTR_EN, t));
  console.log('  leg2 en:'); console.log(showLeg('MORAL_DENIAL_EN', I.MORAL_DENIAL_EN, t));
}
