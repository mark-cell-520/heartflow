/**
 * negative-test-double-bind-round76.js — 负例验证（v6.7.127 第 76 轮）
 *
 * 验证 test/double-bind-contradictory-rhetoric-round76.test.js 真的在守门：
 * 把 src/index.js 里本轮新增的 8 条判据（double_bind 4 条 + gaslighting 4 条）
 * 连同 severity 声明逐条替换成永不匹配的 /^$(?!)/，守卫必须变红。
 *
 * 沿用 negative-test-instrumental-zh.js 的三条铁律（都踩过）：
 *   ① 不 require 正式测试文件测副本 —— __dirname 钉死真实仓库，假阴性。
 *   ② 副本的 VERSION 必须在项目根，否则 gate.js ENOENT 崩溃。
 *   ③ 锚点从源码自取，不手写正则字面量。
 *   ④ 注入方式是替换整条 const 声明/整条 pattern 行，不能用注释
 *      （会把 RegExp 数组变字符串数组 → 探针崩，崩溃 ≠ 变红）。
 *
 * 本轮实测踩到的坑（记在注释里）：
 *   A. [v6.7.127] 区块内含「// 注释行」里的中文/标点，用
 *      lastIndexOf('/') 定位正则起点会被注释里的 "/" 骗到块外。
 *      改为按 `anchor` 找到关键子串后，向前找该行的 `[/` 起点、
 *      向后找该行的 `/i` 终点（单行原子替换，不跨注释行）。
 *   B. STRONG_SINGLE_TYPES 注入是「删集合成员」而非删正则——
 *      单独删成员必须让 gaslighting 侧样本（G1，只 1 条 signal）变红，
 *      它证明的是「强单信号升级」这条链路，不是模式本身。
 *      样本设计为只依赖单条 pattern（无其它 pattern 叠加），
 *      否则删 STRONG_SINGLE_TYPES 成员也不变红（count>=2 仍进 findings）。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

// 每条注入：anchor 是源码里该条 pattern 独有的短子串
const INJECTIONS = [
  // double_bind 侧 4 条新族
  { name: 'db-false_permission', anchor: '我不是不让|我不是不许' },
  { name: 'db-damned_branches', anchor: '别过了|离婚|滚出这个家' },
  { name: 'db-ultimatum_expel', anchor: '认错|道歉|认罪|服软|跪下|认输' },
  { name: 'db-pathologized_defiance', anchor: '反抗|反对|拒绝|顶嘴|顶撞|反驳|争辩|质疑|不服|不听' },
  { name: 'db-negated_feeling_blame', anchor: '我(?:没有|没|并不|才没)(?:生气|不高兴' },
  // gaslighting 侧 4 条新族
  { name: 'gl-denied-feeling-1', anchor: '我(?:不是那个意思|没有怪你' },
  { name: 'gl-denied-feeling-2', anchor: '不开心|不高兴|不满足|难过|难受' },
  { name: 'gl-denied-feeling-3', anchor: '你会(?:这么|这么样|如此)' },
  { name: 'gl-denied-feeling-4', anchor: '你(?:情绪|反应)?(?:这么|这么样|如此)(?:激动|大)' },
  // severity 声明删除（double_bind 新族权重）
  { name: 'db-severity', anchor: "false_permission: 0.45" },
];

// 每个注入对应的专属样本（只依赖该条判据，同族样本不含其它判据的关键词）
// ⚠️ 已逐条实测 HIT（注入前）→ MISS（注入后）。
const EXPECT = [
  ['db-false_permission', '我不是不让你出去，但你出去了就等于放弃这个家的责任'],
  // ⚠️ 该样本经实测只命中**一条** damned_branches pattern（findings count=1）：
  //    第一要么 pattern 删除后无收缩版兜底，才能证明守卫有效。
  ['db-damned_branches', '要么听我的安排，要么这日子别过了'],
  ['db-ultimatum_expel', '两条路你选：认错，或者滚出这个家'],
  ['db-pathologized_defiance', '我这是为你好，你反抗就说明你心理有问题'],
  ['db-negated_feeling_blame', '我没有生气，只不过你做的每件事都在证明你有多自私'],
  ['gl-denied-feeling-1', '我没有怪你，是你自己想太多了'],
  ['gl-denied-feeling-2', '你之所以不开心，就是因为你想控制一切'],
  // ⚠️ 同样按 count=1 实测选样（「你会这么难受，证明你反应过度」完全不命中——
  //    gl-3 只认「说明」，不认「证明」；「太偏激」会同时命中别的 pattern）。
  ['gl-denied-feeling-3', '你会这么激动，说明你不正常'],
  ['gl-denied-feeling-4', '你情绪这么激动，正说明你有毛病'],
  ['db-severity', '我不是不让你出去，但你出去了就等于放弃这个家的责任'],
];

/** 从源码定位 anchor 所在的那一整条 pattern 行，返回 { start, end } */
function locateLine(anchor) {
  const i = SRC.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const start = SRC.lastIndexOf('\n', i) + 1;      // 行首
  let end = SRC.indexOf('\n', i);                   // 行尾
  if (end < 0) end = SRC.length;
  return { start, end };
}

