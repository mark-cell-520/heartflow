/**
 * scripts/negative-test-appeal-to-ridicule.js
 *
 * [r704] appeal_to_ridicule（第 137 维）守卫有效性负例验证。
 *
 * 方法同 r694/r703：把 src/appeal-to-ridicule.js 里各承重分支逐一置为
 * 永不匹配（改文件再跑 test/round-704-appeal-to-ridicule.js 的方式，
 * 证明测试文件本身能抓住每个分支失效），确认测试由 12/12 全绿变红，
 * 还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 12/12 PASS → 每个注入点 FAIL（至少 1 个断言红，
 * 且不是 SyntaxError/Cannot find module/ReferenceError/TypeError
 * 崩溃红）→ 还原后 12/12 PASS 且 md5 与基线一致。
 *
 * 注入点 16 处（按源码里的分支注释定位，不用 split('|') 切分——分支
 * 内部的选择支 | 会把正则切碎，定位必然落空，r691 纪律）：
 *   RIDICULE_ZH 三支（直接嘲词/笑声蔑称/智商贬低）、
 *   RIDICULE_EN 整块、TARGET_ZH 三支（指称+观点名词/第二人称号领/
 *   发言动词指向）、TARGET_EN 整块、IDIOM_ZH/EN 整块、
 *   DEFECT_EXEMPT_ZH/EN 两块（正则字面量整行替换）、
 *   META_EXEMPT_ZH/EN 两块、路由② IDIOM 判定行、路由①双腿判定行。
 *
 * 每个注入点都配一条「只由该分支承重」的专属样本（r691 纪律：两条支
 * 覆盖同一样本时，单支注入证明不了单支承重）——专属样本即 A/C/E 组
 * 断言里的条目，注入后对应断言必须变红。
 *
 * 与 r694 脚本的关键差异（r703 纪律）：killLines 的替换值是
 * `'__negtest_never__'` 而不是 `''`——空串会让 new RegExp 退化成
 * 匹配空串（恒真），把「分支失效」伪装成「分支还在」，且红的是良性
 * 组而不是攻击组，归因失真。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/appeal-to-ridicule.js');
const TEST = path.join(HF, 'test/round-704-appeal-to-ridicule.js');

// 注入点：block = new RegExp 块名；comment = 块内分支注释定位特征
// （缺省 = 整块注入）；line = 行级替换（判定行，用于两条路由）。
const INJECTS = [
  { name: 'RIDICULE_ZH-a 直接嘲词支（可笑/搞笑/蠢/幼稚/天真/弱智/无语）', block: 'RIDICULE_ZH', comment: '// a 直接嘲词' },
  { name: 'RIDICULE_ZH-b 笑声蔑称支（笑死/笑哭）', block: 'RIDICULE_ZH', comment: '// b 笑声蔑称' },
  { name: 'RIDICULE_ZH-c 智商/脑子贬低支（智商堪忧/脑子进水/脑子呢）', block: 'RIDICULE_ZH', comment: '// c 智商/脑子贬低' },
  { name: 'RIDICULE_EN 整块（ridiculous/stupid/childish/lol/IQ is concerning）', block: 'RIDICULE_EN' },
  { name: 'TARGET_ZH-a 指称+观点名词支（这种想法/这也叫方案/就这水平/这算什么方案，含 (?<![我你]) 负向后视）', block: 'TARGET_ZH', comment: '// a 指称' },
  { name: 'TARGET_ZH-b 第二人称号领支（你的方案/你这个想法/你这种观点）', block: 'TARGET_ZH', comment: '// b 第二人称号领' },
  { name: 'TARGET_ZH-c 发言动词指向支（拿出来说/敢发言/也敢说/也敢讲）', block: 'TARGET_ZH', comment: '// c 发言动词指向' },
  { name: 'TARGET_EN 整块（this idea/your logic/you call this/dare to speak）', block: 'TARGET_EN' },
  { name: 'IDIOM_ZH 整块（亏你想得出来/也只有你/不值一驳/脑子正常的人都不会/就这水平）', block: 'IDIOM_ZH' },
  { name: 'IDIOM_EN 整块（can not believe you came up with this/not even worth refuting/anyone with a functioning brain/with this level）', block: 'IDIOM_EN' },
  { name: 'DEFECT_EXEMPT_ZH 整块（可笑的漏洞——缺陷对象豁免失效）', block: 'DEFECT_EXEMPT_ZH', literal: true },
  { name: 'DEFECT_EXEMPT_EN 整块（ridiculous flaw——缺陷对象豁免失效）', block: 'DEFECT_EXEMPT_EN', literal: true },
  { name: 'META_EXEMPT_ZH 整块（诉诸嘲讽元话语豁免失效）', block: 'META_EXEMPT_ZH', literal: true },
  { name: 'META_EXEMPT_EN 整块（appeal to ridicule 元话语豁免失效）', block: 'META_EXEMPT_EN', literal: true },
  { name: '路由② IDIOM 判定行（固定习语单支路由失效）', line: 'if (IDIOM_ZH_.test(text) || IDIOM_EN_.test(text)) {', to: 'if (false && (IDIOM_ZH_.test(text) || IDIOM_EN_.test(text))) {' },
  { name: '路由① 双腿共现判定行（嘲词×目标腿路由失效）', line: 'if (ridicule && target) {', to: 'if (false && ridicule && target) {' },
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
    // 正则字面量/单块常量：整块替换为单行 const NAME = /(?!)/;
    let end = -1;
    for (let i = start + 1; i < lines.length; i++) {
      if (/^\);/.test(lines[i])) { end = i + 1; break; }
    }
    if (end < 0) return { kind: 'literal', start, end: start + 1 };
    return { kind: 'literal', start, end };
  }
  // new RegExp( ... ); 块：找到 ); 行结束
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
  const out = lines.slice();
  if (range.kind === 'literal') {
    // 整块替换：const NAME = new RegExp(...) → const NAME = /(?!)/;
    const out2 = lines.slice(0, range.start);
    out2.push('const ' + inj.block + ' = /(?!)/;');
    for (let i = range.end; i < lines.length; i++) out2.push(lines[i]);
    return out2;
  }
  for (let i = range.start; i < range.end; i++) {
    const line = out[i];
    // 声明行（const XXX = new RegExp(）不碰——替换掉会把模式行变成
    // 裸字符串造成 SyntaxError（崩溃红结论失真，r692 实测）
    if (/^\s*const\s/.test(line)) continue;
    if (/^\s*$/.test(line) || /^\s*\/\//.test(line)) continue;
    // 正则 flags 行（'i' / 'gi' …）不碰——换掉会让 new RegExp 的第二个
    // 参数变成非法 flags，SyntaxError 崩溃红证明不了断言能抓分支失效
    // （r704 实测：RIDICULE_EN/TARGET_EN/IDIOM_EN 三块踩过）
    if (/^'[gimsuyvdx]*'$/.test(line.trim())) continue;
    const t2 = line.trim();
    // 替换成永不匹配的字符串——**不能**用空串（new RegExp('') 匹配空串
    // 恒真，会把「分支失效」伪装成「分支还在」，负例当场假绿；r703 纪律）
    if (t2.endsWith(',')) out[i] = "'__negtest_never__',";
    else if (t2.endsWith('+')) out[i] = "'__negtest_never__' +";
    else out[i] = "'__negtest_never__'";
  }
  return out;
}

// ── 0. 基线 ──────────────────────────────────────────────────────
const baseMd5 = md5(SRC);
const base = runTest();
if (!base.ok) { console.error('基线就不是全绿，中止: ' + base.out.slice(-400)); process.exit(1); }
if (!/结果: 12 通过, 0 失败/.test(base.out)) {
  console.error('基线输出不符合预期（12 通过）: ' + base.out.slice(-200)); process.exit(1);
}
console.log('基线: 12/12 PASS，md5=' + baseMd5.slice(0, 12));

// ── 1. 逐点注入 ────────────────────────────────────────────────────
let allRed = true;
for (const inj of INJECTS) {
  const lines = fs.readFileSync(SRC, 'utf8').split('\n');
  let killed;
  if (inj.line) {
    // 行级替换：判定行整行替换（先断言唯一，防改错行）
    const cnt = lines.filter(l => l.includes(inj.line)).length;
    if (cnt !== 1) {
      console.log('  ✗ ' + inj.name + ' :: 判定行不唯一（' + cnt + ' 处），中止该项');
      allRed = false;
      continue;
    }
    killed = lines.slice();
    const idx = killed.findIndex(l => l.includes(inj.line));
    killed[idx] = killed[idx].replace(inj.line, inj.to);
  } else {
    const range = locate(lines, inj);
    if (!range) {
      console.log('  ✗ ' + inj.name + ' :: 定位失败（块或分支注释未找到）');
      allRed = false;
      continue;
    }
    killed = killLines(lines, range, inj);
  }
  // 防呆：确认至少替换了一行
  const changed = killed.filter((l, i) => l !== lines[i]).length;
  if (changed === 0) {
    console.log('  ✗ ' + inj.name + ' :: 没有行被替换（定位空转）');
    allRed = false;
    continue;
  }
  fs.writeFileSync(SRC, killed.join('\n'));
  const r = runTest();
  fs.writeFileSync(SRC, lines.join('\n')); // 立即还原，防半改状态
  if (r.ok) {
    console.log('  ✗ ' + inj.name + ' :: 注入后仍然全绿（守卫漏抓）');
    allRed = false;
  } else if (isCrashRed(r.out)) {
    console.log('  ✗ ' + inj.name + ' :: 崩溃红（证明不了断言能抓分支失效）');
    allRed = false;
  } else {
    const failLine = (r.out.match(/^\s+-\s+.+$/m) || ['(未见失败项行)'])[0].trim();
    console.log('  ✅ ' + inj.name + ' :: 断言红（' + failLine.slice(0, 90) + '）');
  }
}

// ── 2. 还原校验 ──────────────────────────────────────────────────
const afterMd5 = md5(SRC);
console.log('还原后 md5=' + afterMd5.slice(0, 12) + '（基线 ' + baseMd5.slice(0, 12) + '）' + (afterMd5 === baseMd5 ? ' 一致' : ' 不一致！'));
const final = runTest();
const finalOk = final.ok && /结果: 12 通过, 0 失败/.test(final.out);
console.log(finalOk ? '还原后测试: 12/12 PASS' : '还原后测试异常: ' + final.out.slice(-300));
console.log(allRed && finalOk ? '\n负例验证通过：16/16 注入点全部断言红，还原恢复全绿' : '\n负例验证失败：见上方 ✗ 项');
process.exit(allRed && finalOk ? 0 : 1);
