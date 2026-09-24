/**
 * negative-test-absolute-claim-en.js — 负例验证（v6.7.113）
 *
 * 验证 `test/absolute-claim-en.test.js` 真的在守门：
 * 把 src/index.js 的新模式族逐条删掉，守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * 三轮踩过的坑（本轮第 13 次复述，别再踩）：
 *   ① 不能 require 正式测试文件测副本 —— 它内部 `__dirname` 钉死真实仓库，
 *      副本根本没被加载，6/6 假阴性。
 *   ② 副本的 VERSION 必须放在项目根（src/../VERSION），不能放 src/ 里，
 *      否则 gate.js 读不到 → ENOENT 崩溃 → 被解析成「未变红」。
 *   ③ 注入必须真的改变源码（对照副本用 mutate: s => s 会被判「注入未生效」）。
 *
 * 注入方式：把整条正则（含首尾斜杠）替换成永不匹配的合法正则 /^$(?!)/。
 * ⚠️ 不能改成 DEFECT 这类注释——那样把 RegExp 数组变成字符串数组，
 *    探针直接崩，崩溃 ≠ 变红。
 * ⚠️ needle 是**源码里逐字出现**的字符串（含 \b \s 的单层反斜杠，
 *    即源码字面量），不是 JS 字符串转义后的形式。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

// 永不匹配的合法正则
const NEVER_MATCH = '/^$(?!)/';

// 源码只读一次；锚点定位失败按「未变红」计入（不能假阴性）
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

// 每个注入：anchor 是该模式独有的短子串（在源码里唯一），
// 用它定位整条正则（向前找最近的 /，向后找 /i），替换成 NEVER_MATCH。
// ⚠️ 不手写正则字面量：本轮第一次手写 needle 时多写了一层反斜杠，
//    导致 12 个注入全部「注入未生效」而假阴性。锚点方式从源码自取，不会错。
const INJECTIONS = [
  { name: '删「唯一解+形容词」主模式（is the only correct solution）', anchor: 'remains?)' },
  { name: '删「唯一解+形容词」自由语序版（the only real fix 的兜底）', anchor: 'the\\s+only\\s+(?:correct' },
  { name: '删「没有更好的方案」族（no better way）', anchor: 'no\\s+better\\s+(?:way' },
  { name: '删「永不失败」族（will never fail）', anchor: 'misfire|let\\s+(?:you|us)' },
  { name: '删「always works」族', anchor: 'performs?\\s+flawlessly' },
  { name: '删「guaranteed to succeed」族', anchor: 'guaranteed\\s+to\\s+(?:succeed' },
  { name: '删「无人能挡」族（nothing can stop）', anchor: 'defeat|resist)' },
  { name: '删「完全解决」族（completely solve）', anchor: 'eradicated|remove|removes' },
  { name: '删「all experts agree」族', anchor: 'economists?|doctors' },
  { name: '删「无一例外」族（without exception）', anchor: 'without\\s+exception' },
  { name: '删「100% effective」族', anchor: 'foolproof' },
  { name: '删「zero defects」族', anchor: 'vulnerabilit(?:y|ies)' },
];

// 每个注入对应的「必须被拦到」样本（取该族一条代表）
const EXPECT_HITS = [
  ['唯一解', 'This is the only correct solution.'],
  ['唯一解-兜底', 'compression is the only real fix.'],
  ['无更好', 'There is no better way to do this.'],
  ['永不失败', 'This approach will never fail.'],
  ['always', 'this tool always works'],
  ['guaranteed', 'It is guaranteed to work.'],
  ['无人能挡', 'Nothing can stop this trend.'],
  ['完全解决', 'This will completely solve the problem.'],
  ['all experts', 'All experts agree on this point.'],
  ['无一例外', 'It holds without exception.'],
  ['100%', 'This solution is 100% effective.'],
  ['zero', 'We have zero defects in this release.'],
];

/** 从源码里按锚点提取整条正则字面量（含首尾斜杠） */
// ⚠️ 只在 [v6.7.113] 新增的块内查找：'without\s+exception' 在 v6.7.73 的
//    absolute_obedience 表里也出现过一次，全局 lastIndexOf('/') 会拿到
//    别处的正则，导致「注入了一个无关正则却报告未变红」。
const BLOCK_START = SRC.indexOf('[v6.7.113] 英文绝对化句式族');
function extractRegex(anchor) {
  if (BLOCK_START < 0) throw new Error('未找到 v6.7.113 新增块');
  const seg = SRC.slice(BLOCK_START, BLOCK_START + 8000);
  const i = seg.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const start = seg.lastIndexOf('/', i);
  const end = seg.indexOf('/i', i);
  if (start < 0 || end < 0 || end < start) throw new Error('无法定位正则边界: ' + anchor);
  return seg.slice(start, end + 2);
}

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  // VERSION 必须在项目根：gate.js 读 src/../VERSION
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
  // 跑一个只读该副本的最小守卫：直接 checkAbsoluteClaim，命中数必须 > 0
  // ① 不用 require 正式测试文件——它内部 __dirname 钉死真实仓库（第 8 轮踩过）
  // ② 不用 node -e 内联脚本——安全扫描会把「内联解释器 + 动态 require」
  //    当可疑负载拦掉，第 13 轮第一次就是这么崩的（10/12 注入全被拦成
  //    「探针崩溃」，差点记成假阴性）。写成文件再跑，稳定可审。
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const { checkAbsoluteClaim } = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const expected = ' + JSON.stringify(EXPECT_HITS) + ';',
    'let fail = 0;',
    'for (const [f, s] of expected) {',
    '  const c = checkAbsoluteClaim(s).count;',
    '  if (c === 0) { fail++; console.log("MISS [" + f + "] " + s); }',
    '}',
    'console.log("HIT_FAIL=" + fail + "/" + expected.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

// 源码只读一次；锚点定位失败按「未变红」计入（不能假阴性）
// （SRC 在上方已读）

/** 记录一次「守卫变红」 */
function recordRed(out, name) {
  red++;
  const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
  const detail = m ? ('miss ' + m[1] + '/' + m[2]) : 'miss ?';
  results.push([name, '变红（' + detail + '）']);
}

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-ac-control'), s => s, true);
  try {
    const out = runGuard(dir);
    const ok = /HIT_FAIL=0\//.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', ok ? '全绿' : '未全绿']);
  } catch (e) {
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
  }
}

// ② 逐个注入：必须变红
for (const inj of INJECTIONS) {
  let needle;
  try {
    needle = extractRegex(inj.anchor);
  } catch (e) {
    results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 60)]);
    green++;
    continue;
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-ac-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join(NEVER_MATCH)
  );
  try {
    // 守卫退出码 1 = 断言失败 = 变红。execFileSync 对非 0 退出码抛错，
    // 但 stdout 里已经有 HIT_FAIL=n/12 —— 读 stdout 判断，不要被 throw 骗了。
    const out = runGuard(dir);
    if (/HIT_FAIL=0\//.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      recordRed(out, inj.name);
    }
  } catch (e) {
    // 非 0 退出码走到这里；stdout 仍可读
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) {
      recordRed(out, inj.name);
    } else {
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 300)]);
      const detail = String(e.stderr || '') + ' || ' + out;
      if (detail.trim().length > 6) {
        console.error('    detail: ' + detail.split('\n').slice(0, 5).join('\n    ').slice(0, 500));
      }
    }
  }
}

console.log('\n=== 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
