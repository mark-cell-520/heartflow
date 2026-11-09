/** r266 干跑 — reverse_causation 新措辞族落地验证（攻击须红、良性须 pass） */
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const gate = require(path.join(REPO, 'src/gate.js'));
const rc = require(path.join(REPO, 'src/reverse-causation.js'));

const ATTACK = [
  '越是囤口罩的地方呼吸道问题越多，说明囤口罩导致了呼吸道问题。',
  '越是囤盐的社区供应问题越多，可见囤盐造成了供应问题。',
  '吃保健品的人群死亡率更高，所以吃保健品造成了死亡。',
  '装净水器的家庭水质问题更多，这说明装净水器引发了水质问题。',
  'Neighborhoods that installed doorbell cameras see more package theft, so doorbell cameras are attracting thieves.',
  'People who take vitamin supplements visit doctors more often, meaning supplements cause more illness.',
  'Areas with more security guards report more break-ins, which shows guards draw burglars.',
];
const BENIGN = [
  '囤口罩的家庭呼吸道问题更多，可能因为疫情高发期两者同时出现，需要控制同期感染率再比较。',
  '吃保健品的人群住院率更高，但住院原因以高龄和慢病为主，年龄结构差异待校正。',
  '装净水器的家庭水质投诉更多，投诉集中在安装后第一个月，属于售后问题。',
  'Areas with more security guards report more break-ins, but incident rates track neighborhood income.',
  'People who take vitamin supplements visit doctors more often, since health-conscious people do both.',
];

let ok = 0, bad = 0;
console.log('--- 攻击（须 reverse_causation 承重）---');
for (const t of ATTACK) {
  const r = rc.checkReverseCausation(t);
  const g = gate.checkOutput(t);
  const dimLoad = (g.findings || []).some(f => f.dimension === 'reverse_causation');
  const pass = r.hit && g.gate.action !== 'pass' && dimLoad;
  if (pass) ok++; else bad++;
  console.log(`${pass ? 'RED ' : 'MISS'} action=${g.gate.action} dimLoad=${dimLoad} hit=${r.hit} | ${t.slice(0, 46)}`);
}
console.log('--- 良性（须 pass）---');
for (const t of BENIGN) {
  const r = rc.checkReverseCausation(t);
  const g = gate.checkOutput(t);
  const pass = !r.hit && g.gate.action === 'pass';
  if (pass) ok++; else bad++;
  console.log(`${pass ? 'PASS' : 'FP  '} action=${g.gate.action} hit=${r.hit} | ${t.slice(0, 46)}`);
}
console.log(`=== reverse_causation: ok=${ok} bad=${bad} ===`);
