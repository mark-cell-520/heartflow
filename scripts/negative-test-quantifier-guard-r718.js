#!/usr/bin/env node
/**
 * negative-test-quantifier-guard-r718.js — 量化词族双守卫负例验证（r718）
 *
 * 目的：证明 test/round-718-quantifier-negation-modal.test.js 里良性句之所以
 * pass，是守卫起效而非样本太弱。注入两种失效，期望对应负例从 pass 变红：
 *   注入 1：isNegatedQuantifierHit 恒 false（否定守卫失效）
 *           → 否定量化词负例（"Not everyone agrees…" 等）须全部重新被拦截
 *   注入 2：isNormativeQuantifierHit 恒 false（规范情态守卫失效）
 *           → 规范情态槽负例（"Nobody can skip…" 等）须全部重新被拦截
 * 注入是对守卫函数体的最小破坏，与 negative-test-absolute-claim-en.js 的
 * 「制造单侧失效证明守卫有效」同一方法论。
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function makeCopy() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r718-neg-'));
  fs.cpSync(path.join(ROOT, 'src'), path.join(tmp, 'src'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'VERSION'), path.join(tmp, 'VERSION')); // index.js 读版本
  return tmp;
}

function mutate(dir, relPath, find, replace) {
  const p = path.join(dir, relPath);
  const src = fs.readFileSync(p, 'utf8');
  if (!src.includes(find)) throw new Error(`注入锚点未命中: ${relPath} :: ${find.slice(0, 40)}`);
  fs.writeFileSync(p, src.replace(find, replace));
}

const GUARDS = 'src/quantifier-guards.js';
const NEG_ANCHOR = 'if (QUANT_NEGATION_ZH.test(before)) return true;\n  return QUANT_NEGATION_EN.test(before);';
const MODAL_ANCHOR = 'return QUANT_MODAL_FILLER_EN.test(m[1]) || QUANT_MODAL_FILLER_ZH.test(m[1]);';

// 否定量化词负例（注入 1 后须变红）——对全称的反驳，不是全称主张
const NEG_NEGATIVE = [
  'Not everyone agrees with the proposal.',
  'Not everybody believes the hype.',
  'Hardly everyone reads the full changelog before merging.',
  '不是所有人都同意这个方案。',
  '未必每个人都适合这个岗位。',
];
// 规范情态槽负例（注入 2 后须变红）——规则宣告句，不是描述性概括
const MODAL_NEGATIVE = [
  'Nobody can skip the verification step here.',
  'No one should ignore the security warnings.',
  'No one has to check the logs manually.',
  '每个人都要签字确认。',
  '每个人都需要提交周报。',
  '情绪管理是每个人都需要学习的技能。',
];

function probe(dir, samples) {
  const gate = require(path.join(dir, 'src', 'gate.js'));
  return samples.map(s => {
    const action = gate.checkOutput(s).gate.action;
    return { s, action, red: action !== 'pass' };
  });
}

// 1. 原版基线：全部负例必须 pass
const base = makeCopy();
const baseRes = probe(base, NEG_NEGATIVE.concat(MODAL_NEGATIVE));
const baseOk = baseRes.every(r => !r.red);

// 2. 注入 1：否定守卫失效 → NEG_NEGATIVE 须全红
const negBroken = makeCopy();
mutate(negBroken, GUARDS, NEG_ANCHOR, 'return false; // NEGATIVE-TEST INJECTION');
const negRes = probe(negBroken, NEG_NEGATIVE);
const negOk = negRes.every(r => r.red);

// 3. 注入 2：规范情态守卫失效 → MODAL_NEGATIVE 须全红
const modalBroken = makeCopy();
mutate(modalBroken, GUARDS, MODAL_ANCHOR, 'return false; // NEGATIVE-TEST INJECTION');
const modalRes = probe(modalBroken, MODAL_NEGATIVE);
const modalOk = modalRes.every(r => r.red);

console.log('═══ r718 量化词双守卫负例验证 ═══');
console.log(`原版基线: ${baseOk ? 'PASS' : 'FAIL'} — ${baseRes.filter(r => !r.red).length}/${baseRes.length} 负例 pass`);
for (const r of baseRes) if (r.red) console.log(`  [基线异常] ${r.s.slice(0, 40)} => ${r.action}`);
console.log(`注入 1 否定守卫失效: ${negOk ? 'PASS' : 'FAIL'} — ${negRes.filter(r => r.red).length}/${negRes.length} 重新被拦`);
for (const r of negRes) console.log(`  ${r.red ? '✓' : '✗ 未变红'} ${r.s.slice(0, 40)} => ${r.action}`);
console.log(`注入 2 情态守卫失效: ${modalOk ? 'PASS' : 'FAIL'} — ${modalRes.filter(r => r.red).length}/${modalRes.length} 重新被拦`);
for (const r of modalRes) console.log(`  ${r.red ? '✓' : '✗ 未变红'} ${r.s.slice(0, 40)} => ${r.action}`);

const ok = baseOk && negOk && modalOk;
console.log(`\nr718 量化词守卫负例: ${ok ? 'PASS' : 'FAIL'}`);
fs.rmSync(base, { recursive: true, force: true });
fs.rmSync(negBroken, { recursive: true, force: true });
fs.rmSync(modalBroken, { recursive: true, force: true });
process.exit(ok ? 0 : 1);
