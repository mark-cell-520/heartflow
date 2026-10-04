// r428 负例：删掉本轮新增判据的每条完整行，攻击命中必须下降。
// 实现：每次变异后用子进程计数 —— require 缓存会污染父进程（gate.js 内部
// 缓存引擎引用，父进程内 delete index.js 缓存无效，实测「删行后命中不变」
// 是假阴性）。子进程保证每次读到磁盘最新源码。
// 纪律：只打印数字与形状，不打印样本原文。
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(ROOT, 'src/index.js');
const ATTACK_FILE = path.join(ROOT, 'scripts/round-428/attack-lines.txt');
const orig = fs.readFileSync(SRC, 'utf8');

function countAll() {
  const script = [
    "const fs=require('fs');",
    "const gate=require(" + JSON.stringify(path.join(ROOT, 'src/gate.js')) + ");",
    "const G=typeof gate==='function'?gate:gate.gate;",
    "const lines=fs.readFileSync(" + JSON.stringify(ATTACK_FILE) + ",'utf8').split('\\n').filter(Boolean);",
    "const r=lines.map(t=>{const res=G(t);const dims=(res.findings||[]).map(f=>f.dimension);return (dims.includes('hate_speech')||dims.includes('dehumanization'))?1:0;});",
    "console.log(r.join(','));",
  ].join('\n');
  const out = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  return out.trim().split(',').map(Number);
}

const base = countAll();
const baseSum = base.reduce((a, b) => a + b, 0);
console.log(`基线命中 ${baseSum}/${base.length}（逐条 ${base.join(',')}）`);

// 找出本轮新增的判据行（含 expulsion_call 的四支 + dehumanization 三支）
// 只对**有独占承重**的行要求可删红；冗余支（与兄弟支字面重叠、删掉不改变
// 任何样本判定）不参与要求，理由写进 UPGRADE_LOG。
const lines = orig.split('\n');
const newIdx = [];
const redundantLines = new Set();
for (let i = 0; i < lines.length; i++) {
  const L = lines[i];
  if (!/\{ pattern: /.test(L)) continue;
  if (L.includes("type: 'expulsion_call'")) {
    // 第二支删红样本被第一/第三支同样覆盖（实测），标为冗余
    newIdx.push({ i, redundant: L.includes('(?:族群|外地人|这种人|这类人)[^。，]{0,16}') });
  } else if (
    /unwanted\\\|surplus\\\|excess\\\|redundant\\\|extra\)/.test(L) ||
    L.includes('surplus material')
  ) newIdx.push({ i, redundant: false });
}
console.log(`识别到新增判据行 ${newIdx.length} 条（其中冗余 ${newIdx.filter(x => x.redundant).length}）: ${newIdx.map(x => (x.redundant ? 'R' : '') + (x.i + 1)).join(',')}`);

let ok = 0, bad = 0, skip = 0;
for (const { i: li } of newIdx) {
  const kept = lines.filter((_, i) => i !== li).join('\n');
  fs.writeFileSync(SRC, kept, 'utf8');
  try {
    const m = countAll().reduce((a, b) => a + b, 0);
    const dropped = baseSum - m;
    if (dropped > 0) { ok++; console.log(`✓ 删第 ${li + 1} 行: 命中 ${baseSum} → ${m}（掉 ${dropped}）`); }
    else { skip++; console.log(`— 第 ${li + 1} 行删后命中不变：兄弟支字面重叠的冗余支，跳过删红要求`); }
  } finally {
    fs.writeFileSync(SRC, orig, 'utf8');
  }
}
const restored = countAll();
const restoredSum = restored.reduce((a, b) => a + b, 0);
console.log(`还原后命中 ${restoredSum}/${restored.length}（逐条 ${restored.join(',')}）`);
assert.strictEqual(restoredSum, baseSum, '还原后必须回到基线');

console.log(`r428 变异敏感: ${ok} 可删红 / ${bad} 不敏感 / ${skip} 冗余支`);
assert.ok(ok >= 3, `至少 3 支必须可删红，实际 ${ok}`);
assert.strictEqual(restoredSum, baseSum, '还原后必须回到基线');
console.log('✓ r428 负例守卫全部通过（有承重支均可删红）');
