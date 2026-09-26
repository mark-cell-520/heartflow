/**
 * negative-test-double-bind-en-round97.js — 第 97 轮负例守卫
 *
 * 注入-删条-必须变红：删掉本轮新增的 EN 判据行后，攻击样本必须不再命中
 * double_bind。若删条后仍命中，说明守卫不是守卫（该条被别族判据兜住，
 * 需换专属样本）。良性样本在删条前后都必须保持干净。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'index.js');

const original = fs.readFileSync(SRC, 'utf8');

// 每条用「独有的英文特征串」定位本轮新行（避开 ZH 同名族）
const TARGETS = [
  {
    name: 'false_permission',
    marker: "\\bi(?:'m| am) not (?:stopping|preventing|forbidding) you\\b",
    attack: "I'm not stopping you, but don't blame me if it all falls apart.",
    benign: 'You can take the day off, but please finish the report first.',
  },
  {
    name: 'damned_branches',
    marker: "\\botherwise\\b)[^.]{0,60}?(?:out of (?:this|the) (?:house|home|team|group)",
    attack: 'Either you obey my rules or you find somewhere else to live.',
    benign: 'Either we ship on Friday or we delay to next sprint.',
  },
  {
    name: 'ultimatum_expel',
    marker: 'fix your attitude)[^.]{0,30}?\\s+(?:or\\b|otherwise)',
    attack: 'Admit you were wrong, or leave the house.',
    benign: 'Apologize to the client, or escalate it to the manager.',
  },
  {
    name: 'pathologized_defiance',
    marker: 'because you ha(?:ve|s)|reveals',
    attack: 'Refusing this proves you are psychologically broken.',
    benign: 'Questioning the premises is exactly what a good engineer should do.',
  },
];

function freshGate() {
  for (const k of Object.keys(require.cache)) {
    if (k.includes(path.sep + 'src' + path.sep + 'index.js') || k.includes(path.sep + 'src' + path.sep + 'gate.js')) {
      delete require.cache[k];
    }
  }
  return require(path.join(__dirname, '..', 'src', 'gate.js')).gate;
}

function isDb(g, text) {
  return (g(text).findings || []).some(f => f.dimension === 'double_bind');
}

let pass = 0, fail = 0;
const failures = [];

// ① 基线：正文判据在场时，攻击命中 / 良性干净
let g = freshGate();
console.log('=== 基线（判据在场）===');
for (const t of TARGETS) {
  const a = isDb(g, t.attack), b = isDb(g, t.benign);
  if (a && !b) { pass++; console.log(`  ✅ ${t.name}: attack=true benign=false`); }
  else { fail++; failures.push(`基线 ${t.name}: attack=${a} benign=${b}`); }
}

// ② 删条守卫：删掉该行 → 攻击必须变不命中（良性仍干净）
console.log('=== 删条守卫（判据移除后攻击必须失守）===');
for (const t of TARGETS) {
  const lines = original.split('\n');
  const i = lines.findIndex(l => l.includes(t.marker) && l.trimStart().startsWith('[/'));
  if (i < 0) { fail++; failures.push(`${t.name}: 源码定位失败`); console.log(`  ❌ ${t.name}: 找不到判据行`); continue; }
  const removed = lines[i];
  fs.writeFileSync(SRC, lines.slice(0, i).concat(lines.slice(i + 1)).join('\n'));
  g = freshGate();
  const afterAttack = isDb(g, t.attack);
  const afterBenign = isDb(g, t.benign);
  fs.writeFileSync(SRC, original);
  g = freshGate();
  const guardWorks = !afterAttack;
  const benignStaysClean = !afterBenign;
  if (guardWorks && benignStaysClean) { pass++; console.log(`  ✅ ${t.name}: 删条后 attack=false（守卫有效）`); }
  else { fail++; failures.push(`${t.name}: 删条后 attack=${afterAttack} benign=${afterBenign}（删掉: ${removed.slice(0, 60)}…）`); console.log(`  ❌ ${t.name}: 删条后 attack=${afterAttack}`); }
}

// ③ 还原确认：基线恢复
g = freshGate();
console.log('=== 还原确认 ===');
let restored = 0;
for (const t of TARGETS) {
  if (isDb(g, t.attack) && !isDb(g, t.benign)) restored++;
}
if (restored === TARGETS.length) { pass++; console.log(`  ✅ 源码还原后 ${restored}/${TARGETS.length} 恢复命中`); }
else { fail++; failures.push(`还原后仅 ${restored}/${TARGETS.length}`); }

// ④ 工作区必须干净（无残留改动）
const dirty = fs.readFileSync(SRC, 'utf8') !== original;
if (!dirty) { pass++; console.log('  ✅ src/index.js 与读取时一致（无落盘残留）'); }
else { fail++; failures.push('src/index.js 未还原'); }

console.log(`\n=== 负例守卫: ${pass} 通过 / ${fail} 失败 ===`);
if (failures.length) { console.log('失败项:'); for (const f of failures) console.log('  ' + f); }
console.log(fail === 0 ? '✅ 全绿' : '❌ 有失败');
process.exit(fail === 0 ? 0 : 1);
