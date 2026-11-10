'use strict';
const { __internals } = require('../../../src/false-dilemma.js');
const I = __internals();
const samples = [
  '不买就不是自己人，这点觉悟总得有吧。',
  '不转这篇文章，就是不在乎团队的死活，看着办吧。',
  '支持他，就是支持整个项目组，你自己掂量。',
];
for (const t of samples) {
  console.log(JSON.stringify(t));
  console.log('  NEGACT:', I.ALIGN_NEGACT_ZH.test(t), I.ALIGN_NEGACT_ZH.exec(t) && I.ALIGN_NEGACT_ZH.exec(t)[0]);
  console.log('  EQUATE:', I.ALIGN_EQUATE_ZH.test(t), I.ALIGN_EQUATE_ZH.exec(t) && I.ALIGN_EQUATE_ZH.exec(t)[0]);
  console.log('  PRESSURE:', I.ALIGN_PRESSURE_ZH.test(t));
}
