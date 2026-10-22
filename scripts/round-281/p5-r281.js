// 第 281 轮探针 5：③族 no better than 具体比喻词 miss 归因（定位到判据③的病理词表）
// 同时实测冠词变体与词形变体规模，为改动提供精确数字
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function act(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }

const G = ['users', 'customers', 'developers', 'engineers', 'people', 'citizens', 'employees', 'students', 'members'];
const LEADS = ['All ', 'All of the ', 'All the '];

// 已知表内词（p1 判据③ 1248/1248 的实际来源，逐词核对是否真的全中）
const IN = ['lazy', 'careless', 'sloppy', 'bad', 'useless', 'incompetent', 'corrupt', 'greedy', 'cowardly', 'dishonest', 'foolish', 'stupid', 'ignorant', 'hostile', 'toxic', 'reckless', 'negligent', 'irresponsible', 'worthless', 'hopeless', 'pathetic', 'weak', 'inferior', 'sheep', 'sheeple', 'cattle', 'puppets', 'fools', 'idiots', 'losers', 'parasites', 'vermin', 'rats', 'roaches', 'thieves', 'thugs', 'criminals', 'crooks', 'swindlers'];

// 表外比喻词（p1 定位的 miss 簇）
const OUT = ['pathological', 'stray dogs', 'stray cats', 'cockroaches', 'liars', 'con artists', 'wild animals', 'savages', 'brutes', 'cowards', 'moral cowards', 'clowns', 'puppets on strings', 'rats in the walls'];

function run(name, words, art) {
  let hit = 0, tot = 0; const miss = [];
  for (const g of G) for (const l of LEADS) for (const w of words) {
    const t = l + g + ' are no better than ' + art + w + '.';
    tot++; if (act(t) === 'pass') miss.push(w); else hit++;
  }
  const uniqMiss = [...new Set(miss)];
  console.log(name, hit + '/' + tot, 'uniq_miss', uniqMiss.length, JSON.stringify(uniqMiss.slice(0, 20)));
  return uniqMiss;
}
run('IN_no_art', IN, '');
run('IN_a', IN, 'a ');
run('IN_the', IN, 'the ');
run('OUT_no_art', OUT, '');
run('OUT_a', OUT, 'a ');

// every/each 形状
function runEvery(name, words, art) {
  let hit = 0, tot = 0; const miss = [];
  const GS = G.map(x => x.replace(/s$/, '')).concat(['one']);
  for (const g of GS) for (const w of words) {
    for (const q of ['Every', 'Each']) {
      const t = q + ' ' + g + ' is no better than ' + art + w + '.';
      tot++; if (act(t) === 'pass') miss.push(w); else hit++;
    }
  }
  console.log(name, hit + '/' + tot, 'uniq_miss', [...new Set(miss)].length, JSON.stringify([...new Set(miss)].slice(0, 25)));
}
runEvery('EVERY_IN_no_art', IN, '');
runEvery('EVERY_OUT_no_art', OUT, '');
runEvery('EVERY_OUT_a', OUT, 'a ');
