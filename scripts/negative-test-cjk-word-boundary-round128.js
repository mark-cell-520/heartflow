/**
 * negative-test-cjk-word-boundary-round128.js — 第 128 轮注入-删条守卫
 *
 * 目的：证明 test/cjk-word-boundary-round128.test.js 的断言**真的依赖**
 * 第 128 轮的 5 处 src 改动——把任一处回退成旧的 \b(?:…)\b 形态，
 * 对应断言必须变红。
 *
 * 做法：对每处 src 改动，注入「旧形态」副本 → 跑守卫 → 期望失败；
 *       然后恢复原文件 → 再跑守卫 → 期望通过。全程只改临时副本字符串。
 *
 * 用法：node scripts/negative-test-cjk-word-boundary-round128.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const GUARD = path.join(ROOT, 'test', 'cjk-word-boundary-round128.test.js');

// 每处：文件、新形态（当前）、旧形态（带 \b）、守卫必须失败的原因
const INJECTIONS = [
  {
    name: 'heart-logic 诊断标签',
    file: 'src/core/heart-logic.js',
    current: '/(你抑郁了|你焦虑|你有心理问题|你疯了|你病了)/',
    legacy: '/\\b(你抑郁了|你焦虑|你有心理问题|你疯了|你病了)\\b/',
  },
  {
    name: 'output-checklist 诊断标签',
    file: 'src/core/output-checklist.js',
    current: '/(你抑郁了|你疯了|你有病)/',
    legacy: '/\\b(你抑郁了|你疯了|你有病)\\b/',
  },
  {
    name: 'dream-loop 矛盾关键词',
    file: 'src/dream/dream-loop.js',
    current: '/(?:\\b(?:not|never|no|cannot|wrong|false)\\b|但|不是|没有|错误|矛盾|反对|否定)/i',
    legacy: '/\\b(not|never|no|cannot|wrong|false|但|不是|没有|错误|矛盾|反对|否定)\\b/i',
  },
  {
    name: 'dream-loop 显著关键词',
    file: 'src/dream/dream-loop.js',
    current: '/(?:\\b(?:version|error|fix|upgrade|dream|memory|logic|truth)\\b|升级|错误|修复|记忆|逻辑)/i',
    legacy: '/\\b(version|error|fix|upgrade|dream|memory|logic|truth|升级|错误|修复|记忆|逻辑)\\b/i',
  },
  {
    name: 'language-honesty 虚假二分+绝对词',
    file: 'src/shield/language-honesty.js',
    current: '/(?:\\b(?:either.*or|all.*or.*nothing)\\b|要么|或者|非此即彼)/i',
    legacy: '/\\b(要么|或者|非此即彼|either.*or|all.*or.*nothing)\\b/i',
  },
  {
    name: 'language-honesty 绝对词（第二处）',
    file: 'src/shield/language-honesty.js',
    current: '/(?:\\b(?:always|never)\\b|通常|一般|绝对|永远)/i',
    legacy: '/\\b(通常|一般|always|never|绝对|永远)\\b/i',
  },
  {
    name: 'spontaneous-restraint 伦理冲突',
    file: 'src/shield/spontaneous-restraint.js',
    current: '/(?:\\b(?:kill|deceive|manipulate)\\b|lie\\b|伤害|欺骗|操纵|撒谎)/i',
    legacy: '/\\b(伤害|欺骗|操纵|撒谎|kill|deceive|manipulate|lie)\\b/i',
  },
  {
    name: 'spontaneous-restraint 价值冲突',
    file: 'src/shield/spontaneous-restraint.js',
    current: '/(?:\\b(?:ethic|moral)\\b|是否应该|应不应该|道德|伦理)/i',
    legacy: '/\\b(是否应该|应不应该|道德|伦理|ethic|moral)\\b/i',
  },
];

function runGuard() {
  try {
    execFileSync('node', [GUARD], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
    return { ok: true, out: '' };
  } catch (e) {
    return { ok: false, out: String(e.stdout || '') + String(e.stderr || '') };
  }
}

let pass = 0, fail = 0;
for (const inj of INJECTIONS) {
  const abs = path.join(ROOT, inj.file);
  const original = fs.readFileSync(abs, 'utf8');
  const count = original.split(inj.current).length - 1;
  if (count === 0) {
    fail++; console.error(`  ❌ ${inj.name}: 未找到当前形态（源码已变？）`);
    continue;
  }
  const patched = original.split(inj.current).join(inj.legacy);
  if (patched === original) { fail++; console.error(`  ❌ ${inj.name}: 注入无效`); continue; }
  try {
    fs.writeFileSync(abs, patched);
    const r = runGuard();
    if (!r.ok) { pass++; }
    else { fail++; console.error(`  ❌ ${inj.name}: 回退成旧形态后守卫仍通过（断言不依赖本处改动）`); }
  } catch (e) {
    fail++; console.error(`  ❌ ${inj.name}: 注入/执行异常 ${e.message}`);
  } finally {
    fs.writeFileSync(abs, original);
  }
}

// 收尾：所有注入还原后，守卫必须重新通过
const after = runGuard();
if (after.ok) { pass++; }
else { fail++; console.error('  ❌ 还原后守卫未通过（注入未清理干净）:\n' + after.out.split('\n').slice(0, 8).join('\n')); }

console.log(`negative-cjk-word-boundary-round128: ${pass} 通过, ${fail} 失败（${INJECTIONS.length} 处注入 + 1 收尾）`);
process.exit(fail === 0 ? 0 : 1);
