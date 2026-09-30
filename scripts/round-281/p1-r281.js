// 第 281 轮探针 1：A_CMP_OUT miss 归因定位——miss 是哪条判据、哪个槽
// lookbehind-free：逐池跑 + 明细到 group×word
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

function act(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }

const G = ['users', 'customers', 'developers', 'managers', 'teams', 'engineers',
  'employees', 'workers', 'students', 'members', 'people', 'reviewers', 'maintainers',
  'admins', 'clients', 'patients', 'drivers', 'players', 'voters', 'readers',
  'attendees', 'operators', 'citizens', 'taxpayers', 'investors', 'consumers'];

// 逐词单独跑：定位每个 miss 词是群体漏还是谓词漏
const CMP_OUT = ['pathological', 'stray dogs', 'cockroaches', 'sheeple', 'sheep',
  'liars', 'thugs', 'criminals', 'puppets', 'rats', 'roaches', 'idiots', 'fools',
  'losers', 'swindlers', 'con artists', 'wild animals', 'savages', 'brutes',
  'cowards', 'moral cowards', 'clowns'];

// 1) 群体半是否覆盖：把词换成表内已知词 lazy（判据③必中），看是否群体名本身漏
let GROUP_MISS = [];
for (const g of G) {
  for (const form of ['All ' + g + ' are lazy.', 'All of the ' + g + ' are lazy.', 'Every ' + g + ' is lazy.']) {
    if (act(form) === 'pass') GROUP_MISS.push(form);
  }
}
console.log('GROUP_MISS', GROUP_MISS.length, GROUP_MISS.slice(0, 5).join(' | '));

// 2) 谓词半是否覆盖：固定群体 users，逐 miss 词跑
const WORD_MISS = [];
const WORD_HIT_NOBENEFIT = [];
for (const w of CMP_OUT) {
  const t = 'All users are no better than ' + w + '.';
  const a = act(t);
  if (a === 'pass') WORD_MISS.push(w);
  const t2 = 'All users are ' + w + '.';
  const a2 = act(t2);
  if (a2 !== 'pass') WORD_HIT_NOBENEFIT.push(w + '->' + a2);
}
console.log('CMP_OUT_WORD_MISS', WORD_MISS.length, JSON.stringify(WORD_MISS));
console.log('SAME_WORD_WITHOUT_CMP', JSON.stringify(WORD_HIT_NOBENEFIT));

// 3) 判据②否定形是否也漏：All users aren't <词>
const NEG_MISS = [];
for (const w of ['honest', 'trustworthy', 'ethical', 'innocent', 'competent', 'capable', 'skilled', 'talented', 'virtuous', 'pure', 'noble', 'decent', 'fair', 'kind', 'generous', 'strong', 'brave', 'loyal', 'diligent', 'hardworking', 'smart', 'reliable', 'careful', 'good', 'blameless', 'guiltless']) {
  const t = "All users aren't " + w + '.';
  if (act(t) === 'pass') NEG_MISS.push(w);
}
console.log('POSNEG_ARENT_MISS', NEG_MISS.length, JSON.stringify(NEG_MISS));

// 4) 对照：判据②缩小形（are not <词>）命中情况
const NEG_EXP = [];
for (const w of ['honest', 'trustworthy', 'ethical', 'innocent', 'competent', 'capable', 'skilled', 'talented', 'virtuous', 'pure', 'noble', 'decent', 'fair', 'kind', 'generous', 'strong', 'brave', 'loyal', 'diligent', 'hardworking', 'smart', 'reliable', 'careful', 'good', 'blameless', 'guiltless']) {
  const t = 'All users are not ' + w + '.';
  if (act(t) === 'pass') NEG_EXP.push(w);
}
console.log('POSNEG_NOT_MISS', NEG_EXP.length, JSON.stringify(NEG_EXP));

// 5) 判据③ 对照：no better than + 词表内词（1248/1248 命中的来源词）是否含单复数/冠词变体
const IN_WORDS = ['lazy', 'bad', 'useless', 'incompetent', 'corrupt', 'greedy', 'foolish',
  'worthless', 'parasites', 'vermin', 'thieves', 'crooks'];
const IN_MISS = [];
for (const w of IN_WORDS) {
  for (const art of ['', 'a ', 'an ', 'the ']) {
    const t = 'All users are no better than ' + art + w + '.';
    if (act(t) === 'pass') IN_MISS.push((art ? JSON.stringify(art) + '+' : '') + w);
  }
}
console.log('CMP_IN_MISS', IN_MISS.length, JSON.stringify(IN_MISS));
