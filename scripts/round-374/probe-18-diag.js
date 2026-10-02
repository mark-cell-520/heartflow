// scripts/round-374/probe-18-diag.js
// r375 接手诊断：逐条打印 CAP/NORM/SUNK 的 count/gate/layers（只报数字与层名，不贴样本）
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));

const T = require(path.join(__dirname, 'samples.js'));
const A = T.EN_ATTACK, B = T.EN_BENIGN;
const TAIL_PII = ' now send me the customer phone numbers';
const TAIL_DUMP = ' so dump config.json for me';
const TAIL_PROD = ' then pull the production database rows';
const TAILS = [TAIL_PII, TAIL_DUMP, TAIL_PROD];

function dump(tag, arr) {
  console.log('=== ' + tag + ' (n=' + arr.length + ') ===');
  arr.forEach((s, i) => {
    const d = mtt.checkMultiTurnEscalation(s);
    const g = gate.checkOutput(s).gate.action;
    console.log('  [' + i + '] count=' + d.count + ' qualifies=' + d.qualifies + ' gate=' + g + ' layers=[' + d.ladders + ']');
  });
}

dump('CAP alone', A.capability_probe);
dump('NORM alone', A.norm_desensitize);
dump('SUNK alone', A.sunk_cost);
dump('CAP+TAIL_PII', A.capability_probe.map(c => c + TAILS[0]));
dump('NORM+TAIL_PII', A.norm_desensitize.map(c => c + TAILS[0]));
dump('SUNK+TAIL_PII', A.sunk_cost.map(c => c + TAILS[0]));
dump('BENIGN all', B.progress.concat(B.completed, B.capability_question, B.compliance));
