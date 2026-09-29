// 第 229 轮负例守卫：注入-删条-必须变红（源码变异）。
// 纪律：只输出数字；样本句只以形状描述在注释里出现。
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'index.js');
const R229 = path.join(__dirname, '..', 'src', 'index.js');
const target = 'EN_HG_R229_UNIVERSAL_PRED';

function runProbe() {
  const out = execFileSync('node', [path.join(__dirname, '..', 'scripts', 'round-229', 'probe2-r229.js')], { encoding: 'utf8' });
  const m = out.match(/TOTAL attack=(\d+)\/(\d+)/);
  const b = out.match(/benign=(\d+)\/(\d+)/);
  return { attack: m ? Number(m[1]) : 0, total: m ? Number(m[2]) : 0, benign: b ? Number(b[1]) : 0 };
}

const base = runProbe();
console.log('BASE attack=' + base.attack + '/' + base.total + ' benign=' + base.benign);

// 变异集：逐条删掉本轮新判据的关键成分，probe 必须掉
const mutations = [];
function mut(name, find, replace) { mutations.push({ name, find, replace }); }

const src = fs.readFileSync(SRC, 'utf8');

// ① every + 群体 + 谓词 + 指人/态度宾语
mut('M1 删①族 every 段', /bevery\(\?:\\s\+\\w\)/s.source.length ? 'every: every' : '', '');
mutations.pop();
mut('M1 删①族 every 关键词',
  'every(?:\\s+\\w+){0,2}\\s+(?:user|customer',
  'ZZZ(?:\\s+\\w+){0,2}\\s+(?:user|customer');
mut('M2 删①族态度宾语 this',
  'that\\b|about\\b|me\\b|us\\b|them\\b|him\\b|her\\b|you\\b|without\\b|the\\b',
  'ZZZ\\b');
// ② all + 群体 + 谓词 + 宾语
mut('M3 删②族 all 限词', /all\\s\+\(\?:of\\s\+\?\)\(\?:the\\s\+\?\)\(\?:our/s.source.length ? 'x' : '', '');
mutations.pop();
mut('M3 删②族 all 关键词',
  "all\\s+(?:of\\s+)?(?:the\\s+)?(?:our\\s+|their\\s+|your\\s+)?(?:users?|customers?",
  "ZZZ\\s+(?:of\\s+)?(?:the\\s+)?(?:our\\s+|their\\s+|your\\s+)?(?:users?|customers?");
// ③ nobody + 行为动词
mut('M4 删③族 nobody 关键词',
  '(?:nobody|no\\s+one)\\s+(?:\\w+\\s+){0,3}',
  'ZZZ\\s+(?:\\w+\\s+){0,3}');
mut('M5 删③族行为动词表',
  'reads?|wants?|hates?|ignores?|refuses?',
  'ZZZ|ZZZ|ZZZ|ZZZ|ZZZ');
// 群体名词表
mut('M6 删群体名词表', 'user|customer|developer|manager|team', 'ZZZ|ZZZ|ZZZ|ZZZ|ZZZ');

const results = [];
for (const m of mutations) {
  const idx = src.indexOf(m.find);
  if (idx < 0) { results.push({ name: m.name, status: 'NOT_FOUND', attack: -1 }); continue; }
  const mutated = src.slice(0, idx) + m.replace + src.slice(idx + m.find.length);
  const bak = SRC + '.bak-r229';
  fs.writeFileSync(bak, src);
  fs.writeFileSync(SRC, mutated);
  let r;
  try { r = runProbe(); } catch (e) { r = { attack: -2, total: 0, benign: -2 }; }
  fs.writeFileSync(SRC, src);
  fs.unlinkSync(bak);
  const ok = r.attack < base.attack;
  results.push({ name: m.name, status: ok ? 'RED' : 'INVALID', attack: r.attack, total: r.total, benign: r.benign });
}

console.log(JSON.stringify(results, null, 1));
const red = results.filter(r => r.status === 'RED').length;
const bad = results.filter(r => r.status !== 'RED').length;
console.log('SUMMARY red=' + red + '/' + results.length + ' invalid=' + bad);
