/**
 * scripts/negative-test-appeal-to-pity.js
 *
 * [r695] appeal_to_pity（第 133 维）守卫有效性负例验证。
 *
 * 方法同 r685-r694 negative-test-*.js：把 src/appeal-to-pity.js 里各
 * 承重分支逐一置为永不匹配（改文件再跑测试文件的方式，证明
 * test/round-695-appeal-to-pity.js 本身能抓住每个分支失效），
 * 确认测试由 22/22 全绿变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 22/22 PASS → 每个注入点 FAIL（至少 1 个断言红，
 * 且不是 SyntaxError/Cannot find module/ReferenceError/TypeError
 * 崩溃红）→ 还原后 22/22 PASS 且 md5 与基线一致。
 *
 * 注入点覆盖 35 处：
 *   PITY_ZH 十支（可怜自述/孤独漂泊/家庭不幸/疾病身体/孩子拖累/
 *     贫困处境/失业裁员/年纪大/债务缠身/苦难总括——按分支注释定位）、
 *   PITY_EN 八块（苦难总括/孤独/疾病/失业/贫困/家庭不幸/年纪/债务）、
 *   DEMAND_ZH 十二行（a1 忍心拒绝/a2 不肯帮/a3 情态照顾/a4 总该轮到/
 *     a5 通融裸词/a6 这点小忙/a7 看在份上/b1 迟到怎么了/b2 就不能谅解/
 *     b3 欺负弱者/c1 断活路/c2 逼我走投无路——按模式行特征定位单行）、
 *   DEMAND_EN 三支（情态要求/how could 反问/will kill 后果）、
 *   META_EXEMPT_ZH/EN 两块（正则字面量整块替换）。
 * 每个注入点都配一条「只由该分支承重」的专属样本（r691 纪律）——
 * 即测试文件 A1/A2 里的条目（含 r695 为注入点独占补的 6 条）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/appeal-to-pity.js');
const TEST = path.join(HF, 'test/round-695-appeal-to-pity.js');

// 注入点：block = 常量名；comment = 块内分支注释定位特征；
// line = 模式行唯一特征（单行注入）；literal = 整块替换
const INJECTS = [
  { name: 'PITY_ZH-可怜惨自述支（我这么可怜/我太惨了）', block: 'PITY_ZH', comment: '// 可怜/惨自述' },
  { name: 'PITY_ZH-孤独漂泊支（漂泊异乡/举目无亲）', block: 'PITY_ZH', comment: '// 孤独漂泊' },
  { name: 'PITY_ZH-家庭不幸支（父母离异/爸妈刚离婚）', block: 'PITY_ZH', comment: '// 家庭不幸' },
  { name: 'PITY_ZH-疾病身体支（身体不好/心脏病）', block: 'PITY_ZH', comment: '// 疾病身体' },
  { name: 'PITY_ZH-孩子拖累支（孩子还小/一个人带孩子）', block: 'PITY_ZH', comment: '// 孩子拖累' },
  { name: 'PITY_ZH-贫困处境支（条件差/手头紧/吃不上饭）', block: 'PITY_ZH', comment: '// 贫困处境' },
  { name: 'PITY_ZH-失业裁员支（被裁员/丢了饭碗）', block: 'PITY_ZH', comment: '// 失业裁员' },
  { name: 'PITY_ZH-年纪大支（一把年纪/干不动了）', block: 'PITY_ZH', comment: '// 年纪大' },
  { name: 'PITY_ZH-债务缠身支（欠了一屁股债/网贷缠身）', block: 'PITY_ZH', comment: '// 债务缠身' },
  { name: 'PITY_ZH-苦难总括支（这些年太苦了/命太苦）', block: 'PITY_ZH', comment: '// 苦难总括' },
  { name: 'PITY_EN-苦难总括块（I have been through so much）', block: 'PITY_EN', comment: '// 苦难总括' },
  { name: 'PITY_EN-孤独块（I am all alone）', block: 'PITY_EN', comment: '// 孤独' },
  { name: 'PITY_EN-疾病块（I am sick / my health is poor）', block: 'PITY_EN', comment: '// 疾病' },
  { name: 'PITY_EN-失业块（I was laid off）', block: 'PITY_EN', comment: '// 失业裁员' },
  { name: 'PITY_EN-贫困块（my family will starve）', block: 'PITY_EN', comment: '// 贫困' },
  { name: 'PITY_EN-家庭不幸块（my child is still little）', block: 'PITY_EN', comment: '// 家庭不幸' },
  { name: 'PITY_EN-年纪块（I am too old）', block: 'PITY_EN', comment: '// 年纪' },
  { name: 'PITY_EN-债务块（I am drowning in debt）', block: 'PITY_EN', comment: '// 债务' },
  { name: 'DEMAND_ZH-a1 忍心拒绝行（你怎么忍心拒绝我）', block: 'DEMAND_ZH', line: '竟然|居然)(?:忍心|狠心|狠得下心|下得了手|做得出来)' },
  { name: 'DEMAND_ZH-a2 不肯帮行（你们都不肯帮我）', block: 'DEMAND_ZH', line: '(?:肯|愿意|打算)?(?:帮|帮帮我|帮我|帮我一下|拉我一把' },
  { name: 'DEMAND_ZH-a3 情态照顾行（必须照顾/就该照顾）', block: 'DEMAND_ZH', line: '(?:必须|一定|总得|总该|也该|就应该|务必)(?:照顾|通融' },
  { name: 'DEMAND_ZH-a4 总该轮到行（晋升总该轮到我了）', block: 'DEMAND_ZH', line: '就该|总该|也应该|理应' },
  { name: 'DEMAND_ZH-a5 通融裸词行（高抬贵手/放我一马）', block: 'DEMAND_ZH', line: '(?:通融|体谅|网开一面|高抬贵手|放我一马' },
  { name: 'DEMAND_ZH-a6 这点小忙行（这点小忙你都不帮）', block: 'DEMAND_ZH', line: '(?:这点|这点小|这点小忙|这点忙|这么点|这小)(?:忙|事' },
  { name: 'DEMAND_ZH-a7 看在份上行（看在我这么可怜的份上）', block: 'DEMAND_ZH', line: '(?:看|看在我|看在|念在|念我)(?:这么|怪|也|实在' },
  { name: 'DEMAND_ZH-b1 迟到怎么了行（反问免责）', block: 'DEMAND_ZH', line: '(?:迟到|旷工|早退|晚点|缺席|迟到几分钟' },
  { name: 'DEMAND_ZH-b2 就不能谅解行（b2 收紧独占样本）', block: 'DEMAND_ZH', line: '(?:不能|不能不|能否|能不能|可不可以|可以不可以)?(?:通融|体谅|谅解|包容|宽限)' },
  { name: 'DEMAND_ZH-b3 欺负弱者行（你批评我就是欺负弱者）', block: 'DEMAND_ZH', line: '(?:欺负|针对|歧视|打压|苛待|刻薄|为难|施压)(?:弱者' },
  { name: 'DEMAND_ZH-c1 断活路行（就是断我们活路）', block: 'DEMAND_ZH', line: '(?:断|断送|绝|断绝|断掉)(?:了)?(?:我们|我|我家' },
  { name: 'DEMAND_ZH-c2 逼我走投无路行（后果绑架）', block: 'DEMAND_ZH', line: '(?:逼死|逼我|逼得我|不想让我活|要把我' },
  { name: 'DEMAND_EN-a 情态要求支（you must help/give/grant）', block: 'DEMAND_EN', comment: '// a 通融照顾' },
  { name: 'DEMAND_EN-b how could 支（反问指责）', block: 'DEMAND_EN', comment: '// b 反问免责与指责' },
  { name: 'DEMAND_EN-c will kill 支（后果绑架）', block: 'DEMAND_EN', comment: '// c 后果绑架' },
  { name: 'META_EXEMPT_ZH 整块（制度/第三人称/尊重决定权豁免）', block: 'META_EXEMPT_ZH', literal: true },
  { name: 'META_EXEMPT_EN 整块（Under the policy/决定权在你豁免）', block: 'META_EXEMPT_EN', literal: true },
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

// 定位注入行区间：返回 {kind, start, end}
function locate(lines, inj) {
  const blockRe = new RegExp('^const ' + inj.block + ' = ');
  const start = lines.findIndex(l => blockRe.test(l));
  if (start < 0) return null;
  if (inj.literal) {
    // new RegExp([...].join('|')) 多行数组块：整块替换为单行
    // const NAME = /(?!)/;——只换 const 行会把数组行留成裸语句造成
    // SyntaxError（崩溃红结论失真，r694 实测），必须连 ].join 行一起替换。
    let end = -1;
    for (let i = start + 1; i < lines.length; i++) {
      if (/^\}\);/.test(lines[i]) || /^\]\.join/.test(lines[i])) { end = i + 1; break; }
    }
    if (end < 0) return null;
    return { kind: 'literal', start, end };
  }
  // 块尾（本仓既有 ); 结尾也有 ].join('|'), 'i'); 结尾，r694 实测两种都认）
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\}\);/.test(lines[i]) || /^\]\.join/.test(lines[i])) { end = i; break; }
  }
  if (end < 0) return null;
  if (inj.line) {
    // 单行注入：模式行唯一特征（DEMAND_ZH 的 a/b/c 支在同一注释块内
    // 多行并列，branch 定位会把整支当一行，必须逐行特征定位）
    const li = lines.findIndex((l, i) => i > start && i < end && l.includes(inj.line));
    if (li < 0) return null;
    return { kind: 'line', start: li, end: li + 1 };
  }
  if (!inj.comment) return { kind: 'block', start, end };
  const ci = lines.findIndex((l, i) => i > start && i < end && l.includes(inj.comment));
  if (ci < 0) return null;
  let stop = end;
  for (let i = ci + 1; i < end; i++) {
    if (/^\s*\/\//.test(lines[i])) { stop = i; break; }
  }
  return { kind: 'branch', start: ci + 1, end: stop };
}

function killLines(lines, range, inj) {
  if (range.kind === 'literal') {
    // 整块替换：const NAME = new RegExp([...]) → const NAME = /(?!)/;
    const out = lines.slice(0, range.start);
    out.push('const ' + inj.block + ' = /(?!)/;');
    for (let i = range.end; i < lines.length; i++) out.push(lines[i]);
    return out;
  }
  const out = lines.slice();
  for (let i = range.start; i < range.end; i++) {
    const line = out[i];
    // 声明行不碰（替换掉会把模式行变成裸字符串造成 SyntaxError，r692 实测）
    if (/^\s*const\s/.test(line)) continue;
    if (/^\s*$/.test(line) || /^\s*\/\//.test(line)) continue;
    const t = line.trim();
    if (t.endsWith(',')) out[i] = "''" + ',';
    else if (t.endsWith('+')) out[i] = "'' +";
    else out[i] = "''";
  }
  return out;
}

// ── 0. 基线 ────────────────────────────────────────────────────────
const baseMd5 = md5(SRC);
const base = runTest();
if (!base.ok) { console.error('基线就不是全绿，中止: ' + base.out.slice(-400)); process.exit(1); }
if (!/结果: 22 通过, 0 失败/.test(base.out)) {
  console.error('基线输出不符合预期（22 通过）: ' + base.out.slice(-200)); process.exit(1);
}
console.log('基线: 22/22 PASS，md5=' + baseMd5.slice(0, 12));

// ── 1. 逐点注入 ────────────────────────────────────────────────────
let allRed = true;
for (const inj of INJECTS) {
  const lines = fs.readFileSync(SRC, 'utf8').split('\n');
  const range = locate(lines, inj);
  if (!range) {
    console.log('  ✗ ' + inj.name + ' :: 定位失败（块/分支注释/行特征未找到）');
    allRed = false;
    continue;
  }
  const killed = killLines(lines, range, inj);
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
    console.log('  ✗ ' + inj.name + ' :: 崩溃红非断言红（结论失真）: ' + (r.out.split('\n').filter(l => /Error/.test(l))[0] || '').slice(0, 120));
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
if (!after.ok || !/结果: 22 通过, 0 失败/.test(after.out)) {
  console.error('还原后未恢复 22/22');
  process.exit(1);
}
console.log('还原: md5 一致，22/22 PASS');
console.log(allRed ? '负例验证通过：全部 ' + INJECTS.length + ' 个注入点均断言红' : '负例验证失败：存在漏抓注入点');
process.exit(allRed ? 0 : 1);
