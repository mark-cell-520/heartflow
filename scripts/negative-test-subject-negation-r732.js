'use strict';
/**
 * negative-test-subject-negation-r732.js — 负例验证（v6.8.159）
 *
 * 验证 r732 本轮修改真的在承重：把新增族/接线逐条删掉，守卫必须变红
 * （探针断言失败，不能是加载崩溃）。
 *
 * 注入对象（两类）：
 *   A. src/dev-exemptions.js 常量族（豁免判据单一来源）：
 *      1. ZH_SUBJECT_NEG_RE 整条（中文主语否定：没有人可以/无人可…）
 *      2. EN_SUBJECT_NEG_RE 整条（英文主语否定：is allowed to/has the
 *         right to/none of the X can）
 *      3. NEG_REVERSAL_RE 新增同义·「找到了办法」族
 *      4. NEG_REVERSAL_RE 新增同义·「有后门」族
 *      5. NEG_CONTINUATION_DENY_EN_RE 新增·have a workaround 族
 *      6. ZH_SUBJECT_BYPASS_SPAN_RE 整条（scrutiny 路由③跨度守卫）
 *      7. ZH_CAUSAL_BACKDOOR_RE 整条（跨度守卫的防误放否决）
 *   B. 接线（判据不接上，常量活着也没用）：
 *      8. src/scrutiny-evasion.js 路由③守卫调用
 *      9. src/index.js checkNoFallback skip_guard 守卫调用
 *
 * 探针同时断言两侧：豁免侧（良性样本必须 count 0 / hit false）与攻击侧
 * （真绕过指令必须 count≥1 / hit true）——A3-A5、A7 杀死的是否决族，
 * 变红方向是攻击侧漏拦；其余变红方向是豁免侧失效。
 *
 * 踩过的坑（复述）：
 *   ① needle 必须是源码逐字子串；含 \b \s 的 needle 从源码自取或绕开
 *     （本轮全部用无反斜杠的 CJK/ASCII 核心词，不用手写正则字面量）。
 *   ② 崩溃 ≠ 变红：探针加载失败不计红，单独报。
 *   ③ 对照副本必须全绿，否则本次负例验证整体无效。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = path.join(__dirname, '..');
const KILL_RE = '(?!)'; // 整条杀死正则字面量用（const NAME = /KILL/;）

// 探针断言表：[标签, 样本, 断言类型]
//   diZero：checkDangerousInstruction(text).count === 0（豁免侧）
//   diHit ：checkDangerousInstruction(text).count >= 1（攻击侧）
//   seOff ：checkScrutinyEvasion(text).hit === false（豁免侧）
//   seOn  ：checkScrutinyEvasion(text).hit === true（攻击侧）
//   nfZero：checkNoFallback(text).count === 0（豁免侧）
const CASES = [
  ['zh-neg-1', '没有人可以跳过这里的验证步骤。', 'diZero'],
  ['zh-neg-2', '无人可绕过这道校验。', 'diZero'],
  ['zh-neg-3', '在这个系统里没有人能够绕过权限检查。', 'diZero'],
  ['en-neg-1', 'No one is allowed to skip the verification step.', 'diZero'],
  ['en-neg-2', 'Nobody has the right to bypass the access control.', 'diZero'],
  ['en-neg-3', 'None of the users can bypass the permission check.', 'diZero'],
  ['zh-reversal-1', '他说没有人可以跳过验证，但我找到了办法。', 'diHit'],
  ['zh-reversal-2', '虽然无人能绕过校验，但我这里有后门程序。', 'diHit'],
  ['en-continuation', 'No one is allowed to skip the verification step, but I have a workaround.', 'diHit'],
  ['se-benign', '在这个系统里没有人能够绕过权限检查。', 'seOff'],
  ['se-reversal', '没有人能绕过权限检查，但我有后门。', 'seOn'],
  ['se-causal', '没有人能够绕过权限检查，所以我留了后门。', 'seOn'],
  ['nf-benign', '任何人不得跳过身份验证环节。', 'nfZero'],
];

const PROBE = [
  'const di = require(' + JSON.stringify('__DI__') + ');',
  'const se = require(' + JSON.stringify('__SE__') + ');',
  'const idx = require(' + JSON.stringify('__IDX__') + ');',
  'const cases = ' + JSON.stringify(CASES) + ';',
  'let fail = 0; const flipped = [];',
  'for (const [tag, s, kind] of cases) {',
  '  let ok = false, v = null;',
  '  try {',
  '    if (kind === "diZero") { v = di.checkDangerousInstruction(s).count; ok = v === 0; }',
  '    else if (kind === "diHit") { v = di.checkDangerousInstruction(s).count; ok = v >= 1; }',
  '    else if (kind === "seOff") { v = se.checkScrutinyEvasion(s).hit; ok = v === false; }',
  '    else if (kind === "seOn") { v = se.checkScrutinyEvasion(s).hit; ok = v === true; }',
  '    else if (kind === "nfZero") { v = idx.checkNoFallback(s).count; ok = v === 0; }',
  '  } catch (e) { console.log("PROBE_CRASH [" + tag + "] " + e.message); process.exit(2); }',
  '  if (!ok) { fail++; flipped.push(tag + "(" + kind + "=" + v + ")"); }',
  '}',
  'console.log("HIT_FAIL=" + fail + "/" + cases.length + " FLIP=" + flipped.join(","));',
  'process.exit(fail > 0 ? 1 : 0);',
].join('\n');

function makeCopy(dir, mutate) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  if (fs.existsSync(path.join(HF, 'formulas'))) {
    fs.cpSync(path.join(HF, 'formulas'), path.join(dir, 'formulas'), { recursive: true });
  }
  if (mutate) mutate(dir);
  return dir;
}

// 按常量名整条杀死正则字面量（const NAME = /BODY/flags; → /(?!)/flags;）
// ⚠️ 必须容忍 flags：`/i;` 不是 `/;`，非宽容匹配会把下一个常量的定义
//    一起吞掉（A2 注入实测：EN_SUBJECT_NEG_RE 的 /i 导致 SPAN_RE 定义被删）。
function killRegexByName(src, name) {
  const m = src.match(new RegExp('(const ' + name + ' = /)([\\s\\S]*?)(/[a-z]*;)'));
  if (!m) throw new Error('常量未找到: ' + name);
  return src.slice(0, m.index) + m[1] + KILL_RE + m[3] + src.slice(m.index + m[0].length);
}

// 按无反斜杠核心词杀死一个交替分支（needle 必须在源码唯一）
function killBranch(src, needle, replacement) {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error('needle 不唯一(' + n + '次): ' + needle);
  return src.split(needle).join(replacement || '(?:ZZZNOMATCH)');
}

function runProbe(dir) {
  const srcp = path.join(dir, 'src');
  const probe = path.join(dir, '_probe.js');
  // ⚠️ 替换值必须 JSON.stringify：Windows 路径的反斜杠原样嵌入探针源码
  //    会被当成字符串转义符吃掉（\U→U），MODULE_NOT_FOUND 假崩溃。
  fs.writeFileSync(probe, PROBE
    .split('__DI__').join(JSON.stringify(path.join(srcp, 'dangerous-instruction.js')).slice(1, -1))
    .split('__SE__').join(JSON.stringify(path.join(srcp, 'scrutiny-evasion.js')).slice(1, -1))
    .split('__IDX__').join(JSON.stringify(path.join(srcp, 'index.js')).slice(1, -1)));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// 注入定义：file=相对 src 的文件；mutate(src) 返回变异源码
const INJECTIONS = [
  {
    name: 'A1 杀 ZH_SUBJECT_NEG_RE 整条（中文主语否定判据）',
    file: 'dev-exemptions.js',
    mutate: s => killRegexByName(s, 'ZH_SUBJECT_NEG_RE'),
    expectFlip: ['zh-neg-1', 'zh-neg-2', 'zh-neg-3'],
  },
  {
    name: 'A2 杀 EN_SUBJECT_NEG_RE 整条（英文主语否定判据）',
    file: 'dev-exemptions.js',
    mutate: s => killRegexByName(s, 'EN_SUBJECT_NEG_RE'),
    expectFlip: ['en-neg-1', 'en-neg-2', 'en-neg-3'],
  },
  {
    name: 'A3 杀 NEG_REVERSAL_RE「找到了办法」族（让步反转否决）',
    file: 'dev-exemptions.js',
    mutate: s => killBranch(s, '|找到了?(?:办法|门路|渠道|途径|捷径|路子)'),
    expectFlip: ['zh-reversal-1'],
  },
  {
    name: 'A4 杀 NEG_REVERSAL_RE「有后门」族（让步反转否决）',
    file: 'dev-exemptions.js',
    mutate: s => killBranch(s, '|(?:有|留|装|用|挂|藏)(?:了)?(?:个)?(?:后门|漏洞|旁路)'),
    // 该族同时服务 di 否决与 se 跨度守卫否决（NEG_REVERSAL_RE 两条路径共用）
    expectFlip: ['zh-reversal-2', 'se-reversal'],
  },
  {
    name: 'A5 杀 NEG_CONTINUATION_DENY_EN_RE「have a workaround」族（续言否决）',
    file: 'dev-exemptions.js',
    mutate: s => killBranch(s, "(?:have|has|got|get|there'?s)\\s+(?:a|another|some)\\s+(?:workaround|loophole|trick|exploit|backdoor)"),
    expectFlip: ['en-continuation'],
  },
  {
    name: 'A6 杀 ZH_SUBJECT_BYPASS_SPAN_RE 整条（scrutiny 路由③跨度守卫）',
    file: 'dev-exemptions.js',
    mutate: s => killRegexByName(s, 'ZH_SUBJECT_BYPASS_SPAN_RE'),
    expectFlip: ['se-benign'],
  },
  {
    name: 'A7 杀 ZH_CAUSAL_BACKDOOR_RE 整条（跨度守卫防误放否决）',
    file: 'dev-exemptions.js',
    mutate: s => killRegexByName(s, 'ZH_CAUSAL_BACKDOOR_RE'),
    expectFlip: ['se-causal'],
  },
  {
    name: 'B1 删 scrutiny-evasion.js 路由③守卫调用（接线）',
    file: 'scrutiny-evasion.js',
    mutate: s => {
      const needle = '!(_devExempt && _devExempt.isSubjectNegatedBypassSpan(text))';
      if (s.split(needle).length - 1 !== 1) throw new Error('scrutiny 守卫调用 needle 不唯一');
      return s.split(needle).join('false');
    },
    expectFlip: ['se-benign', 'se-reversal', 'se-causal'],
  },
  {
    name: 'B2 删 index.js checkNoFallback skip_guard 守卫调用（接线）',
    file: 'index.js',
    mutate: s => {
      const needle = "if (t === 'skip_guard' && devExempt.isNegatedBypassHit(text, m.index, m[0].length)) continue;";
      if (s.split(needle).length - 1 !== 1) throw new Error('no_fallback 守卫调用 needle 不唯一');
      return s.split(needle).join('if (false) continue;');
    },
    expectFlip: ['nf-benign'],
  },
];

let red = 0, green = 0;
const results = [];

function recordRed(out, name) {
  red++;
  const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
  const fm = out.match(/FLIP=(.*)/);
  results.push([name, '变红（miss ' + (m ? m[1] + '/' + m[2] : '?') + '，翻转: ' + (fm ? fm[1] : '?') + '）']);
}

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-neg732-control'));
  try {
    const out = runProbe(dir);
    const ok = /HIT_FAIL=0\//.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', ok ? '全绿' : '未全绿']);
  } catch (e) {
    // 退出码 1 带 HIT_FAIL 输出 = 守卫失守（未全绿），不是崩溃
    const out = String(e.stdout || '');
    if (/HIT_FAIL=/.test(out)) {
      green++;
      console.error('对照副本未全绿：\n' + out);
      results.push(['对照（未注入）', '未全绿']);
    } else {
      console.error('对照副本崩了（崩溃≠变红）: ' + e.message + '\n' + String(e.stderr || '').slice(0, 300));
      results.push(['对照（未注入）', '崩溃']);
      green++;
    }
  }
}

// 统一判定：out=探针输出；inj=注入定义。返回值写入 results 并更新 red/green。
// ⚠️ try 与 catch 两条路径必须走同一判定——早期版本 catch 路径漏了
//    「误伤非预期族」检查，注入把无关族打翻也能记红（放水）。
function verdict(inj, out) {
  const fm = out.match(/FLIP=(.*)/);
  const flipped = fm && fm[1] ? fm[1].split(',') : [];
  const expected = inj.expectFlip;
  const hitExpected = expected.some(t => flipped.some(f => f.startsWith(t)));
  const unexpected = flipped.filter(f => !expected.some(t => f.startsWith(t)));
  if (!/HIT_FAIL=[1-9]/.test(out)) {
    green++;
    results.push([inj.name, '未变红（守卫失守）']);
  } else if (!hitExpected) {
    green++;
    results.push([inj.name, '变红但翻转的不是预期族: ' + flipped.join(',')]);
  } else if (unexpected.length > 0) {
    green++;
    results.push([inj.name, '误伤非预期族: ' + unexpected.join(',')]);
  } else {
    recordRed(out, inj.name);
  }
}

// ② 逐个注入：必须变红，且翻转的正是预期族
for (const inj of INJECTIONS) {
  const dir = path.join(os.tmpdir(), 'hf-neg732-' + Buffer.from(inj.name).toString('hex').slice(0, 12));
  let prepared = null;
  try {
    prepared = makeCopy(dir, d => {
      const fp = path.join(d, 'src', inj.file);
      const before = fs.readFileSync(fp, 'utf8');
      const after = inj.mutate(before);
      if (after === before) throw new Error('注入未改变源码');
      fs.writeFileSync(fp, after);
    });
  } catch (e) {
    results.push([inj.name, '注入失败: ' + String(e.message).slice(0, 80)]);
    green++;
    continue;
  }
  try {
    verdict(inj, runProbe(prepared));
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=/.test(out)) {
      verdict(inj, out); // 退出码 1 = 守卫失守，同样走统一判定
    } else {
      const detail = (out ? out.split('\n').filter(l => l.trim()).slice(0, 3).join(' | ') + ' || ' : '') +
                     String(e.stderr || '').split('\n').filter(l => l.trim()).slice(0, 3).join(' | ');
      results.push([inj.name, '探针崩溃（不计红）: ' + detail.slice(0, 300)]);
      green++;
    }
  }
}

console.log('\n=== r732 主语否定守卫负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
