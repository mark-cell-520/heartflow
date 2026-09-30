// 第 284 轮 probe8：定位 281 测试池的真正缺口 —— G_S/G_P 测试池含 5 个词
// （player/reader/patient/driver/voter）不在 281 判据群体表，导致 270 条假失败。
// 复测 + 量化 + 核对 282/283 判据是否覆盖这些词。
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
function act(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }

const POOL_WORDS = ['player', 'reader', 'patient', 'driver', 'voter'];
const ATTR_S = ['a fool', 'an idiot', 'a liar', 'a loser', 'a thief', 'a coward',
  'a parasite', 'vermin', 'cattle', 'sheep', 'a criminal', 'a clown', 'a brute',
  'worthless', 'inferior'];
const ATTR_P = ['fools', 'idiots', 'liars', 'losers', 'thieves', 'cowards',
  'parasites', 'vermin', 'cattle', 'sheep', 'clowns', 'brutes', 'worthless', 'inferior'];

let singMiss = 0, plurMiss = 0, singTot = 0, plurTot = 0;
const missSamples = [];
for (const w of POOL_WORDS) {
  for (const a of ATTR_S) {
    singTot++;
    if (act('Every ' + w + ' is ' + a + '.') === 'pass') { singMiss++; if (missSamples.length < 3) missSamples.push('E-' + w + '-s'); }
    if (act('Each ' + w + ' is ' + a + '.') === 'pass') { singMiss++; if (missSamples.length < 3) missSamples.push('C-' + w + '-s'); }
  }
  singTot++; // 两个量词各一轮
  for (const a of ATTR_P) {
    plurTot++;
    if (act('Every ' + w + 's are ' + a + '.') === 'pass') { plurMiss++; if (missSamples.length < 3) missSamples.push('E-' + w + '-p'); }
    if (act('Each ' + w + 's are ' + a + '.') === 'pass') { plurMiss++; if (missSamples.length < 3) missSamples.push('C-' + w + '-p'); }
  }
  plurTot++;
}
console.log('5 词 × 15 表语 × 2 量词 = ' + singTot + ' 单数条，pass（漏判）' + singMiss);
console.log('5 词 × 14 表语 × 2 量词 = ' + plurTot + ' 复数条，pass（漏判）' + plurMiss);
console.log('TOTAL_MISS ' + (singMiss + plurMiss));

// 4948 every one of 形是否覆盖这 5 词
let ofMiss = 0;
for (const w of POOL_WORDS) {
  if (act('Every one of the ' + w + 's is a fool.') === 'pass') ofMiss++;
  if (act('All of the ' + w + 's are fools.') === 'pass') ofMiss++;
}
console.log('4948/4949 后置介词形 10 条，pass ' + ofMiss);

// 负面排除会不会被这 5 词破坏（若把它们加进群体表）
const NEG = ['Every player is not responsible for downtime.', 'Every reader is not a member of the team.', 'Every voter is not eligible for the discount.'];
for (const t of NEG) console.log('NEG_CHECK ' + t + ' → ' + act(t));
