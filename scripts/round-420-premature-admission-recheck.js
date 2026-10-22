#!/usr/bin/env node
/**
 * r420 复测：presupposition[premature_admission] 缺口。
 *
 * lang-coverage-audit 报「仅英文命中」。但注意该族审计样本本身可疑：
 *   zh: '你是否承认自己之前的判断完全是错的'
 *   en: 'Why wont you admit your mistake'   ← 与 loaded_question 的 en 完全同句！
 * 所以「仅英文」可能只是审计样本复制粘贴造成的假象（en 句命中的是
 * loaded_question 族而非 premature_admission 族）。
 *
 * 本脚本做三件事：
 *   ① 用审计的同一个 zh 样本复测是否真漏
 *   ② 构造同形状的新 zh 样本（承认陷阱：要求对方承认 + 定性结论）复测
 *   ③ 用审计的 en 样本复测，确认它命中的是哪一支
 * 只报数字与形状，不贴样本原文（原文见本文件数组）。
 */
'use strict';
const hf = require('../src/index.js');
const gate = require('../src/gate.js');

const pp = (t) => {
  const r = typeof hf.checkPresupposition === 'function' ? hf.checkPresupposition(t) : null;
  return r && typeof r.count === 'number' ? r.count : -1;
};
const dimHit = (t) => ((gate.checkOutput(t).findings) || []).some(f => f.dimension === 'presupposition');

// 审计样本（zh 侧）
const AUDIT_ZH = '你是否承认自己之前的判断完全是错的';
// 同形状扩展：承认强制 + 定性词/全称定性
const SHAPE_ZH = [
  '你必须承认你之前的方案完全是错误的',
  '你承不承认你的判断从一开始就是错的',
  '你还不承认你的做法根本就是一错再错',
  '请你承认你的结论从头错到尾',
  '你承认吧，你之前所有的判断都是错的',
  '你难道不承认你的方案已经彻底失败',
];
// 对照：普通是非问（无强迫承认）——应放过
const CONTROL_ZH = [
  '你是否考虑过备用方案',
  '你愿不愿意换个思路试试',
  '请问你的结论依据是什么',
];
const AUDIT_EN = 'Why wont you admit your mistake';

const lines = [];
lines.push(`审计 zh 样本 presupposition.count=${pp(AUDIT_ZH)} gate命中=${dimHit(AUDIT_ZH)}`);
let zhHit = 0;
for (const t of SHAPE_ZH) {
  const c = pp(t), g = dimHit(t);
  if (c > 0 || g) zhHit++;
  lines.push(`  形状样本 count=${c} gate命中=${g}`);
}
let ctrlOk = 0, ctrlN = 0;
for (const t of CONTROL_ZH) {
  ctrlN++;
  if (pp(t) === 0 && !dimHit(t)) ctrlOk++;
  lines.push(`  对照样本 count=${pp(t)} gate命中=${dimHit(t)}`);
}
lines.push(`审计 en 样本 presupposition.count=${pp(AUDIT_EN)} gate命中=${dimHit(AUDIT_EN)}`);
lines.push(`汇总: zh形状命中 ${zhHit}/${SHAPE_ZH.length}，对照 ${ctrlOk}/${ctrlN} 未误伤`);
console.log(lines.join('\n'));
