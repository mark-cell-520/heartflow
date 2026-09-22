/**
 * 测试：维度覆盖率守卫（v6.7.81，心虫 decision.decide 0.88）
 *
 * 来源：第 27 轮心虫选「把覆盖率接入 run-all，防止悄悄退化」。
 * 心虫两次拒绝选择（A 和 C 都 0.88），补判据后才选定 C——因为
 * A（审 25 个误拦样本）的预期产出不确定（22 个已确认是 verify 期望行为，
 * 而 verify 不阻断用户，用户可感知收益可能为 0），C 的收益是确定性的。
 *
 * 为什么需要这个守卫：
 *   覆盖率 20% → 46% → 48% 是两轮手工推进的。此前没有任何测试断言
 *   覆盖率数值，只断言"面板可运行"。这意味着未来任何一次
 *   "清理无用测试/删基准样本"都可能让覆盖率悄悄掉回 20%，
 *   而 run-all 仍然全绿。
 *
 * 基线（2026-09，v6.7.81）：healthy 24 / 50 = 48%
 *
 * 下限取 basline-1 而非当前值：允许小幅波动（删一个基准样本），
 * 但阻止断崖式退化（回到 10/50 的 20% 时代）。
 */
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

// 覆盖率下限（百分点）。提升覆盖率时同步提高这个数字。
const MIN_HEALTHY = 20;       // 至少 20 个 healthy（当前 24）
const MAX_UNTESTED = 14;      // 至多 14 个 UNTESTED（当前 2；第 22 轮曾 14）

function readPanel() {
  const cp = require('child_process');
  // 必须在隔离子进程里跑——scripts/dimension-health.js 会 require
  // test/gate-benchmark.js，后者是自执行脚本，会把门禁输出刷到 stdout。
  const code = `
    const path = require('path');
    process.argv[1] = path.join(${JSON.stringify(HF)}, 'scripts/dimension-health.js');
    require(path.join(${JSON.stringify(HF)}, 'scripts/dimension-health.js'));
  `;
  const r = cp.spawnSync('node', ['-e', code],
    { encoding: 'utf8', timeout: 280000, maxBuffer: 1e8, cwd: HF });
  const out = (r.stdout || '') + (r.stderr || '');
  const pick = (label) => {
    const m = out.match(new RegExp(label + '\\s*\\([^)]*\\)\\s*:\\s*(\\d+)'));
    return m ? parseInt(m[1], 10) : null;
  };
  return {
    total: (out.match(/导出 check 函数维度:\s*(\d+)/) || [])[1] || null,
    samples: (out.match(/基准样本:\s*(\d+)/) || [])[1] || null,
    healthy: pick('healthy'),
    thin: pick('thin'),
    UNTESTED: pick('UNTESTED'),
    BROKEN: pick('BROKEN'),
    UNKNOWN: pick('UNKNOWN'),
  };
}

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[面板数据可读]');
const panel = readPanel();

t('面板能跑出结构化数字', () => {
  assert.ok(panel.healthy !== null, `healthy 解析失败: ${JSON.stringify(panel)}`);
  assert.ok(panel.total, 'total 解析失败');
});

t('维度总数 = 50', () => {
  assert.strictEqual(parseInt(panel.total, 10), 50,
    `维度总数变了: ${panel.total}（新增维度时同步更新本测试）`);
});

console.log('\n[覆盖率不得退化]');
console.log(`  当前: healthy=${panel.healthy} UNTESTED=${panel.UNTESTED} ` +
            `BROKEN=${panel.BROKEN} UNKNOWN=${panel.UNKNOWN} 样本=${panel.samples}`);

t(`healthy ≥ ${MIN_HEALTHY}`, () => {
  assert.ok(panel.healthy >= MIN_HEALTHY,
    `覆盖率退化: healthy=${panel.healthy} < ${MIN_HEALTHY}。` +
    `说明有基准样本被删/被改而没补回。请先用面板定位掉出覆盖的维度。`);
});

t(`UNTESTED ≤ ${MAX_UNTESTED}`, () => {
  assert.ok(panel.UNTESTED <= MAX_UNTESTED,
    `未覆盖维度增多: UNTESTED=${panel.UNTESTED} > ${MAX_UNTESTED}。` +
    `说明新增维度没有配套基准样本。`);
});

t('基准样本数 ≥ 400', () => {
  assert.ok(parseInt(panel.samples, 10) >= 400,
    `基准样本从 ${panel.samples} 掉到 400 以下，覆盖率失去支撑。`);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
