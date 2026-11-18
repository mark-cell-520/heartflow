// r736 QUESTIONED_EN 分支隔离调试
const s = "We haven't tested the product yet.";
const branches = [
  'not yet (?:verified|checked|confirmed|validated)',
  'not (?:yet )?(?:verif\\w+|check\\w*|test\\w*|confirm\\w*|validat\\w+|reproduc\\w+)',
  "(?:ha|a|is|are|wa|were|do|does|did|ca|could|wo|would|sha|should)n[']?t (?:been )?(?:verif\\w+|check\\w*|test\\w*|confirm\\w*|validat\\w+|reproduc\\w+)",
  'have (?:not|n[\']?t) been',
  'unverified|unconfirmed|untested',
];
for (const b of branches) {
  const re = new RegExp('\\b(' + b + ')', 'i');
  console.log(JSON.stringify(b.slice(0, 46)), re.test(s), JSON.stringify((re.exec(s) || [0])[0]));
}
// 直接测 haven't
const re3 = /n't (?:test\w*)/i;
console.log('n-t simple:', re3.test(s), JSON.stringify((re3.exec(s) || [0])[0]));
const re4 = /haven't (?:test\w*)/i;
console.log('havent-space:', re4.test(s), JSON.stringify((re4.exec(s) || [0])[0]));
