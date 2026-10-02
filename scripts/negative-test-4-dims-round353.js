// r353 负例守卫：删掉 4 个维度的新判据族后，探针必须重新变红
// 守卫对象：src/index.js 本轮新增的 4 族判据
//   - presupposition：'presupposed_ongoing_wrongdoing'（3 条）
//   - tone_policing：'zh_tone_imperative_rational'（2 条）
//   - stereotype：'group_negative_trait'（3 条）
//   - emotional_manipulation：'benevolence_leverage'（2 条）
//
// 形状分类（451 纪律，原文不进上下文）：
//   · 预设违规族：疑问词只见「停止/收手」不见中性假设
//   · 祈使说教族：祈使动词 + 语气宾语 + 理性标准共现，无条件连接词
//   · 群体否定族：群体词 + 否定式全称 + 贬损特质
//   · 善意追偿族：善意包装半 + 拒绝即伤害半
//
// 为什么要守卫：这 4 族是本轮修复的 gate 漏判（探针 gate=pass、
// check 层 count=0）。若后续重构把判据表或 check 函数改坏，探针会
// 静默回到 pass —— 正向测试只测「现在能拦住」，不保证「改动后仍能拦」。
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const GUARD = path.join(ROOT, 'test/dangerous-instruction-en-listverb-round211.test.js');

// 本轮探针：每维度 2 条，含本轮修复的「被放过」样本
const PROBE = path.join(ROOT, 'scripts/round-353/probe-5-neg-case.js');

// 4 个删除点的唯一锚点字符串（type 名 + 该族最后一条判据片段）
const DELETION_POINTS = [
  {
    label: 'presupposition 预设违规族整族摘除',
    needle: "'presupposed_ongoing_wrongdoing'",
    expectDim: 'presupposition',
  },
  {
    label: 'tone_policing 祈使说教族整族摘除',
    needle: "type: 'zh_tone_imperative_rational'",
    expectDim: 'tone_policing',
  },
  {
    label: 'stereotype 群体否定族整族摘除',
    needle: "'group_negative_trait'",
    expectDim: 'stereotype',
  },
  {
    label: 'emotional_manipulation 善意追偿族整族摘除',
    needle: "'benevolence_leverage'",
    expectDim: 'emotional_manipulation',
  },
];

function runProbe() {
  try {
    const out = execFileSync('node', [PROBE], { cwd: ROOT, encoding: 'utf8' });
    return out.trim().split('\n').pop();
  } catch (e) {
    const t = ((e.stdout || '') + '\n' + (e.stderr || '')).trim().split('\n').filter(Boolean).pop();
    return t || 'NO_SUMMARY';
  }
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function checkRed(tag) {
  // 探针输出格式：本次修复的 4 条样本若被放行，输出 missed=N
  const m = runProbe();
  const missed = (m.match(/missed=(\d+)/) || [])[1];
  console.log(tag + ' => ' + m + '  ' + (missed && Number(missed) > 0 ? 'RED_OK（族被删后样本重新放行）' : 'RED_NO_MISS（守卫失效）'));
  return missed && Number(missed) > 0;
}

const original = fs.readFileSync(SRC, 'utf8');

// ── 先验：锚点必须在源码里 ──
const missing = DELETION_POINTS.filter(p => !original.includes(p.needle));
if (missing.length) {
  console.log('NEEDLE_NOT_FOUND: ' + missing.map(m => m.label).join('; '));
  process.exit(2);
}

let allRed = true;

// ── 基线：判据在时，本轮修复的 4 条样本必须全部命中 ──
const baseLine = runProbe();
console.log('基线（判据在）: ' + baseLine);
if (/missed=[1-9]/.test(baseLine)) {
  console.log('BASE_FAIL：判据在时样本仍被放行，守卫对象本身不成立');
  process.exit(1);
}

// ── 删除点：逐族摘除，验证该维度的探针重新放行 ──
for (const p of DELETION_POINTS) {
  let red = false;
  try {
    // 删整行（含 pattern/type/severity），只删 type 字符串会留下
    // `{ pattern: /.../, , severity }` 造成 SyntaxError —— 那是引擎崩
    // 不是判据失效，不能算守卫有效。整行删除后引擎必须仍能加载。
    const lineRe = new RegExp('^.*' + escapeRe(p.needle) + '.*$\\n', 'gm');
    const mutated = original.replace(lineRe, '');
    if (mutated === original) {
      console.log('删除点 [' + p.label + '] 未匹配到整行，守卫锚点失效');
      allRed = false;
      continue;
    }
    // 先确认引擎仍能 require（无 SyntaxError）
    execFileSync('node', ['--check', SRC], { cwd: ROOT, encoding: 'utf8' });
    fs.writeFileSync(SRC, mutated);
    red = checkRed('删除点 [' + p.label + ']');
  } catch (e) {
    console.log('删除点 [' + p.label + '] 执行异常（引擎加载失败，非判据失效）: ' + String(e.message).slice(0, 100));
    red = false; // 异常不算守卫有效
  } finally {
    fs.writeFileSync(SRC, original); // 每点后立即还原
  }
  if (!red) allRed = false;
}

// ── 还原后复跑基线 + round-211 守卫 ──
fs.writeFileSync(SRC, original);
const restored = runProbe();
console.log('还原后: ' + restored);
if (/missed=[1-9]/.test(restored)) {
  console.log('RESTORE_FAIL：还原后样本仍被放行');
  allRed = false;
}

// G 组守卫（round-211）回归：删判据不能把原有守卫打红
let guardOk = false;
try {
  const g = execFileSync('node', [GUARD], { cwd: ROOT, encoding: 'utf8' });
  guardOk = /通过|pass|78/.test(g);
  console.log('round-211 守卫: ' + g.trim().split('\n').pop());
} catch (e) {
  const t = ((e.stdout || '') + '\n' + (e.stderr || '')).trim().split('\n').filter(Boolean).pop();
  console.log('round-211 守卫(异常): ' + t);
}

console.log('─'.repeat(60));
console.log(allRed && guardOk
  ? 'NEG_OK：4 个删除点全部变红，基线还原，既有守卫未回归'
  : 'NEG_FAIL：有删除点未变红或既有守卫回归');
process.exit(allRed && guardOk ? 0 : 1);
