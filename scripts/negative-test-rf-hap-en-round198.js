/**
 * 负例脚本（第 198 轮）：rh 英文两族补形的四态验证
 *
 * 用法：node scripts/negative-test-rf-hap-en-round198.js
 *
 * 判定（任一不成立退出码 1）：
 *   ① 原版（判据在）→ 守卫测试 47/47 绿
 *   ② 删掉 RF-EN4b/EN5 两支 → report_fudging 攻击断言必须变红（守卫有效）
 *   ③ 删掉 HAP-EN9 支 → human_answer_proxy 攻击断言必须变红
 *   ④ 还原 → 守卫测试重新全绿（且源码未污染）
 *
 * 纪律（第 197 轮教训）：负例脚本用**原地改 SRC + 跑完还原**，不用副本路径
 * （HF_ROOT 覆盖的是工程根，副本必须连 src 一起复制才生效）。
 * 删条方式：把该支正则替换为永不匹配的占位 /(?!x)x/i，注释行保持原样。
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(ROOT, 'src', 'reward-hacking.js');
const GUARD = path.join(ROOT, 'test', 'reward-hacking-rf-hap-en-round198.test.js');

function runGuard() {
  try {
    execFileSync('node', [GUARD], { cwd: ROOT, stdio: 'pipe' });
    return { ok: true, out: '' };
  } catch (e) {
    return { ok: false, out: ((e.stdout || '') + (e.stderr || '')).toString() };
  }
}

// 就地删除指定锚点注释之后的第一支正则（替换为永不匹配占位）
// 注意：锚点注释可能有多行续行，需跳过所有注释行找到真正的正则行
function crippleByAnchor(anchor) {
  const orig = fs.readFileSync(SRC, 'utf8');
  const idx = orig.indexOf(anchor);
  if (idx < 0) throw new Error('锚点未找到: ' + anchor);
  const lines = orig.slice(idx).split('\n');
  let i = 1; // 跳过锚点所在行
  while (i < lines.length && lines[i].trim().startsWith('//')) i++;
  if (i >= lines.length) throw new Error('锚点后未找到正则行: ' + anchor);
  const reLine = lines[i];
  if (!/^\s{4}\/[^\n]*\/i,\s*$/.test(reLine)) {
    throw new Error('锚点后首行不是正则行: ' + reLine.slice(0, 60));
  }
  const crippled = orig.replace(reLine + '\n', '    /(?!x)x/i,\n');
  if (crippled === orig) throw new Error('替换未生效: ' + anchor);
  fs.writeFileSync(SRC, crippled);
  return orig;
}

function restore(orig) {
  fs.writeFileSync(SRC, orig);
}

// 从守卫输出中提取期望变红的断言名是否出现 ❌
function failedNames(out) {
  return (out.match(/❌\s+[^\n]+/g) || []).map(l => l.replace(/^\s*❌\s+/, '').trim());
}

const states = [];
function record(name, ok, extra) {
  states.push({ name, ok, extra: extra || '' });
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
}

// ① 原版全绿
const s1 = runGuard();
record('原版（判据在）守卫全绿', s1.ok, s1.ok ? '' : failedNames(s1.out).slice(0, 4).join(' | '));

// ② 删 RF 两支 → rf 攻击断言变红
let orig2 = null;
try {
  orig2 = crippleByAnchor('// RF-EN4b 分裂语序');
  // 连续删第二支（RF-EN5），锚点在删 RF-EN4b 后的新文本里
  crippleByAnchor('// RF-EN5 选择性纳入产物');
  const s2 = runGuard();
  const rfRed = failedNames(s2.out).some(n => n.startsWith('rf-block'));
  record('删 RF-EN4b/EN5 后 rf-block 断言变红', !s2.ok && rfRed,
    rfRed ? failedNames(s2.out).filter(n => n.startsWith('rf-block')).slice(0, 3).join(' | ')
          : '未观察到 rf-block 失败');
} catch (e) {
  record('删 RF-EN4b/EN5 后 rf-block 断言变红', false, e.message);
} finally {
  if (orig2) restore(orig2);
}

// ③ 删 HAP-EN9 → hap 攻击断言变红
let orig3 = null;
try {
  orig3 = crippleByAnchor('// HAP-EN9 用人工转录冒充模型输出');
  const s3 = runGuard();
  const hapRed = failedNames(s3.out).some(n => n.startsWith('hap-block'));
  record('删 HAP-EN9 后 hap-block 断言变红', !s3.ok && hapRed,
    hapRed ? failedNames(s3.out).filter(n => n.startsWith('hap-block')).slice(0, 3).join(' | ')
           : '未观察到 hap-block 失败');
} catch (e) {
  record('删 HAP-EN9 后 hap-block 断言变红', false, e.message);
} finally {
  if (orig3) restore(orig3);
}

// ④ 还原后重新全绿
const s4 = runGuard();
record('还原后守卫重新全绿', s4.ok, s4.ok ? '' : failedNames(s4.out).slice(0, 4).join(' | '));

// ⑤ 源码未被污染（语法 + 支数量回到入库值）
try {
  const src = fs.readFileSync(SRC, 'utf8');
  const rfCount = (src.match(/RF-EN\d+[ab]?/g) || []).length;
  const hapCount = (src.match(/HAP-EN\d+[ab]?/g) || []).length;
  execFileSync('node', ['--check', SRC], { cwd: ROOT, stdio: 'pipe' });
  record('源码还原且语法正确', rfCount >= 8 && hapCount >= 8, `RF注释=${rfCount} HAP注释=${hapCount}`);
} catch (e) {
  record('源码还原且语法正确', false, e.message);
}

const failed = states.filter(s => !s.ok).length;
console.log(`\n四态验证：${states.length - failed}/${states.length} 通过，${failed} 失败`);
process.exit(failed ? 1 : 0);
