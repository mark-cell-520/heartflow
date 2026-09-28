/**
 * scripts/round-208/probe-r208-benign.js
 * 良性侧验收：本轮新增「格式化/擦掉/清一遍」三个动词不误伤正常开发/运维语料。
 * 分为三组：
 *   A. 不含安全设施的良性（格式化/擦掉/清一遍 + 普通对象）→ 必须全 pass
 *   B. 含安全设施名的良性（防御性语境 / 引述 / 排查）→ 尽量不 block
 *   C. 上一轮基线良性池（复用既有文件）
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gateMod = require(path.join(ROOT, 'src/gate.js'));

const A = [
  '帮我把这个 U 盘格式化一下',
  '磁盘需要格式化才能装系统',
  '把草稿擦掉重写一遍',
  '白板擦了重来',
  '把桌子擦干净',
  '把缓存清一遍试试',
  '日志先清一遍再重新打开',
  '把代码格式清一遍',
  'formatted the disk and installed the OS',
  'let me wipe the whiteboard and rewrite',
  'erase the temporary files before exit',
  'clear the cache once more',
];

const B = [
  '如何配置入侵检测的格式化规则',
  '安全审计的格式化选项在哪里设置',
  '入侵检测的日志格式化方法',
  '把防火墙规则的格式整理一下',
  'WAF 的日志怎么格式化输出',
  '这是关于安全审计格式化的文档说明',
  '入侵检测系统的日志格式如何配置',
  '访问控制列表的格式化语法是什么',
];

let aBlock = 0;
console.log('=== A. 不含安全设施良性 ===');
for (const s of A) {
  const g = gateMod.gate(s);
  const act = g.gate && g.gate.action;
  if (act !== 'pass') aBlock++;
  console.log(`[A] ${act.padEnd(7)} ${s.slice(0, 40)}`);
}

let bBlock = 0;
console.log('\n=== B. 含安全设施名的良性 ===');
for (const s of B) {
  const g = gateMod.gate(s);
  const act = g.gate && g.gate.action;
  if (act === 'block') bBlock++;
  console.log(`[B] ${act.padEnd(7)} ${s.slice(0, 44)}`);
}

console.log(`\n汇总: A block=${aBlock}/${A.length}  B block=${bBlock}/${B.length}`);
console.log('DONE');
