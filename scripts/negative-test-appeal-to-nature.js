/**
 * scripts/negative-test-appeal-to-nature.js
 *
 * [r706] appeal_to_nature（第 139 维）守卫有效性负例验证。
 *
 * 方法同 r694/r703/r704/r705：把 src/appeal-to-nature.js 里各承重分支
 * 逐一置为永不匹配（改文件再跑 test/round-706-appeal-to-nature.js 的
 * 方式，证明测试文件本身能抓住每个分支失效），确认测试由 10/10 全绿
 * 变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 10/10 PASS → 每个注入点 FAIL（至少 1 个断言红，且
 * 不是 SyntaxError/Cannot find module/ReferenceError/TypeError 崩溃
 * 红）→ 还原后 10/10 PASS 且 md5 与基线一致。
 *
 * 注入点 29 处（按源码里的分支注释定位，不用 split('|') 切分——分支
 * 内部的选择支 | 会把正则切碎，定位必然落空，r691 纪律）：
 *   NATURE_ZH 八支（a 天然+名词、b 纯植物/草本、c 野生、d 自然熟/
 *     原生态、e 老祖宗、f 原始森林/无污染、g 自然疗法、h 母乳是天
 *     然的）、
 *   NATURE_EN 七支（a all-natural/natural materials、c wild、d
 *     naturally ripened、e passed down、f primeval、g natural
 *     healing、h is natural；b plant-based 暂无专属样本未列）、
 *   SUPERIOR_ZH 六支（a 比化学类+优越词、a2 比X更、b 肯定/一定、
 *     c 放心吃/用、d 没有任何化学成分、e 经过时间检验）、
 *   SUPERIOR_EN 四支（a comparative than、b must be、d no
 *     artificial chemicals、time-tested 结论支）、
 *   META_EXEMPT_ZH/EN 两块、路由判定两行。
 *
 * 每个注入点都配一条「只由该分支承重」的专属样本（r691/r702/r705
 * 纪律：两条支覆盖同一样本时，单支注入证明不了单支承重——如 a 支
 * 「纯天然植物提取」与 b 支「植物提取」有子串重叠，a 支专属样本用
 * 「天然材质」走不通 b 的形）。
 *
 * 与 r703/r705 纪律同：killLines 的替换值是 `'__negtest_never__'`
 * 而不是 `''`——空串会让 new RegExp 退化成匹配空串（恒真），把「分支
 * 失效」伪装成「分支还在」；flags 行（'i'）跳过不换；行首 `|` 必须
 * 保留（判据 startsWith("'|")，r705 串味教训）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/appeal-to-nature.js');
const TEST = path.join(HF, 'test/round-706-appeal-to-nature.js');

// 注入点：block = new RegExp 块名；comment = 块内分支注释定位特征
// （缺省 = 整块注入）；line = 行级替换（判定行/time-tested 单支）。
const INJECTS = [
  { name: 'NATURE_ZH-a (纯/全/100%)天然+名词（天然材质样本专属）', block: 'NATURE_ZH', comment: '// a (纯/全/100%)天然' },
  { name: 'NATURE_ZH-b 纯(植物/草本)提取/配方（纯草本配方样本专属）', block: 'NATURE_ZH', comment: '// b 纯(植物/草本)提取' },
  { name: 'NATURE_ZH-c 野生（野生的比家里养样本专属）', block: 'NATURE_ZH', comment: '// c 野生/野生的' },
  { name: 'NATURE_ZH-d 自然熟/原生态（自然熟样本专属）', block: 'NATURE_ZH', comment: '// d 自然熟' },
  { name: 'NATURE_ZH-e 老祖宗传下来（老祖宗样本专属）', block: 'NATURE_ZH', comment: '// e 老祖宗' },
  { name: 'NATURE_ZH-f 原始森林/无污染（原始森林样本专属）', block: 'NATURE_ZH', comment: '// f 原始森林' },
  { name: 'NATURE_ZH-g 自然疗法（自然疗法样本专属）', block: 'NATURE_ZH', comment: '// g 自然疗法' },
  { name: 'NATURE_ZH-h 母乳是天然的（母乳样本专属）', block: 'NATURE_ZH', comment: '// h (母乳/牛奶等)是天然的' },
  { name: 'NATURE_EN-a all-natural/natural materials（EN 天然材质样本专属）', block: 'NATURE_EN', comment: '// a all-natural' },
  { name: 'NATURE_EN-c wild-caught（EN 野生样本专属）', block: 'NATURE_EN', comment: '// c wild' },
  { name: 'NATURE_EN-d naturally ripened（EN 自然熟样本专属）', block: 'NATURE_EN', comment: '// d naturally' },
  { name: 'NATURE_EN-e passed down from ancestors（EN 祖传样本专属）', block: 'NATURE_EN', comment: '// e passed down' },
  { name: 'NATURE_EN-f primeval forest（EN 原始森林样本专属）', block: 'NATURE_EN', comment: '// f primeval' },
  { name: 'NATURE_EN-g natural healing（EN 自然疗法治样本专属）', block: 'NATURE_EN', comment: '// g natural/holistic' },
  { name: 'NATURE_EN-h is natural（EN 母乳样本专属）', block: 'NATURE_EN', comment: '// h is natural' },
  { name: 'SUPERIOR_ZH-a 比化学类+优越词（野生比家里养样本专属）', block: 'SUPERIOR_ZH', comment: '// a 比较形' },
  { name: 'SUPERIOR_ZH-a2 比X更+优越词（a2 专属样本）', block: 'SUPERIOR_ZH', comment: '// a2 比X更' },
  { name: 'SUPERIOR_ZH-b 肯定/一定+优越词（母乳一定比配方奶好样本专属）', block: 'SUPERIOR_ZH', comment: '// b 肯定/一定' },
  { name: 'SUPERIOR_ZH-c 放心吃/用（纯草本配方放心用样本专属）', block: 'SUPERIOR_ZH', comment: '// c 放心/安心' },
  { name: 'SUPERIOR_ZH-d 没有任何化学成分（纯草本配方没有任何化学成分样本专属）', block: 'SUPERIOR_ZH', comment: '// d 没有任何化学成分' },
  { name: 'SUPERIOR_ZH-e 经过时间检验（老祖宗样本专属）', block: 'SUPERIOR_ZH', comment: '// e 经过时间' },
  { name: 'SUPERIOR_EN-a comparative than（EN 野生样本专属）', block: 'SUPERIOR_EN', comment: '// a comparative' },
  { name: 'SUPERIOR_EN-b must be/definitely（EN 天然材质样本专属）', block: 'SUPERIOR_EN', comment: '// b must be' },
  { name: 'SUPERIOR_EN-d no artificial chemicals（EN 100% herbal 样本专属）', block: 'SUPERIOR_EN', comment: '// d no/zero' },
  { name: 'SUPERIOR_EN time-tested 结论支（EN 祖传样本专属，行级注入）', line: 'time[- ](?:tested|honored|honoured)', to: '__negtest_never__' },
  { name: 'META_EXEMPT_ZH 整块（E1 中文元话语承重样本专属）', block: 'META_EXEMPT_ZH' },
  { name: 'META_EXEMPT_EN 整块（E1 英文元话语承重样本专属）', block: 'META_EXEMPT_EN' },
  { name: '判定行 superior 计算（双腿共现路由失效）', line: 'const superior = SUP_ZH_.test(text) || SUP_EN_.test(text);', to: 'const superior = false;' },
  { name: '判定行 if (superior)（命中返回失效）', line: 'if (superior) {', to: 'if (false) {' },
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
    // ⚠️ 行首的连接 `|` 必须保留：模式行在源码里可能是 `'|(?:...'`
    // （ZH 块，单引号）或 `"|\\bwild...`（EN 块，**双引号**）——替换值
    // 丢掉 `|` 会让上一支的末尾粘上 `__negtest_never__`，把**前一支**
    // 也杀掉，注入点的红就归因错了（r705 单引号形态实测；r706 补双
    // 引号形态：EN 块全部双引号，只认单引号等于每一支 EN 注入都串味
    // 杀上一支——杀 d 实测杀掉了 c 支，红样本是 c 的样本）。
    // 判据认两种引号：trim 后前两字符是「引号 + |」即保留。
    const lead = (t2.startsWith("'|") || t2.startsWith('"|')) ? '|' : '';
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
if (!/结果: 10 通过, 0 失败/.test(base.out)) {
  console.error('基线输出不符合预期（10 通过）: ' + base.out.slice(-200)); process.exit(1);
}
console.log('基线: 10/10 PASS，md5=' + baseMd5.slice(0, 12));

// ── 1. 逐点注入 ────────────────────────────────────────────────────
let allRed = true;
for (const inj of INJECTS) {
  const lines = fs.readFileSync(SRC, 'utf8').split('\n');
  let killed;
  if (inj.line) {
    // 行级替换：判定行/time-tested 单支整行替换（先断言唯一，防改错行）
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
const finalOk = final.ok && /结果: 10 通过, 0 失败/.test(final.out);
console.log(finalOk ? '还原后测试: 10/10 PASS' : '还原后测试异常: ' + final.out.slice(-300));
console.log(allRed && finalOk ? '\n负例验证通过：' + INJECTS.length + '/' + INJECTS.length + ' 注入点全部断言红，还原恢复全绿' : '\n负例验证失败：见上方 ✗ 项');
process.exit(allRed && finalOk ? 0 : 1);
