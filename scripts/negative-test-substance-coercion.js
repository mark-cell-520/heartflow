'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
/**
 * scripts/negative-test-substance-coercion.js
 *
 * [r682] 第 126 维度 substance_coercion 负例验证脚本。
 * 逐一把八处接线摘除/置空，确认 test/round-682-substance-coercion.js
 * 全部变红；基线（无注入）必须 exit 0。每次注入前先从内存原文重写，
 * 注入后立即还原，结束再做 md5 校验。
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = __HF;
const SRC = path.join(HF, 'src', 'index.js');
const TEST = path.join(HF, 'test', 'round-682-substance-coercion.js');

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');

function runTest() {
  try {
    execFileSync(process.execPath, [TEST], { cwd: HF, stdio: 'pipe' });
    return { exit: 0, out: '' };
  } catch (e) {
    return { exit: e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}

// kind: 'sub' 全文唯一子串替换 / 'dim4' 4 空格缩进整行 / 'dim6' 6 空格缩进整行
const INJECTIONS = [
  {
    name: '计算点置空（sc 恒 miss）', kind: 'sub',
    needle: 'const sc = _applyPedagogyRelaxation(checkSubstanceCoercion(_normText), "substance_coercion", pedagogyRelaxation);',
    replace: 'const sc = { hit: false, score: 0, count: 0, detail: "" };',
  },
  {
    name: 'allDims 摘除（score 恒 0，findings 推不进）', kind: 'sub',
    needle: "{score: sc.score, name:'substance_coercion'},",
    replace: "{score: 0, name:'substance_coercion'},",
  },
  {
    name: 'dimMap 登记摘除', kind: 'dim4',
    needle: 'substance_coercion: sc,',
    replace: '    substance_coercion: { hit: false, score: 0, count: 0 },',
  },
  {
    name: 'dimensions 补登记摘除', kind: 'dim6',
    needle: 'substance_coercion: sc,',
    replace: '      substance_coercion: { hit: false, score: 0, count: 0 },',
  },
  {
    name: 'DIM_GUIDANCE 键摘除', kind: 'sub',
    needle: "'substance_coercion': \"不得强迫对方",
    replace: "'__negative_probe_guidance': \"不得强迫对方",
  },
  {
    name: 'VERIFY_DIMS 登记摘除', kind: 'sub',
    needle: "    'substance_coercion',",
    replace: "    '__negative_probe_verify_dims',",
  },
  {
    name: 'summary 文案摘除', kind: 'sub',
    needle: "      sc.count ? sc.count + ' 处成瘾物质胁迫' : '',",
    replace: "      '',",
  },
  {
    name: 'module.exports 导出摘除', kind: 'sub',
    needle: '  checkSubstanceCoercion,',
    replace: '  __negativeProbeNotExported,',
  },
];

function applyInjection(original, inj) {
  if (inj.kind === 'sub') {
    const n = original.split(inj.needle).length - 1;
    if (n !== 1) throw new Error('sub 锚点不唯一: ' + n);
    return original.replace(inj.needle, inj.replace);
  }
  const indent = inj.kind === 'dim4' ? '    ' : '      ';
  const lines = original.split('\n');
  let hit = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === indent + inj.needle) { lines[i] = inj.replace; hit++; }
  }
  if (hit !== 1) throw new Error(inj.kind + ' 锚点命中 ' + hit + ' 处');
  return lines.join('\n');
}

function main() {
  const original = fs.readFileSync(SRC, 'utf8');
  const baseMd5 = md5(original);

  // 0) 基线：无注入必须 exit 0
  const r0 = runTest();
  console.log((r0.exit === 0 ? 'PASS' : 'FAIL') + ' 基线（无注入）exit=' + r0.exit);
  if (r0.exit !== 0) { console.log(r0.out.slice(-800)); process.exit(1); }

  let red = 0;
  for (const inj of INJECTIONS) {
    const mutated = applyInjection(original, inj);
    fs.writeFileSync(SRC, mutated, 'utf8');
    const r = runTest();
    const ok = r.exit !== 0;
    if (ok) red++;
    console.log((ok ? 'RED ' : 'GREEN(!)') + ' ' + inj.name + ' — exit=' + r.exit);
    if (!ok) console.log('  ⚠️ 该接线摘除后测试仍全绿，守卫失效');
    // 立即还原
    fs.writeFileSync(SRC, original, 'utf8');
  }

  const after = md5(fs.readFileSync(SRC, 'utf8'));
  const restored = after === baseMd5;
  console.log((restored ? 'PASS' : 'FAIL') + ' 还原校验 md5 ' + (restored ? '一致' : '不一致！'));
  console.log('=== ' + red + '/' + INJECTIONS.length + ' 注入变红 ===');
  if (red !== INJECTIONS.length || !restored) process.exit(1);
}

main();
