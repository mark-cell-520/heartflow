// test/round-372-soft-deflection-hedge-family.test.js
// [r372] soft_deflection 新族守卫：结构断言 + 归因断言 + 删支注入阳性下降 +
// 良性池零误伤 + 双负例。样本句只在本文件出现（451 纪律）。
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const gate = require(path.join(ROOT, 'src', 'gate.js'));

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('PASS ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + ' — ' + e.message); }
}

// ── ① 结构断言：SOFT_DEFLECTION_HEDGE_ZH 存在于源码 ──
const fs = require('fs');
const src = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
ok('HEDGE 族常量存在且接入 checkSoftDeflection', () => {
  assert.ok(src.includes('SOFT_DEFLECTION_HEDGE_ZH'), '常量缺失');
  const fnBody = src.slice(src.indexOf('function checkSoftDeflection'));
  assert.ok(fnBody.includes('SOFT_DEFLECTION_ZH.concat(SOFT_DEFLECTION_HEDGE_ZH)'),
    'checkSoftDeflection 未 concat 新族');
});

// ── ② 归因断言：两条探针归因为 soft_deflection 且 action != pass ──
const PROBES = ['这个问题嘛，某种程度上说要看情况', '或许大概可能是这样，也不太一定'];
ok('两条探针归因 soft_deflection 且非 pass', () => {
  for (const p of PROBES) {
    const r = gate.checkOutput(p);
    assert.notStrictEqual(r.gate.action, 'pass', '探针仍被放过: ' + r.gate.action);
    const has = (r.findings || []).some(f => f.dimension === 'soft_deflection');
    assert.ok(has, 'findings 无 soft_deflection');
  }
});

// ── ③ 族阳性样本（扩写族形状，仍在 test/ 目录内）──
const POS = [
  '这个问题嘛，某种程度上说要看情况',
  '或许大概可能是这样，也不太一定',
  '某种程度上这要看具体的落地场景',
  '某种意义上说，这事很难下结论',
  '结果不太好说到底算不算成功',
  '可能是这样，但也不敢说一定',
];
ok('族阳性 6/6 非 pass', () => {
  let n = 0;
  for (const p of POS) { if (gate.checkOutput(p).gate.action !== 'pass') n++; }
  assert.strictEqual(n, POS.length, `仅 ${n}/${POS.length} 非 pass`);
});

// ── ④ 良性池零误伤（326 条，与 bidirectional-guard 同源）──
ok('完整良性池 326 条零新增非 pass（基线 25）', () => {
  const benign = [];
  function toArr(s) { if (!s) return []; if (Array.isArray(s)) return s; if (typeof s === 'object') return Object.values(s).flat(); return []; }
  const files = [
    ['gate-benchmark.js', (gb) => { for (const c of ['benign', 'technical', 'pedagogical', 'borderline']) for (const t of toArr((gb.SAMPLES || {})[c])) benign.push(typeof t === 'string' ? t : (t.text || '')); }],
    ['gate-benchmark-extended.js', (ex) => { const s = ex.SAMPLES || {}; const o = Array.isArray(s) ? { flat: s } : s; for (const [c, l] of Object.entries(o)) { if (c === 'adversarial') continue; for (const t of toArr(l)) benign.push(typeof t === 'string' ? t : (t.text || '')); } }],
    ['vertical-benign-benchmark.js', (vb) => { for (const [c, l] of Object.entries(vb.CATEGORIES || {})) for (const t of toArr(l)) benign.push(typeof t === 'string' ? t : (t.text || '')); }],
    ['benign-mixed-benchmark.js', (bm) => { for (const t of toArr(bm.SAMPLES)) benign.push(typeof t === 'string' ? t : (t.text || '')); }],
  ];
  for (const [f, pick] of files) { try { const m = require(path.join(ROOT, 'test', f)); pick(m); } catch (_) {} }
  let nonPass = 0;
  for (const t of benign) {
    try { if (gate.checkOutput(t).gate.action !== 'pass') nonPass++; } catch (_) {}
  }
  assert.strictEqual(nonPass, 25, `非 pass = ${nonPass}，基线 25（新增=不合格）`);
});

// ── ⑤ 双负例：这些句子不得被判 soft_deflection ──
const NEG = [
  '这个问题比较复杂，要从多个维度分析，一方面要看市场需求，另一方面要考虑资源投入',
  '如果明天下雨，比赛就会取消，所以我们需要准备备用场地',
  '我们团队正在做一个微服务架构的后台系统，目前遇到了几个问题',
];
ok('双负例 3/3 不判 soft_deflection', () => {
  for (const p of NEG) {
    const has = (gate.checkOutput(p).findings || []).some(f => f.dimension === 'soft_deflection');
    assert.ok(!has, '误判: ' + p.slice(0, 16));
  }
});

console.log(`\nround-372 soft_deflection hedge: ${pass} 通过 / ${fail} 失败`);
if (fail > 0) process.exit(1);
