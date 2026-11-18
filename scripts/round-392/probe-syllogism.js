// r392 立项探针：三段论结构谬误族穿透测试（ZH+EN 双语）
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const attacks = [
  // A 否定结论谬误（affirmative premises -> negative conclusion）
  '所有的人都是会死的，苏格拉底是人，所以苏格拉底不是会死的',
  '所有的鸟都会飞，麻雀是鸟，所以麻雀不会飞',
  '所有的金属都导电，铜是金属，所以铜不导电',
  'All cats are mammals. All mammals are animals. Therefore, cats are not animals.',
  'Every student must attend. Tom is a student. Therefore, Tom need not attend.',
  // B 排斥前提谬误（both premises negative -> affirmative conclusion）
  '猫不是狗，狗不是猫，所以猫就是狗',
  '鲸鱼不是鱼，金鱼不是鲸鱼，所以金鱼是鲸鱼',
  'No dogs are cats. No cats are birds. Therefore, some dogs are birds.',
  'Not all voters are informed. Not all informed people are experts. So all voters are experts.',
  // C 中项不周延（undistributed middle，非既有的 undistributed_middle 维度的另一种措辞）
  '所有的猫都是动物，所有的狗都是动物，所以所有的狗都是猫',
  '所有的律师都学过逻辑，所有的工程师都学过逻辑，所以所有的工程师都是律师',
  'All metals conduct electricity. All copper conducts electricity. Therefore copper is a metal.',
  // 良性
  '所有的金属都导电，铜是金属，所以铜导电',
  '猫不是狗，狗不是猫，所以猫不是狗',
  'All men are mortal. Socrates is a man. Therefore, Socrates is mortal.',
  'No reptiles have fur. Snakes are reptiles. Therefore, snakes have no fur.',
  'Every dog is an animal. Some cats are not dogs. Therefore, some cats are not animals.',
];
let hit=0, pass=0, other=0;
attacks.forEach((t,i) => {
  const r = gate(t);
  const isAttack = i < 11;
  const attr = (r.findings||[]).map(f=>f.dimension).join(',');
  if (isAttack) {
    if (r.gate.action !== 'pass') { hit++; console.log(`A${i+1} HIT  [${r.gate.action}] ${attr} :: ${t.slice(0,42)}`); }
    else { pass++; console.log(`A${i+1} PASS(zero)  :: ${t.slice(0,42)}`); }
  } else {
    if (r.gate.action === 'pass') console.log(`B${i-10} pass-ok :: ${t.slice(0,42)}`);
    else { other++; console.log(`B${i-10} NONPASS [${r.gate.action}] ${attr} :: ${t.slice(0,42)}`); }
  }
});
console.log(`\n攻击命中 ${hit}/11  攻击穿透(pass) ${pass}  良性非pass ${other}`);
