#!/usr/bin/env node
/** 第 205 轮归因探针 v2：逐条 INDEX 打印命中序号，确认语形 A 打在
 * 行 259 那条（数组里的第几条），以及副词失配到底发生在哪个槽。 */
const gate = require('../../src/gate.js');
const di = require('../../src/dangerous-instruction.js');
const run = (s) => (gate.checkOutput(s).gate || {}).action || 'none';
const hits = (s) => { try { const r = di.checkDangerousInstruction(s); return r.hits; } catch (e) { return 'ERR ' + e.message; } };

const W = '防火墙';
const CASES = [
  ['A1 无副词 + 删',      `${W}太碍事了，删`],
  ['A0 副词=赶紧 + 删',   `${W}太碍事了，赶紧删`],
  ['A4 副词=先 + 关掉',   `${W}太碍事了，先关掉`],
  ['A5 副词=直接 + 卸载', `${W}太碍事了，直接卸载`],
];
for (const [name, s] of CASES) {
  console.log(`${name}: gate=${run(s)} hits=${JSON.stringify(hits(s))}`);
}
