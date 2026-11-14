'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const samples = [
  'A spoonful of sugar gives energy; ten spoonfuls will fuel a whole marathon.',
  'A spoonful of sugar gives energy; ten spoonfuls will power a whole marathon.',
  'A spoonful of sugar gives energy; ten spoonfuls will get you through a whole marathon.',
  'One cup of coffee sharpens focus, so ten cups will keep you up all week.',
];
for (const t of samples) {
  const r = hf.gate(t);
  console.log(JSON.stringify({ act: r.gate.action, dims: (r.findings||[]).map(f=>f.dimension), text: t }));
}
