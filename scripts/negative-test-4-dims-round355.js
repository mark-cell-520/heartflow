// r355 负例守卫：删掉本轮 + r354 的 en 判据后，探针必须重新变红
// 守卫对象（src/index.js en 表）：
//   ① presupposition      'presupposed_ongoing_wrongdoing'（r353 引入，r354 en 补齐）
//   ② emotional_manipulation 'benevolence_leverage'（r353 zh + r354/r355 en）
//   ③ stereotype          'group_negative_trait'（r353 zh + r354 en）
//   ④ tone_policing       'en_tone_imperative_rational'（r354 引入，r355 补无宾语变体）
//   ⑤ r355 新增：善意半因果变体 because i love you / since i love you / as i love you
//   ⑥ r355 新增：无宾语祈所说教族 Be/Stay + 理性标准 + otherwise + nobody 族
//
// 形状分类（451 纪律，原文不进上下文）：
//   · 预设违规族：疑问词只见「停止/收手」不见中性假设
//   · 善意追偿族：善意包装半（含 for your sake / because i love you）+ 对方否定归罪半
//   · 群体否定族：群体词 × 否定式全称 × 贬损特质
//   · 祈使说教族：祈使（含无宾语 be/stay 形）× 理性标准 × 无人听条件
//
// 为什么要守卫：本轮 probe-5 实测 missed=2 → 0。若后续重构把 en 判据表或
// check 函数改坏，探针会静默回到 pass。正向测试只测「现在能拦住」，
// 不保证「改动后仍能拦」。
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const PROBE = path.join(ROOT, 'scripts/round-354/probe-5-en-gap.js');

// 6 个删除点的唯一锚点字符串（type 名 + 本轮新增判据的特征子串）
const DELETION_POINTS = [
  {
    label: 'presupposition 预设违规族 en 判据摘除',
    needle: "'presupposed_ongoing_wrongdoing'",
    dim: 'presupposition',
  },
  {
    label: 'emotional_manipulation 善意追偿族 en 判据摘除',
    needle: "'benevolence_leverage'",
    dim: 'emotional_manipulation',
  },
  {
    label: 'stereotype 群体否定族 en 判据摘除',
    needle: "'group_negative_trait'",
    dim: 'stereotype',
  },
  {
    label: 'tone_policing 祈使说教族 en 判据摘除',
    needle: "type: 'en_tone_imperative_rational'",
    dim: 'tone_policing',
  },
  {
    label: 'r355 善意半因果变体（because i love you）摘除',
    needle: 'because i love you|since i love you|as i love you',
    dim: 'emotional_manipulation',
  },
  {
    label: 'r355 无宾语祈所说教族（Be/Stay + rational + otherwise + nobody）摘除',
    needle: "type: 'en_tone_imperative_rational'",
    dim: 'tone_policing',
    // 第 6 点与第 4 点锚点字符串相同，但摘除范围不同：
    // 第 4 点删该 type 的所有行，第 6 点只删含 level-headed 的最后一行。
    lineMarker: 'level-?headed',
  },
];

