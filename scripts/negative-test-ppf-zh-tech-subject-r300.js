// scripts/negative-test-ppf-zh-tech-subject-r300.js
// [v6.7.130 第 300 轮] 注入-删条：主语技术域闸门是不是真守卫
// 纪律：样本只在本文件出现；只报数字与形状。
// 方式（与 r298/r299 同款三段式）：
//   ① 基线：跑守卫测试的全部负例，必须全放行
//   ② 注入：把 src/index.js 里 isTechSubject 的 return 改成永 false（=闸门失效），
//      负例应重新被 8781 行判据吞掉 → 断言必须变红
//   ③ 恢复 + 复跑：必须回到全绿
// 若 ② 不变红，说明闸门没在保护任何东西（或保护的是别的东西），判为不合格。
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');

// 备份策略：用 git stash 之外的手工备份文件，避免污染 git 状态
const SRC = path.join(ROOT, 'src', 'index.js');
const BAK = SRC + '.round300-techsubj-backup.js';
const GUARD = path.join(ROOT, 'test', 'doubt-ppf-zh-tech-subject-r300.test.js');

// 注入目标：isTechSubject 的返回语句
const ORIG = '  return TECH_SUBJECT_NOUNS.test(subj);';
const INJ = '  return false; // [注入测试] 闸门失效\n  return TECH_SUBJECT_NOUNS.test(subj);';

function run(label) {
  let out = '', code = 0;
  try {
    out = execFileSync('node', [GUARD], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    // node 测试断言失败时退出码非 0，stdout 仍在 e.stdout —— r299 踩过这个坑
    code = e.status || 1;
    out = (e.stdout || '') + (e.stderr || '');
  }
  const failLines = out.split('\n').filter(l => l.includes('FAIL:'));
  const passLines = out.split('\n').filter(l => l.includes('全通过'));
  console.log('--- ' + label + ' ---');
  for (const l of passLines) console.log('  ' + l.trim());
  for (const l of failLines) console.log('  ' + l.trim());
  console.log('  ' + (code === 0 ? '✅ 该态全绿' : '🔴 该态非零退出(' + code + ')，FAIL 分组 ' + failLines.length + ' 个'));
  return { green: code === 0 && failLines.length === 0, failCount: failLines.length, out, code };
}

function read() { return fs.readFileSync(SRC, 'utf8'); }
function write(s) { fs.writeFileSync(SRC, s); }

// 0) 备份
fs.copyFileSync(SRC, BAK);
console.log('=== 0) 备份 src/index.js → ' + path.basename(BAK) + ' ===');

let injected = false;
try {
  // 1) 基线
  const base = run('① 基线（闸门生效）');
  if (!base.green) throw new Error('基线不绿，中止');

  // 2) 注入：让闸门永 false
  const cur = read();
  if (cur.indexOf(ORIG) === -1) throw new Error('未找到注入锚点，src 可能已改动');
  write(cur.replace(ORIG, INJ));
  injected = true;
  const inj = run('② 注入（闸门 return false）');

  // 3) 恢复
  fs.copyFileSync(BAK, SRC);
  injected = false;
  const rec = run('③ 恢复（移除注入）');

  console.log('\n=== 判定 ===');
  console.log('基线绿: ' + base.green);
  console.log('注入后 FAIL 数: ' + inj.failCount);
  console.log('恢复后绿: ' + rec.green);
  if (!base.green) { console.log('🔴 基线不绿'); process.exit(1); }
  if (inj.failCount === 0) {
    console.log('🔴 注入后守卫测试仍全绿 —— 闸门没有保护任何东西，判为不合格守卫');
    process.exit(1);
  }
  if (!rec.green) { console.log('🔴 恢复后未回到全绿，src 可能被污染'); process.exit(1); }
  console.log('✅ 注入-删条验证通过：基线绿 → 闸门失效后 ' + inj.failCount + ' 组变红 → 恢复全绿');
} catch (e) {
  console.log('🔴 异常: ' + e.message);
  if (injected) { try { fs.copyFileSync(BAK, SRC); console.log('已恢复 src'); } catch (e2) { console.log('恢复失败: ' + e2.message); } }
  process.exit(1);
} finally {
  try { fs.unlinkSync(BAK); } catch (e) { /* 忽略 */ }
}
