/**
 * 负例脚本：reward_hacking 英文侧 11 族补形守卫（第 199 轮）
 *
 * 用法：
 *   node scripts/negative-test-rh-en-families-round199.js          # 原版必须绿
 *   HF_ROOT=<注入后副本> node scripts/negative-test-rh-en-families-round199.js
 *
 * 与 test/ 的守卫测试同源样本；本脚本额外做「删条必变红」——把本轮新增
 * 的某支正则从副本源码里删掉，守卫必须失败。若删条后仍绿，说明该守卫
 * 不是真守卫（测了个空）。
 *
 * 家族铁律参考 scripts/negative-test-absolute-claim-en.js。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = process.env.HF_ROOT || path.join(__dirname, '..');
const SRC = path.join(HF, 'src/reward-hacking.js');
const GUARD = path.join(HF, 'test/reward-hacking-en-families-round199.test.js');
const SELF = __filename;

// 本轮新增的锚点注释 → 支编号（与 src/reward-hacking.js 中的注释一一对应）
const NEEDLES = [
  { tag: 'EA-EN1', fam: 'evaluation_awareness' },
  { tag: 'EIS-EN1', fam: 'eval_input_shortcut' },
  { tag: 'TS-EN1', fam: 'task_substitution' },
  { tag: 'HAP-EN11', fam: 'human_answer_proxy' },
  { tag: 'MR-EN1', fam: 'measurement_rigging' },
  { tag: 'DG-EN1', fam: 'metric_denominator_gaming' },
  { tag: 'CS-EN1', fam: 'check_suppression' },
  { tag: 'SRL-EN1', fam: 'self_referential_loop' },
  { tag: 'ERM-EN4', fam: 'eval_ruleset_masking' },
  { tag: 'EL-EN1', fam: 'eval_leakage' },
  { tag: 'CT-EN1', fam: 'condition_tuning' },
];

function runGuard() {
  try {
    const out = execFileSync(process.execPath, [GUARD], {
      encoding: 'utf8', env: Object.assign({}, process.env, { HF_ROOT: HF }),
    });
    const ok = /(\d+) 通过, (\d+) 失败/.test(out) && out.includes(', 0 失败');
    return { ok, tail: out.trim().split('\n').slice(-2).join('\n') };
  } catch (e) {
    return { ok: false, tail: (e.stdout || '').trim().split('\n').slice(-3).join('\n') || e.message };
  }
}

function injectDrop(tag) {
  const src = fs.readFileSync(SRC, 'utf8');
  const lines = src.split('\n');
  // 找到锚点注释行，跳过连续注释行，取其后的第一条正则行
  let idx = lines.findIndex(l => l.includes(tag));
  if (idx < 0) return null;
  while (idx + 1 < lines.length && lines[idx + 1].trim().startsWith('//')) idx++;
  const regexLineIdx = idx + 1;
  if (regexLineIdx >= lines.length || !lines[regexLineIdx].trim().startsWith('/')) return null;
  const original = fs.readFileSync(SRC);
  fs.writeFileSync(SRC, lines.slice(0, regexLineIdx).concat(lines.slice(regexLineIdx + 1)).join('\n'));
  return () => fs.writeFileSync(SRC, original);
}

const states = [];
function log(s) { states.push(s); console.log(s); }

log('五态负例：原版绿 → 逐支删条变红 → 还原恢复绿');

let restore = null;
try {
  const base = runGuard();
  log(`① 原版守卫: ${base.ok ? '绿' : '红'} — ${base.tail.replace(/\n/g, ' / ')}`);
  if (!base.ok) {
    log('❌ 原版就红，先修守卫再谈负例');
    process.exit(1);
  }

  let dropped = 0, turnedRed = 0;
  for (const n of NEEDLES) {
    const undo = injectDrop(n.tag);
    if (!undo) { log(`⚠️ ${n.tag} 未定位到正则行，跳过`); continue; }
    restore = undo;
    const r = runGuard();
    dropped++;
    if (!r.ok) turnedRed++;
    log(`  删 ${n.tag} (${n.fam}): ${r.ok ? '❌ 仍绿' : '✅ 变红'}`);
    undo();
    restore = null;
  }
  log(`② 删条 ${dropped} 支，${turnedRed} 支成功变红`);

  const after = runGuard();
  log(`③ 还原后守卫: ${after.ok ? '✅ 恢复绿' : '❌ 仍红'}`);
  log(`④ 源码无污染: ${fs.readFileSync(SRC).length > 0 ? '✅ 已还原' : '-'}`);

  const allOk = base.ok && dropped === turnedRed && after.ok;
  log(allOk ? '✅ 五态全过：守卫有效且可逆' : '❌ 存在无效守卫');
  process.exit(allOk ? 0 : 1);
} catch (e) {
  if (restore) { try { restore(); log('已还原源码'); } catch (_) {} }
  log('脚本异常: ' + e.message);
  process.exit(1);
}
