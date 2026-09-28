/**
 * 负例脚本（第 197 轮）：把守卫测试的两处改动分别注入/回滚，验证
 * 「删条必变红」不是巧合而是判据真的在兜底。
 *
 * 用法：
 *   node scripts/negative-test-di-idx7-idx47-round197.js
 *
 * 判定：
 *   · 原版（有判据）→ 守卫测试 11/11 绿
 *   · 删掉 PAT4 凭据定语 → idx 7 族必须变红
 *   · 删掉 advisory 破坏校验物闸 → idx 47 族必须变红
 * 三个状态任一不成立即退出码 1。
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(ROOT, 'src', 'dangerous-instruction.js');
const GUARD = path.join(ROOT, 'test', 'dangerous-instruction-idx7-idx47-round197.test.js');

function runGuard() {
  try {
    execFileSync('node', [GUARD], { cwd: ROOT, stdio: 'pipe' });
    return { ok: true, out: '' };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function cripple(kind) {
  return crippleInPlace(kind);
}

// 守卫测试 require 的是真实 src 路径（HF_ROOT 只影响 test 文件里的路径拼接），
// 所以负例验证必须**原地改 SRC 再还原**，不能用副本路径。
function crippleInPlace(kind) {
  const orig = fs.readFileSync(SRC, 'utf8');
  let lines = orig.split('\n');
  if (kind === 'pat4') {
    const i = lines.findIndex(l => l.includes('密码|口令|密钥|凭证|凭据|登录|session|token'));
    lines[i] = lines[i].replace(/密码\|口令\|密钥\|凭证\|凭据\|登录\|session\|token/g, '');
  } else {
    const anchor = lines.findIndex(l => l.includes('破坏校验物语义一票否决'));
    let s = anchor;
    while (s >= 0 && !/const BYPASS_VERB_P/.test(lines[s])) s--;
    let e = anchor;
    while (e < lines.length && !/BYPASS_VERB_P\.test\(text\)/.test(lines[e])) e++;
    for (let i = s; i <= e; i++) {
      if (/const BYPASS_VERB_P/.test(lines[i])) lines[i] = '  const BYPASS_VERB_P = /(?!x)x/;';
      else if (/const CHECK_OBJ_P/.test(lines[i])) lines[i] = '  const CHECK_OBJ_P = /(?!x)x/;';
    }
  }
  fs.writeFileSync(SRC, lines.join('\n'));
  return orig;
}

let failed = 0;

// ① 原版必须全绿
const base = runGuard();
console.log(base.ok ? '✅ 原版守卫 11/11 绿' : '❌ 原版守卫未全绿（改动本身有问题）');
if (!base.ok) { console.log(base.out); failed++; }

// ② 删 PAT4 凭据定语 → idx 7 族必须变红
{
  const orig = crippleInPlace('pat4');
  const r = runGuard();
  fs.writeFileSync(SRC, orig);
  const mentionsIdx7 = /idx 7：把字句凭据定语族/.test(r.out) && /❌/.test(r.out);
  console.log(r.ok ? '❌ 删 PAT4 定语后守卫仍全绿（守卫无效）'
                   : (mentionsIdx7 ? '✅ 删 PAT4 凭据定语 → idx 7 族按预期变红'
                                   : '⚠️ 删 PAT4 定语后守卫变红但不在 idx 7 族'));
  if (r.ok || !mentionsIdx7) failed++;
}

// ③ 删 advisory 破坏校验物闸 → idx 47 族必须变红
{
  const orig = crippleInPlace('adv');
  const r = runGuard();
  fs.writeFileSync(SRC, orig);
  const mentionsIdx47 = /idx 47：裸「避免」/.test(r.out) && /❌/.test(r.out);
  console.log(r.ok ? '❌ 删 advisory 闸后守卫仍全绿（守卫无效）'
                   : (mentionsIdx47 ? '✅ 删 advisory 破坏校验物闸 → idx 47 族按预期变红'
                                    : '⚠️ 删 advisory 闸后守卫变红但不在 idx 47 族'));
  if (r.ok || !mentionsIdx47) failed++;
}

// ④ 还原后必须恢复全绿（防负例脚本自己把源码写坏）
const after = runGuard();
console.log(after.ok ? '✅ 还原后守卫恢复 11/11 绿' : '❌ 还原后守卫未恢复（负例脚本污染了源码）');
if (!after.ok) failed++;

process.exit(failed > 0 ? 1 : 0);
