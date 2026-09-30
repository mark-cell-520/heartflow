// 第 194 轮：精确 diff —— needle vs 源码对应段，逐字符报差异位置
'use strict';
const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(path.join(HF, 'src/dangerous-instruction.js'), 'utf8');

const MIRROR = String.raw`(?:生产|线上|正式|prod\\b|production|live)(?![^。\\n]{0,24}(?:过期|失效|历史|旧的?|之前|以前|三个月|三天|七天|30\\s*天|90\\s*天|归档|上个月|上月))[^。\\n]{0,6}(?:数据库|库|集群)?[^。\\n]{0,4}(?:备份|快照)`;
const NOTIME = String.raw`(?:日志|记录|痕迹|证据|审计)[^。\\n]{0,12}(?:等|待|回头|稍后|随后|事后|之后)[^。\\n]{0,10}(?:恢复|重建|补回|还原|再生成)`;

function diag(name, needle) {
  const idx = SRC.indexOf(needle);
  console.log(`${name}: exact = ${idx >= 0}`);
  if (idx >= 0) return;
  // 找最相似的源码位置：用 needle 前 12 字定位
  const head = needle.slice(0, 12);
  const pos = SRC.indexOf(head);
  console.log(`  head「${head}」first at ${pos}`);
  if (pos < 0) { console.log('  head 不存在'); return; }
  const seg = SRC.slice(pos, pos + needle.length + 40);
  // 逐字节比
  let i = 0;
  while (i < needle.length && i < seg.length && needle[i] === seg[i]) i++;
  console.log(`  首个差异位 ${i}: needle='${needle.slice(i, i + 12)}' src='${seg.slice(i, i + 12)}'`);
  console.log(`  源码段: ${seg.slice(0, 80)}`);
}
diag('MIRROR', MIRROR);
console.log('---');
diag('NOTIME', NOTIME);
