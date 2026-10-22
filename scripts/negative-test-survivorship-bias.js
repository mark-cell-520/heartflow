/**
 * scripts/negative-test-survivorship-bias.js
 *
 * [r694] survivorship_bias（第 132 维）守卫有效性负例验证。
 *
 * 方法同 r685-r693 negative-test-*.js：把 src/survivorship-bias.js 里各
 * 承重分支逐一置为永不匹配（改文件再跑测试文件的方式，证明
 * test/round-694-survivorship-bias.js 本身能抓住每个分支失效），
 * 确认测试由 27/27 全绿变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 27/27 PASS → 每个注入点 FAIL（至少 1 个断言红，
 * 且不是 SyntaxError/Cannot find module/ReferenceError/TypeError
 * 崩溃红）→ 还原后 27/27 PASS 且 md5 与基线一致。
 *
 * 注入点覆盖 22 处（按源码里的分支注释定位，不用 split('|') 切分——
 * 分支内部的选择支 | 会把正则切碎，定位必然落空，r691 纪律）：
 *   SURVIVOR_ZH 七支（财富/奖项/健康/名气/资产/中奖/无金额集体）、
 *   SURVIVOR_EN 六块（财富/奖项/健康/名气/资产/低起点三支合并）、
 *   GENERALIZE_ZH 三支（推及听者/领域评价/比较式贬损）、
 *   GENERALIZE_EN 两块（推及听者/领域评价）、
 *   PATH_ZH / PATH_EN 整块、META_EXEMPT_ZH/EN 两块（正则字面量整行替换）。
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
const SRC = path.join(HF, 'src/survivorship-bias.js');
const TEST = path.join(HF, 'test/round-694-survivorship-bias.js');

// 注入点：block = new RegExp 块名（或正则字面量常量名）；
// comment = 块内分支注释定位特征（缺省 = 整块注入）
const INJECTS = [
  { name: 'SURVIVOR_ZH-财富成功支（成了世界首富/年薪百万/月入十万）', block: 'SURVIVOR_ZH', comment: '// 财富与收入成功' },
  { name: 'SURVIVOR_ZH-奖项竞技支（拿了奥斯卡影后/冠军/上岸）', block: 'SURVIVOR_ZH', comment: '// 奖项与竞技成功' },
  { name: 'SURVIVOR_ZH-健康生存支（痊愈/活到一百岁）', block: 'SURVIVOR_ZH', comment: '// 健康与生存成功' },
  { name: 'SURVIVOR_ZH-名气翻身支（成名/暴富/逆袭）', block: 'SURVIVOR_ZH', comment: '// 名气与翻身成功' },
  { name: 'SURVIVOR_ZH-资产生活支（买了房/豪车）', block: 'SURVIVOR_ZH', comment: '// 资产与生活成功' },
  { name: 'SURVIVOR_ZH-中奖运气支（中了大奖/彩票）', block: 'SURVIVOR_ZH', comment: '// 中奖与运气成功' },
  { name: 'SURVIVOR_ZH-无金额集体成功支（都赚了）', block: 'SURVIVOR_ZH', comment: '// 无金额集体成功' },
  { name: 'SURVIVOR_EN-财富成功支（became a millionaire/got rich）', block: 'SURVIVOR_EN', comment: '// 财富成功' },
  { name: 'SURVIVOR_EN-奖项竞技支（won the lottery/Oscar）', block: 'SURVIVOR_EN', comment: '// 奖项与竞技' },
  { name: 'SURVIVOR_EN-健康生存支（was cured/lived to 90）', block: 'SURVIVOR_EN', comment: '// 健康与生存' },
  { name: 'SURVIVOR_EN-名气翻身支（became famous/hit it big）', block: 'SURVIVOR_EN', comment: '// 名气与翻身' },
  { name: 'SURVIVOR_EN-资产成功支（owns three houses/runs three companies）', block: 'SURVIVOR_EN', comment: '// 资产成功' },
  { name: 'SURVIVOR_EN-低起点成功支（never went to college and now owns/dropped out and built）', block: 'SURVIVOR_EN', comment: '// 低起点成功' },
  { name: 'GENERALIZE_ZH-a 推及听者支（所以你也该/你肯定也/人人都能）', block: 'GENERALIZE_ZH', comment: '// a 推及听者' },
  { name: 'GENERALIZE_ZH-b 领域评价支（读书没用/真轻松/好混）', block: 'GENERALIZE_ZH', comment: '// b 领域评价' },
  { name: 'GENERALIZE_ZH-c 比较式贬损支（比大多数人都强/吊打）', block: 'GENERALIZE_ZH', comment: '// c 比较式贬损' },
  { name: 'GENERALIZE_EN-a 推及听者支（so you should/you can too/anyone can）', block: 'GENERALIZE_EN', comment: '// a 推及听者' },
  { name: 'GENERALIZE_EN-b 领域评价支（college is unnecessary/is a solid plan/must work）', block: 'GENERALIZE_EN', comment: '// b 领域评价' },
  { name: 'PATH_ZH 整块（辍学/退学/摆地摊/白手起家）', block: 'PATH_ZH' },
  { name: 'PATH_EN 整块（dropped out/skipped college/from a poor family）', block: 'PATH_EN' },
  { name: 'META_EXEMPT_ZH 整块（这就是典型的幸存者偏差/统计陈述）', block: 'META_EXEMPT_ZH', literal: true },
  { name: 'META_EXEMPT_EN 整块（survivorship bias is a common pitfall）', block: 'META_EXEMPT_EN', literal: true },
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
    // 正则字面量常量或 new RegExp([...]) 块：整块替换为单行
    // const NAME = /(?!)/;——META_EXEMPT_* 是多行 new RegExp 数组形态，
    // 只换 const 行会把数组行留成裸语句造成 SyntaxError（崩溃红结论
    // 失真，r694 实测），必须连块尾 ); 一起替换。
    let end = -1;
    for (let i = start + 1; i < lines.length; i++) {
      if (/^\);/.test(lines[i]) || /^\]\.join/.test(lines[i])) { end = i + 1; break; }
    }
    if (end < 0) return { kind: 'literal', start, end: start + 1 };
    return { kind: 'literal', start, end };
  }
  // new RegExp( ... ); 块或 new RegExp([...].join('|')); 块：
  // 找到 ); 或 ].join 行结束（本仓两种块尾形态都有，r694 实测）
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\);/.test(lines[i]) || /^\]\.join/.test(lines[i])) { end = i; break; }
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
      // 整块替换：const NAME = new RegExp([...]) → const NAME = /(?!)/;
      // 删掉块内全部中间行，只留替换后的声明行（r694：META 是多行
      // 数组形态，逐行换 '' 会留下 new RegExp(['',''].join('|'))
      // = 匹配空串的过强豁免，方向失真）
      const out2 = lines.slice(0, range.start);
      out2.push('const ' + inj.block + ' = /(?!)/;');
      for (let i = range.end; i < lines.length; i++) out2.push(lines[i]);
      return out2;
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
if (!/结果: 27 通过, 0 失败/.test(base.out)) {
  console.error('基线输出不符合预期（27 通过）: ' + base.out.slice(-200)); process.exit(1);
}
console.log('基线: 27/27 PASS，md5=' + baseMd5.slice(0, 12));

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
if (!after.ok || !/结果: 27 通过, 0 失败/.test(after.out)) {
  console.error('还原后未恢复 27/27');
  process.exit(1);
}
console.log('还原: md5 一致，27/27 PASS');
console.log(allRed ? '负例验证通过：全部 ' + INJECTS.length + ' 个注入点均断言红' : '负例验证失败：存在漏抓注入点');
process.exit(allRed ? 0 : 1);
