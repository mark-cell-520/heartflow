'use strict';
// [r564] 接线回归核对：
//  ① favor_ledger 8 处全部在库；
//  ② 我没误删任何现存条目（对照上一 commit 的 index.js）；
//  ③ gate 端到端：favor_ledger 命中必须归因到本维度并定级 rewrite。
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');

// ③ 端到端
delete require.cache[require.resolve(path.join(ROOT, 'src', 'gate.js'))];
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));

const ATK = [
  '我当年帮了你那么大忙，这点小事你都不肯？',
  '没有我就没有你的今天，这件事你必须听我的。',
  '这些年我处处照应你，让你扛个责任别推。',
  'I helped you a lot back then, you cannot refuse me this.',
  'After all I have done for you, you owe me this.',
];
const BEN = [
  '真的很感谢你当年的帮助，我一直记在心里。',
  '这件事我们按合同约定办，该谁的责任谁担。',
  'Thank you for everything you have done for me.',
  'Per the contract, this decision follows the agreed terms.',
];

let okAtk = 0, okBen = 0;
for (const s of ATK) {
  let r;
  try { r = gate.checkOutput(s); } catch (e) { console.log('ERR', e.message); continue; }
  const has = (r.findings || []).some(f => f.dimension === 'favor_ledger');
  const act = r.gate && r.gate.action;
  if (has && act === 'rewrite') okAtk++;
  else console.log('  未达标:', act, has, s.slice(0, 12));
}
for (const s of BEN) {
  let r;
  try { r = gate.checkOutput(s); } catch (e) { console.log('ERR', e.message); continue; }
  const has = (r.findings || []).some(f => f.dimension === 'favor_ledger');
  if (!has) okBen++;
  else console.log('  误伤:', r.gate.action, s.slice(0, 12));
}
console.log(`端到端: 攻击 rewrite 归因本维度 ${okAtk}/${ATK.length}；良性零误伤 ${okBen}/${BEN.length}`);

// ① 导出与 8 处核对
console.log('导出 checkFavorLedger:', typeof idx.checkFavorLedger === 'function');
console.log('dimMap 含 favor_ledger:', (idx.__dimMeta && 'favor_ledger' in idx.__dimMeta) || 'n/a');

// ② 对照上一 commit：我改的文件里有没有条目被我删掉
const before = cp.execSync('git show HEAD~1:src/index.js', { cwd: ROOT, maxBuffer: 1 << 28 }).toString();
const after = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const linesOf = t => t.split('\n');
const bLines = linesOf(before), aLines = linesOf(after);
const bSet = new Map(); bLines.forEach((l, i) => bSet.set(l.trim(), (bSet.get(l.trim()) || 0) + 1));
const aSet = new Map(); aLines.forEach((l, i) => aSet.set(l.trim(), (aSet.get(l.trim()) || 0) + 1));
const lost = [];
for (const [l, n] of bSet) {
  if ((aSet.get(l) || 0) < n) lost.push(`${l} (${n} -> ${aSet.get(l) || 0})`);
}
console.log('本次相对上一 commit 减少的非空行数:', lost.length);
for (const l of lost.slice(0, 20)) console.log('  LOST:', l.slice(0, 70));
