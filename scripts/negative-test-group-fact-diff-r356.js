// r356 负例守卫：把「群体事实差异句豁免」的各处生效点置假后，探针必须重新变红
//
// 守卫对象（src/index.js）：
//   · isGroupFactDiffEn() 函数本体 → 整段替换为 return false
//   · 三处同源豁免调用点的判断条件 → 置假（false）
//     ① checkVagueness 返回前短路（vagueness 归零）
//     ② checkUnsupportedClaim hasPublicAuthority 后短路（count 归零）
//     ③ checkAppealToAuthority dedup 前信号过滤
//
// 为什么用「置假」而不是「删行」：删掉判断行本身会让 if 语句/模板残缺，
// 引擎直接语法崩，测到的是 parse error 而不是判据失效。置假保持语法完整，
// 只让豁免逻辑不再生效 —— 这才是「守卫不是守卫」的正确测法。
//
// 形状分类（451 纪律，原文不进上下文）：
//   · 差异族：模糊来源词（studies/research/data + show/indicate/suggest）
//     × 度量差异动词（differ/higher/lower/average…）
//     × 无天生归因词（naturally/biologically/inherently…）
//     × 无禀赋高下词（better at/worse at/superior/inferior…）
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const PROBE = path.join(ROOT, 'scripts/round-356/probe-1-group-fact-fp.js');

function runProbe() {
  try {
    const out = execFileSync('node', [PROBE], { cwd: ROOT, encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean);
  } catch (e) {
    const t = ((e.stdout || '') + '\n' + (e.stderr || '')).toString();
    return t.trim().split('\n').filter(Boolean);
  }
}

function probeNumbers(lines) {
  const res = { benign: null, attack: null };
  for (const l of lines) {
    let m = l.match(/^r356-benign nonPass=(\d+)/);
    if (m) res.benign = Number(m[1]);
    m = l.match(/^r356 attack missed=(\d+)/);
    if (m) res.attack = Number(m[1]);
  }
  return res;
}

// 用花括号配对找出 [fromIdx, 匹配的 '}' ] 区间
function matchBrace(src, fromIdx) {
  let depth = 0;
  for (let i = fromIdx; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

// 4 个置假点。kind=func 的替换整段函数体为 return false；
// kind=cond 的把判断条件替换为 false（保持 if 语法完整）。
const NEUTER_POINTS = [
  {
    label: 'isGroupFactDiffEn 函数本体置假',
    kind: 'func',
    start: 'function isGroupFactDiffEn(text) {',
  },
  {
    label: 'checkVagueness 豁免判断置假',
    kind: 'cond',
    from: 'if (count > 0 && !hasChinese && isGroupFactDiffEn(text)) return { count: 0, matches: [], score: 0 };',
    to: 'if (false) return { count: 0, matches: [], score: 0 };',
  },
  {
    label: 'checkUnsupportedClaim 豁免判断置假',
    kind: 'cond',
    from: 'if (count > 0 && !hasChinese && isGroupFactDiffEn(text)) {',
    to: 'if (false) {',
  },
  {
    label: 'checkAppealToAuthority 豁免过滤置假',
    kind: 'cond',
    from: 'const filtered = (signalsRaw.length > 0 && !hasChinese && isGroupFactDiffEn(text))',
    to: 'const filtered = (false)',
  },
];

function neuter(src, p) {
  if (p.kind === 'cond') {
    if (!src.includes(p.from)) return null;
    // 要求唯一
    const n = src.split(p.from).length - 1;
    if (n !== 1) return null;
    return src.replace(p.from, p.to);
  }
  // kind=func：从函数签名行开始，配对花括号，整段换成 `return false;`
  const idx = src.indexOf(p.start);
  if (idx < 0) return null;
  const braceOpen = src.indexOf('{', idx);
  if (braceOpen < 0) return null;
  const braceClose = matchBrace(src, braceOpen);
  if (braceClose < 0) return null;
  return src.slice(0, braceOpen) + '{ return false; }' + src.slice(braceClose + 1);
}

const original = fs.readFileSync(SRC, 'utf8');

// ── 先验：所有锚点必须在源码里且可定位 ──
const missing = NEUTER_POINTS.filter(p => neuter(original, p) === null);
if (missing.length) {
  console.log('NEEDLE_NOT_FOUND: ' + missing.map(m => m.label).join('; '));
  process.exit(2);
}

let allRed = true;

// ── 基线：判据在时，32 条同形状良性必须 0 误拦、6 条攻击 0 漏判 ──
const base = probeNumbers(runProbe());
console.log('基线（判据在）: benign nonPass=' + base.benign + ' attack missed=' + base.attack + '（期望 0/0）');
if (base.benign !== 0 || base.attack !== 0) {
  console.log('BASE_FAIL：判据在时误拦未清零或攻击漏判，守卫对象本身不成立');
  process.exit(1);
}

// ── 逐置假点：豁免失效后必须重新出现误拦（benign nonPass > 0）──
for (const p of NEUTER_POINTS) {
  let red = false;
  try {
    const mutated = neuter(original, p);
    if (!mutated) { console.log('置假点 [' + p.label + '] 锚点未匹配，守卫失效'); allRed = false; continue; }
    execFileSync('node', ['--check', SRC], { cwd: ROOT, encoding: 'utf8' });
    fs.writeFileSync(SRC, mutated);
    const m = probeNumbers(runProbe());
    const isRed = m.benign !== null && m.benign > 0;
    console.log('置假点 [' + p.label + '] => benign nonPass=' + m.benign + ' attack missed=' + m.attack + '  ' +
      (isRed ? 'RED_OK（豁免失效后良性重新被误拦）' : 'RED_NO_MISS（守卫失效）'));
    red = isRed;
  } catch (e) {
    console.log('置假点 [' + p.label + '] 执行异常（引擎加载失败，非判据失效）: ' + String(e.message).slice(0, 80));
    red = false;
  } finally {
    fs.writeFileSync(SRC, original);
  }
  if (!red) allRed = false;
}

// ── 还原后复跑基线 ──
fs.writeFileSync(SRC, original);
const restored = probeNumbers(runProbe());
console.log('还原后: benign nonPass=' + restored.benign + ' attack missed=' + restored.attack);
if (restored.benign !== 0 || restored.attack !== 0) {
  console.log('RESTORE_FAIL：还原后误拦未清零或攻击漏判');
  allRed = false;
}

console.log('─'.repeat(60));
console.log(allRed
  ? 'NEG_OK：4 个置假点全部变红，基线还原'
  : 'NEG_FAIL：有置假点未变红或基线未还原');
process.exit(allRed ? 0 : 1);
