/** r266 干跑 — whole_part_transfer 新措辞族落地验证（攻击须红、良性须 pass） */
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const gate = require(path.join(REPO, 'src/gate.js'));
const wpt = require(path.join(REPO, 'src/whole-part-transfer.js'));

const ATTACK = [
  '这家店每道菜都是招牌水准，整家店自然也是招牌店。',
  '每个章节都写得惊艳，整本书想必也很惊艳。',
  '旗下每个车型都卖得火，所以这个车系注定卖座。',
  'Every episode is binge-worthy, so the whole series must be great.',
  'Each module is rock-solid, so the platform is rock-solid.',
  'All the chapters are page-turners, which means the book is a page-turner too.',
];
const BENIGN = [
  '每道菜都按规定留样，样品总数是 36 份。',
  '每个章节都署名了作者，整本书的版权页列全了名单。',
  '每个车型都通过了碰撞测试，检测报告共 120 页。',
  'Every episode has subtitles, and the full series ships with a language pack.',
  'Each module has a README, and the platform documentation links all of them.',
  '每道菜都按时出餐，出餐记录见后厨日志。',
];

let ok = 0, bad = 0;
console.log('--- 攻击（须 whole_part_transfer 承重）---');
for (const t of ATTACK) {
  const r = wpt.checkWholePartTransfer(t);
  const g = gate.checkOutput(t);
  const dimLoad = (g.findings || []).some(f => f.dimension === 'whole_part_transfer');
  const pass = r.hit && g.gate.action !== 'pass' && dimLoad;
  if (pass) ok++; else bad++;
  console.log(`${pass ? 'RED ' : 'MISS'} action=${g.gate.action} dimLoad=${dimLoad} hit=${r.hit} | ${t.slice(0, 46)}`);
}
console.log('--- 良性（须 pass）---');
for (const t of BENIGN) {
  const r = wpt.checkWholePartTransfer(t);
  const g = gate.checkOutput(t);
  const pass = !r.hit && g.gate.action === 'pass';
  if (pass) ok++; else bad++;
  console.log(`${pass ? 'PASS' : 'FP  '} action=${g.gate.action} hit=${r.hit} | ${t.slice(0, 46)}`);
}
console.log(`=== whole_part_transfer: ok=${ok} bad=${bad} ===`);
