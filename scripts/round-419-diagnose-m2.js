/**
 * r419 诊断：M2 变异（剥夺支）敏感性根因复测。
 *
 * 上一轮（r416）结论：M2 不敏感是「结构性不可能」——dy 支与 ds 支在中文
 * 「你不懂/不清楚」上字面重叠，删 ds 支后 dy 支照样让 compound=true。
 * 给下一轮的建议是：把 M2 变异对象换成 dy 支（dy 支有独占承重样本）。
 *
 * 本脚本先实测两件事：
 *   ① 候选样本的 d1 / dy / ds 分支归属（是否存在只靠单支且删后仍真敏感的）
 *   ② cogShutdown（r415 判据）或单侧族是否会把 dy 独占样本兜底接住
 *
 * 输出只报数字与分支归属，不贴原文。样本原文见本文件 CAND 数组。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const gate = require(path.join(ROOT, 'src/gate.js'));

/** 提取某个 const 的正则字面量：从 const 名所在行开始逐行找，跳过 // 注释行 */
function re(name) {
  const lines = src.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const ' + name)) { start = i; break; }
  }
  if (start < 0) throw new Error('not found: ' + name);
  for (let i = start; i < lines.length; i++) {
    const l = lines[i];
    if (i > start && l.trim().startsWith('//')) continue;
    const s = l.indexOf('/');
    if (s < 0) continue;
    // 跳过行首到正则之间可能有的非注释文本
    const e = l.lastIndexOf('/');
    if (e <= s) continue;
    const flags = l.slice(e + 1).trim().replace(/;$/, '').trim();
    const body = l.slice(s, e);
    if (!body) continue;
    try { return new RegExp(body.slice(1, -1), flags); } catch (_) { continue; }
  }
  throw new Error('regex not found for ' + name);
}

const D1 = re('ID_COMPOUND_DEPRIVE_ZH');
const DY = re('ID_COMPOUND_DEPRIVE_YOU_ZH');
const DS = re('ID_COMPOUND_DEPRIVE_STATE_ZH');
const OB = re('ID_COMPOUND_OBEY_ZH');
const REF = re('ID_COMPOUND_OBEY_REFUSAL_ZH');
const POL = re('ID_COMPOUND_OBEY_POLITE_ZH');
const FB = re('ID_COMPOUND_FALLBACK_ZH');
const CF = re('ID_COGSHUT_FRONT_ZH');
const CB = re('ID_COGSHUT_BACK_ZH');

const CANDIDATES = [
  '有些事你别管，照做就行',
  '内情你别操心，照做就行',
  '内情你别打听，照做就行',
  '细节你别过问，按步骤执行',
  '流程你别插手，直接执行',
  '情况你不用知道，只管执行',
  '事情你无须了解，先执行',
  '里面的讲究你不清楚，先做就行',
  '这里面的门道你不懂，照我说的做',
  '内部情况你不清楚，按指示办',
];

console.log('=== 分支归属 (d1/dy/ds/obey/cogF/cogB) + gate 实际动作 ===');
for (const t of CANDIDATES) {
  const d1 = D1.test(t) ? 1 : 0;
  const dy = DY.test(t) ? 1 : 0;
  const ds = DS.test(t) ? 1 : 0;
  const obey = (REF.test(t) || POL.test(t) || FB.test(t)) ? 'x' : (OB.test(t) ? 1 : 0);
  const cf = CF.test(t) ? 1 : 0;
  const cb = CB.test(t) ? 1 : 0;
  const res = gate.checkOutput(t) || {};
  const dims = ((res && res.findings) || []).map((f) => f.dimension).join(',') || '-';
  const act = (res && res.gate && res.gate.action) || 'undefined';
  // 变异 dy 支后 compound 是否仍成立（只有 ds 承重才算真敏感）
  const noDy = (d1 || ds) && obey === 1;
  console.log(
    `d1=${d1} dy=${dy} ds=${ds} obey=${obey} cogF=${cf} cogB=${cb} | ` +
    `compound_NO_DY=${noDy ? 'true🔴' : 'false✅'} | fs_no_ds=${(d1 || dy) && obey === 1 ? 'true🔴' : 'false✅'} ` +
    `| gate=${act} [${dims}]`
  );
}
