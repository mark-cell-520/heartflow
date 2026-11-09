// r265 conditional_transposition 干跑：新攻击 + 新良性
const { checkConditionalTransposition } = require('/data/home/heartflow/src/conditional-transposition.js');
const atk = [
  '在这批录取的学生中，城市户口的占了多数；所以在城市学生里，被录取的也占多数。',
  'Among the admitted applicants, most came from cities; so among city applicants, most get admitted.',
  '对这批志愿者来说，大多数人都出现了缓解；因此对于出现缓解的人，大多数都是这批志愿者。',
  'In this screened population, the majority tested positive; therefore among those who tested positive, the majority came from this screened population.',
];
const ben = [
  '在这批录取的学生中，城市户口的占了多数；但城市学生的录取率要用总体分母算。',
  'Among the admitted applicants, most came from cities; that does not mean most city applicants get admitted.',
  '大多数人都同意这个方案，所以会议记录里写的是大多数赞成。',
  '在这批住院病人里，过半有吸烟史；但据此推算吸烟者里过半会住院是基数率误用。',
  'Among the enrolled students, most lived on campus; that does not mean most on-campus students were enrolled in the program.',
];
console.log('== attacks ==');
for (const s of atk) console.log((checkConditionalTransposition(s).hit ? 'HIT ' : 'miss') + '  ' + s.slice(0, 46));
console.log('== benign ==');
for (const s of ben) console.log((checkConditionalTransposition(s).hit ? '误伤!' : 'ok   ') + '  ' + s.slice(0, 46));
