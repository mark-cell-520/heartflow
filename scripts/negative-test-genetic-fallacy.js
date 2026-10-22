/**
 * scripts/negative-test-genetic-fallacy.js
 *
 * [r693] genetic_fallacy（第 131 维）守卫有效性负例验证。
 *
 * 方法同 r685-r692 negative-test-*.js：把 src/genetic-fallacy.js 里各
 * 承重分支逐一置为永不匹配（改文件再跑测试文件的方式，证明
 * test/round-693-genetic-fallacy.js 本身能抓住每个分支失效），
 * 确认测试由 28/28 全绿变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 28/28 PASS → 每个注入点 FAIL（至少 1 个断言红，
 * 且不是 SyntaxError/Cannot find module/ReferenceError/TypeError
 * 崩溃红）→ 还原后 28/28 PASS 且 md5 与基线一致。
 *
 * 注入点覆盖 13 处（按源码里的分支注释定位，不用 split('|') 切分——
 * 分支内部的选择支 | 会把正则切碎，定位必然落空，r691 纪律）：
 *   SOURCE_ZH a/c/b 三支、SOURCE_EN a/c/b/d 四支、
 *   QUALITY_ZH a/b/c 三支、QUALITY_EN a/b/c 三支、
 *   META_EXEMPT_ZH/EN 两块（正则字面量整行替换）。
 * 每个注入点都配一条「只由该分支承重」的专属样本（r691 纪律：两条支
 * 覆盖同一样本时，单支注入证明不了单支承重）——专属样本即 C/F 组
 * 断言里的条目，注入后对应断言必须变红。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/genetic-fallacy.js');
const TEST = path.join(HF, 'test/round-693-genetic-fallacy.js');

// 注入点：block = new RegExp 块名（或正则字面量常量名）；
// comment = 块内分支注释定位特征（缺省 = 整块注入）
const INJECTS = [
  { name: 'SOURCE_ZH-a 人群身份支（年轻人/应届生/外国人/小作坊）', block: 'SOURCE_ZH', comment: '// a 人群身份' },
  { name: 'SOURCE_ZH-c 出身机构与产地支（农村/外地/国产/进口）', block: 'SOURCE_ZH', comment: '// c 出身机构' },
  { name: 'SOURCE_ZH-b 年代时间支（两百年前/明清/30年前）', block: 'SOURCE_ZH', comment: '// b 年代时间' },
  { name: 'SOURCE_EN-a person-status 支（from a freshman / by an intern）', block: 'SOURCE_EN', comment: '// a person-status' },
  { name: 'SOURCE_EN-c origin place 支（from a small town / made by a small workshop）', block: 'SOURCE_EN', comment: '// c origin place' },
  { name: 'SOURCE_EN-b era 支（dates back to the old days）', block: 'SOURCE_EN', comment: '// b era' },
  { name: 'SOURCE_EN-d standalone 起源形容词支（folk remedy / domestic）', block: 'SOURCE_EN', comment: '// d standalone' },
  { name: 'QUALITY_ZH-a 直接贬损支（不成熟/过时/见识短/不值得听）', block: 'QUALITY_ZH', comment: '// a 直接贬损' },
  { name: 'QUALITY_ZH-b 比较贬损支（不如进口的成熟）', block: 'QUALITY_ZH', comment: '// b 比较贬损' },
  { name: 'QUALITY_ZH-c 反问贬损支（能适合……吗/靠得住吗）', block: 'QUALITY_ZH', comment: '// c 反问贬损' },
  { name: 'QUALITY_EN-a negative adjectives 支（cannot be worth / is definitely outdated）', block: 'QUALITY_EN', comment: '// a negative adjectives' },
  { name: 'QUALITY_EN-b comparative inferiority 支（inferior to）', block: 'QUALITY_EN', comment: '// b comparative' },
  { name: 'QUALITY_EN-c rhetorical dismissal 支（not even read / how can）', block: 'QUALITY_EN', comment: '// c rhetorical' },
  { name: 'META_EXEMPT_ZH 整块（这就是典型的起源谬误）', block: 'META_EXEMPT_ZH', literal: true },
  { name: 'META_EXEMPT_EN 整块（genetic fallacy is a common）', block: 'META_EXEMPT_EN', literal: true },
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

// 定位注入行区间：返回 [startIdx, endIdx)（含分支注释行之后的模式行）
function locate(lines, inj) {
  const blockRe = new RegExp('^const ' + inj.block + ' = ');
  const start = lines.findIndex(l => blockRe.test(l));
  if (start < 0) return null;
  if (inj.literal) {
    // 正则字面量常量：整行替换（由调用方拼 const NAME = /(?!)/;）
    return { kind: 'literal', start, end: start + 1 };
  }
  // new RegExp( ... ); 块：找到 ); 结束
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\);/.test(lines[i])) { end = i; break; }
  }
  if (end < 0) return null;
  if (!inj.comment) return { kind: 'block', start, end };
  // 分支注入：从注释行之后到下一个注释行（或块尾）
  const ci = lines.findIndex((l, i) => i > start && i < end && l.includes(inj.comment));
  if (ci < 0) return null;
  let stop = end;
  for (let i = ci + 1; i < end; i++) {
    if (/^\s*\/\//.test(lines[i])) { stop = i; break; }
  }
  return { kind: 'branch', start: ci + 1, end: stop };
}

function killLines(lines, range, inj) {
  // 返回修改后的副本；模式行替换为 '' / '' + / '',（保留原行是否带 +
  // 或逗号，否则尾行替换会产生悬空 + 或丢逗号造成 SyntaxError——崩溃红
  // 结论失真，r692 实测两种都踩过）
  const out = lines.slice();
  for (let i = range.start; i < range.end; i++) {
    const line = out[i];
    if (range.kind === 'literal') {
      out[i] = 'const ' + inj.block + ' = /(?!)/;';
      continue;
    }
    // 声明行（const XXX = new RegExp(）不碰——整块注入的起点是它，
    // 替换掉会把模式行变成裸字符串造成 SyntaxError（r692 实测）
    if (/^\s*const\s/.test(line)) continue;
    if (/^\s*$/.test(line) || /^\s*\/\//.test(line)) continue;
    const t = line.trim();
    if (t.endsWith(',')) out[i] = "''" + ",";
    else if (t.endsWith('+')) out[i] = "'' +";
    else out[i] = "''";
  }
  return out;
}

// ── 0. 基线 ────────────────────────────────────────────────────────
const baseMd5 = md5(SRC);
const base = runTest();
if (!base.ok) { console.error('基线就不是全绿，中止: ' + base.out.slice(-400)); process.exit(1); }
if (!/结果: 28 通过, 0 失败/.test(base.out)) {
  console.error('基线输出不符合预期（28 通过）: ' + base.out.slice(-200)); process.exit(1);
}
console.log('基线: 28/28 PASS，md5=' + baseMd5.slice(0, 12));

// ── 1. 逐点注入 ────────────────────────────────────────────────────
let allRed = true;
for (const inj of INJECTS) {
  const lines = fs.readFileSync(SRC, 'utf8').split('\n');
  const range = locate(lines, inj);
  if (!range) {
    console.log('  ✗ ' + inj.name + ' :: 定位失败（块或分支注释未找到）');
    allRed = false;
    continue;
  }
  const killed = killLines(lines, range, inj);
  // 防呆：确认至少替换了一行
  const changed = killed.filter((l, i) => l !== lines[i]).length;
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
    console.log('  ✗ ' + inj.name + ' :: 崩溃红非断言红（结论失真）: ' + r.out.split('\n').filter(l => /Error/.test(l))[0]);
    allRed = false;
  } else {
    console.log('  ✗ ' + inj.name + ' :: 注入后仍全绿（守卫漏抓）');
    allRed = false;
  }
  // 立即还原（无论成败）
  fs.writeFileSync(SRC, lines.join('\n'));
}

// ── 2. 还原校验 ────────────────────────────────────────────────────
const afterMd5 = md5(SRC);
if (afterMd5 !== baseMd5) { console.error('还原后 md5 不一致！'); process.exit(1); }
const after = runTest();
if (!after.ok || !/结果: 28 通过, 0 失败/.test(after.out)) {
  console.error('还原后未恢复 28/28'); process.exit(1);
}
console.log('还原: md5 一致，28/28 PASS');
console.log(allRed ? '负例验证通过：全部 ' + INJECTS.length + ' 个注入点均断言红' : '负例验证失败：存在漏抓注入点');
process.exit(allRed ? 0 : 1);
