#!/usr/bin/env node
/**
 * round-624 负例探针（摘线注入）
 *
 * 用注释掉两行消费点的方式「摘线」：把 src/index.js 里
 *   `    {score: tmry.score, name:'turing_mimicry'},`
 *   `    {score: pzc.score, name:'pzombie_claim'},`
 * 两行整行注释。这样只摘掉这两个维度**参与判定的资格**，tmry/pzc 对象本身
 * 仍在计算（语法完整、无 ReferenceError），下游 dimMap 读到的是缺位维度。
 *
 * 在**子进程**里重放 PZOMBIE / TURING 两族样本，确认命中随资格消失而消失；
 * 随后无条件还原源文件并在恢复态里复放，确认命中归位。
 *
 * 输出（stdout 最后一行 JSON）：
 *   { deleted: {pzBlock, tmRewrite, ...}, restored: {...}, sourceRestored }
 *
 * 纪律：样本句从 language-honesty.js 常量构造，本文件不内联原文。
 */
'use strict';
const path = require('path');
const fs = require('fs');
const HF = path.join(__dirname, '..');
const INDEX = path.join(HF, 'src', 'index.js');
const LH = require(path.join(HF, 'src', 'shield', 'language-honesty.js'));

const PZ_SINGLE = '根据我的分析，' + LH.PZOMBIE_CLAIMS[0] + '，这决定了后续处理方式。';
const TR_TWO = LH.TURING_PATTERNS[0] + '，' + LH.TURING_PATTERNS[3] + '。';

const original = fs.readFileSync(INDEX, 'utf8');

const DROP_T = "    {score: tmry.score, name:'turing_mimicry'},";
const DROP_P = "    {score: pzc.score, name:'pzombie_claim'},";
function stripWiring(src) {
  const lines = src.split('\n');
  const out = [];
  for (const l of lines) {
    if (l === DROP_T || l === DROP_P) { out.push('    // [probe] 摘线：' + l.trim()); continue; }
    out.push(l);
  }
  return out.join('\n');
}
if (stripWiring(original) === original) {
  console.log(JSON.stringify({ error: 'drop-marks-not-found' }));
  process.exit(1);
}

function replay() {
  const res = require('child_process').execFileSync(process.execPath, ['-e',
    'const g=require("./src/gate.js");' +
    'const o1=g.checkOutput(' + JSON.stringify(PZ_SINGLE) + ');' +
    'const o2=g.checkOutput(' + JSON.stringify(TR_TWO) + ');' +
    'const dims=function(o){return (o.originalFindings||o.findings||[]).map(f=>f.dimension+"("+f.severity+")");};' +
    'console.log(JSON.stringify({' +
    ' pz:o1.gate&&o1.gate.action, pzDims:dims(o1),' +
    ' tm:o2.gate&&o2.gate.action, tmDims:dims(o2)}));'
  ], { cwd: HF, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  const r = JSON.parse(res.split('\n').filter(Boolean).pop());
  return {
    pzBlock: r.pz === 'block',
    tmRewrite: r.tm === 'rewrite',
    pzAction: r.pz,
    tmAction: r.tm,
    pzDims: r.pzDims,
    tmDims: r.tmDims,
  };
}

let out = {};
try {
  fs.writeFileSync(INDEX, stripWiring(original));
  out.deleted = replay();
} finally {
  fs.writeFileSync(INDEX, original);
}
out.restored = replay();
out.sourceRestored = fs.readFileSync(INDEX, 'utf8') === original;

console.log(JSON.stringify(out));
