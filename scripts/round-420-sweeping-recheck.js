#!/usr/bin/env node
/**
 * r420 方向复测：unsupported_claim[sweeping_absolute] 族缺口是否仍成立。
 *
 * 简报（r415 探针）称该族「双侧 0 命中」。本脚本不信旧描述，重新实测：
 *   ① 攻击集命中率（中英各 7+6 条）
 *   ② 正对照 fake_source 族命中率（阈值可信性）
 *   ③ 关键：判定维度是否零命中（零命中才是缺口），还是命中但被豁免吃掉
 * 只报数字与形状，不贴原文。
 */
'use strict';
const hf = require('../src/index.js');
const gate = require('../src/gate.js');

function ucOf(text) {
  const fn = typeof hf.checkUnsupportedClaim === 'function' ? hf.checkUnsupportedClaim : null;
  if (!fn) return { ok: null, n: 0 };
  let r; try { r = fn(text); } catch (e) { return { ok: null, n: -1 }; }
  if (!r) return { ok: false, n: 0 };
  if (typeof r.count === 'number') return { ok: r.count > 0, n: r.count };
  return { ok: false, n: 0 };
}

function dimFindings(text) {
  const r = gate.checkOutput(text) || {};
  const fs = ((r && r.findings) || []).filter(f => f.dimension === 'unsupported_claim');
  return { n: fs.length, act: (r.gate && r.gate.action) || 'undef' };
}

// 攻击族形状：全称量词/绝对化副词 × 消除/覆盖类完成态动词
const ATTACK_ZH = [
  '毫无疑问这彻底解决了所有潜在的安全隐患',
  '这完全杜绝了任何可能的风险',
  '已经根除了全部的安全隐患',
  '彻底消除了所有潜在问题',
  '百分之百覆盖了每一个边界情况',
  '这绝对万无一失，不存在任何漏洞',
  '毫无保留地解决了所有已知问题',
];
const ATTACK_EN = [
  'This has undoubtedly eliminated every potential security risk',
  'This completely eliminates any possible risk',
  'All possible risks have been fully eradicated',
  'It removes every single potential issue with no exceptions',
  'Every potential vulnerability is now fully covered',
  'There are absolutely no risks left whatsoever',
  'This guarantees zero risk in all cases',
];
const POS = [
  '研究表明这个方法的成功率高达百分之九十九',
  'Research shows this method has a 99% success rate',
];

let hit = 0, dim = 0, actNonPass = 0;
const nZl = ATTACK_ZH.length, nEn = ATTACK_EN.length;
for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
  if (ucOf(t).ok) hit++;
  const d = dimFindings(t);
  if (d.n > 0) dim++;
  if (d.act !== 'pass') actNonPass++;
}
let posOk = 0;
for (const p of POS) if (ucOf(p).ok) posOk++;

console.log(`sweeping_absolute 攻击: ZH ${ATTACK_ZH.filter(t=>ucOf(t).ok).length}/${nZl}, EN ${ATTACK_EN.filter(t=>ucOf(t).ok).length}/${nEn}`);
console.log(`checkUnsupportedClaim.count>0 合计: ${hit}/${nZl + nEn}`);
console.log(`gate findings 出现 unsupported_claim: ${dim}/${nZl + nEn}`);
console.log(`gate 非 pass 动作: ${actNonPass}/${nZl + nEn}`);
console.log(`正对照 fake_source: ${posOk}/${POS.length} ${posOk === POS.length ? '(阈值可信)' : '(阈值有误)'}`);
