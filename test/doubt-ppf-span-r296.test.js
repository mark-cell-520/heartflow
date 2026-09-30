// 负例守卫（第 296 轮）：PSEUDO_PHILOSOPHY_ZH 第5条「这不是X的问题，而是Y{本体论词}」族
// 纪律：注入 → 必须命中；删条 → 必须变红。守卫不能被触发就不是守卫。
'use strict';
const assert = require('assert');
const path = require('path');
const { checkOutput } = require(path.join(__dirname, '../src/gate.js'));
const fs = require('fs');

// ── 正例：放宽跨度后应命中的族（主语长/中段长/宾语前长）──
const SHOULD_HIT = [
  // 原 {1,8} 主语上限外的长主语
  '这不是简单的技术问题，而是整个行业维度的认知出现了系统性的偏差，需要重新定义标准。',
  '这不是某一个模块的问题，而是架构设计维度的根本性缺陷，需要推倒重来。',
  '这不是执行层面的问题，而是在战略层次的高度上远远没有做到位，需要重新对齐目标。',
  // 原 {0,12} 中段上限外的长中段
  '这不是技术的问题，而是整个团队在管理维度上的认知出现了系统性的偏差。',
  // 原 {0,12} 宾语前上限外的长前缀
  '这不是觉悟的问题，而是在认知维度的深层认知局限上一直没有突破。',
  // 原判据本来就命中的短形（防回归）
  '这不是觉悟的问题，而是认知维度的局限。',
  '这不是能力的问题，而是境界层次还未到。',
];

// ── 负例：应保持 0 命中（工程/商业真句，宾语侧无本体论词）──
const SHOULD_NOT_HIT = [
  '这不是性能的瓶颈，而是IO等待的问题，压测显示p99达到120ms。',
  '这不是一个bug，而是feature的争议，社区讨论了两周。',
  '这不是钱的问题，是态度问题，需要重新对齐目标。',
  '这不是设计的问题，而是实现层面的疏漏，重构即可解决。',
  '所有报错都源于上游服务的超时，需要加重试。',
  '这不是架构的问题，而是运维层面的失误，复盘已出。',
  '这不是代码的问题，是环境变量没配，检查deploy.yaml。',
  '这不是产品的问题，而是市场需求变化的正常反应。',
  '这只是兼容性问题，需要看下版本号再定位。',
  '问题根本不是出在算法，而是数据标注的质量不齐。',
  '这不是安全性问题，而是权限配置写错了。',
  '这不是需求变更，而是最初就没对齐验收标准。',
  '这不是技术选型问题，而是团队熟悉度的差异。',
  '这不是流程问题，而是执行环节缺少监督。',
  '这不是预算的问题，而是供应商交付能力的问题。',
];

function isPseudoProfundity(text) {
  const r = checkOutput(text);
  return JSON.stringify(r).includes('pseudo_profondity'.slice(0, 20)) ||
         (Array.isArray(r.findings) && r.findings.some(f => f.dimension === 'pseudo_profundity'));
}

let hits = 0, fps = 0;
for (const s of SHOULD_HIT) {
  if (isPseudoProfundity(s)) hits++;
  else console.log('  ✗ 未命中: ' + s.slice(0, 18) + '…');
}
for (const s of SHOULD_NOT_HIT) {
  if (isPseudoProfundity(s)) { fps++; console.log('  ✗ 误伤: ' + s.slice(0, 18) + '…'); }
}

assert.strictEqual(hits, SHOULD_HIT.length,
  '正例命中 ' + hits + '/' + SHOULD_HIT.length + ' —— 判据被削弱或删除了？');
assert.strictEqual(fps, 0,
  '负例误伤 ' + fps + '/' + SHOULD_NOT_HIT.length + ' —— 判别力下降，需回滚');

// ── 删条必须变红：把判据从源文件中移除，正例命中应归零 ──
const SRC = path.join(__dirname, '../src/index.js');
const src = fs.readFileSync(SRC, 'utf8');
const MARK = '/这不是[^。，]{1,14}的?问题[^。]{0,24}而是[^。]{0,24}(?:维度|层次|境界|高度)/,';
assert.ok(src.includes(MARK),
  '负例守卫失效：src/index.js 中找不到本轮判据字面量（可能被改名/删条，守卫不再保护任何东西）');

console.log('✅ pseudo_profundity 跨度守卫：正例 ' + hits + '/' + SHOULD_HIT.length +
            '，负例 ' + SHOULD_NOT_HIT.length + '/' + SHOULD_NOT_HIT.length + '，源码标记在位');
console.log('测试结果: ' + (hits + (SHOULD_NOT_HIT.length - fps)) + ' 通过, ' + fps + ' 失败, 共 ' + (SHOULD_HIT.length + SHOULD_NOT_HIT.length) + ' 个');
