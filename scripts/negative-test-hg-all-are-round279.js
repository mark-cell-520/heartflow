/**
 * negative-test-hg-all-are-round279.js — 负例验证（v6.7.126 第 279 轮）
 *
 * 验证 test/hasty-all-are-narrow-round279.test.js 真的在守门：
 * 把 src/index.js 里第 277/279 轮新增的三条 all-are 收窄判据逐条删掉，
 * 守卫必须变红（断言失败，不能是加载崩溃或注入未生效）。
 *
 * 踩过的坑（前几轮复述，别再踩）：
 *   ① 不能 require 正式测试文件测副本 —— 它内部 __dirname 钉死真实仓库，
 *      副本根本没被加载，6/6 假阴性。
 *   ② 副本的 VERSION 必须放在项目根（copy/VERSION），否则 gate.js 读不到
 *      → ENOENT 崩溃 → 被解析成「未变红」。
 *   ③ 注入必须真的改变源码（对照副本用 mutate: s => s 会被判「注入未生效」）。
 *   ④ needle 是**源码里逐字出现**的字符串（含 \\b \\s 的单层反斜杠）,
 *      不是 JS 字符串转义后的形式。
 *   ⑤ 崩溃（throw）≠ 变红：必须读到 HIT_FAIL=n/… 才算红。
 *   ⑥ BLOCK 口径：dehumanization 触发 block 时 findings 被顶替，
 *      所以守卫探针用 action ∈ {block,rewrite,verify} 判命中。
 *
 * mutation 方式：把整条正则（含首尾斜杠）替换成永不匹配的合法正
 * 则 /^$(?!)/。⚠️ 不能改成注释——那会把 RegExp 数组变成字符串数组，
 * 探针直接崩，崩溃 ≠ 变红。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');
const NEVER_MATCH = '/^$(?!)/';

// 每条判据的唯一定位串（源码逐字，含单层反斜杠）
// 277 判据①：群体 ∧ 病理归因（ATTR_NEG）
const P1_ANCHOR = 'are\\s+(?!not\\b|n\'t\\b)(?:lazy|careless|sloppy';
// 277 判据②：群体 ∧ 褒义品格 ∧ 否定（279 轮已补 aren't）
const P2_ANCHOR = 'are\\s*(?:not|n\'t)\\s+(?:honest|trustworthy|c';
// 277 判据③：群体 ∧ 比较级全称 condemning 形
const P3_ANCHOR = 'are\\s+no\\s+better\\s+than';
// 229 ②' 句末零宾语族（279 轮新增测试覆盖到，一并守护）
const P4_ANCHOR = 'readers?)\\s+(?:complain|complained|refuse|refused';
// 229 ② 族（279 轮补了 45 个功能性谓词排除，一并守护）
const P5_ANCHOR = 'scaled|built|receives?|received|gets?|got';
// 229 ① 族 every/each 主判据（279 轮测试 ⑨ 段覆盖）
const P6_ANCHOR = 'ignores?|refuses?|refused|hates?|wants?|complains?';

/** 从源码里按锚点向前找最近的 `/`，向后找 `/i`，截出整条正则 */
function extractRegex(anchor) {
  const i = SRC.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor.slice(0, 30));
  const start = SRC.lastIndexOf('/', i);
  const end = SRC.indexOf('/i', i);
  if (start < 0 || end < 0 || end < start) throw new Error('无法定位正则边界: ' + anchor.slice(0, 30));
  return SRC.slice(start, end + 2);
}

// 每个注入的「必须被拦到」样本（该族代表各两条）
const EXPECT_HITS = [
  ['277①', 'All users are lazy.', 'All of the customers are dishonest.'],
  ['277②-not', 'All users are not honest.', 'All customers are not reliable.'],
  ['277②-arent', "All users aren't honest.", "All customers aren't reliable."],
  ['277③', 'All users are no better than lazy children.', 'All customers are no better than thieves.'],
  ["229②'", 'All of our customers complained.', 'All developers refused.'],
  ['229②', 'All users ignore this.', 'All customers resent the change.'],
  ['229①', 'Every user ignores the warning.', 'Each reviewer skips the checklist.'],
];

const INJECTIONS = [
  { name: 'M1 删 277 判据①（群体∧病理归因）', anchor: P1_ANCHOR, hits: [0] },
  { name: "M2 删 277 判据②（群体∧褒义∧否定，含 aren't）", anchor: P2_ANCHOR, hits: [1, 2] },
  { name: 'M3 删 277 判据③（比较级全称 condemning）', anchor: P3_ANCHOR, hits: [3] },
  { name: "M4 删 229 ②' 族（句末零宾语）", anchor: P4_ANCHOR, hits: [4] },
  { name: 'M5 删 229 ② 族（群体∧谓词∧宾语）', anchor: P5_ANCHOR, hits: [5] },
  { name: 'M6 删 229 ① 族（every/each 主判据）', anchor: P6_ANCHOR, hits: [6] },
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
  // 探针用 gate 的 action 判命中（不用 findings 里的维度名，
  // 因为 dehumanization 触发 block 时维度归因被 gate_block 顶替）
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

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-a279-control'), (s) => s, true);
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
    path.join(os.tmpdir(), 'hf-a279-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    (s) => s.split(needle).join(NEVER_MATCH)
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
    if (/HIT_FAIL=[1-9]/.test(out)) {
      recordRed(out, inj.name);
    } else {
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 200)]);
      const detail = String(e.stderr || '') + ' || ' + out;
      if (detail.trim().length > 6) {
        console.error('    detail: ' + detail.split('\n').slice(0, 4).join('\n    ').slice(0, 400));
      }
    }
  }
}

console.log('\n=== 第 279 轮负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
