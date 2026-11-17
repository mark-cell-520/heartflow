'use strict';
// r378 续：econ 子组计数 32→33（r369/r371/r372/r373/r374/r375 六处）。
const fs = require('fs');
const files = [
  'round-369-paradox-of-thrift.test.js',
  'round-371-decoy-effect.test.js',
  'round-372-healthy-user-bias.test.js',
  'round-373-extraordinary-claims.test.js',
  'round-374-stock-flow-conflation.test.js',
  'round-375-government-household-analogy.test.js',
];
for (const f of files) {
  const p = '/data/home/heartflow/test/' + f;
  const s = fs.readFileSync(p, 'utf8');
  const out = s.replace(/plugin\.FAMILIES\.filter\(f => f\.group === 'econ'\)\.length, 32,/g, "plugin.FAMILIES.filter(f => f.group === 'econ').length, 33,");
  if (out !== s) { fs.writeFileSync(p, out); console.log(f, 'updated'); } else console.log(f, 'NO-OP');
}
