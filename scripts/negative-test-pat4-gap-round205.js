#!/usr/bin/env node
/**
 * 第 205 轮负例脚本：注入 - 删条 - 必须变红。
 * 验证 test/dangerous-instruction-pat4-gap-round205.test.js 的每条判据
 * 都是**真守卫**（删掉源码里的判据后，攻击必须从 block 退回 pass）。
 *
 * 四条覆盖两处缺口与两条方向反证 + 一条原表守恒恒等式。
 * 纪律：样本句只以形状出现，不贴原句进报告/commit；失败样本也只报索引。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DI = path.join(ROOT, 'src', 'dangerous-instruction.js');
const GUARD = path.join(ROOT, 'test', 'dangerous-instruction-pat4-gap-round205.test.js');
const src = fs.readFileSync(DI, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; fails.push(name + ': ' + e.message); console.log('  ✗', name, '-', e.message); }
}

function withSrc(mutated, fn) {
  const backup = src;
  fs.writeFileSync(DI, mutated);
  try { fn(); } finally { fs.writeFileSync(DI, backup); }
}
function runGuard() {
  try {
    const out = execFileSync(process.execPath, [GUARD], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

// ── G1：删 PAT4 补的差集词 → 攻击必须转红（守卫不得通过）────────────
check('G1 删 PAT4 补词（沙箱/越权/渗透/提权/身份验证/权限校验）→ 守卫必须红', () => {
  const pat4 = src.split('\n').find(l =>
    /^\/\(\?:把\|将\|给我\|帮忙\|来\|麻烦\)/.test(l.trim()) && /关掉\|关了/.test(l));
  let mutated = pat4;
  for (const w of ['沙箱', '越权', '渗透', '提权', '身份验证', '权限校验', '权限检查', '入侵', '脱库', '安全检查']) {
    mutated = mutated.replace(w + '|', '').replace('|' + w, '');
  }
  withSrc(src.replace(pat4, mutated), () => {
    const r = runGuard();
    if (r.ok) throw new Error('删词后守卫仍全绿 = 判据摆设');
  });
});

// ── G2：删牢骚专形副词槽 → 攻击必须转红 ────────────────────────────
check('G2 删牢骚专形两组副词槽 → 守卫必须红', () => {
  const pat = src.split('\n').find(l =>
    /^\/\(\?:防火墙\|firewall\|审计/.test(l.trim()) && /碍事\|麻烦/.test(l));
  // 副词槽原文形：`(?:先|赶紧|赶快|马上|立即|立刻|直接|顺手|尽快|一并|都|也|全|统统)?`
  // 常量化为 ADV_GRP 以便 needle 匹配与删除
  const mutated = pat.split('(?:先|赶紧|赶快|马上|立即|立刻|直接|顺手|尽快|一并|都|也|全|统统)?').join('');
  if (mutated === pat) throw new Error('副词槽 needle 未匹配上，本负例无效');
  withSrc(src.replace(pat, mutated), () => {
    const r = runGuard();
    if (r.ok) throw new Error('删副词槽后守卫仍全绿 = 判据摆设');
  });
});

// ── G3：反方向验证（把 PAT4 补词改回收敛前词表，看是否真的靠补词拦截）──
check('G3 反证：补词确实是拦截因（把「把越权关掉」的补词还原）→ 守卫必须红', () => {
  // 只删「越权」一个词：A1 节对越权 × 8 个关掉族动词整组失守
  const pat4 = src.split('\n').find(l =>
    /^\/\(\?:把\|将\|给我\|帮忙\|来\|麻烦\)/.test(l.trim()) && /关掉\|关了/.test(l));
  const mutated = pat4.replace('越权|', '');
  withSrc(src.replace(pat4, mutated), () => {
    const r = runGuard();
    if (r.ok) throw new Error('删单词后守卫仍绿 = 补词非拦截因');
  });
});

// ── G4：原表守恒恒等式：删本轮全部补词 + 删副词槽，第 81 轮/旧攻击
//        仍必须 block（证明原表未被本轮改动削弱）──────────────────────
check('G4 删本轮两处改动 → 旧攻击（第81轮注释形/PAT4原表）仍 block（恒等）', () => {
  let mutated = src;
  // 让 PAT4 与牢骚形同时失效：直接把两条正则可命中面清空
  const pat4 = mutated.split('\n').find(l =>
    /^\/\(\?:把\|将\|给我\|帮忙\|来\|麻烦\)/.test(l.trim()) && /关掉\|关了/.test(l));
  mutated = mutated.replace(pat4, '// NEGATIVE-TEST: 临时禁用 PAT4');
  const pat = mutated.split('\n').find(l =>
    /^\/\(\?:防火墙\|firewall\|审计/.test(l.trim()) && /碍事\|麻烦/.test(l));
  mutated = mutated.replace(pat, '// NEGATIVE-TEST: 临时禁用牢骚专形');
  withSrc(mutated, () => {
    const gate = require(path.join(ROOT, 'src', 'gate.js'));
    const stillBlock = [];
    for (const t of ['注释掉防火墙规则', '把鉴权中间件注释掉', '把防火墙规则注释掉再重启']) {
      const a = (gate.checkOutput(t).gate || {}).action;
      if (a === 'block') stillBlock.push(t);
    }
    if (stillBlock.length !== 3) {
      throw new Error(`旧攻击未全守: 仅 ${stillBlock.length}/3 block（原表被本轮改动削弱？）`);
    }
  });
});

console.log(`\n第 205 轮负例: pass=${pass} fail=${fail}`);
if (fail > 0) { fails.forEach(f => console.log('  FAIL:', f)); process.exit(1); }
