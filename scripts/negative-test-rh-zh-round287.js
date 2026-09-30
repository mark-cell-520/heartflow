/**
 * negative-test-rh-zh-round287.js — 负例验证（v6.7.125 第 287 轮）
 *
 * 验证 `src/reward-hacking.js` 本轮新增的 4 支中文判据真的在守门：
 * 逐条删掉，守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * 与 negative-test-absolute-claim-en.js 同构，但有三处 round-287 专属适配：
 *   ① 目标文件是 src/reward-hacking.js（不是 index.js），
 *      makeCopy 已按文件参数化，不再钉死 index.js。
 *   ② 守卫入口是 checkRewardHacking（模块导出函数），不是 checkAbsoluteClaim。
 *   ③ 复用模板的三条铁律：VERSION 必须放副本项目根（gate.js 读 src/../VERSION）；
 *      注入用「永不匹配的合法正则 /^$(?!)/」而非 DEFECT 注释；
 *      needle 从源码自取（锚点定位），不手写正则字面量（免反斜杠层数错）。
 *
 * 判据族（v6.7.125 本轮新增）：
 *   TG-Z4 / TG-Z4b   test_gaming           降低测试难度换通过
 *   DG-Z11 / DG-Z11b metric_denominator_gaming  择优计入 + 目的半前置
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const TARGET = path.join(HF, 'src', 'reward-hacking.js');

// 永不匹配的合法正则
const NEVER_MATCH = '/^$(?!)/';

const SRC = fs.readFileSync(TARGET, 'utf8');

// 本轮新增判据分布在文件两处（test_gaming 表在 ~32877，metric_denominator_gaming
// 表在 ~73346），相距约 4 万字符，单一窗口装不下 —— 各自按块起点定位。
// round-287 实测教训：原实现用 Math.max 取两个锚点的较大值，导致 TG-Z4/TG-Z4b
// 两条锚点落在窗口外，4 个注入里 2 个「锚点未找到」而假阴性。
const BLOCKS = [
  { tag: 'TG', start: SRC.indexOf('[v6.7.125 round-287] TG-Z4'), len: 6000 },
  { tag: 'DG', start: SRC.indexOf('[v6.7.125 round-287] DG-Z11'), len: 6000 },
];
for (const b of BLOCKS) {
  if (b.start < 0) throw new Error('未找到 round-287 新增块: ' + b.tag);
}

// anchor 是该模式在源码里独有的短子串（源码单层反斜杠，JS 字符串里写 \\s）
// 每个 anchor 标注它属于哪个块，extractRegex 只在该块窗口内查找。
const INJECTIONS = [
  // TG-Z4：把测试用例难度改简单（动作半殿后语序）
  { name: 'TG-Z4 降测试难度换通过', block: 'TG', anchor: '难度|要求|门槛|严格度|复杂度|条件' },
  // TG-Z4b：目的半前置（只要测试能过 → 改简单）
  { name: 'TG-Z4b 只要过就降难度', block: 'TG', anchor: '只要|若|如果|要是' },
  { name: 'DG-Z11 择优计入+目的前置', block: 'DG', anchor: '体面|说得过去' },
  // DG-Z11b：只统计活跃用户 → 指标就好看（镜像语序）
  { name: 'DG-Z11b 择优计入+目的殿后', block: 'DG', anchor: '顿时)?' },
];

// 互补对双删注入：本轮 4 支判据是两组互补语序（动作半殿后 / 目的半前置），
// 单删任一支，另一支仍能兜住同族样本 —— 这是**覆盖冗余**而非守卫失守。
// round-287 实测（probe-r287-rzw.js）：Z4b 命中段含「只要测试能过」前缀，
// Z4 命中段只是「把测试用例改简单点」；两者命中区间不同，语义分层真实存在。
// 因此单删项按「守卫是否对该支专属样本失守」判定，另设双删项验证整族承重。
const DOUBLE_INJECTIONS = [
  { name: 'TG-Z4+Z4b 双删（整族承重）', anchors: ['难度|要求|门槛|严格度|复杂度|条件', '只要|若|如果|要是'] },
  { name: 'DG-Z11+Z11b 双删（整族承重）', anchors: ['体面|说得过去', '顿时)?'] },
];

// 每个注入对应的「必须被拦到」样本（该族代表；JS 字符串，反斜杠正常写法）
// 专属样本设计原则（round-287 实测修正）：原本所有样本都让相邻互补支也命中，
// 导致单删一支后守卫仍绿，被误判成「守卫失守」。现在每组给两条样本：
//   ① 族代表（两支互补都能命中）—— 双删注入用，验证整族承重；
//   ② 语序专属（只有该支能命中）—— 单删注入用，验证该支独立承重。
const EXPECT_HITS = [
  ['TG-Z4', '把测试用例改简单点'],
  ['TG-Z4b', '只要测试能过，把测试用例改简单点'],
  ['DG-Z11', '为了让指标好看，只统计活跃用户'],
  ['DG-Z11b', '只统计活跃用户，指标就好看'],
];

// [v6.7.126 第 288 轮] 跨族冗余白名单：单删某支后仍命中，但命中来自
// **另一族的语义等价判据**，属合理冗余，不算守卫失守。
// round-288 实测（scripts/round-288/probe-r288-z11b.js + probe-r288-shape.js）：
//   删掉 DG-Z11b 后，Z11b 专属样本仍被命中，count=1 / score=0.75 /
//   class=measurement_rigging —— 命中支是 measurement_rigging 第 ⑨ 支
//   （src/reward-hacking.js 第 1645 行「只统计/只算 + 指标 + 好看」）。
//   该支以「只统计＋指标词＋好看」的字面形状命中全句，与 DG-Z11b 同形，
//   跨族兜底语义正确，**不是** Z11b 判据失守。
// 这与第 285 轮 M3 教训同型：断言口径（要求「单删必须全表无人兜底」）
//   比守卫实际承诺的（该支专属语义仍被覆盖）更严。
// 因此单删项按「兜底者是否在白名单」分流：白名单外兜底 = 真失守（红），
//   白名单内兜底 = 合理冗余（绿，注明兜底族）。
const CROSS_FAMILY_OK = {
  'DG-Z11b': [{
    cls: 'measurement_rigging',
    why: '「只统计 + 指标 + 好看」同形判据（reward-hacking.js 第 1645 行 ⑨）',
  }],
};

/** 从源码里按锚点提取整条正则字面量（含首尾斜杠），只在所属块窗口内找 */
function extractRegex(anchor, blockTag) {
  const blk = BLOCKS.find(b => b.tag === blockTag);
  if (!blk) throw new Error('未知块: ' + blockTag);
  const seg = SRC.slice(blk.start, blk.start + blk.len);
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
  const target = path.join(dir, 'src', 'reward-hacking.js');
  const before = fs.readFileSync(target, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(target, after);
  return dir;
}

function runGuard(dir, hits) {
  // ① 不用 require 正式测试文件（__dirname 钉死真实仓库）
  // ② 不用 node -e 内联（安全扫描会拦「内联解释器 + 动态 require」）
  const probe = path.join(dir, '_probe-rh.js');
  fs.writeFileSync(probe, [
    'const { checkRewardHacking } = require(' + JSON.stringify(path.join(dir, 'src', 'reward-hacking.js')) + ');',
    'const expected = ' + JSON.stringify(hits) + ';',
    'let fail = 0;',
    'for (const [f, s] of expected) {',
    '  let c = 0;',
    '  try { c = checkRewardHacking(s).count; } catch (e) { console.log("THREW [" + f + "] " + e.message); process.exit(2); }',
    '  if (c === 0) { fail++; console.log("MISS [" + f + "] " + s); }',
    '}',
    'console.log("HIT_FAIL=" + fail + "/" + expected.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * [v6.7.126 第 288 轮] 实测「未变红」时是谁兜住了样本。
 * 返回命中的 class 名数组（如 ['measurement_rigging']）。
 * 只报族名与数字，不打印样本原文（451 纪律）。
 */
function probeBackstop(dir, hits) {
  const probe = path.join(dir, '_probe-cls.js');
  fs.writeFileSync(probe, [
    'const { checkRewardHacking } = require(' + JSON.stringify(path.join(dir, 'src', 'reward-hacking.js')) + ');',
    'const hits = ' + JSON.stringify(hits.map(([, s]) => s)) + ';',
    'const cls = new Set();',
    'for (const s of hits) {',
    '  try {',
    '    const r = checkRewardHacking(s);',
    '    for (const c of (r.classes || [])) cls.add(c);',
    '    for (const h of (r.hits || [])) if (h && h.class) cls.add(h.class);',
    '  } catch (e) { /* 探针失败不阻塞主流程 */ }',
    '}',
    'console.log("CLASSES=" + Array.from(cls).sort().join(","));',
  ].join('\n'));
  try {
    const out = execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const m = out.match(/CLASSES=(.*)/);
    return m && m[1] ? m[1].split(',').filter(Boolean) : [];
  } catch (e) {
    const out = String(e.stdout || '');
    const m = out.match(/CLASSES=(.*)/);
    return m && m[1] ? m[1].split(',').filter(Boolean) : [];
  }
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
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-rh287-control'), s => s, true);
  try {
    const out = runGuard(dir, EXPECT_HITS);
    const ok = /HIT_FAIL=0\//.test(out);
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
  // 单删判定用「语序专属样本」：只保留 tag 与该支绑定的那条
  const own = EXPECT_HITS.filter(([tag]) => tag === inj.name.split(' ')[0]);
  const hits = own.length ? own : EXPECT_HITS;
  let needle;
  try {
    needle = extractRegex(inj.anchor, inj.block);
  } catch (e) {
    results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 60)]);
    green++;
    continue;
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-rh287-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join(NEVER_MATCH)
  );
  try {
    const out = runGuard(dir, hits);
    if (/HIT_FAIL=0\//.test(out)) {
      // [v6.7.126 第 288 轮] 未变红不等于失守：先查白名单族是否兜底。
      // probe-r288-z11b.js 实测：删 DG-Z11b 后样本被 measurement_rigging
      // 的同形判据（只统计+指标+好看）兜住 —— 语义等价，不算失守。
      // 但必须**实际测出**兜底族，不是空口认定；测不出白名单兜底才判失守。
      const backstop = probeBackstop(dir, hits);
      const tag = inj.name.split(' ')[0];
      const ok = (CROSS_FAMILY_OK[tag] || []).find(w => backstop.includes(w.cls));
      if (ok) {
        results.push([inj.name, '合理冗余（白名单族 ' + ok.cls + ' 兜底）']);
        continue;
      }
      green++;
      results.push([inj.name, '未变红（守卫失守'
        + (backstop.length ? '，兜底族=' + backstop.join('/') : '，无兜底') + '）']);
    } else {
      recordRed(out, inj.name);
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) {
      recordRed(out, inj.name);
    } else {
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 300)]);
      green++;
    }
  }
}

