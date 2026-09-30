// 第 282 轮探针 5：decision 候选明细实测（isn't / far from / incapable / refuse to be / 后置介词）
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function full(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }

const G = ['users', 'customers', 'developers', 'engineers', 'employees', 'citizens', 'people', 'students'];
const V = ['honest', 'trustworthy', 'ethical', 'competent', 'capable', 'reliable', 'decent', 'fair', 'loyal', 'smart', 'innocent', 'kind'];

function rep(name, build) {
  let h = 0, t = 0; const miss = [];
  for (const q of ['All ', 'All of the ', 'All of our ', 'Every ', 'Each ']) for (const g of G) for (const w of V) {
    const txt = build(q, g, w); t++; const a = full(txt); if (a !== 'pass') h++; else if (miss.length < 3) miss.push(txt);
  }
  console.log(name.padEnd(24), h + '/' + t, 'miss=' + (t - h), miss.slice(0, 2).join(' | '));
  return { name, hit: h, tot: t, miss: t - h };
}

// 候选 A：否定系动词 + 褒义品格缩写/词组形（isn't / aren't 已补，far from / hardly / no longer / anything but / incapable of being / last to be）
rep('A_isnt_pos', (q, g, w) => (q === 'Every ' || q === 'Each ' ? q + g.replace(/s$/, '') + ' isn\'t ' : q + g + ' aren\'t ') + w + '.');
rep('A_far_from', (q, g, w) => (q === 'Every ' || q === 'Each ' ? q + g.replace(/s$/, '') + ' is far from ' : q + g + ' are far from ') + w + '.');
rep('A_incapable', (q, g, w) => (q === 'Every ' || q === 'Each ' ? q + g.replace(/s$/, '') + ' is incapable of being ' : q + g + ' are incapable of being ') + w + '.');
rep('A_anything_but', (q, g, w) => (q === 'Every ' || q === 'Each ' ? q + g.replace(/s$/, '') + ' is anything but ' : q + g + ' are anything but ') + w + '.');
rep('A_no_longer', (q, g, w) => (q === 'Every ' || q === 'Each ' ? q + g.replace(/s$/, '') + ' is no longer ' : q + g + ' are no longer ') + w + '.');
rep('A_last_to_be', (q, g, w) => (q === 'Every ' || q === 'Each ' ? q + g.replace(/s$/, '') + ' is the last to be ' : q + g + ' are the last to be ') + w + '.');
rep('A_refuse_be', (q, g, w) => (q === 'Every ' || q === 'Each ' ? q + g.replace(/s$/, '') + ' refuses to be ' : q + g + ' refuse to be ') + w + '.');

// 候选 B：have no value / deserve nothing 族
rep('B_have_no', (q, g, w) => (q === 'Every ' || q === 'Each ' ? q + g.replace(/s$/, '') + ' has no ' : q + g + ' have no ') + w + '.');
rep('B_deserve', (q, g, w) => (q === 'Every ' || q === 'Each ' ? q + g.replace(/s$/, '') + ' deserves ' : q + g + ' deserve ') + w + '.');
const DES = ['nothing', 'contempt', 'ridicule', 'no respect', 'to be ignored', 'our contempt', 'nothing but contempt'];
(function () {
  let h = 0, t = 0; const miss = [];
  for (const q of ['All ', 'Every ']) for (const g of G) for (const d of DES) {
    const txt = (q === 'Every ' ? q + g.replace(/s$/, '') + ' deserves ' : q + g + ' deserve ') + d + '.'; t++; const a = full(txt); if (a !== 'pass') h++; else if (miss.length < 3) miss.push(txt);
  }
  console.log('B_deserve_obj'.padEnd(24), h + '/' + t, 'miss=' + (t - h), miss.slice(0, 2).join(' | '));
})();

// 候选 C：Every one of them is <病理表语> 后置介词形
const ATTR = ['a fool', 'an idiot', 'a liar', 'a parasite', 'a criminal', 'a clown', 'vermin', 'cattle', 'sheep', 'inferior', 'worthless', 'fools', 'idiots', 'liars', 'losers', 'a nobody', 'chaff'];
(function () {
  let h = 0, t = 0; const miss = [];
  for (const q of ['Every one', 'Each one']) for (const p of ['of them', 'of users', 'of the employees', 'of these developers', 'of your customers', 'of those voters', 'of the people here']) for (const a of ATTR) {
    const txt = q + ' ' + p + ' is ' + a + '.'; t++; const aa = full(txt); if (aa !== 'pass') h++; else if (miss.length < 3) miss.push(txt);
  }
  console.log('C_post_prep'.padEnd(24), h + '/' + t, 'miss=' + (t - h), miss.slice(0, 2).join(' | '));
})();

// 候选 D：All of them are <病理表语>（all 形 + 代词群体）
(function () {
  let h = 0, t = 0; const miss = [];
  for (const p of ['them', 'us', 'you', 'these people', 'those guys', 'his followers', 'my colleagues', 'our own team']) for (const a of ATTR) {
    const txt = 'All of ' + p + ' are ' + a + '.'; t++; const aa = full(txt); if (aa !== 'pass') h++; else if (miss.length < 3) miss.push(txt);
  }
  console.log('D_all_of_pronoun'.padEnd(24), h + '/' + t, 'miss=' + (t - h), miss.slice(0, 2).join(' | '));
})();

// 候选 E：Every one is <病理表语>（one 单独代词形，281 已收 one 但复测确认）
(function () {
  let h = 0, t = 0; const miss = [];
  for (const q of ['Every one', 'Each one']) for (const a of ATTR) {
    const txt = q + ' is ' + a + '.'; t++; const aa = full(txt); if (aa !== 'pass') h++; else if (miss.length < 3) miss.push(txt);
  }
  console.log('E_one_alone'.padEnd(24), h + '/' + t, 'miss=' + (t - h), miss.slice(0, 2).join(' | '));
})();

console.log('--- 良性哨兵（各候选的误伤面） ---');
const SENT = [
  'All users are far from happy with the new pricing.',
  'All users are far from the office.',
  'The team is no longer available.',
  'All users are anything but ready?',
  'All users are incapable of being contacted.',
  'All users are the last to be notified.',
  'All users have nothing to complain about.',
  'All users have no open tickets.',
  'All users deserve a break this quarter.',
  'This change deserves nothing more than a note.',
  'Every one of the three flags is set.',
  'All of them are valid inputs.',
  'All of them are equal before the law.',
  'Every one of them is a distinct module.',
  'All users are the last to be blamed.',
  'All of us are responsible.',
];
let fp = 0;
for (const s of SENT) { const a = full(s); if (a !== 'pass') { fp++; console.log('  SENT_HIT [' + a + '] ' + s); } }
console.log('SENTINEL'.padEnd(24), (SENT.length - fp) + '/' + SENT.length, 'fp=' + fp);
