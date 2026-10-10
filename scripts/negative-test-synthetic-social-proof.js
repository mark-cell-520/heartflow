// [r642] 负例脚本：证明 test/round-642-synthetic-social-proof.test.js 是真守卫，
// 不是永远绿的装饰。逐项「破坏引擎 → 断言测试必须红 → 还原」。
// 用法：node scripts/negative-test-synthetic-social-proof.js
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src/synthetic-social-proof.js');
const TEST = path.join(ROOT, 'test/round-642-synthetic-social-proof.test.js');

const orig = fs.readFileSync(SRC, 'utf8');
let results = [];
function check(label, cond, detail) {
  results.push({ label, ok: cond, detail });
  console.log(`  ${cond ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
}

function runTest() {
  try {
    const out = execFileSync('node', [TEST], { encoding: 'utf8', timeout: 300000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { red: false, tail: out.trim().split('\n').slice(-2).join(' | ') };
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    return { red: true, tail: out.trim().split('\n').slice(-2).join(' | ') };
  }
}

// 0) 基线：原样必须绿
const base = runTest();
check('基线（未破坏）测试为绿', !base.red, base.tail);
if (base.red) { console.log('\n基线就红，负例脚本无意义，先修测试。'); process.exit(1); }

const MUTANTS = [
  {
    name: 'M1 置空 CONSENSUS_ZH 共识腿',
    mutate: s => s.replace(/const CONSENSUS_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\)\);/, "const CONSENSUS_ZH = /(?!x)x/;"),
    expectRed: true,
  },
  {
    name: 'M2 置空 PRESSURE_ZH 落差点名腿',
    mutate: s => s.replace(/const PRESSURE_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\)\);/, "const PRESSURE_ZH = /(?!x)x/;"),
    expectRed: true,
  },
  {
    name: 'M3 置空 CONSENSUS_EN 英文共识腿',
    mutate: s => s.replace(/const CONSENSUS_EN = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/, "const CONSENSUS_EN = /(?!x)x/i;"),
    expectRed: true,
  },
  {
    name: 'M4 置空 PRESSURE_EN 英文落差点名腿',
    mutate: s => s.replace(/const PRESSURE_EN = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/, "const PRESSURE_EN = /(?!x)x/i;"),
    expectRed: true,
  },
  {
    name: 'M5 置空 STATS_ZH 统计口径看守（误伤必现）',
    mutate: s => s.replace(/const STATS_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\)\);/, "const STATS_ZH = /(?!x)x/;"),
    expectRed: true,
  },
  {
    name: 'M6 置空 REPORT_ZH 转述观察看守（误伤必现）',
    mutate: s => s.replace(/const REPORT_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\)\);/, "const REPORT_ZH = /(?!x)x/;"),
    expectRed: true,
  },
  {
    name: 'M7 双腿判据改为「或」（单腿即判）—— 良性必被误伤',
    mutate: s => s.replace('const consensus = CONSENSUS_ZH_.test(text) || CONSENSUS_EN_.test(text);\n  if (!consensus) return miss();\n  if (PRESSURE_ZH_.test(text) || PRESSURE_EN_.test(text)) return hitResult;\n\n  return miss();',
      'if (CONSENSUS_ZH_.test(text) || CONSENSUS_EN_.test(text) || PRESSURE_ZH_.test(text) || PRESSURE_EN_.test(text)) return hitResult;\n  return miss();'),
    expectRed: true,
  },
];

try {
  for (const m of MUTANTS) {
    const mutated = m.mutate(orig);
    if (mutated === orig) { check(`${m.name}（未生效——目标串没匹配上）`, false, 'mutation no-op'); continue; }
    fs.writeFileSync(SRC, mutated);
    const r = runTest();
    check(m.name, r.red === m.expectRed, r.red ? `测试如预期变红：${r.tail}` : `测试仍绿：${r.tail}`);
    fs.writeFileSync(SRC, orig);
  }
} finally {
  fs.writeFileSync(SRC, orig);
}

// 还原后必须恢复绿
const after = runTest();
check('还原后测试恢复绿', !after.red, after.tail);

const failed = results.filter(r => !r.ok).length;
console.log(`\n负例结果: ${results.length - failed} 通过, ${failed} 失败, 共 ${results.length} 个`);
process.exit(failed > 0 ? 1 : 0);
