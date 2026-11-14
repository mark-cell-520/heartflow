'use strict';
// r331 调试：定位良性句命中路径 + 验证豁免语序
const { checkImmortalTimeBias } = require('../../src/immortal-time-bias.js');
const texts = [
  '体检筛查出来的结节多数终生不会恶变，可见筛查改善了患者的生存结局。',
  '把一辈子都不会发病的病变也算作早期发现，筛查的收益就会被高估。',
  '筛查发现的甲状腺癌很多是过度诊断，这个病例组合问题让筛查收益被大大夸大。',
];
for (const t of texts) {
  const r = checkImmortalTimeBias(t);
  console.log(`hit=${r.hit} detail=${r.detail} :: ${t.slice(0, 30)}`);
}
