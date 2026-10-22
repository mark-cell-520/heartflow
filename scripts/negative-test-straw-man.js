/**
 * scripts/negative-test-straw-man.js
 *
 * [r705] straw_man（第 138 维）守卫有效性负例验证。
 *
 * 方法同 r694/r703/r704：把 src/straw-man.js 里各承重分支逐一置为
 * 永不匹配（改文件再跑 test/round-705-straw-man.js 的方式，证明测试
 * 文件本身能抓住每个分支失效），确认测试由 11/11 全绿变红，还原后
 * 恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 11/11 PASS → 每个注入点 FAIL（至少 1 个断言红，
 * 且不是 SyntaxError/Cannot find module/ReferenceError/TypeError
 * 崩溃红）→ 还原后 11/11 PASS 且 md5 与基线一致。
 *
 * 注入点 24 处（按源码里的分支注释定位，不用 split('|') 切分——分支
 * 内部的选择支 | 会把正则切碎，定位必然落空，r691 纪律）：
 *   ATTRIB_STRONG_ZH 五支（a 你+强调+就是/是想、b 你这么说无非是想、
 *   c 按你的意思/逻辑、d 照你这么说、e 你的逻辑就是）、
 *   ATTRIB_WEAK_ZH 整块、ATTRIB_STRONG_EN/ATTRIB_WEAK_EN 整块、
 *   REFUTE_ZH 四支（a 那…谁来/负责、a2 我们干脆X、b 太天真了、
 *   c 只有你对、d 躺平算了）、REFUTE_EN 整块、
 *   ABSOLUTE_NEG_ZH 五支（a 都/全+负面词、b 所有的付出被否定、
 *   b2 付出都白费、c 否定+所有/整个、d 完全/根本+不可行）、
 *   ABSOLUTE_NEG_EN 整块、META_EXEMPT_ZH/EN 两块、
 *   路由①/路由②两条判定行。
 *
 * 每个注入点都配一条「只由该分支承重」的专属样本（r691/r702 纪律：
 * 两条支覆盖同一样本时，单支注入证明不了单支承重；inject 摘除样本
 * 的两条腿都先在单维层实测命中过，再拿来证明豁免）。
 *
 * 与 r703 纪律同：killLines 的替换值是 `'__negtest_never__'` 而不是
 * `''`——空串会让 new RegExp 退化成匹配空串（恒真），把「分支失效」
 * 伪装成「分支还在」；flags 行（'i'）跳过不换（r704 纪律：换成非法
 * flags 会 SyntaxError 崩溃红，证明不了断言能抓分支失效）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/straw-man.js');
const TEST = path.join(HF, 'test/round-705-straw-man.js');

// 注入点：block = new RegExp 块名；comment = 块内分支注释定位特征
// （缺省 = 整块注入）；line = 行级替换（判定行，用于两条路由）。
const INJECTS = [
  { name: 'ATTRIB_STRONG_ZH-a 你[们][强调]就是/不就是/是[想/要]说/表达/认为/怪/嫌/否定', block: 'ATTRIB_STRONG_ZH', comment: '// a 你(们)' },
  { name: 'ATTRIB_STRONG_ZH-b 你这么[说/讲][无非]是想（否定团队努力样本专属）', block: 'ATTRIB_STRONG_ZH', comment: '// b 你这么' },
  { name: 'ATTRIB_STRONG_ZH-c 按你的意思/逻辑/说法（干脆别做测试样本专属）', block: 'ATTRIB_STRONG_ZH', comment: '// c 按你的意思' },
  { name: 'ATTRIB_STRONG_ZH-d 照你这么说/照你的逻辑（付出白费样本专属）', block: 'ATTRIB_STRONG_ZH', comment: '// d 照你这么说' },
  { name: 'ATTRIB_STRONG_ZH-e 你的逻辑就是/岂不是/看来', block: 'ATTRIB_STRONG_ZH', comment: '// e 你的逻辑就是' },
  { name: 'ATTRIB_WEAK_ZH 整块（你的意思是/你想说的是/你的说法是——躺平算了与只有你对两条路由②样本专属）', block: 'ATTRIB_WEAK_ZH' },
  { name: 'ATTRIB_STRONG_EN 整块（you are just saying / so you are saying / by your logic）', block: 'ATTRIB_STRONG_EN' },
  { name: 'ATTRIB_WEAK_EN 整块（what you mean is / you mean that）', block: 'ATTRIB_WEAK_EN' },
  { name: 'REFUTE_ZH-a 那…谁来/凭什么/负责类反问', block: 'REFUTE_ZH', comment: '// a 反问' },
  { name: 'REFUTE_ZH-a2 无那前缀形 我们干脆X/不如X', block: 'REFUTE_ZH', comment: '// a2 无那前缀形' },
  { name: 'REFUTE_ZH-b 贬损定性 太天真了/想得美', block: 'REFUTE_ZH', comment: '// b 贬损定性' },
  { name: 'REFUTE_ZH-c 反诘对立 只有你对/只有你行', block: 'REFUTE_ZH', comment: '// c 反诘对立' },
  { name: 'REFUTE_ZH-d 放弃贬损 躺平算了/摆烂', block: 'REFUTE_ZH', comment: '// d 放弃贬损' },
  { name: 'REFUTE_EN 整块（who is going to / might as well / how naive / only you are right / give up altogether）', block: 'REFUTE_EN' },
  { name: 'ABSOLUTE_NEG_ZH-a 都/全+[是/有/要/会]+负面定性词（都有问题样本专属）', block: 'ABSOLUTE_NEG_ZH', comment: '// a 都/全' },
  { name: 'ABSOLUTE_NEG_ZH-b 所有/全部的付出类名词被否定/抹杀', block: 'ABSOLUTE_NEG_ZH', comment: '// b 所有/全部' },
  { name: 'ABSOLUTE_NEG_ZH-b2 名词在前形 付出/努力+都/全+白费', block: 'ABSOLUTE_NEG_ZH', comment: '// b2 名词在前形' },
  { name: 'ABSOLUTE_NEG_ZH-c 否定/抹杀/推翻+所有/整个', block: 'ABSOLUTE_NEG_ZH', comment: '// c 否定/抹杀' },
  { name: 'ABSOLUTE_NEG_ZH-d 完全/根本+不可行/站不住', block: 'ABSOLUTE_NEG_ZH', comment: '// d 完全/根本' },
  { name: 'ABSOLUTE_NEG_EN 整块（everything I did was wrong / are all flawed / negate all our effort）', block: 'ABSOLUTE_NEG_EN' },
  { name: 'META_EXEMPT_ZH 整块（稻草人谬误元话语豁免失效——E1 承重样本专属）', block: 'META_EXEMPT_ZH' },
  { name: 'META_EXEMPT_EN 整块（straw man 元话语豁免失效——E1 承重样本专属）', block: 'META_EXEMPT_EN' },
  { name: '路由① 强归谬形×（反驳尾巴或绝对化归述）判定行', line: 'if (strong && (refute || absNeg)) {', to: 'if (false && strong && (refute || absNeg)) {' },
  { name: '路由② 弱转述形×反驳尾巴判定行', line: 'if (weak && refute) {', to: 'if (false && weak && refute) {' },
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
  // new RegExp( ... ); 块：找到 ); 行结束
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\}\);/.test(lines[i]) || /^\);/.test(lines[i])) { end = i; break; }
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
    // ⚠️ 行首的 `|` 必须保留：模式行在源码里是 `'|(?:...'`（引号内以
    // 竖线开头），替换值丢掉 `|` 会让上一支的末尾粘上 `__negtest_never__`
    // （如 `(?:错|...)__negtest_never__`），把**前一支**也杀掉——注入点
    // 的红就归因错了（杀 b 实际杀了 a 的尾部），单支承重证明失真
    // （r705 实测踩到，b/b2/d/c 四支串味）。注意判据是 `startsWith("'|")`
    // 不是 `startsWith('|')`——trim 后第一个字符是单引号不是竖线。
    const lead = t2.startsWith("'|") ? '|' : '';
    if (t2.endsWith(',')) out[i] = "'" + lead + "__negtest_never__',";
    else if (t2.endsWith('+')) out[i] = "'" + lead + "__negtest_never__' +";
    else out[i] = "'" + lead + "__negtest_never__'";
  }
  return out;
}

// ── 0. 基线 ──────────────────────────────────────────────────────
const baseMd5 = md5(SRC);
const base = runTest();
if (!base.ok) { console.error('基线就不是全绿，中止: ' + base.out.slice(-400)); process.exit(1); }
if (!/结果: 11 通过, 0 失败/.test(base.out)) {
  console.error('基线输出不符合预期（11 通过）: ' + base.out.slice(-200)); process.exit(1);
}
console.log('基线: 11/11 PASS，md5=' + baseMd5.slice(0, 12));

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
const finalOk = final.ok && /结果: 11 通过, 0 失败/.test(final.out);
console.log(finalOk ? '还原后测试: 11/11 PASS' : '还原后测试异常: ' + final.out.slice(-300));
console.log(allRed && finalOk ? '\n负例验证通过：' + INJECTS.length + '/' + INJECTS.length + ' 注入点全部断言红，还原恢复全绿' : '\n负例验证失败：见上方 ✗ 项');
process.exit(allRed && finalOk ? 0 : 1);
