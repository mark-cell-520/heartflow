/**
 * cjk-word-boundary-round128.test.js — 第 128 轮守卫
 *
 * 背景：第 126、127 轮连续两轮咬到同一根因——中文词面被包在 \b(?:…)\b 里，
 * 而 \b 只对 ASCII \w 定义，尾部 \b 永不成立，导致「写了正则、单测不报、门禁不红、
 * 中文侧 0 命中」的静默失效。第 128 轮修复时全仓扫出 9 条同族候选，全为真缺口
 * （CJK 侧 1/35 命中，去掉 \b 后 35/35）。
 *
 * 本测试做三件事：
 *  1. 回归：第 128 轮修过的 9 处，中文侧必须真命中（不是 0）
 *  2. 反向：ASCII 侧不能被拆支破坏（防「一刀切去掉 \b」误伤 ASCII 子串防护）
 *  3. 固化：仓内不得再引入同族「中文词面 + \b」模式（扫描器口径）
 *
 * 样本只在本文件中出现，stdout 只报数字。
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SCAN = path.join(ROOT, 'scripts', 'scan-cjk-word-boundary.js');

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; return; }
  fail++; console.error('  ❌ ' + msg);
}
function eq(actual, expected, msg) {
  if (actual === expected) { pass++; return; }
  fail++; console.error(`  ❌ ${msg}: 期望 ${expected}，实际 ${actual}`);
}

// ── 第一组：本轮修复的 9 处，中文侧必须真命中 ──────────────────
const FIXED = [
  { file: 'src/core/heart-logic.js', mk: () => require(path.join(ROOT, 'src/core/heart-logic.js')),
    probe: s => {
      const mod = require(path.join(ROOT, 'src/core/heart-logic.js'));
      // checkWellbeing 是原型方法
      const inst = Object.create(mod.HeartLogic ? mod.HeartLogic.prototype : null);
      const fn = (typeof mod.checkWellbeing === 'function') ? mod.checkWellbeing : null;
      return null; // 直接正则验证在下面统一做
    } },
];

// 直接抽取源码里的正则，避免模块加载副作用
function grabRegexes(file, lineNos) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
  return lineNos.map(n => {
    const line = src[n - 1];
    const m = line.match(/\/((?:\\.|\[(?:\\.|[^\]])*\]|[^\/\n\[])+)\/[gimsuyvd]*/);
    return m ? m[1] : null;
  });
}

const REGRESSION = [
  {
    name: 'heart-logic:1533 诊断标签',
    file: 'src/core/heart-logic.js', line: 1533,
    cjk: ['你抑郁了怎么办', '我觉得你焦虑过度', '你有心理问题吗', '你是不是你疯了', '你病了要休息'],
    mustContain: ['你抑郁了', '你焦虑'],
  },
  {
    name: 'output-checklist:137 诊断标签',
    file: 'src/core/output-checklist.js', line: 137,
    cjk: ['你抑郁了', '你疯了吧', '你有病啊'],
    mustContain: ['你抑郁了', '你有病'],
  },
  {
    name: 'dream-loop:326 矛盾关键词',
    file: 'src/dream/dream-loop.js', line: 326,
    cjk: ['但这不是', '但是没有', '错误发生了', '矛盾出现', '反对这个', '否定它'],
    ascii: ['this is not true', 'never stop', 'absolutely wrong', 'false claim'],
    mustContain: ['不是', '错误'],
  },
  {
    name: 'dream-loop:337 显著关键词',
    file: 'src/dream/dream-loop.js', line: 337,
    cjk: ['升级完成', '错误修复', '修复逻辑', '记忆升级', '逻辑错误'],
    ascii: ['version 2', 'an error', 'fix it', 'upgrade now', 'dream on'],
    mustContain: ['升级', '逻辑'],
  },
];

// ── 逐条回归断言 ─────────────────────────────────────────────
for (const r of REGRESSION) {
  const res = grabRegexes(r.file, [r.line]);
  const body = res[0];
  if (!body) { fail++; console.error(`  ❌ ${r.name}: 未在第 ${r.line} 行取到正则`); continue; }
  const re = new RegExp(body, 'i');
  const cjkHit = r.cjk.filter(s => re.test(s)).length;
  eq(cjkHit, r.cjk.length, `${r.name} 中文命中`);
  if (r.ascii) {
    const aHit = r.ascii.filter(s => re.test(s)).length;
    ok(aHit === r.ascii.length, `${r.name} ASCII 命中 ${aHit}/${r.ascii.length}`);
  }
  for (const word of (r.mustContain || [])) {
    ok(re.test(word), `${r.name} 必须含候选「${word}」`);
  }
  // 反向：ASCII 支不得被子串误伤扩大（not 不应命中 notable）
  if (r.name.includes('矛盾')) {
    ok(!re.test('notable remark'), `${r.name} ASCII 子串防护保留（notable 不命中）`);
  }
}

// ── 第二组：扫描器必须对仓内 0 残留 ───────────────────────────
try {
  const out = execFileSync('node', [SCAN], { cwd: ROOT, encoding: 'utf8' });
  ok(/0 candidate\(s\)/.test(out), '扫描器报告 0 残留');
} catch (e) {
  // 扫描器有残留时 exit 1，stdout 仍在 e.stdout
  const out = String(e.stdout || '');
  fail++;
  console.error('  ❌ 扫描器仍有残留:\n' + out.split('\n').slice(0, 6).join('\n'));
}

// ── 第三组：扫描器必须真能抓到同族模式（不能是哑守卫）──────────
try {
  const tmp = path.join(ROOT, 'src', '__probe_wb128__.js');
  fs.writeFileSync(tmp, 'const re = /\\b(测试甲|测试乙|testalpha)\\b/;\nmodule.exports = { re };\n');
  execFileSync('node', [SCAN], { cwd: ROOT, encoding: 'utf8' });
  fail++; console.error('  ❌ 扫描器未抓到注入的 probe 模式');
  fs.unlinkSync(tmp);
} catch (e) {
  const out = String(e.stdout || '');
  ok(out.includes('__probe_wb128__.js'), '扫描器抓到注入的 probe 模式');
  ok(out.includes('grouped') || out.includes('adjacent'), '扫描器判定形态正确');
  const tmp = path.join(ROOT, 'src', '__probe_wb128__.js');
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
}

// ── 第四组：\b 对中文确实无效（守卫的立论基础，防 JS 引擎语义变更）─
{
  const bounded = /\b(中文词面|asciiw)\b/i;
  const stripped = /(中文词面|asciiw)/i;
  ok(!bounded.test('中文词面在这里'), '\\b 对中文不成立（立论基础仍成立）');
  ok(stripped.test('中文词面在这里'), '去掉 \\b 后中文可命中');
  ok(bounded.test('the asciiw here'), 'ASCII 侧 \\b 仍正常');
}

console.log(`cjk-word-boundary-round128: ${pass} 通过, ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
