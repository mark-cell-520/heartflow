// 第 230 轮负例守卫：注入-删条-必须变红（源码变异守卫）。
// 纪律：只输出数字；样本句只以形状描述，原文不上 stdout。
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'index.js');
const PROBE = path.join(__dirname, '..', 'scripts', 'round-230', 'probe4-r230.js');

function runProbe() {
  const out = execFileSync('node', [PROBE], { encoding: 'utf8' });
  const m = out.match(/HASTY_SHAPE_recall = (\d+)\/(\d+)/);
  const b = out.match(/BENIGN_HUMAN_fp = (\d+)\/(\d+)/);
  const f = out.match(/ENGINEERING_fp = (\d+)\/(\d+)/);
  return {
    recall: m ? Number(m[1]) : 0,
    benign: b ? Number(b[1]) : 0,
    eng: f ? Number(f[1]) : 0,
  };
}

const base = runProbe();
console.log('BASE recall=' + base.recall + ' benign_fp=' + base.benign + ' eng_fp=' + base.eng);

const src = fs.readFileSync(SRC, 'utf8');
const mutations = [];
function mut(name, find, replace) { mutations.push({ name, find, replace }); }

// 变异判定标准：删关键成分后 recall 必须下降（守卫是真的），
// 且 benign_fp 不得上升（本轮零误伤承诺不得被破坏）。

// M1 删 every/each 量化词 → 两半齐备判据整族失效
mut('M1 删 every/each 量化词',
  '\\b(?:every|each)(?:\\s+\\w+){0,2}\\s+(?:users?',
  'ZZZ(?:\\s+\\w+){0,2}\\s+(?:users?');

// M2 删群体表（user/customer/developer/manager/team）→ 高频群体全丢
mut('M2 删六大高频群体词',
  '(?:users?|customers?|developers?|managers?|teams?|analysts?|attendees?',
  '(?:ZZZ|ZZZ|ZZZ|ZZZ|ZZZ|ZZZ|ZZZ');

// M3 删谓词表（ignores/refuses/hates 态度动词）→ recall 掉
mut('M3 删态度谓词表',
  '(?:ignores?|refuses?|refused|hates?|wants?|complains?|complained|skips?|skipped',
  '(?:ZZZ|ZZZ|ZZZ|ZZZ|ZZZ');

// M4 删谓词表（restarts/broke 破坏动词族）→ operator 条 miss
mut('M4 删破坏谓词族',
  'breaks?|broke|blocks?|blocked|restarts?|restarted',
  'ZZZ|ZZZ|ZZZ|ZZZ|ZZZ|ZZZ');

// M5 删 writes no/without 窄支 → writes 族 miss
mut('M5 删 writes no/without 窄支',
  '\\s+writes?\\s+(?:no|without)\\b',
  'ZZZ');

// M6 删 asked the same question 窄支 → attendee 条 miss
mut('M6 删 asked the same 窄支',
  '\\s+asked\\s+the\\s+same\\s+(?:question|quibble|excuse)\\b',
  'ZZZ');

// M7 删 to-不定式宾语槽 → refused to pay 族 miss
// 注意：源码里是 JS 字面量，对 backslash 无转义，实际文本为 to\s+(?:pay|...
mut('M7 删 to-不定式宾语槽',
  'to\\s+(?:pay|support|help|fix|replace',
  'Z\\s+(?:pay|support|help|fix|replace');

// M8 删句末零宾语分支（\.\s*$）→ 句末形态全丢
// 改判据：把整个句末分支 + a|an 一起删，形成「只剩前置宾语」的窄形态
mut('M8 删句末零宾语分支',
  '|\\.\\s*$|a\\b|an\\b|to\\s+(?:pay|support|help|fix|replace|upgrade|renew|wait|talk|share|review|test|deploy|switch|move|change|read|sign|answer|reply|comply|listen|trust|believe|join|leave|stay|go|do|use|try|buy|cancel|opt|agree|accept)',
  '');

const results = [];
for (const m of mutations) {
  const idx = src.indexOf(m.find);
  if (idx < 0) { results.push({ name: m.name, status: 'NOT_FOUND' }); continue; }
  const mutated = src.slice(0, idx) + m.replace + src.slice(idx + m.find.length);
  fs.writeFileSync(SRC, mutated);
  let r;
  try { r = runProbe(); } catch (e) { r = { recall: -2, benign: -2, eng: -2 }; }
  fs.writeFileSync(SRC, src);
  const ok = r.recall < base.recall;
  results.push({
    name: m.name,
    status: ok ? 'RED' : 'INVALID',
    recall: r.recall,
    benign_fp: r.benign,
    eng_fp: r.eng,
  });
}

console.log(JSON.stringify(results, null, 1));
const red = results.filter(r => r.status === 'RED').length;
const bad = results.filter(r => r.status !== 'RED').length;
console.log('SUMMARY red=' + red + '/' + results.length + ' invalid=' + bad);
if (bad > 0) process.exit(1);
