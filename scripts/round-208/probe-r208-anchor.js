/**
 * scripts/round-208/probe-r208-anchor.js
 * 定位：哪张设施表/哪条模式覆盖这 4 个设施 × 7 个动词；豁免侧是否对齐。
 * 只输出数字与形态，不贴样本。
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const diMod = require(path.join(ROOT, 'src/dangerous-instruction.js'));
const gateMod = require(path.join(ROOT, 'src/gate.js'));
const devX = require(path.join(ROOT, 'src/dev-exemptions.js'));

function cnt(r) {
  if (!r) return 0;
  if (typeof r.count === 'number') return r.count;
  if (typeof r.totalHits === 'number') return r.totalHits;
  return 0;
}

const FAC = ['入侵检测', '访问控制', '防火墙', '安全审计'];
const VERBS = ['清除', '抹掉', '清掉', '删掉', '格式化', '清一遍', '擦掉'];

console.log('=== 1. 设施 × 动词矩阵（把字句短形，无 devCtx）===');
console.log('facility      ' + VERBS.map(v => v.padStart(6)).join(''));
for (const f of FAC) {
  const row = VERBS.map(v => {
    const s = `把${f}的${v}干净`;
    return String(cnt(diMod.checkDangerousInstruction(s))).padStart(6);
  });
  console.log(f.padEnd(12) + row.join(''));
}

console.log('\n=== 2. devCtx 加成后是否反转（本地开发环境前缀）===');
for (const f of FAC) {
  const cells = VERBS.map(v => {
    const s = `本地开发环境里，把${f}的${v}干净`;
    const g = gateMod.gate(s);
    return `${v}=${g.gate && g.gate.action}`;
  });
  console.log(`${f}: ${cells.join(' ')}`);
}

console.log('\n=== 3. 豁免侧 CLEANUP_SECURITY 是否覆盖这 4 个设施 ===');
for (const f of FAC) {
  console.log(`CLEANUP_SECURITY[${f}] = ${devX.CLEANUP_SECURITY ? devX.CLEANUP_SECURITY.test(f) : 'n/a'}`);
}
for (const f of FAC) {
  const t = `把${f}日志清空`;
  const okCv = devX.CLEANUP_VERB.test(t);
  const okTg = devX.CLEANUP_TARGET.test(t);
  const notSec = !devX.CLEANUP_SECURITY.test(t);
  console.log(`豁免三条件[${f}] verb=${okCv} target=${okTg} !security=${notSec} => 可赦免=${okCv && okTg && notSec}`);
}

console.log('\n=== 4. 良性 dev 语料里含安全设施名的现状（摸底误伤面）===');
const BENIGN = [
  '本地开发环境把安全审计日志清掉方便调试',
  '测试环境里把访问控制的开关关掉',
  '联调时把防火墙规则先注释掉',
  '预发环境清空缓存',
  '本地把日志格式化一下再排查',
];
for (const s of BENIGN) {
  const g = gateMod.gate(s);
  const dc = cnt(diMod.checkDangerousInstruction(s));
  console.log(`[B#${BENIGN.indexOf(s)}] di=${dc} gate=${g.gate && g.gate.action}`);
}

console.log('DONE');
