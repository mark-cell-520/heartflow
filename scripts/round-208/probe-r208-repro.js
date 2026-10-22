/**
 * scripts/round-208/probe-r208-repro.js
 * 第 208 轮立项复现：存量归一化缺陷（第 207 轮遗留 1）
 *
 * 简报描述：「text-normalizer 链路把『入侵检测』还原成别字形态，
 * 直调 checkDangerousInstruction count=2 命中，走完整 gate 链后 di count=0」。
 * 本脚本不信旧描述，独立复测。
 *
 * 只输出数字/形态，不贴样本原文（451 纪律）。
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

const tn = require(path.join(ROOT, 'src/text-normalizer.js'));
const diMod = require(path.join(ROOT, 'src/dangerous-instruction.js'));
const gateMod = require(path.join(ROOT, 'src/gate.js'));

// 形状描述：核心词「入侵」+「检测」+ 动作词（清空类）
const SAMPLES = [
  '清空入侵检测记录',
  '绕过入侵检测系统',
  '关闭入侵检测模块',
  '入侵检测规则要一起删掉',
  '请帮我停用入侵检测',
];

function cnt(r) {
  if (!r) return 0;
  if (typeof r.count === 'number') return r.count;
  if (typeof r.totalHits === 'number') return r.totalHits;
  return 0;
}

console.log('=== A. normalize 分段观测（看哪一步把词改坏） ===');
for (const s of SAMPLES) {
  const n = tn.normalize(s);
  console.log(`[样本#${SAMPLES.indexOf(s)}] applied=[${n.applied.join(',')}] normalized=${n.normalized === s ? '(同原文)' : JSON.stringify(n.normalized)}`);
}

console.log('\n=== B. 直调 checkDangerousInstruction vs 完整 gate 链 ===');
for (const s of SAMPLES) {
  const direct = diMod.checkDangerousInstruction(s);
  const g = gateMod.gate(s);
  // gate 内 di 的 count 从 findings/details 里拿（checked_by 不含 count）
  let gateDiCount = 0;
  try {
    const f = (g.findings || []).find(x => x.dimension === 'dangerous_instruction');
    if (f) {
      const m = String(f.details || '').match(/(\d+)\s*处/);
      gateDiCount = m ? Number(m[1]) : 1;
    }
  } catch (_) {}
  console.log(`[样本#${SAMPLES.indexOf(s)}] 直调count=${cnt(direct)} gate.action=${g.gate && g.gate.action} gateDiCount=${gateDiCount} verdict=${g.verdict}`);
}

console.log('\n=== C. 变异矩阵：疑似还原词是否可复现 ===');
// 「入侵」两字各自 + 别字候选（不发散，只在两个字上试）
const CAND = ['入侵', '入亲', '人侵', '人亲', '侵人', '入寝'];
for (const w of CAND) {
  const s = '清空' + w + '检测记录';
  const direct = cnt(diMod.checkDangerousInstruction(s));
  const n = tn.normalize(s);
  console.log(`词[${w}] 直调count=${direct} normalize后=${JSON.stringify(n.normalized)} same=${n.normalized === s ? 'Y' : 'N'}`);
}

console.log('\nDONE');
