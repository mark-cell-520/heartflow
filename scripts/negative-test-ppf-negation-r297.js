/**
 * negative-test-ppf-negation-r297.js — r297 前置否定族守卫的注入-删条验证
 *
 * 目的：证明 test/doubt-ppf-negation-r297.test.js **真的在守门** ——
 *   把本轮新增的两条判据从 src/index.js 里替换成永不匹配的正则，
 *   守卫必须变红（断言失败，不是加载崩溃）。
 *
 * 三轮踩过的坑（别再踩）：
 *   ① 不能 require 正式测试文件测副本（__dirname 钉死真实仓库 → 假阴性）
 *   ② 副本 VERSION 必须放项目根（src/../VERSION），否则 ENOENT 崩溃 ≠ 变红
 *   ③ 注入必须真的改变源码（对照副本用 s => s 会报「注入未生效」）
 *   ④ needle 用**源码字面量**（单层反斜杠），不是 JS 字符串转义后的形式
 *   ⑤ 崩涡 ≠ 变红，必须读 stdout 里的 HIT_FAIL 才算红
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

// 两个注入：本轮新增族 A 与族 B 的判据字面量（源码原文）
const INJECTIONS = [
  { name: '删前置否定族A（问题不在X，而在Y{词表}）', needle: '/(?:问题|瓶颈|根源|关键)[^。！？\\n]{0,12}不在[^。！？\\n]{1,16}[，,。；;][^。！？\\n]{0,12}(?:而)?是?在(?:于)?[^。！？\\n]{0,24}(?:维度|层次|境界|高度)(?![，,])/' },
  { name: '删非问题引导族B（这不是X的错，而是Y{词表}）', needle: '/这不是[^。，]{1,18}的?(?:问题|错|原因)[^。]{0,24}而是[^。]{0,24}(?:维度|层次|境界|高度)(?![，,])/' },
];

// 删条后必须变红的正例（取每族 2 条代表）
const EXPECT_HITS = [
  ['A·维度', '问题不在于甲，而在于维度的认知偏差。'],
  ['A·境界长主语', '这个项目的真正问题不在代码实现层面，而在整体架构设计的高度。'],
  ['B·错引导境界', '这不是甲的错，而是境界层次还没到。'],
  ['B·错引导长主语', '这不是某一个团队的错，而是整个组织在战略维度上高度不够。'],
];

// 删条后必须保持 0 命中的负例（防止「删条后守卫因误伤变绿」的假红）
const EXPECT_CLEAN = [
  '问题不在算法，而在数据分布的维度，这是统计学习的基本常识。',
  '延迟的根源不在网络，而在序列化开销的层次。',
  '这不是性能的瓶颈，而是IO等待的问题，压测显示p99达到120ms。',
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
    'const HF = require(' + JSON.stringify(path.join(dir, 'src', 'gate.js')) + ');',
    'const expected = ' + JSON.stringify(EXPECT_HITS) + ';',
    'const clean = ' + JSON.stringify(EXPECT_CLEAN) + ';',
    'function ppf(s){ return /pseudo_profundity/i.test(JSON.stringify(HF.checkOutput(s))); }',
    'let miss = 0;',
    'for (const [f, s] of expected) if (!ppf(s)) { miss++; console.log("MISS [" + f + "]"); }',
    'let fp = 0;',
    'for (const s of clean) if (ppf(s)) { fp++; console.log("FALSE_POS"); }',
    'console.log("HIT_FAIL=" + miss + "/" + expected.length + " FP=" + fp);',
    'process.exit(miss > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];
function recordRed(out, name) {
  red++;
  const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
  results.push([name, '变红（miss ' + (m ? m[1] : '?') + '）']);
}

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-ppf297-control'), s => s, true);
  try {
    const out = runGuard(dir);
    const ok = /HIT_FAIL=0\/.*FP=0/.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', ok ? '全绿' : '未全绿']);
  } catch (e) {
    results.push(['对照（未注入）', '崩溃: ' + String(e.message).slice(0, 80)]);
    green++;
  }
}

// ② 逐个注入：必须变红
for (const inj of INJECTIONS) {
  if (SRC.indexOf(inj.needle) < 0) {
    results.push([inj.name, '锚点未找到（源码无此判据字面量）']);
    green++;
    continue;
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-ppf297-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(inj.needle).join(NEVER_MATCH)
  );
  try {
    const out = runGuard(dir);
    if (/HIT_FAIL=0\//.test(out)) { green++; results.push([inj.name, '未变红（守卫失守）']); }
    else recordRed(out, inj.name);
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) recordRed(out, inj.name);
    else { results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 200)]); }
  }
}

console.log('\n=== r297 注入-删条验证 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('变红 ' + red + '/' + INJECTIONS.length + '，失守/崩溃 ' + green);
process.exit(red === INJECTIONS.length && green === 0 ? 0 : 1);
