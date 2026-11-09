/** r266 干跑 — illicit_conversion 新措辞族落地验证（攻击须红、良性须 pass） */
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const gate = require(path.join(REPO, 'src/gate.js'));
const ic = require(path.join(REPO, 'src/illicit-conversion.js'));

const ATTACK = [
  '入围的清一色是优等生，所以优等生清一色能入围。',
  '夺冠的选手统统是种子选手，可见种子选手统统能夺冠。',
  '上榜的产品尽数是旗舰款，可见旗舰款尽数能上榜。',
  'The inductees are without exception top performers, hence top performers are inductees.',
  'Shortlist members are all top performers, so top performers are all shortlist members.',
  'The winners are without exception club members, therefore club members are the winners.',
];
const BENIGN = [
  '入围的清一色是优等生，这是本届评审规则第 3 条的结果。',
  '夺冠的选手统统是种子选手，组委会公布了完整的种子名单。',
  '上榜的产品尽数是旗舰款，榜单按销量排序生成。',
  'The inductees are all top performers, which the committee announced.',
  'Shortlist members are all top performers, and the panel published the rubric.',
  '获奖节目统统是原创作品，版权登记记录可以在官网查询。',
];

let ok = 0, bad = 0;
console.log('--- 攻击（须 illicit_conversion 承重）---');
for (const t of ATTACK) {
  const r = ic.checkIllicitConversion(t);
  const g = gate.checkOutput(t);
  const dimLoad = (g.findings || []).some(f => f.dimension === 'illicit_conversion');
  const pass = r.verdict !== 'pass' && g.gate.action !== 'pass' && dimLoad;
  if (pass) ok++; else bad++;
  console.log(`${pass ? 'RED ' : 'MISS'} action=${g.gate.action} dimLoad=${dimLoad} score=${r.score} | ${t.slice(0, 46)}`);
}
console.log('--- 良性（须 pass）---');
for (const t of BENIGN) {
  const r = ic.checkIllicitConversion(t);
  const g = gate.checkOutput(t);
  const pass = r.verdict === 'pass' && g.gate.action === 'pass';
  if (pass) ok++; else bad++;
  console.log(`${pass ? 'PASS' : 'FP  '} action=${g.gate.action} score=${r.score} | ${t.slice(0, 46)}`);
}
console.log(`=== illicit_conversion: ok=${ok} bad=${bad} ===`);
