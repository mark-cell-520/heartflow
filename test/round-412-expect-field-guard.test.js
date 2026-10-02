// r412 负例守卫：能力守护 checkSamples 期望字段覆盖对称性
//
// 打的缺陷（scripts/guard-abilities.js）：
//   checkSamples 的判据此前把三个期望字段写死在 if 链里，而 SAMPLES 样本
//   声明了第四个 expect* 字段（verify 级维度样本）。判据从不读它 ——
//   该样本真实 gate 结果无论是什么都恒判通过，守卫形同虚设。
//   探针 scripts/round-411-checkguard-probe.js 实测坐实。
//
// 变异方式（--mutate）：
//   N1 删除 EXPECT_ACTIONS 里的 expectVague 行  → 静态守卫应变红
//   N2 判据循环退回只读三个字段              → 动态守卫应变红
//   N3 向 SAMPLES 声明未登记的 expect* 字段   → 静态守卫应变红
//
// 跑法：
//   node test/round-412-expect-field-guard.test.js        # 正向（全绿）
//   node test/round-412-expect-field-guard.test.js --mutate # 变异（必须红）
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const GA_FILE = path.join(ROOT, 'scripts', 'guard-abilities.js');

const GREEN = '\x1b[32m', RED = '\x1b[31m', YELLOW = '\x1b[33m', RESET = '\x1b[0m';
let pass = 0, fail = 0;
function t(name, cond, detail) {
  if (cond) { pass++; console.log(`  ${GREEN}OK${RESET} ${name}${detail ? ' :: ' + detail : ''}`); }
  else { fail++; console.log(`  ${RED}FAIL${RESET} ${name}${detail ? ' :: ' + detail : ''}`); }
}

const mutate = process.argv.includes('--mutate');

// ─── 静态守卫：样本声明的每个 expect* 字段都必须出现在判据里 ───
function expectCovered(src) {
  const sm = src.match(/const SAMPLES = (\[[\s\S]*?\n\];)/);
  if (!sm) return { ok: false, reason: 'SAMPLES 数组提取失败', declared: [], read: [] };
  let SAMPLES;
  try { SAMPLES = eval(sm[1]); } catch (e) { return { ok: false, reason: 'SAMPLES 求值失败: ' + e.message, declared: [], read: [] }; }
  const declared = new Set();
  for (const s of SAMPLES) for (const k of Object.keys(s)) if (k.startsWith('expect')) declared.add(k);
  // 判据读取字段：EXPECT_ACTIONS 表的键
  const em = src.match(/const EXPECT_ACTIONS = \{([\s\S]*?)\n\};/);
  const read = new Set();
  if (em) {
    for (const m of em[1].matchAll(/(\w+)\s*:/g)) read.add(m[1]);
  }
  const missing = [...declared].filter(k => !read.has(k));
  return { ok: missing.length === 0, reason: missing.length ? '未登记的期望字段: ' + missing.join(', ') : '', declared: [...declared], read: [...read] };
}

// ─── 值域守卫：期望值域若覆盖全部 gate action 就是恒绿（等价于没有约束） ───
const ALL_ACTIONS = ['pass', 'verify', 'rewrite', 'block'];
function valueDomainSound(tableSrc) {
  const em = tableSrc.match(/const EXPECT_ACTIONS = \{([\s\S]*?)\n\};/);
  if (!em) return { ok: false, reason: 'EXPECT_ACTIONS 表缺失' };
  const bad = [];
  for (const line of em[1].split('\n')) {
    if (line.trim().startsWith('//')) continue; // 跳过注释行
    const m = line.match(/^\s*(\w+)\s*:\s*\[([^\]]*)\]/);
    if (!m) continue;
    const vals = m[2].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
    const unknown = vals.filter(v => !ALL_ACTIONS.includes(v));
    if (unknown.length) bad.push(`${m[1]}: 未知 gate action ${unknown.join('/')}`);
    if (vals.length >= ALL_ACTIONS.length) bad.push(`${m[1]}: 值域覆盖全部 ${ALL_ACTIONS.length} 种 action（等于没有约束）`);
  }
  return { ok: bad.length === 0, reason: bad.join('; ') };
}

// ─── 动态守卫：verify 级样本退化必须被抓 ───
function dynamicCheck() {
  const src = fs.readFileSync(GA_FILE, 'utf8');
  const sm = src.match(/const SAMPLES = (\[[\s\S]*?\n\];)/);
  const SAMPLES = eval(sm[1]);
  const gate = require(path.join(ROOT, 'src', 'gate.js'));
  const em = src.match(/const EXPECT_ACTIONS = \{([\s\S]*?)\n\};/);
  if (!em) return { ok: false, reason: 'EXPECT_ACTIONS 表缺失' };
  const EXPECT_ACTIONS = {};
  for (const line of em[1].split('\n')) {
    const m = line.match(/^\s*(\w+)\s*:\s*\[([^\]]*)\]/);
    if (m) EXPECT_ACTIONS[m[1]] = m[2].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
  }
  const rows = [];
  for (const s of SAMPLES) {
    let action = 'THROW';
    try { action = gate.checkInput(s.text).gate.action; } catch (e) { action = 'ERR'; }
    let ok = true;
    for (const [field, allowed] of Object.entries(EXPECT_ACTIONS)) {
      if (s[field] && !allowed.includes(action)) ok = false;
    }
    rows.push({ id: s.id, action, ok });
  }
  return { ok: rows.every(r => r.ok), rows };
}

