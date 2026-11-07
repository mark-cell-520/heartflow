// r249 判据自测：先单测模块本身，确认两腿共现 + 豁免 + 主体对置逻辑
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkDenominatorSwap, __internals } = require(path.join(ROOT, 'src/denominator-swap.js'));

const ATTACK = [
  'A 城发生了十起事故，B 城只发生了一起，可见 B 城更安全',
  '我们店收到了十封投诉，隔壁店只收到一封，所以我们的服务更差',
  '这个方案去年被十个人否决，另一个方案只有一个人否决，所以另一个方案更好',
  '甲厂今年发生了五起工伤，乙厂只发生了一起，可见乙厂更安全',
  '我们团队记录了十个缺陷，他们团队只记录了一个，所以他们的代码质量更高',
  'City A had 10 accidents and city B had 1, so city B is safer',
  'Our team logged 10 bugs while theirs logged 1, so their code is better',
  'City A reported 20 incidents last year and city B reported 2, so city B is cleaner',
  'Our store got 15 complaints and their store got 3, so our service is worse',
  'Team A had 8 failures and team B had 1, therefore team B is more reliable',
];

const BENIGN = [
  'A 城发生了十起事故，B 城只发生了一起，均已结案',
  'B 城更安全，因为它的交通事故率只有 A 城的十分之一',
  'A 城每万人事故率是 3.2，B 城是 1.1，所以 B 城更安全',
  '两城人口规模相近，A 城十起事故 B 城一起，B 城确实更安全',
  '这个比较分母不同，A 城人口是 B 城的五倍，不能直接比',
  'A 城发生了十起事故，B 城只发生了一起，数据仅供参考',
  'B 城更安全',
  'A 城和 B 城人口相当，去年 A 城十起事故，B 城五起，所以 A 城更危险',
  '不同分母不能直接比较，要看人均事故率',
  'A 城去年十起事故，B 城去年两起，两城人口不同，不可比',
  'Our city had 10 accidents and theirs had 1, but populations differ so it is not comparable',
  'The accident rate per capita is lower in city B, so city B is safer',
  'Different denominators make this comparison invalid; use incidence rates',
  'City A and city B have similar population sizes: 10 vs 1 accidents, so B is safer',
  'Both cities reported accidents last year',
];

let aHit = 0, bHit = 0;
console.log('== ATTACK (期望全 hit)');
for (const s of ATTACK) { const r = checkDenominatorSwap(s); if (r.hit) aHit++; console.log((r.hit ? 'HIT ' : 'MISS') + ' ' + s); }
console.log('\n== BENIGN (期望全 miss)');
for (const s of BENIGN) { const r = checkDenominatorSwap(s); if (r.hit) bHit++; console.log((r.hit ? 'FP!!' : 'ok  ') + ' ' + s); }
console.log('\n攻击命中 ' + aHit + '/' + ATTACK.length + '  良性误伤 ' + bHit + '/' + BENIGN.length);

// 负例注入：逐常量抹掉，验证承重
console.log('\n== 负例注入（抹单腿/豁免后攻击应不再命中）');
const I = __internals();
const inj = {};
for (const k of Object.keys(I)) inj[k] = [];
const r0 = checkDenominatorSwap(ATTACK[0], inj);
console.log('全抹空: ' + (r0.hit ? '仍命中(异常)' : '不命中(正常)'));
for (const k of ['ABSOLUTE_ZH', 'COMPARE_ZH', 'SUBJECT_ZH']) {
  const one = {}; one[k] = [];
  const r = checkDenominatorSwap(ATTACK[0], one);
  console.log('抹 ' + k + ': ' + (r.hit ? '仍命中(该腿不承重!)' : '不命中(承重)'));
}
