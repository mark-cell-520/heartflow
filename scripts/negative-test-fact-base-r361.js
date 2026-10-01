// r361 负例守卫：PC_FACT_BASE_ZH 可复核时点词扩表（r361 commit 95c2207f）
// 守卫对象（src/index.js）：
//   · PC_FACT_BASE_ZH 正则本身 → 替换为空断言 (?!)，让整族时点护栏失效
//   · checkPseudoCausal 调用点 `if (hasChinese && PC_FACT_BASE_ZH.test(text)) continue;`
//     → 条件置假
// 判据：护栏失效后，probe-3 基线里由时点豁免放行的良性句必须重新变红。
// 形状（451 纪律，样本原文隔离在 scripts/round-361/probe-3-baseline.js）。
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const PROBE = path.join(ROOT, 'scripts/round-361/probe-3-baseline.js');
const FACTBASE_PROBE = path.join(ROOT, 'scripts/round-361/probe-14-factbase-set.js');

// 时点护栏专用探针：只含「精确倍数 + 时点」形状的中文样本。
// 输出一行 `pcCount>0 N/M`。
function runFactbaseProbe() {
  try {
    const out = execFileSync('node', [FACTBASE_PROBE], { cwd: ROOT, encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean);
  } catch (e) {
    const t = ((e.stdout || '') + '\n' + (e.stderr || '')).toString();
    return t.trim().split('\n').filter(Boolean);
  }
}

function factbaseRed(lines) {
  for (const l of lines) {
    const m = l.match(/pcCount>0 (\d+)\/(\d+)/);
    if (m) return Number(m[1]);
  }
  return null;
}

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
    let m = l.match(/BENIGN FP (\d+)\/(\d+)/);
    if (m) res.benign = Number(m[1]);
    m = l.match(/ATTACK (\d+)\/(\d+)/);
    if (m) res.attack = Number(m[1]);
  }
  return res;
}

const NEUTER_POINTS = [
  {
    label: 'PC_FACT_BASE_ZH 正则本体置假（时点词全失效）',
    kind: 'regex',
    from: "const PC_FACT_BASE_ZH = /(?:去年|今年|上月|上季度|上半年|下半年|一季度|二季度|三季度|四季度|本季度|上本年|当天|当日|上线以来|落地后|改版后|迭代后|优化后|调整后|导入后|接入后|20\\d{2}\\s*年|从\\s*\\d|\\d+(?:\\.\\d+)?\\s*(?:%|％)|p\\s*[=<]|r\\s*=\\s*-|arxiv|doi|github\\.com)/i;",
    to: "const PC_FACT_BASE_ZH = /(?!x)x/i;",
  },
  {
    label: 'checkPseudoCausal 时点护栏调用点置假',
    kind: 'cond',
    from: 'if (hasChinese && PC_FACT_BASE_ZH.test(text)) continue;',
    to: 'if (false) continue;',
  },
];

// 时点护栏生效面在 detector 层（PC_FACT_BASE_ZH 只保护 pseudo_causal 命中），
// gate 层可能被其他维度（perfect_error/unsupported_claim/vagueness）抢先顶成
// non-pass —— probe-3 的 7 条 FP 里恰好每条都有伴生维度。所以守卫判据必须
// 直接量 pseudo_causal.dimensions.count，不能量 gate.action。
// 判据：置假后 probe-14（精确倍数 + 时点样本）里 pcCount>0 的条数必须 > 0。

function neuter(src, p) {
  if (p.kind === 'regex') {
    if (!src.includes(p.from)) return null;
    const n = src.split(p.from).length - 1;
    if (n !== 1) return null;
    return src.replace(p.from, p.to);
  }
  if (!src.includes(p.from)) return null;
  const n = src.split(p.from).length - 1;
  if (n !== 1) return null;
  return src.replace(p.from, p.to);
}

const original = fs.readFileSync(SRC, 'utf8');
const missing = NEUTER_POINTS.filter(p => neuter(original, p) === null);
if (missing.length) {
  console.log('NEEDLE_NOT_FOUND: ' + missing.map(m => m.label).join('; '));
  process.exit(2);
}

let allGreen = true;

// ── gate 层基线（probe-3）：整体恶化哨兵 ──
const base = probeNumbers(runProbe());
console.log('gate 层基线（probe-3）: benign FP=' + base.benign + '/28 attack=' + base.attack + '/19');
if (base.benign === null || base.benign > 7 || base.attack === null || base.attack < 16) {
  console.log('BASE_FAIL：基线偏离 r361 实测（benign<=7, attack>=16）');
  process.exit(1);
}

// ── 逐置假点：护栏失效后 detector 层 pseudo_causal 必须重新出现命中（变红）──
const baseRed = factbaseRed(runFactbaseProbe());
console.log('时点护栏基线（判据在）: pcCount>0 ' + baseRed + '/11（期望 0）');
if (baseRed === null) { console.log('BASE_FAIL：探针无输出'); process.exit(1); }
if (baseRed !== 0) { console.log('BASE_FAIL：判据在时仍有 pseudo_causal 命中'); process.exit(1); }
for (const p of NEUTER_POINTS) {
  let red = false;
  try {
    const mutated = neuter(original, p);
    if (!mutated) { console.log('置假点 [' + p.label + '] 锚点未匹配'); allGreen = false; continue; }
    execFileSync('node', ['--check', SRC], { cwd: ROOT, encoding: 'utf8' });
    fs.writeFileSync(SRC, mutated);
    const n = factbaseRed(runFactbaseProbe());
    const isRed = n !== null && n > 0;
    console.log('置假点 [' + p.label + '] => pcCount>0 ' + n + '/11  ' +
      (isRed ? 'RED_OK（护栏失效后 pseudo_causal 重新命中）' : 'RED_NO_MISS（守卫失效）'));
    red = isRed;
  } catch (e) {
    console.log('置假点 [' + p.label + '] 执行异常: ' + String(e.message).slice(0, 80));
    red = false;
  } finally {
    fs.writeFileSync(SRC, original);
  }
  if (!red) allGreen = false;
}

fs.writeFileSync(SRC, original);
const restoredRed = factbaseRed(runFactbaseProbe());
console.log('还原后: pcCount>0 ' + restoredRed + '/11');
if (restoredRed !== 0) { console.log('RESTORE_FAIL：还原后 detector 层仍命中'); allGreen = false; }

console.log('─'.repeat(60));
console.log(allGreen
  ? 'NEG_OK：2 个置假点全部变红，基线还原'
  : 'NEG_FAIL：有置假点未变红或基线未还原');
process.exit(allGreen ? 0 : 1);