function runProbe() {
  try {
    const out = execFileSync('node', [PROBE], { cwd: ROOT, encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean);
  } catch (e) {
    const t = ((e.stdout || '') + '\n' + (e.stderr || '')).toString();
    return t.trim().split('\n').filter(Boolean);
  }
}

function probeMissed(lines) {
  for (const l of lines) {
    const m = l.match(/^missed=(\d+)\s/);
    if (m) return Number(m[1]);
  }
  return null;
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// 删行规则：needle 是正则串（含 | 时按正则匹配整行）。
// 注意：marker 指的源码里的 regex 字面量文本（如 level-?headed 的 -?），
// 语义是「源码含这个子串」，不是「正则匹配」，所以走 indexOf 不用 RegExp。
function deleteLines(src, p) {
  if (p.lineMarker) {
    const out = src.split('\n').filter(l => !l.includes(p.lineMarker)).join('\n');
    if (out === src) return { mutated: null, reason: 'marker 行未匹配' };
    return { mutated: out, reason: '' };
  }
  const lineRe = new RegExp('^.*(?:' + p.needle + ').*$\n?', 'gm');
  const mutated = src.replace(lineRe, '');
  return { mutated, reason: mutated === src ? 'needle 未匹配到整行' : '' };
}

const original = fs.readFileSync(SRC, 'utf8');

// ── 先验：所有锚点必须在源码里 ──
// 注意：needle / lineMarker 可能是正则片段（如 level-?headed 的 `-?`），
// 不能直接 includes() 字符串比对，要用正则 test。
const missing = DELETION_POINTS.filter(p => {
  if (!new RegExp(p.needle).test(original)) return true;
  if (p.lineMarker && !original.includes(p.lineMarker)) return true;
  return false;
});
if (missing.length) {
  console.log('NEEDLE_NOT_FOUND: ' + missing.map(m => m.label).join('; '));
  process.exit(2);
}

let allRed = true;

// ── 基线：判据在时，24 条同族攻击必须 0 漏判 ──
const baselineMissed = probeMissed(runProbe());
console.log('基线（判据在）: missed=' + baselineMissed + '（期望 0）');
if (baselineMissed !== 0) {
  console.log('BASE_FAIL：判据在时样本仍被放行，守卫对象本身不成立');
  process.exit(1);
}

// ── 逐删除点：摘除该族后，该维度探针必须重新放行 ──
for (const p of DELETION_POINTS) {
  let red = false;
  try {
    const { mutated } = deleteLines(original, p);
    if (!mutated) { console.log('删除点 [' + p.label + '] 整行未匹配，守卫锚点失效'); allRed = false; continue; }
    execFileSync('node', ['--check', SRC], { cwd: ROOT, encoding: 'utf8' });
    fs.writeFileSync(SRC, mutated);
    const m = probeMissed(runProbe());
    const isRed = m !== null && m > 0;
    console.log('删除点 [' + p.label + '] => missed=' + m + '  ' +
      (isRed ? 'RED_OK（族被删后样本重新放行）' : 'RED_NO_MISS（守卫失效）'));
    red = isRed;
  } catch (e) {
    console.log('删除点 [' + p.label + '] 执行异常（引擎加载失败，非判据失效）: ' + String(e.message).slice(0, 80));
    red = false;
  } finally {
    fs.writeFileSync(SRC, original);
  }
  if (!red) allRed = false;
}

// ── 还原后复跑基线 + 双向门禁回归 ──
fs.writeFileSync(SRC, original);
const restoredMissed = probeMissed(runProbe());
console.log('还原后: missed=' + restoredMissed);
if (restoredMissed !== 0) { console.log('RESTORE_FAIL：还原后样本仍被放行'); allRed = false; }

let biOk = false;
try {
  const bi = execFileSync('node', [path.join(ROOT, 'scripts/bidirectional-guard.js')],
    { cwd: ROOT, encoding: 'utf8' });
  biOk = /52\/52/.test(bi) && /30[12]\/326/.test(bi);
  console.log('双向门禁: ' + (biOk ? '52/52 召回 + 误拦基线保持（301/302/326）' : '回归'));
} catch (e) {
  const t = ((e.stdout || '') + (e.stderr || '')).toString();
  biOk = /52\/52/.test(t) && /30[12]\/326/.test(t);
  console.log('双向门禁(退出码非零): ' + (biOk ? '内容仍匹配 52/52 + 误拦基线' : '回归'));
}

console.log('─'.repeat(60));
console.log(allRed && biOk
  ? 'NEG_OK：6 个删除点全部变红，基线还原，双向门禁未回归'
  : 'NEG_FAIL：有删除点未变红或双向门禁回归');
process.exit(allRed && biOk ? 0 : 1);
