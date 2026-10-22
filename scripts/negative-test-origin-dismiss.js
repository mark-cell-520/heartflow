/**
 * scripts/negative-test-origin-dismiss.js
 *
 * [r703] stereotype「身份标签 × 能力贬低」补族守卫有效性负例验证。
 *
 * 方法同 r702：把 src/index.js 里本轮新增的各承重分支逐一置为永不
 * 匹配（改文件再跑 test/round-703-origin-dismiss.js 的方式，证明
 * 测试文件本身能抓住每个分支失效），确认由 10/10 全绿变红，
 * 还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 10/10 PASS → 每个注入点 FAIL（至少 1 个断言红，
 * 且不是 SyntaxError/Cannot find module/ReferenceError/TypeError
 * 崩溃红）→ 还原后 10/10 PASS 且 md5 与基线一致。
 *
 * 注入点 10 处（本轮新增承重分支）：
 *   ORIGIN_IDENTITY_ZH 四支（学历/地域/年龄/性别口语）、
 *   CAPABILITY_DISMISS_ZH 两支（反问形/贬低断言）、
 *   ORIGIN_IDENTITY_EN 整块、CAPABILITY_DISMISS_EN 整块、
 *   _originDismissSegment 让步豁免逻辑、
 *   checkStereotype 的 stereotypeOriginDismiss 接线行。
 *
 * 与 r702 脚本的关键差异：killLines 的替换值是
 * `'__negtest_never__'` 而不是 `''`——空字符串的 includes 恒为
 * true，会把「分支失效」伪装成「分支还在」，负例当场假绿。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/index.js');
const TEST = path.join(HF, 'test/round-703-origin-dismiss.js');

// 注入点：block = 常量名；comment = 块内分支注释定位特征；
// line = 行级替换（特征串 → 替换串），用于函数与接线行。
const INJECTS = [
  { name: 'ORIGIN_IDENTITY_ZH-学历出身支（大专毕业/技校/本科生）', block: 'ORIGIN_IDENTITY_ZH', comment: '// 学历出身' },
  { name: 'ORIGIN_IDENTITY_ZH-地域出身支（农村人/外地人/小地方）', block: 'ORIGIN_IDENTITY_ZH', comment: '// 地域出身' },
  { name: 'ORIGIN_IDENTITY_ZH-年龄支（三十多岁/上了年纪）', block: 'ORIGIN_IDENTITY_ZH', comment: '// 年龄' },
  { name: 'ORIGIN_IDENTITY_ZH-性别口语指称支（一个女的/女人）', block: 'ORIGIN_IDENTITY_ZH', comment: '// 性别口语指称' },
  { name: 'CAPABILITY_DISMISS_ZH-反问形支（能懂什么/写什么）', block: 'CAPABILITY_DISMISS_ZH', comment: '// 反问形' },
  { name: 'CAPABILITY_DISMISS_ZH-贬低断言支（可想而知/不上档次/学不会）', block: 'CAPABILITY_DISMISS_ZH', comment: '// 贬低断言形' },
  { name: 'ORIGIN_IDENTITY_EN 整块（rural area/vocational school/over forty）', block: 'ORIGIN_IDENTITY_EN', comment: null },
  { name: 'CAPABILITY_DISMISS_EN 整块（what could he know/can not possibly understand）', block: 'CAPABILITY_DISMISS_EN', comment: null },
  { name: '_originDismissSegment 让步豁免逻辑（虽然X但Y 翻案放行失效）', line: 'if (_originHitAny(low, concessions)) {', to: 'if (false && _originHitAny(low, concessions)) {' },
  { name: 'checkStereotype 的 stereotypeOriginDismiss 接线行', line: 'signals.push(...stereotypeOriginDismiss(text, hasChinese));', to: '// [negtest] 接线已摘除' },
];

function md5(f) { return crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex'); }

function runTest() {
  try {
    const out = execFileSync('node', [TEST], { cwd: HF, encoding: 'utf8', timeout: 180000 });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function isCrashRed(out) {
  // 崩溃红（语法错/模块缺失/引用错/类型错）证明不了断言能抓分支失效
  return /SyntaxError|Cannot find module|ReferenceError|TypeError/.test(out);
}

// 定位注入行区间：块内按分支注释定位到下一个注释行止
function locate(lines, inj) {
  const blockRe = new RegExp('^const ' + inj.block + ' = ');
  const start = lines.findIndex((l) => blockRe.test(l));
  if (start < 0) return null;
  // 块尾（本仓既有 }); 结尾、].join 结尾，也有 ]; 结尾——三种都认）
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\}\);/.test(lines[i]) || /^\]\.join/.test(lines[i]) || /^\];/.test(lines[i])) { end = i; break; }
  }
  if (end < 0) return null;
  if (!inj.comment) return { kind: 'block', start, end };
  const ci = lines.findIndex((l, i) => i > start && i < end && l.includes(inj.comment));
  if (ci < 0) return null;
  let stop = end;
  for (let i = ci + 1; i < end; i++) {
    if (/^\s*\/\//.test(lines[i])) { stop = i; break; }
  }
  return { kind: 'branch', start: ci + 1, end: stop };
}

function killLines(lines, range) {
  const out = lines.slice();
  for (let i = range.start; i < range.end; i++) {
    const line = out[i];
    // 声明行不碰（替换掉会把模式行变成裸字符串造成 SyntaxError）
    if (/^\s*const\s/.test(line)) continue;
    if (/^\s*$/.test(line) || /^\s*\/\//.test(line)) continue;
    const t = line.trim();
    // 替换成永不匹配的字符串——**不能**用空串（'' includes 恒 true，
    // 会把「分支失效」伪装成「分支还在」，负例当场假绿）
    if (t.endsWith(',')) out[i] = "'__negtest_never__',";
    else if (t.endsWith('+')) out[i] = "'__negtest_never__' +";
    else out[i] = "'__negtest_never__'";
  }
  return out;
}

// ── 0. 基线 ────────────────────────────────────────────────────────
const baseMd5 = md5(SRC);
const base = runTest();
if (!base.ok) { console.error('基线就不是全绿，中止: ' + base.out.slice(-400)); process.exit(1); }
if (!/结果: 10 通过, 0 失败/.test(base.out)) {
  console.error('基线输出不符合预期（10 通过）: ' + base.out.slice(-200)); process.exit(1);
}
console.log('基线: 10/10 PASS，md5=' + baseMd5.slice(0, 12));

// ── 1. 逐点注入 ────────────────────────────────────────────────────
let allRed = true;
for (const inj of INJECTS) {
  const original = fs.readFileSync(SRC, 'utf8');
  const lines = original.split('\n');
  let killed;
  let changed = 0;

  if (inj.line) {
    // 行级替换（函数/接线行）
    const i = lines.findIndex((l) => l.includes(inj.line));
    if (i < 0) {
      console.log('  ✗ ' + inj.name + ' :: 定位失败（特征行未找到）');
      allRed = false;
      continue;
    }
    killed = lines.slice();
    killed[i] = lines[i].replace(inj.line, inj.to);
    changed = killed[i] === lines[i] ? 0 : 1;
  } else {
    const range = locate(lines, inj);
    if (!range) {
      console.log('  ✗ ' + inj.name + ' :: 定位失败（块/分支注释未找到）');
      allRed = false;
      continue;
    }
    killed = killLines(lines, range);
    changed = killed.filter((l, i) => l !== lines[i]).length;
  }

  if (changed === 0) {
    console.log('  ✗ ' + inj.name + ' :: 没有行被替换（定位空转）');
    allRed = false;
    continue;
  }

  fs.writeFileSync(SRC, killed.join('\n'));
  const r = runTest();
  const crash = !r.ok && isCrashRed(r.out);
  if (!r.ok && !crash) {
    console.log('  ✓ ' + inj.name + ' :: 断言红（守卫有效，替换 ' + changed + ' 行）');
  } else if (crash) {
    console.log('  ✗ ' + inj.name + ' :: 崩溃红非断言红（结论失真）: ' + (r.out.split('\n').filter((l) => /Error/.test(l))[0] || '').slice(0, 120));
    allRed = false;
  } else {
    console.log('  ✗ ' + inj.name + ' :: 仍然全绿（守卫抓不住该分支失效）');
    allRed = false;
  }
  // 每个注入点后立即还原，避免半改状态遗留
  fs.writeFileSync(SRC, original);
}

// ── 2. 还原校验 ────────────────────────────────────────────────────
const afterMd5 = md5(SRC);
if (afterMd5 !== baseMd5) {
  console.error('还原后 md5 不一致，来源可能已损坏: ' + afterMd5 + ' != ' + baseMd5);
  process.exit(1);
}
const after = runTest();
if (!after.ok || !/结果: 10 通过, 0 失败/.test(after.out)) {
  console.error('还原后基线未恢复全绿: ' + after.out.slice(-300));
  process.exit(1);
}

console.log(allRed ? '全部注入点断言红 + 还原一致：守卫有效' : '存在失效注入点，见上方 ✗');
process.exit(allRed ? 0 : 1);