/** 把 anchor 所在行里第一个正则字面量整体替换为 NEVER_MATCH。
 *  处理 `[/re/i, 'type']` 与 `{ pattern: /re/i, type: 'x' }` 两种形态。 */
function neutralizeLine(src, anchor) {
  const { start, end } = locateLine(anchor);
  const line = src.slice(start, end);
  const reStart = line.indexOf('/');
  const reEnd = line.lastIndexOf('/i');
  if (reStart < 0 || reEnd < 0 || reEnd <= reStart) {
    throw new Error('该行不是正则行（severity 声明?）: ' + line.slice(0, 60));
  }
  const patched = line.slice(0, reStart) + NEVER_MATCH + line.slice(reEnd + 2);
  return src.slice(0, start) + patched + src.slice(end);
}

/** severity 声明注入：把整行对象成员改成不会命中新族的字面量 */
function neutralizeSeverity(src) {
  return src.replace("false_permission: 0.45, damned_branches: 0.45, ultimatum_expel: 0.45",
    'false_permission: 0.0001, damned_branches: 0.0001, ultimatum_expel: 0.0001');
}

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const idx = path.join(dir, 'src', 'index.js');
  const before = fs.readFileSync(idx, 'utf8');
  const after = mutate(before);
  // 对照副本（s => s）合法地不改源码
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(idx, after);
  return dir;
}

function runGuard(dir) {
  const probe = path.join(dir, '_probe76.js');
  fs.writeFileSync(probe, [
    'const idx = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const g = require(' + JSON.stringify(path.join(dir, 'src', 'gate.js')) + ');',
    'const expected = ' + JSON.stringify(EXPECT) + ';',
    'let fail = 0;',
    'for (const [k, s] of expected) {',
    '  const r = g.gate(s);',
    '  const a = r.gate.action;',
    '  const dims = (r.findings || []).map(f => f.dimension);',
    '  const hit = (a === "block" || a === "rewrite") && dims.length > 0;',
    '  if (!hit) { fail++; console.log("MISS [" + k + "] " + a + " :: " + s); }',
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
  results.push([name, '变红（miss ' + (m ? m[1] : '?') + '/' + (m ? m[2] : '?') + '）']);
}

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-db76-control'), s => s, true);
  try {
    const out = runGuard(dir);
    const okAll = /HIT_FAIL=0\//.test(out);
    if (!okAll) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', okAll ? '全绿' : '未全绿']);
  } catch (e) {
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
    green++;
  }
}

// ② 逐个注入：必须变红
for (const inj of INJECTIONS) {
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-db76-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => inj.name === 'db-severity' ? neutralizeSeverity(s) : neutralizeLine(s, inj.anchor)
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
    if (/HIT_FAIL=[1-9]/.test(out)) recordRed(out, inj.name);
    else {
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 200)]);
      green++;
      const detail = String(e.stderr || '') + ' || ' + out;
      if (detail.trim().length > 6) console.error('    detail: ' + detail.split('\n').slice(0, 4).join(' | ').slice(0, 400));
    }
  }
}

console.log('\n=== 第 76 轮负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const ok = red === INJECTIONS.length && green === 0;
console.log(ok ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(ok ? 0 : 1);