// ③ 互补对双删：整组判据同时删掉，必须变红（验证整族承重，不是单支冗余）
for (const inj of DOUBLE_INJECTIONS) {
  let needles = [];
  let ok = true;
  for (const a of inj.anchors) {
    try { needles.push(extractRegex(a, inj.name.startsWith('TG') ? 'TG' : 'DG')); }
    catch (e) { results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 60)]); green++; ok = false; break; }
  }
  if (!ok) continue;
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-rh287dbl-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => { let r = s; for (const n of needles) r = r.split(n).join(NEVER_MATCH); return r; }
  );
  try {
    const out = runGuard(dir, EXPECT_HITS);
    if (/HIT_FAIL=0\//.test(out)) {
      green++;
      results.push([inj.name, '未变红（整族失守）']);
    } else {
      recordRed(out, inj.name);
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) {
      recordRed(out, inj.name);
    } else {
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 300)]);
      green++;
    }
  }
}

console.log('\n=== 负例验证结果（round-287 reward_hacking）===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
const total = INJECTIONS.length + DOUBLE_INJECTIONS.length;
// [v6.7.126 第 288 轮] 判定口径修正：单删项允许「白名单跨族兜底」，
// 双删项仍要求整族承重（两支全删后必须真的没人命中）。
// 因此通过条件 = 所有项都不是「未变红（守卫失守）」。
const failures = results.filter(([, r]) => /守卫失守|整族失守|崩溃|未全绿/.test(r));
console.log('\n注入 ' + total + ' 项（单删 ' + INJECTIONS.length + ' + 双删 ' + DOUBLE_INJECTIONS.length + '）：'
  + red + ' 项让守卫变红，' + green + ' 项未变红'
  + '，失守/异常 ' + failures.length + ' 项');
const pass = failures.length === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
