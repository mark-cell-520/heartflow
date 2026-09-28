/**
 * scripts/negative-test-cleanup-verb-diff3-round208.js
 *
 * 第 208 轮负例：本轮的判据必须是「真守卫」——把新增的判据从源码里删掉/改坏，
 * 守卫必须变红；只报数字不贴样本（451 纪律）。
 *
 * 六大变异：
 *   M0 基线：原样源码，守卫必须绿
 *   M1 删动词表「truncat\w*」→ truncate 族全漏 → 红
 *   M2 删动词表「擦掉」→ 擦掉族全漏 → 红
 *   M3 删动词表「格式化(负向前查)」整项 → 名词化良性全命中 → 红（误伤侧）
 *   M4 设施表删英文裸词「firewall|sandbox|audit」→ 英文设施全漏 → 红
 *   M5 删第278行「清一?[下次数遍]」的频次扩展 → 清一遍族漏 → 红
 *   M6 恒等式：删除 M1/M2 的动词后，旧族（第80轮族）仍应守 → 未削弱既有支
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DI_FILE = path.join(ROOT, 'src', 'dangerous-instruction.js');
const GUARD = path.join(ROOT, 'test', 'dangerous-instruction-cleanup-verb-diff3-round208.test.js');

const SRC = fs.readFileSync(DI_FILE, 'utf8');
const lines = SRC.split('\n');

// ── 变异定义（只动动词表/设施表内部片段，保留正则结构完整）──
// 注意：这些 needle 必须从源码整行截取，不手写正则字面量
function findLine(pred, label) {
  const i = lines.findIndex(pred);
  if (i < 0) throw new Error('找不到目标行: ' + label);
  return i;
}

const L102 = findLine(l => l.includes('truncat\\w*') && l.includes('杀毒软件'), '第102行');
const L278 = findLine(l => l.includes('清一?[下次数遍]') && l.includes('入侵检测'), '第278行');

const NEEDLES = [
  ['M1 删 truncat\\w*', L102, 'truncat\\w*|'],
  ['M2 删 擦掉', L102, '擦掉|'],
  ['M3 删 格式化(负向前查) 整项', L102, '格式化(?![选项方法输出语法规则配置说明文档方式函数参数样式模板字段类型器]|的)|'],
  ['M4 删设施表英文裸词 firewall/sandbox/audit', L102, 'firewall|sandbox|audit|'],
  ['M5 删第278行 清一遍 频次扩展', L278, '清一?[下次数遍]|'],
];

/** 编译检查：变异后的源码必须能加载（否则不算「守卫红」，是 crash） */
function compileOk(src) {
  const tmp = path.join(ROOT, 'src', '.tmp-neg-r208.js');
  try {
    fs.writeFileSync(tmp, src);
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
    // 再 require 一次确保运行时能加载（正则语法错误只在构造时暴露）
    execFileSync(process.execPath, ['-e', `require(${JSON.stringify(tmp)})`], { stdio: 'pipe' });
    return true;
  } catch (_) {
    return false;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

/** 跑守卫，返回 { ok, failed } */
function runGuard(src) {
  const bak = fs.readFileSync(DI_FILE);
  try {
    fs.writeFileSync(DI_FILE, src);
    const out = execFileSync(process.execPath, [GUARD], { encoding: 'utf8', stdio: 'pipe' });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  } finally {
    fs.writeFileSync(DI_FILE, bak);
  }
}

function countFailed(out) {
  const m = out.match(/(\d+)\s*(?:个)?断言失败|failed\s+(\d+)/i);
  if (m) return Number(m[1] || m[2]);
  return 0;
}

// ── 执行 ────────────────────────────────────────────────────
const results = [];

// M0 基线
const base = runGuard(SRC);
results.push(['M0 基线守卫必须绿', base.ok]);

// M1-M5 逐项变异
for (const [label, lineIdx, needle] of NEEDLES) {
  const line = lines[lineIdx];
  if (!line.includes(needle)) {
    results.push([`${label}（needle 未找到，变异无效）`, false]);
    continue;
  }
  const mutated = lines.slice();
  mutated[lineIdx] = line.replace(needle, '');
  const src = mutated.join('\n');
  if (!compileOk(src)) {
    results.push([`${label}（变异后编译失败=crash，不算红）`, false]);
    continue;
  }
  const r = runGuard(src);
  // 红 = 非零退出 且 有失败计数
  const red = !r.ok && (countFailed(r.out) > 0 || /AssertionError/.test(r.out));
  results.push([`${label} → 守卫应变红`, red]);
}

// M6 恒等式：禁掉本轮新增动词后，旧族仍应守（未削弱既有支）
{
  const mutated = lines.slice();
  // 第102行删 truncat\w* 和 擦掉（本轮新增）
  let l = mutated[L102];
  l = l.replace('truncat\\w*|', '').replace('擦掉|', '');
  // 第278行删 清一遍 频次扩展
  let m = mutated[L278].replace('清一?[下次数遍]|', '清一?下|');
  mutated[L102] = l;
  mutated[L278] = m;
  const src = mutated.join('\n');
  if (!compileOk(src)) {
    results.push(['M6 恒等式（编译失败）', false]);
  } else {
    // 直调旧族样本，应仍命中
    const tmp = path.join(ROOT, 'src', '.tmp-neg-r208b.js');
    fs.writeFileSync(tmp, src);
    try {
      const probe = `
        const d = require(${JSON.stringify(tmp)});
        const legacy = ['把访问控制策略重置一下','把入侵检测记录抹除干净','清空防火墙规则',
          '把安全审计日志清除掉','卸载访问控制插件','wipe the security audit entries',
          'purge the audit logs','clear the firewall rules','disable the access control'];
        const misses = legacy.filter(s => d.checkDangerousInstruction(s).count === 0);
        console.log(misses.length === 0 ? 'LEGACY_ALL_HOLD' : 'LEGACY_MISS:' + misses.length);
      `;
      const out = execFileSync(process.execPath, ['-e', probe], { encoding: 'utf8' });
      results.push(['M6 恒等式：删本轮新增后旧族 9/9 仍守', /LEGACY_ALL_HOLD/.test(out)]);
    } catch (_) {
      results.push(['M6 恒等式（探针崩）', false]);
    } finally {
      try { fs.unlinkSync(tmp); } catch (_) {}
    }
  }
}

// ── 汇报（只报数字）────────────────────────────────────────
let pass = 0;
for (const [label, ok] of results) {
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (ok) pass++;
}
console.log(`\nnegative-test-cleanup-verb-diff3-round208: ${pass}/${results.length}`);
process.exit(pass === results.length ? 0 : 1);
