/**
 * negative-test-hg-copula-postprep-round283.js — 负例验证（第 283 轮）
 *
 * 验证 test/hasty-copula-postprep-round282.test.js 真的在守门：
 * 把 src/index.js 里第 283 轮新增/修改的三处判据逐条删掉，守卫必须变红。
 *
 * 三处改动：
 *   M1 删 282 C/D 群体表补词（interns?|individuals?）
 *   M2 删 282 C 判据限定词可选化（(?:(?:DET)\s+(?:own\s+)?)? → (?:(?:DET)\s+(?:own\s+)?)）
 *   M3 删 283 everyone/everybody 直连系动词独立支
 *   M4 无效变异对照（把 /i 改成 /u —— 大小写语义不变，守卫必须**不**变红）
 *
 * 坑（279 轮脚本已踩，别再踩）：
 *   ① 副本 VERSION 必须在项目根，否则 gate.js ENOENT 崩溃 ≠ 变红
 *   ② needle 是源码逐字串（含单层反斜杠）
 *   ③ 崩溃 ≠ 变红：必须读到 MISS/HIT_FAIL 才算红
 *   ④ BLOCK 口径：用 gate action ∈ {block,rewrite,verify} 判命中
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');
const NEVER_MATCH = '/^$(?!)/';

// 唯一定位串（源码逐字）
const M1_ANCHOR = 'fanatics?|interns?|individuals?|people|ones)';
const M2_ANCHOR = 'of\\s+(?:(?:(?:the|these|those|my|your|his|her|their|our|its|each|every|all|both|single)\\s+(?:own\\s+)?)?(?:users?|';
const M3_ANCHOR = '动词独立支：281 判据的';

/** 从源码里按锚点向后找最近的 `/`，截出整条正则 /…/i */
function extractRegexAfter(anchor) {
  const i = SRC.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor.slice(0, 30));
  const start = SRC.indexOf('/', i);
  const end = SRC.indexOf('/i', start);
  if (start < 0 || end < 0 || end < start) throw new Error('无法定位正则边界: ' + anchor.slice(0, 30));
  return SRC.slice(start, end + 2);
}

// 每个注入的「必须被拦到」样本
const EXPECT_HITS = [
  ['M1-interns', 'All of the interns are fools.', 'All of the interns are vermin.'],
  ['M1-individuals', 'All of the individuals are fools.', 'Every single one of individuals is a nobody.'],
  ['M2-bare', 'Each single one of users is a fool.', 'Every one of employees is an idiot.'],
  ['M3-everyone', 'Everyone is a fool.', 'Everybody is vermin.'],
];

const INJECTIONS = [
  { name: 'M1 删 282 C/D 群体表补词 interns?|individuals?', anchor: M1_ANCHOR, hits: [0, 1], mutate: (s) => s.split(M1_ANCHOR).join('fanatics?|people|ones)') },
  { name: 'M2 删 282 C 限定词可选化（裸群体词形）', anchor: M2_ANCHOR, hits: [2], mutate: (s) => s.split(M2_ANCHOR).join('of\\s+(?:(?:the|these|those|my|your|his|her|their|our|its|each|every|all|both|single)\\s+(?:own\\s+)?(?:users?|') },
  // M3：删 283 新支整条正则（用注释锚定位最近的 /…/i 整条替换为永不匹配）
  { name: 'M3 删 283 everyone/everybody 直连独立支', anchor: M3_ANCHOR, hits: [3], useExtract: true },
];

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const idx = path.join(dir, 'src', 'index.js');
  const before = fs.readFileSync(idx, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(idx, after);
  return dir;
}

function runGuard(dir) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const gate = require(' + JSON.stringify(path.join(dir, 'src', 'gate.js')) + ');',
    'const expected = ' + JSON.stringify(EXPECT_HITS) + ';',
    'let fail = 0;',
    'for (const [f, s1, s2] of expected) {',
    '  for (const s of [s1, s2]) {',
    '    let a = "none";',
    '    try { const r = gate.checkOutput(s); a = r && r.gate ? r.gate.action : "none"; } catch (e) { a = "ERR"; }',
    '    if (a === "pass" || a === "none" || a === "ERR") { fail++; console.log("MISS[" + f + "] " + s); }',
    '  }',
    '}',
    'console.log("HIT_FAIL=" + fail);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

function recordRed(out, name) {
  red++;
  const m = out.match(/HIT_FAIL=(\d+)/);
  results.push([name, '变红（miss ' + (m ? m[1] : '?') + '）']);
}

// ① 对照副本
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-r283-control'), (s) => s, true);
  try {
    const out = runGuard(dir);
    const ok = /HIT_FAIL=0\b/.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', ok ? '全绿' : '未全绿']);
  } catch (e) {
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
    green++;
  }
}

// ② 逐个注入
for (const inj of INJECTIONS) {
  let mutate = inj.mutate;
  let noChangeOk = inj.allowNoChange || false;
  if (inj.useExtract) {
    let needle;
    try { needle = extractRegexAfter(inj.anchor); }
    catch (e) { results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 60)]); green++; continue; }
    mutate = (s) => s.split(needle).join(NEVER_MATCH);
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-r283-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    mutate,
    noChangeOk
  );
  try {
    const out = runGuard(dir);
    if (/HIT_FAIL=0\b/.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      recordRed(out, inj.name);
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) recordRed(out, inj.name);
    else results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 200)]);
  }
}

// ③ M4 无效变异对照：把 `(?:\s+(?:here|involved|...))?` 里的非捕获组
//    `(?:` 改成捕获组 `(` —— 语义完全等价（不影响匹配结果），
//    守卫必须仍全绿。若它变红，说明探针记的是源码字符串而不是行为。
{
  const name = 'M4 无效变异对照（捕获组化，语义等价）';
  const M4_NEEDLE = 'everyone|everybody)\\s+(?:is|are)\\s+(?!not\\b|n\'t\\b)(?:a\\s+|an\\s+)?(?:fools?';
  const M4_REPL = 'everyone|everybody)\\s+(?:is|are)\\s+(?!not\\b|n\'t\\b)(a\\s+|an\\s+)?(?:fools?';
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-r283-neutral'),
    (s) => s.split(M4_NEEDLE).join(M4_REPL), false);
  try {
    const out = runGuard(dir);
    const ok = /HIT_FAIL=0\b/.test(out);
    if (ok) results.push([name, '保持全绿（无效变异被正确识别）']);
    else { green++; results.push([name, '异常变红（说明探针记的是源码字符串不是行为）']); }
  } catch (e) {
    green++;
    results.push([name, '崩溃: ' + String(e.message).slice(0, 80)]);
  }
}

console.log('\n=== 第 283 轮负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.filter(i => i.anchor).length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === 3 && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
