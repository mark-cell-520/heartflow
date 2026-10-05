/**
 * negative-test-manufactured-consent-wiring.js — 负例验证（第494轮）
 *
 * 验证 test/round-493-manufactured-consent.test.js 真的在守 manufactured_consent
 * 的承重支：把 src/manufactured-consent.js 的 M1/M2 与豁免组逐支置为永不匹配，
 * 承重结构必须被捕获（断言变红 / 探针由豁免转为命中），不是加载崩溃。
 *
 * 沿用 round-492 负例脚本的三条教训：
 *   ① 副本必须整仓子集拷贝且测试指向副本目录跑（gate.js 要读 VERSION）。
 *   ② 用「整块替换法」而不是正则体内替换 —— 正则体含 / 字符，按 / 切分会截断。
 *   ③ 注入后必须真的改变源码 —— 还原后逐字节比对，防 needle 漂移假阴性。
 *
 * 本轮新增两点（round-494 实测踩到）：
 *   ④ CONSENT_EN 是 `new RegExp([...].join('|'), 'i')` 多行声明，整行替换会留下
 *      悬空数组字面量 → 语法崩溃。必须先定位到 `].join(` 结束行，把整块替换。
 *   ⑤ **豁免支不能用良性样本驱动**：VOTE_COUNT/PROCEDURE/NO_SILENT_EQUATE/
 *      META_EXEMPT 删掉后良性样本本来就全不命中（本族判据根本不在场），
 *      良性零误报断言天然全绿 —— 这不是守卫不敏感，是断言选错了载荷。
 *      正确做法：把良性样本改写成**携带豁免信号的攻击样本**（沉默现状 ×
 *      由沉默推出同意 + 一条豁免痕迹），删掉对应豁免支后它必须由「不命中」
 *      转为「命中」。这同时也是对「三项良性信号占二即豁免」逻辑的真实压力测试。
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const TEST = 'round-493-manufactured-consent.test.js';
const MOD = 'manufactured-consent.js';

// never-match 注入体：纯字面量，样本语料里不可能出现
const DEAD = '/ZZZZ_NEVER_MATCH_494/';

// 判据支（M1/M2）：删任一支 → 攻击样本必须全部不命中 → 单元层断言变红
const JUDGMENT_BRANCHES = [
  { name: 'SILENCE_ZH（M1 沉默现状·中文）', decl: 'const SILENCE_ZH = /' },
  { name: 'SILENCE_EN（M1 沉默现状·英文）', decl: 'const SILENCE_EN = /' },
  { name: 'CONSENT_ZH（M2 沉默推同意·中文）', decl: 'const CONSENT_ZH = /' },
  { name: 'CONSENT_EN（M2 沉默推同意·英文）', decl: 'const CONSENT_EN = new RegExp(' },
];

// 豁免支探针（round-494 实测推导出的形状）：
//   ① 豁免判定是「三项良性信号**占二**」→ 单条豁免信号不足以免责，
//      探针必须恰好携带**两条**信号，删掉目标支后降到一条 → 判定翻转。
//   ② isZh 分支下三支豁免都会做 zh||en 双判，所以**两条信号不能落在同一族**
//      （同族删一支另一支仍在，仍是 2 条，删了也不翻转）。
//   ③ 因此每个探针 = 目标支信号 + **另一族**的一个信号，组合形如
//      VOTE×PROC / PROC×NOEQ / NOEQ×VOTE —— 三族两两配对，删任一支
//      都有唯一一个探针由 0 命中翻为 1 命中。
// 这批探针同时是对「占二即豁免」这条逻辑本身的压力测试。
const EXEMPT_BRANCHES = [
  { name: 'VOTE_COUNT_ZH（豁免①具名票数·中文）', decl: 'const VOTE_COUNT_ZH = /',
    probes: ['无人反对，表决结果 3 票赞成、1 票弃权，会议纪要已归档，这事就这么定了。'] },
  { name: 'VOTE_COUNT_EN（豁免①具名票数·英文）', decl: 'const VOTE_COUNT_EN = /',
    probes: ['No objections, so I take it as unanimous approval. The vote was 3 in favor and the minutes were circulated.'] },
  { name: 'PROCEDURE_ZH（豁免②程序痕迹·中文）', decl: 'const PROCEDURE_ZH = /',
    probes: ['无人反对，会议纪要已归档，未反馈部门不作同意，这事就这么定了。'] },
  { name: 'PROCEDURE_EN（豁免②程序痕迹·英文）', decl: 'const PROCEDURE_EN = /',
    probes: ['No objections, so I take it as unanimous approval. The minutes were circulated and no response is not consent.'] },
  { name: 'NO_SILENT_EQUATE_ZH（豁免③沉默不认同意·中文）', decl: 'const NO_SILENT_EQUATE_ZH = /',
    probes: ['无人反对，未反馈部门不作同意，表决结果 3 票赞成，这事就这么定了。'] },
  { name: 'NO_SILENT_EQUATE_EN（豁免③沉默不认同意·英文）', decl: 'const NO_SILENT_EQUATE_EN = /',
    probes: ['No objections, so I take it as unanimous approval. No response is not consent and the vote was 3 in favor.'] },
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-neg494-'));
execFileSync('cp', ['-r',
  path.join(HF, 'src'),
  path.join(HF, 'VERSION'),
  path.join(HF, 'package.json'),
  tmp]);
fs.mkdirSync(path.join(tmp, 'test'), { recursive: true });
fs.copyFileSync(
  path.join(HF, 'test', TEST),
  path.join(tmp, 'test', TEST),
);
const ckptFile = path.join(tmp, 'src', MOD);

// 探针脚本：require 副本 src，返回命中数
const probeFile = path.join(tmp, 'neg-probe.js');
fs.writeFileSync(probeFile, `
const { checkManufacturedConsent } = require('./src/${MOD}');
const probes = JSON.parse(process.argv[2]);
let hit = 0;
for (const p of probes) { if (checkManufacturedConsent(p).hit) hit++; }
console.log(String(hit));
`);

function runProbes(probes) {
  try {
    const out = execFileSync(process.execPath, [probeFile, JSON.stringify(probes)],
      { encoding: 'utf8', cwd: tmp, timeout: 60000 });
    return parseInt(out.trim(), 10);
  } catch (e) { return -1; }
}

function syntaxOk() {
  try { execFileSync(process.execPath, ['--check', ckptFile]); return true; }
  catch (e) { return false; }
}

function runGuardTest() {
  try {
    const out = execFileSync(process.execPath, [path.join(tmp, 'test', TEST)],
      { encoding: 'utf8', timeout: 90000 });
    return { failed: false, out };
  } catch (e) {
    return { failed: true, out: (e.stdout || '') + (e.stderr || '') };
  }
}

let red = 0, green = 0;

function checkOne(b, kind) {
  const orig = fs.readFileSync(ckptFile, 'utf8');
  const lines = orig.split('\n');
  const idx = lines.findIndex(l => l.startsWith(b.decl));
  if (idx < 0) { console.log(`❌ ${b.name}: 找不到 const 声明行，算未变红`); green++; return; }

  // 多行 `new RegExp([...].join(...))` 声明：定位到 ].join( 结束行
  let end = idx;
  if (b.decl.includes('new RegExp(')) {
    for (let i = idx; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('].join(')) { end = i; break; }
    }
    if (end === idx) { console.log(`❌ ${b.name}: 多行声明找不到 ].join( 结束行，算未变红`); green++; return; }
  }

  const nameStart = lines[idx].indexOf('const ') + 6;
  const nameEnd = lines[idx].indexOf(' =', nameStart);
  const mutName = lines[idx].slice(nameStart, nameEnd);
  const block = lines.slice(idx, end + 1).join('\n');
  const replacement = `const ${mutName} = ${DEAD};`;
  lines.splice(idx, end - idx + 1, replacement);
  const mutated = lines.join('\n');
  if (mutated === orig) {
    console.log(`❌ ${b.name}: 注入未生效，算未变红`); green++; return;
  }
  fs.writeFileSync(ckptFile, mutated, 'utf8');
  if (!syntaxOk()) {
    console.log(`❌ ${b.name}: 注入后语法不合法，算未变红`);
    green++; fs.writeFileSync(ckptFile, orig, 'utf8'); return;
  }

  if (kind === 'judgment') {
    const { failed, out } = runGuardTest();
    if (failed && /ERR_ASSERTION/.test(out)) {
      console.log(`✅ ${b.name}: 守卫变红（ERR_ASSERTION，非崩溃）`);
      red++;
    } else if (failed) {
      console.log(`⚠️ ${b.name}: 退出非零但需人工判断 —— ${out.trim().slice(-120)}`);
      green++;
    } else {
      console.log(`❌ ${b.name}: 删后守卫仍全绿（守卫对该支不敏感）`);
      green++;
    }
  } else {
    const before = runProbes(b.probes);
    if (before !== 0) {
      console.log(`⚠️ ${b.name}: 删前探针即命中 ${before}/${b.probes.length}，豁免未生效，需人工判断`);
      green++; fs.writeFileSync(ckptFile, orig, 'utf8'); return;
    }
    const after = runProbes(b.probes);
    if (after > 0) {
      console.log(`✅ ${b.name}: 删后探针 ${after}/${b.probes.length} 转为命中（豁免失效被捕获）`);
      red++;
    } else {
      console.log(`❌ ${b.name}: 删后探针仍 0 命中（豁免组不是该样本的承重支）`);
      green++;
    }
  }

  // 还原并验证逐字节一致
  fs.writeFileSync(ckptFile, orig, 'utf8');
  const restored = fs.readFileSync(ckptFile, 'utf8');
  if (restored !== orig) {
    console.log(`❌ ${b.name}: 还原后与原文不一致（块 ${block.length} → ${replacement.length}）`);
    green++; return;
  }
}

console.log('── 判据支（M1/M2）删除后守卫测试必须变红 ──');
for (const b of JUDGMENT_BRANCHES) checkOne(b, 'judgment');

console.log('\n── 豁免支删除后攻击型探针必须由豁免转为命中 ──');
for (const b of EXEMPT_BRANCHES) checkOne(b, 'exempt');

const total = JUDGMENT_BRANCHES.length + EXEMPT_BRANCHES.length;
console.log(`\n负例结果：${red}/${total} 支删除后捕获到守卫失效` + (green === 0 ? '，全部通过' : `，${green} 支需人工复核`));
fs.rmSync(tmp, { recursive: true, force: true });
if (red !== total) process.exit(1);
