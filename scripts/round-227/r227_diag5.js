'use strict';
const path = require('path');
const src = require('fs').readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');
const tm = src.match(/const AUTHORITY_FIRST_PERSON = \{[\s\S]*?\n\};/);
const table = eval('(' + tm[0].replace(/^const \w+ = /, '').replace(/;\s*$/, '') + ')');
const RECORD = /\b(?:audit\s+log|left\s+a\s+comment|documented|changelog|approval\s+record|commit\s+message|minutes|the\s+RFC|per\s+the|according\s+to\s+the)/i;
const cases = [
  'Trust me, I am the expert here.',
  'Because I said so, that is final.',
  'My authority on this is final.',
  'We defer to the founder on this.',
  'The manager already approved it.',
  'Seniority says we ship it.',
  'I have the rank to decide this.',
  '听我的，我是这方面的专家。',
];
for (const t of cases) {
  const zh = /[\u4e00-\u9fff]/.test(t);
  const lang = zh ? 'zh' : 'en';
  const halves = table[lang];
  const idHit = halves.identity.filter(re => re.test(t)).length;
  const obHit = halves.obey.filter(re => re.test(t)).length;
  const dsHit = halves.dismiss.filter(re => re.test(t)).length;
  const rec = (!zh && RECORD.test(t));
  console.log('[' + lang + '] id=' + idHit + ' ob=' + obHit + ' ds=' + dsHit + ' recordCtx=' + rec);
}
