/**
 * 测试：dimensions/summary 登记守卫（v6.7.84，心虫 decision.decide 0.94）
 *
 * 背景：第 50 轮修 pseudo_causal 断链时发现三个维度算了 checkXxx、
 * 推了 findings，却从未登记进 discriminate() 的 dimensions 对象与
 * summary 数组——读方（gate / MCP / 面板）一律从 dimensions 取，
 * 于是永远当"未命中"。
 *
 * 该坑此前无机制拦截：第 23 轮的维度行动审计只测单维函数返回值，
 * 没测 discriminate() 的返回值。所以每加一个维度都可能重复踩。
 *
 * 本测试跑 scripts/dimension-registry-guard.js 并断言：
 *   ① 现状全绿（50 个 checkXxx 中被 discriminate 使用的全部登记）
 *   ② 守卫对"移除登记"敏感（负例：临时删掉一个登记必须红灯）
 *      ——第 51 轮已实测过一次，这里固化，防守卫将来失效成死代码
 */
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const GUARD = path.join(HF, 'scripts/dimension-registry-guard.js');
const SRC = path.join(HF, 'src/index.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[守卫现状]');

t('登记守卫全绿', () => {
  const r = spawnSync('node', [GUARD], { encoding: 'utf8', timeout: 120000 });
  assert.strictEqual(r.status, 0, '守卫报红：\n' + (r.stdout || '') + (r.stderr || ''));
  assert.ok(/均已登记/.test(r.stdout || ''), '守卫未给出通过结论');
});

t('守卫统计出真实规模（不是空跑）', () => {
  const r = spawnSync('node', [GUARD], { encoding: 'utf8', timeout: 120000 });
  const m = (r.stdout || '').match(/discriminate 内绑定: (\d+) 个/);
  assert.ok(m, '守卫没输出绑定数');
  assert.ok(parseInt(m[1], 10) >= 40, `只绑定 ${m && m[1]} 个，明显偏少——口径可能坏了`);
});

console.log('\n[守卫有效性（负例）]');

t('移除一个维度登记 → 守卫必须红灯', () => {
  const orig = fs.readFileSync(SRC, 'utf8');
  const backup = '/tmp/idx-guard-negex-' + process.pid + '.js';
  fs.writeFileSync(backup, orig);
  try {
    const patched = orig.replace('      indirect_injection: ii,\n', '');
    if (patched === orig) throw new Error('找不到 indirect_injection 登记锚点（源码变了？需更新守卫测试）');
    fs.writeFileSync(SRC, patched);
    const r = spawnSync('node', [GUARD], { encoding: 'utf8', timeout: 120000 });
    assert.strictEqual(r.status, 1, '移除了登记守卫却仍绿——守卫是死代码');
    assert.ok(/checkIndirectInjection/.test(r.stdout || ''), '守卫报红但没点名是哪个维度');
  } finally {
    fs.writeFileSync(SRC, orig);
  }
  // 还原后必须恢复绿
  const r2 = spawnSync('node', [GUARD], { encoding: 'utf8', timeout: 120000 });
  assert.strictEqual(r2.status, 0, '还原后守卫仍红');
  try { fs.unlinkSync(backup); } catch (_) {}
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
