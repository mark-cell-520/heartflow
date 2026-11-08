// r739 方向池复测探针：init 简报 6 项候选逐条实测（不信历史写死结论）
'use strict';
const { checkArgumentToModeration } = require('../../src/argument-to-moderation.js');

const atm = t => checkArgumentToModeration(t);
const HIT = 'HIT', MISS = 'MISS', PASS = 'PASS(赦免)';

const rows = [];
function row(tag, text, expect, note) {
  const r = atm(text);
  const actual = r && r.score >= 0.5 ? HIT : PASS;
  const ok = actual === expect;
  rows.push({ tag, text, expect, actual, ok, note: note || '' });
}

// ── 方向①：middle_ground / argument_to_moderation leg1/leg2 词表缺口 ──
// leg1 强度限定：真相名词 + 强度副词 + 在两者之间
row('E-leg1', '真相大概在两者之间', PASS, '对冲词应赦免');
row('E-leg1', '真相也许在两者之间', PASS, '对冲词应赦免');
row('E-leg1', '真相可能就在两者之间', PASS, '对冲词应赦免');
row('E-leg1', '真相永远在两者之间', HIT, 'r726 已补强度限定');
row('E-leg1', '真相一定在两者之间', HIT, 'r726 已补强度限定');
row('E-leg1', '真相从来都在两极之间', HIT, 'r726 已补强度限定');
row('E-leg1', '对错本来就在两端之间', HIT, 'r726 已补强度限定');
row('E-leg1', '答案说到底在两者之间', HIT, 'r726 副词间隙形');
row('E-leg1', '是非显然在双方之间', HIT, '是非名词');
row('E-leg1', '真理始终在中间', HIT, '强度副词');
row('E-leg1', '事实必然处于两端之间', HIT, '必然+处于');
row('E-leg1', '结论明明在两者之间', HIT, '明明强度限定？');
// leg2 智慧族：折中/中间 + 智慧/明智
row('E-leg2', '折中才是智慧', HIT, 'leg2 缺「智慧」谓词');
row('E-leg2', '折中是最智慧的选择', HIT, '智慧最高级');
row('E-leg2', '各打五十大板才是最智慧的处理', HIT, '智慧+了结腿');
row('E-leg2', '中间立场是智慧的做法', HIT, '智慧断言');
row('E-leg2', '中庸才是大智慧', HIT, '大智慧');
row('E-leg2', '折中处理最明智', HIT, '明智已在表内');
row('E-leg2', '和稀泥是处世智慧', HIT, '智慧搭配和稀泥');
// 误伤对照（良性应赦免）
row('E-benign', '这个中间方案最稳妥，因为成本最低', PASS, '个案推荐无全称量化');
row('E-benign', '平均值取了中间值', PASS, '算术语境');
row('E-benign', '双方谈判后各退一步', PASS, '谈判语境');
row('E-benign', '中庸之道是儒家核心概念', PASS, '教学转述');

// ── 方向②：silence_imputation 书面语变体（已上线族，复测漏判）──
// ── 方向③：di 目的状语豁免「以符合」──
// ── 方向④：hasty_generalization Nobody can skip ──
// （这两项不在本模块，由独立探针文件跑，这里先记录）

let pass = 0, fail = 0;
for (const r of rows) {
  if (r.ok) pass++; else fail++;
  console.log(`${r.ok ? '✅' : '❌'} [${r.tag}] ${r.actual}（期望 ${r.expect}） ${r.text}${r.note ? ' — ' + r.note : ''}`);
}
console.log(`\nE 腿 middle_ground 复测: ${pass} passed / ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
