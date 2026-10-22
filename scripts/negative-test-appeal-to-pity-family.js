/**
 * scripts/negative-test-appeal-to-pity-family.js
 *
 * [r702] appeal_to_pity「口语化通融请求」补族守卫有效性负例验证。
 *
 * 方法同 r695 negative-test-appeal-to-pity.js：把 src/appeal-to-pity.js
 * 里本轮新增的各承重分支逐一置为永不匹配（改文件再跑测试文件的方式，
 * 证明 test/round-702-appeal-to-pity-family.js 本身能抓住每个分支
 * 失效），确认测试由 18/18 全绿变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 18/18 PASS → 每个注入点 FAIL（至少 1 个断言红，
 * 且不是 SyntaxError/Cannot find module/ReferenceError/TypeError
 * 崩溃红）→ 还原后 18/18 PASS 且 md5 与基线一致。
 *
 * 注入点覆盖 15 处（本轮新增分支，按分支注释定位）：
 *   PITY_ZH 三支（情感挫折/家人疾病/无能力自述）、
 *   PITY_EN 三块（情感挫折/家人疾病/无能力）、
 *   DEMAND_ZH 四支（d 请求放过与不追究/e 请求让步/f 强行要求/g 乞怜祈使）、
 *   DEMAND_EN 五块（d 请求放过/e 请求不追究/f 请求让步/g 强行要求/h 乞怜祈使）。
 * 每个注入点都配一条「只由该分支承重」的专属样本（r691 纪律）——
 * 即测试文件 A1/A2 里的条目；DEMAND_EN-f 的专属样本用 forgive 形
 * （let it go just this once 会同时命中 d 的 let go 通路，杀 f 后
 * 仍绿，r702 实测后换样）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/appeal-to-pity.js');
const TEST = path.join(HF, 'test/round-702-appeal-to-pity-family.js');

// 注入点：block = 常量名；comment = 块内分支注释定位特征
const INJECTS = [
  { name: 'PITY_ZH-情感挫折支（我刚失恋了/感情受挫）', block: 'PITY_ZH', comment: '// 情感挫折' },
  { name: 'PITY_ZH-家人疾病支（我妈住院了/我爸病了）', block: 'PITY_ZH', comment: '// 家人疾病' },
  { name: 'PITY_ZH-无能力自述支（我什么都不懂/我没本事）', block: 'PITY_ZH', comment: '// 无能力自述' },
  { name: 'PITY_EN-情感挫折块（I just got dumped）', block: 'PITY_EN', comment: '// 情感挫折（I just got dumped' },
  { name: 'PITY_EN-家人疾病块（my mom is in the hospital）', block: 'PITY_EN', comment: '// 家人疾病（my mom' },
  { name: 'PITY_EN-无能力块（I do not know anything）', block: 'PITY_EN', comment: "// 无能力（I don" },
  { name: 'DEMAND_ZH-d 请求放过与不追究支（这次就算了吧/别跟我计较）', block: 'DEMAND_ZH', comment: '// d 请求放过与请求不追究' },
  { name: 'DEMAND_ZH-e 请求让步支（不能让着我一点吗/相让一步）', block: 'DEMAND_ZH', comment: '// e 请求让步' },
  { name: 'DEMAND_ZH-f 强行要求形支（不行也得行/无论如何都得批）', block: 'DEMAND_ZH', comment: '// f 强行要求形' },
  { name: 'DEMAND_ZH-g 乞怜祈使支（可怜可怜我吧/行行好）', block: 'DEMAND_ZH', comment: '// g 乞怜祈使' },
  { name: 'DEMAND_EN-d 请求放过块（let it slide this once）', block: 'DEMAND_EN', comment: '// d 请求放过（let it slide' },
  { name: 'DEMAND_EN-e 请求不追究块（do not hold it against me）', block: 'DEMAND_EN', comment: '// e 请求不追究（do not' },
  { name: 'DEMAND_EN-f 请求让步块（cannot you forgive me just this once）', block: 'DEMAND_EN', comment: '// f 请求让步（cannot' },
  { name: 'DEMAND_EN-g 强行要求块（no excuses / no matter what）', block: 'DEMAND_EN', comment: '// g 强行要求（no excuses' },
  { name: 'DEMAND_EN-h 乞怜祈使块（have pity on me）', block: 'DEMAND_EN', comment: '// h 乞怜祈使（have pity' },
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
  // 块尾（本仓既有 ); 结尾也有 ].join('|'), 'i'); 结尾，两种都认）
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\}\);/.test(lines[i]) || /^\]\.join/.test(lines[i])) { end = i; break; }
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
if (!/结果: 18 通过, 0 失败/.test(base.out)) {
  console.error('基线输出不符合预期（18 通过）: ' + base.out.slice(-200)); process.exit(1);
}
console.log('基线: 18/18 PASS，md5=' + baseMd5.slice(0, 12));

// ── 1. 逐点注入 ────────────────────────────────────────────────────
let allRed = true;
for (const inj of INJECTS) {
  const lines = fs.readFileSync(SRC, 'utf8').split('\n');
  const range = locate(lines, inj);
  if (!range) {
    console.log('  ✗ ' + inj.name + ' :: 定位失败（块/分支注释未找到）');
    allRed = false;
    continue;
  }
  const killed = killLines(lines, range);
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
    console.log('  ✗ ' + inj.name + ' :: 崩溃红非断言红（结论失真）: ' + (r.out.split('\n').filter((l) => /Error/.test(l))[0] || '').slice(0, 120));
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
if (!after.ok || !/结果: 18 通过, 0 失败/.test(after.out)) {
  console.error('还原后未恢复 18/18'); process.exit(1);
}
console.log('还原: md5 一致，18/18 PASS');
console.log(allRed ? '负例验证通过：全部 ' + INJECTS.length + ' 个注入点均断言红' : '负例验证失败：存在漏抓注入点');
process.exit(allRed ? 0 : 1);
