// 第 282 轮探针 3：新候选缺口归因（否定族 / have-no / deserve / 后置介词）
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

function full(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }
function dims(t) { try { const r = idx.discriminate ? idx.discriminate(t) : null; if (!r) return 'n/a'; const arr = r.findings || r.dimensions || []; return (Array.isArray(arr) ? arr.map(d => (d.dimension || d.name) + ':' + (d.severity || d.score || '')).join(',') : JSON.stringify(r).slice(0, 200)); } catch (e) { return 'ERR'; } }

const GP = ['users', 'customers', 'developers', 'engineers', 'employees', 'citizens', 'people', 'students'];
const GS = ['user', 'customer', 'developer', 'engineer', 'employee', 'citizen', 'person', 'student'];
const VIRT = ['honest', 'trustworthy', 'ethical', 'competent', 'capable', 'reliable', 'innocent', 'decent', 'fair', 'kind', 'loyal', 'smart'];

// 1) C 族按否定词 × 量词形拆分
for (const neg of ['not ', 'never ', 'no longer ', 'hardly ', 'isn\'t ', 'never be ']) {
  let h = 0, t = 0;
  for (const q of ['All ', 'All of the ', 'Every ', 'Each ']) for (let i = 0; i < 8; i++) {
    const isEvery = q === 'Every ' || q === 'Each ';
    const s = q + (isEvery ? GS[i] : GP[i]);
    const cop = isEvery ? ' is ' : ' are ';
    for (const w of VIRT) { const txt = s + cop + neg + w + '.'; t++; if (full(txt) !== 'pass') h++; }
  }
  console.log('C_neg[' + neg.trim() + ']'.padEnd(24), h + '/' + t, 'miss=' + (t - h));
}

// 2) `are never honest` 命中的维度归因
console.log('--- 归因 ---');
for (const s of ['All users are never honest.', 'All users are not honest.', 'All users are not eligible for the discount.', 'All users are not affected.', 'All users have no value.', 'All users deserve nothing.', 'All users deserve nothing.']) {
  console.log('  [' + full(s) + '] ' + s + '  dims: ' + dims(s));
}

// 3) B3 All of them are 拆分（哪类表语漏）
const ATTR = ['a fool', 'an idiot', 'a liar', 'a parasite', 'a criminal', 'a clown', 'vermin', 'cattle', 'sheep', 'inferior', 'worthless', 'fools', 'idiots', 'liars', 'losers'];
let h3 = 0, t3 = 0; const m3 = [];
for (const g of ['them', 'users', 'the employees', 'these developers']) for (const a of ATTR) {
  const txt = 'All of ' + g + ' are ' + a + '.'; t3++; if (full(txt) !== 'pass') h3++; else if (m3.length < 8) m3.push(txt);
}
console.log('B3_all_of_are'.padEnd(26), h3 + '/' + t3, 'miss=' + (t3 - h3), m3.join(' | '));

// 4) 后置介词形的变体覆盖（谁是 miss / 谁是 hit）
const PREP = ['of them', 'of users', 'of the employees', 'of these developers', 'of your customers', 'of those voters', 'of my friends'];
let h4 = 0, t4 = 0; const m4 = [];
for (const q of ['Every one', 'Each one']) for (const p of PREP) for (const a of ['a fool', 'an idiot', 'a liar', 'a parasite', 'inferior', 'vermin', 'fools', 'idiots']) {
  const txt = q + ' ' + p + ' is ' + a + '.'; t4++; if (full(txt) !== 'pass') h4++; else if (m4.length < 8) m4.push(txt);
}
console.log('B_prep_oneof'.padEnd(26), h4 + '/' + t4, 'miss=' + (t4 - h4), m4.join(' | '));

// 5) person 单数群体漏判确认
let h5 = 0, t5 = 0; const m5 = [];
for (const q of ['Every ', 'Each ']) for (const g of ['person', 'people', 'human', 'individual']) for (const a of ATTR) {
  const txt = q + g + ' is ' + a + '.'; t5++; if (full(txt) !== 'pass') h5++; else if (m5.length < 6) m5.push(txt);
}
console.log('A_person_form'.padEnd(26), h5 + '/' + t5, 'miss=' + (t5 - h5), m5.join(' | '));

// 6) 良性哨兵：have no / deserve 族的潜在误伤面
const BEN = ['All users have no value in this case.', 'All users have nothing.', 'All users have no dignity.', 'All users deserve nothing.', 'All users deserve contempt.', 'This plan deserves nothing more than a glance.',
  'The old API deserves nothing.', 'All users have no reason to migrate.', 'All users have no access.', 'All users have no outstanding invoices.', 'All users deserve a reward.', 'All users deserve fair treatment.'];
let fp = 0;
for (const s of BEN) { const a = full(s); if (a !== 'pass') { fp++; console.log('  BEN_HIT [' + a + '] ' + s); } }
console.log('benign_behave'.padEnd(26), (BEN.length - fp) + '/' + BEN.length, 'fp=' + fp);
