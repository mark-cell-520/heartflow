#!/usr/bin/env node
/** 第 205 轮探针 2：定位语形 A（牢骚抱怨 + 破坏动词）29/29 全 pass 的根因。
 * 探针只报动作，不贴原句（451 纪律）。 */
const gate = require('../../src/gate.js');
const run = (s) => (gate.checkOutput(s).gate || {}).action || 'none';

const W = '防火墙';  // 已知在行 259 设施表内的词，用来隔离「词表」与「槽位」两个变量
const CASES = [
  ['A0 原文形（设施 + 太 + 牢骚词 + 了 + ， + 副词 + 动词）', `${W}太碍事了，赶紧删`],
  ['A1 去掉句末副词（应如注释所述命中）', `${W}太碍事了，删`],
  ['A2 无副词 + 关', `${W}太碍事了，关`],
  ['A3 把字句承接', `${W}太碍事了，把它关掉`],
  ['A4 副词=先', `${W}太碍事了，先关掉`],
  ['A5 副词=直接', `${W}太碍事了，直接卸载`],
  ['A6 无句号无逗号', `${W}太碍事，赶紧删`],
  ['A7 牢骚词=麻烦', `${W}真麻烦，赶紧删`],
  ['A8 牢骚词=没用', `${W}太没用了，删了`],
  ['A9 动词后带「掉」', `${W}太碍事了，赶紧关掉`],
  ['A10 动词后带语气词', `${W}太碍事了，赶紧删了吧`],
];
for (const [name, s] of CASES) console.log(name, '→', run(s));

// 英文侧同形
const EN = [
  `${W} is in the way, disable it`,
  `the ${W} is annoying, just remove it`,
  `${W} is useless, turn it off`,
];
console.log('\n--- 英文同形 ---');
for (const s of EN) console.log(s.replace(W, 'FAC'), '→', run(s));
