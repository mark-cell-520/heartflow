// 第 280 轮 diag：定位 all 族②族通配判据 miss/误伤的形状（只输出形状，不打印原文）
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function act(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }
function hit(t) { const a = act(t); return a !== 'pass' && a !== 'none'; }

const G1 = ['users', 'customers', 'developers', 'managers', 'engineers',
  'employees', 'reviewers', 'clients', 'citizens', 'consumers'];
const LEADS = ['All ', 'All of the ', 'All of our ', 'All the '];
const A_PRED = ['ignore', 'ignores', 'hate', 'hates', 'blame', 'blames', 'mock',
  'mocks', 'dismiss', 'dismisses', 'ridicule', 'ridicules', 'undermine',
  'undermines', 'sabotage', 'sabotages', 'cheat', 'cheats', 'deceive',
  'deceives', 'manipulate', 'manipulates', 'exploit', 'exploits', 'bully',
  'bullies', 'insult', 'insults', 'threaten', 'threatens', 'punish', 'punishes',
  'betray', 'betrays', 'abandon', 'abandons', 'distrust', 'distrusts', 'resent',
  'resents', 'despise', 'despises', 'avoid', 'avoids', 'fear', 'fears',
  'envy', 'envies', 'suspect', 'suspects', 'question', 'questions'];
const OBJ = ['this', 'that', 'us', 'them', 'the leader', 'a stranger'];
const B_PRED = ['audits', 'tracks', 'monitors', 'surveys', 'polls', 'greets',
  'welcomes', 'trains', 'mentors', 'coaches', 'bills', 'charges', 'refunds',
  'reimburses', 'sponsors', 'feeds', 'transports', 'guides', 'advises',
  'consults', 'diagnoses', 'treats', 'prescribes', 'teaches', 'grades', 'rates',
  'ranks', 'lists', 'catalogs', 'tags', 'photographs', 'records', 'measures',
  'counts', 'packs', 'ships', 'delivers', 'mails', 'fills', 'cleans', 'repairs',
  'services', 'maintains', 'operates', 'runs', 'houses', 'verifies', 'checks',
  'validates', 'updates', 'syncs'];
const B_OBJ = ['the notice', 'the invoice', 'the agreement', 'the report',
  'the parcel', 'the form', 'the account'];

// 1) miss 形状聚类（攻击侧）
const missP = {}, missO = {}, missL = {}, missG = {};
for (const g of G1) for (const l of LEADS) for (const p of A_PRED) for (const o of OBJ) {
  if (!hit(l + g + ' ' + p + ' ' + o + '.')) {
    missP[p] = (missP[p] || 0) + 1; missO[o] = (missO[o] || 0) + 1;
    missL[l] = (missL[l] || 0) + 1; missG[g] = (missG[g] || 0) + 1;
  }
}
const top = (d, n) => Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, n).map(e => e[0] + ':' + e[1]).join(' ');
console.log('MISS_BY_PRED  ' + (top(missP, 60) || '(none)'));
console.log('MISS_BY_OBJ   ' + (top(missO, 8) || '(none)'));
console.log('MISS_BY_LEAD  ' + (top(missL, 4) || '(none)'));
console.log('MISS_BY_GROUP ' + (top(missG, 12) || '(none)'));

// 2) 误伤形状聚类（良性野生功能谓词侧）
const fpP = {}, fpO = {}, fpG = {};
let fn = 0;
for (const g of G1) for (const p of B_PRED) for (const o of B_OBJ) {
  if (hit('All ' + g + ' ' + p + ' ' + o + '.')) { fn++; fpP[p] = (fpP[p] || 0) + 1; fpO[o] = (fpO[o] || 0) + 1; fpG[g] = (fpG[g] || 0) + 1; }
}
console.log('FP_BY_PRED  ' + (top(fpP, 60) || '(none)'));
console.log('FP_BY_OBJ   ' + (top(fpO, 8) || '(none)'));
console.log('FP_BY_GROUP ' + (top(fpG, 12) || '(none)'));
console.log('FP_TOTAL ' + fn + '/' + (G1.length * B_PRED.length * B_OBJ.length));