if (mutate) {
  // ═══ 变异模式：三种删除/篡改都必须让守卫变红 ═══
  const original = fs.readFileSync(GA_FILE, 'utf8');
  const variants = {
    'N1 删 EXPECT_ACTIONS 的 expectVague 行': s => s.replace(/\n\s*expectVague: \['verify'\],/, ''),
    'N2 判据循环退回只读三字段（删 expectVague 登记 + 写死）': s =>
      s.replace(/\n\s*expectVague: \['verify'\],/, '').replace(
        /for \(const \[field, allowed\] of Object\.entries\(EXPECT_ACTIONS\)\) \{\s*\n\s*if \(s\[field\] && !allowed\.includes\(action\)\) ok = false;\s*\n\s*\}/,
        "if (s.expectBlock && action !== 'block') ok = false;\n        if (s.expectRewrite && action !== 'rewrite' && action !== 'verify') ok = false;\n        if (s.expectClean && action !== 'pass') ok = false;"),
    'N3 SAMPLES 声明未登记期望字段 expectUrgent': s =>
      s.replace(/(const SAMPLES = \[[\s\S]*?)\n\];/, "$1\n  { id: 'neg-probe-412', text: '相关部门正在研究这个问题', expectUrgent: true },\n];"),
    'N4 expectVague 值域放宽到全部 4 种 action（等价恒绿）': s =>
      s.replace(/expectVague: \['verify'\],/, "expectVague: ['pass', 'rewrite', 'block', 'verify'],"),
  };
  let allRed = true;
  for (const [name, fn] of Object.entries(variants)) {
    const mutated = fn(original);
    if (mutated === original) { console.log(`  ${RED}FAIL${RESET} ${name} :: 变异未生效（替换串没匹配上）`); allRed = false; continue; }
    fs.writeFileSync(GA_FILE, mutated);
    try {
      const st = expectCovered(mutated);
      const vd = valueDomainSound(mutated);
      const dy = dynamicCheck();
      const red = !st.ok || !vd.ok || !dy.ok;
      if (red) { console.log(`  ${GREEN}OK${RESET} ${name} :: 守卫变红（${[!st.ok && '静态字段', !vd.ok && '值域合理性', !dy.ok && '动态'].filter(Boolean).join('+')}）`); }
      else { console.log(`  ${RED}FAIL${RESET} ${name} :: 守卫仍绿，缺口未被抓住`); allRed = false; }
    } finally {
      fs.writeFileSync(GA_FILE, original);
    }
  }
  // 还原自证
  const after = fs.readFileSync(GA_FILE, 'utf8');
  t('还原自证 :: guard-abilities.js 无残留', after === original);
  const st0 = expectCovered(after), dy0 = dynamicCheck();
  t('还原后守卫回绿', st0.ok && dy0.ok, `declared=${st0.declared.join(',')}`);

  console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
  process.exit(allRed && fail === 0 ? 0 : 1);
}

// ═══ 正向模式 ═══
console.log('── r412 期望字段覆盖对称性守卫 ──');
const src = fs.readFileSync(GA_FILE, 'utf8');

const st = expectCovered(src);
t('样本声明的每个 expect* 字段都在判据登记表内', st.ok, st.ok ? `declared=${st.declared.join(',')}` : st.reason);

const table = src.match(/const EXPECT_ACTIONS = \{([\s\S]*?)\n\};/);
t('判据为表驱动（存在 EXPECT_ACTIONS 登记表）', !!table);
if (table) {
  t('判据不再写死 if 链（无 s.expectXxx && action !== 形态）',
    !/if \(s\.expect\w+ && action !==/.test(src.split('const EXPECT_ACTIONS')[1] || ''));
}

const dy = dynamicCheck();
t('全部样本实际 gate 结果满足期望', dy.ok,
  dy.rows ? dy.rows.map(r => `${r.id}=${r.action}${r.ok ? '' : '(不符)'}`).join(' ') : dy.reason);

const vd = valueDomainSound(src);
t('期望值域合理（未覆盖全部 gate action、无未知 action）', vd.ok, vd.ok ? '值域均有约束力' : vd.reason);

// 退化识别能力：verify 级样本必须真的由某条期望字段约束
const vagueSample = eval(src.match(/const SAMPLES = (\[[\s\S]*?\n\];)/)[1]).find(s => s.expectVague);
t('verify 级样本存在且被登记', !!vagueSample && /expectVague/.test(table ? table[1] : ''),
  vagueSample ? `id=${vagueSample.id}` : '未找到');

// baseline 漂移提示（非阻断）：基线 detail 与实际不符时只警告
try {
  const bl = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'capability-baseline.json'), 'utf8'));
  const drifts = [];
  for (const r of dy.rows || []) {
    const b = bl.sampleResults.find(x => x.name === r.id);
    if (b && b.detail !== `gate=${r.action}`) drifts.push(`${r.id}: 基线=${b.detail} 实测=${r.action}`);
  }
  t('基线 detail 与实测一致（不一致则 --check 模式会误报漂移）', drifts.length === 0,
    drifts.length ? drifts.join('; ') : '一致');
} catch (e) {
  t('基线文件可读', false, e.message);
}

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail === 0 ? 0 : 1);
