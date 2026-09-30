/**
 * negative-test-pseudo-profundity-onto-r289.js — 负例验证（第 289 轮）
 *
 * 验证 test/pseudo-profundity-ontological-zh-r289.test.js 真的在守门：
 * 把 src/index.js 里 PSEUDO_PHILOSOPHY_ZH 新增的 8 条正则逐条删掉，
 * 守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * 沿用 negative-test-absolute-claim-en.js 的三条铁律（别再踩）：
 *   ① 不能 require 正式测试文件测副本 —— __dirname 钉死真实仓库，
 *      副本根本没被加载，6/6 假阴性。
 *   ② 副本的 VERSION 必须放项目根（src/../VERSION），否则 gate.js 读不到
 *      → ENOENT 崩溃 → 被解析成「未变红」。
 *   ③ 注入必须真的改变源码（对照副本用 mutate: s => s 会被判「注入未生效」）。
 *
 * 注入方式：把整条正则（含首尾斜杠）替换成永不匹配的合法正则 /^$(?!)/。
 * ⚠️ 不能改成 DEFECT 这类注释——会把 RegExp 数组变成字符串数组，
 *    探针直接崩，崩溃 ≠ 变红。
 * ⚠️ needle 是源码里逐字出现的字符串（含 \b \s 的单层反斜杠），
 *    即源码字面量，不是 JS 字符串转义后的形式。
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

// 每条注入：row 是第 289 轮新增块内的正则行号（0-based，见下），
// 用它整行替换成 NEVER_MATCH。
// ⚠️ 用行号而不用锚点：本轮踩坑——写死在脑子里的「锚点组合」
//    实际不在源码里（如 \u7684\u5bbf\u547d|\u7684\u5e95\u8272 中间隔了别的词），
//    4/8 锚点定位失败。行号定位与「该行确实是正则」都由运行时断言兜底。
// ⚠️ 与第 288 轮教训同型：断言的前缀/锚点必须精确到本轮自己的判据。
const INJECTIONS = [
  { row: 24, name: '① 跨域系词收尾（之X 族）' },
  { row: 25, name: '① 跨域系词收尾（的X 族）' },
  { row: 27, name: '①-2 明喻量化（一盒）' },
  { row: 28, name: '①-2 明喻量化（限定量词族）' },
  { row: 33, name: '② 伪辩证（不是A而是B，B侧本体论词表）' },
  { row: 34, name: '②-2 伪辩证（是/在于 + B侧本体论词表）' },
  { row: 37, name: '③ 无条件治愈全称' },
  { row: 38, name: '③ 时间会给出/带来答案' },
  { row: 39, name: '③-2 命定式收尾（所有X都是为了Y）' },
  { row: 42, name: '③-3 命定式收尾（离开/告别…都是为了）' },
  { row: 50, name: '④ 存在论比喻（系词+比喻物）' },
  { row: 52, name: '④-2 明喻「一场/一次」收尾' },
];

// 每条注入对应的「必须被拦到」样本（该族一条代表，全部来自 r289 测试文件）
const EXPECT_HITS = [
  ['①-之X', '孤独是灵魂在喧嚣世界中为自己保留的最后一块静默之地。'],
  ['①-的X', '成长就是一次又一次把自己打碎再拼起来的过程。'],
  ['①-2', '生活就像一盒巧克力，你永远不知道下一颗是什么味道。'],
  ['②', '自由不是随心所欲，而是自我主宰。'],
  ['②-b', '真正的勇气，不是没有恐惧，而是带着恐惧依然前行。'],
  ['③', '时间会治愈一切创伤，只要你愿意给它一个机会。'],
  ['③-2', '所有的离别，都是为了更好的重逢。'],
  ['④', '时间是最温柔的暴政，它在流逝中定义我们的存在。'],
];

// 只在第 289 轮新增块内查找，且逐行扫描：用「含锚点的行」定位正则，
// 不用 lastIndexOf('/')（跨行会把注释里的斜杠当起点）。
const BLOCK_START = SRC.indexOf('[v6.7.129 第 289 轮]');
if (BLOCK_START < 0) {
  console.error('未找到第 289 轮新增块');
  process.exit(2);
}

function extractRegex(rowSpec) {
  const seg = SRC.slice(BLOCK_START, BLOCK_START + 12000);
  const lines = seg.split('\n');
  const row = rowSpec.row;
  if (row < 0 || row >= lines.length) throw new Error('行号越界: ' + row);
  const line = lines[row];
  const t = line.trim();
  if (!t.startsWith('/')) throw new Error('该行不是正则: ' + row + ' -> ' + t.slice(0, 40));
  const start = line.indexOf('/');
  const end = line.lastIndexOf('/,');
  if (start < 0 || end < 0 || end <= start) throw new Error('无法定位正则边界: ' + row);
  return line.slice(start, end + 1);
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
  // 跑一个只读该副本的最小守卫：直接 checkPseudoProfundity（维度函数），
  // 命中数必须 > 0。写成文件再跑，不用 node -e（安全扫描会拦内联解释器）。
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const { checkPseudoProfundity } = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const expected = ' + JSON.stringify(EXPECT_HITS) + ';',
    'let fail = 0;',
    'for (const [f, s] of expected) {',
    '  const c = checkPseudoProfundity(s).count;',
    '  if (c === 0) { fail++; console.log("MISS [" + f + "]"); }',
    '}',
    'console.log("HIT_FAIL=" + fail + "/" + expected.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

function recordRed(out, name) {
  red++;
  const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
  const detail = m ? ('miss ' + m[1] + '/' + m[2]) : 'miss ?';
  results.push([name, '变红（' + detail + '）']);
}

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-pp289-control'), s => s, true);
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
    needle = extractRegex(inj);
  } catch (e) {
    results.push([inj.name, '定位失败: ' + String(e.message).slice(0, 60)]);
    green++;
    continue;
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-pp289-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join(NEVER_MATCH)
  );
  try {
    const out = runGuard(dir);
    if (/HIT_FAIL=0\//.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      recordRed(out, inj.name);
    }
  } catch (e) {
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
console.log(`\n变红 ${red} / 未变红 ${green}`);
process.exit(green === 0 ? 0 : 1);
