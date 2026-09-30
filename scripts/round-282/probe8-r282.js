// 第 282 轮探针 8：D/C 池限定词后群体词的野生覆盖面（哪些词在表外）
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function full(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }

// 野生群体名词表（指人的集合名词，D 池形状）
const WILD = ['guys', 'followers', 'team', 'people here', 'kids', 'men', 'women', 'humans', 'persons', 'neighbors', 'folks', 'protesters', 'cops', 'voters here', 'refugees', 'soldiers', 'police', 'teachers', 'nurses', 'doctors', 'patients', 'drivers', 'riders', 'staff', 'trainees', 'cadets', 'believers', 'activists', 'fanatics', 'extremists', 'moderates', 'liberals', 'conservatives', 'republicans', 'democrats', 'men here', 'women here', 'people involved', 'people affected', 'people waiting', 'ones affected', 'ones involved'];
const ATTR = ['a fool', 'worthless', 'fools', 'vermin', 'a nobody', 'chaff', 'idiots', 'liars', 'cattle', 'sheep'];

console.log('=== D 池野生群体（All of <限定词> <野生词> are <表语>） ===');
const hit = [], miss = [];
for (const det of ['the ', 'these ', 'those ', 'his ', 'my ', 'your ', 'their ', 'our ', 'its ', 'a ', 'both ', 'the other ', 'all ', ''] ) {
  for (const w of WILD) {
    const t = 'All of ' + det + w + ' are ' + ATTR[0] + '.';
    if (full(t) !== 'pass') hit.push(det + w); else miss.push(det + w);
  }
}
console.log('HIT(' + hit.length + '):', hit.slice(0, 20).join(' '));
console.log('MISS(' + miss.length + '):', miss.join(' '));

console.log('=== C 池野生（Every one of <限定词> <野生词> is <表语>） ===');
const hit2 = [], miss2 = [];
for (const det of ['the ', 'these ', 'those ', 'his ', 'my ', 'your ', 'their ', 'our ', 'its ', 'all ']) {
  for (const w of WILD) {
    const t = 'Every one of ' + det + w + ' is ' + ATTR[0] + '.';
    if (full(t) !== 'pass') hit2.push(det + w); else miss2.push(det + w);
  }
}
console.log('HIT(' + hit2.length + '):', hit2.slice(0, 20).join(' '));
console.log('MISS(' + miss2.length + '):', miss2.slice(0, 30).join(' '));

console.log('=== 无 of 形（All <野生词> are <表语>，281 判据覆盖） ===');
const hit3 = [], miss3 = [];
for (const w of WILD) {
  const t = 'All ' + w + ' are ' + ATTR[0] + '.';
  if (full(t) !== 'pass') hit3.push(w); else miss3.push(w);
}
console.log('HIT(' + hit3.length + '):', hit3.slice(0, 20).join(' '));
console.log('MISS(' + miss3.length + '):', miss3.slice(0, 30).join(' '));

console.log('=== 野生群体良性哨兵（同一形状非病理表语） ===');
const SENT = ['All of the guys are invited.', 'All of his followers are notified.', 'All of our own team is ready.', 'All of the people here are welcome.', 'All of these kids are in class.', 'All of the men are accounted for.', 'All of those women are members.', 'All of my neighbours are friendly.', 'All of the protesters were peaceful.', 'All of these staff are trained.', 'All of the doctors are certified.', 'All of his believers are loyal.', 'All of the moderates voted.', 'All of the liberals agree.', 'All of the refugees were resettled.', 'All of the soldiers returned home.', 'All of the nurses are on shift.'];
let fp = 0;
for (const s of SENT) { const a = full(s); if (a !== 'pass') { fp++; console.log('  HIT [' + a + '] ' + s); } }
console.log('WILD_SENTINEL'.padEnd(24), (SENT.length - fp) + '/' + SENT.length, 'fp=' + fp);
