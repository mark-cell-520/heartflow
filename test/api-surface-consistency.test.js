/**
 * 测试：API 表面一致性（v6.7.79 建，v6.8.99 第 744 轮改为委托 src/core/api-surface.js）
 *
 * 来源：第 44 轮心虫选「核对 API 参考表」。
 *
 * 一、为什么改（r744 轮初实测：两条判据都在失效）
 *
 * ① 假阳性（幽灵方法每轮必红）：README 的 **Version history** 段落里写着
 *    「`src/index.js checkEvidence(claim, evidence)` 的 `score = …`」，
 *    本测试原来的 `` `(\w+)\s*\(` `` 正则把它当成 gate.js 的导出契约，
 *    于是每轮红一条「文档列了导出里不存在的方法: checkEvidence」。
 *    文档其实在同一段里就写明了它是 src/index.js 的内部函数。
 *    **根因：把叙述区（变更记录）当成了 API 区。**
 *
 * ② 漏列（覆盖面只有 1/161 个模块）：本测试只扫 src/gate.js。
 *    r736/r737/r738 给 gate.js 加了 quotationFrame / delimiterChannel /
 *    postHocLegs 三个诊断导出，r743 又给 measure-core.js 加了
 *    readTestCountFile / writeTestCount 等导出，全部无文档提及，
 *    本测试一条都报不出来。
 *
 * 二、改法
 *
 * 判定逻辑搬去 src/core/api-surface.js（单一来源，MCP 与脚本共用），
 * 本测试只留门禁断言。两条判据都是**可解释的位置规则**：
 *   - 契约位 = 非叙述区章节里的表格首列 `| `name(` ` 或 ATX 标题 `### `name(` `
 *   - 叙述区 = 标题命中 version history / changelog / 变更记录 / 历史 的章节
 *
 * 三、本测试守四条
 *   ① 零幽灵方法（硬失败）
 *   ② 全部公开导出都被至少一份文档提及（硬失败，且覆盖面是 3 个公开模块）
 *   ③ gate() 硬闸门本体有文档说明（硬失败）
 *   ④ 量不到就拒绝出数，不洗成「没问题」（硬失败）
 */
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HF = __HF;
const api = require(path.join(HF, 'src/core/api-surface.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[API 表面核对（src/core/api-surface.js 单一实现）]');

const R = api.audit(HF);
console.log(`  公开面 ${R.counts.publicModules} 个模块 / ${R.counts.exports} 个函数导出`);
console.log(`  契约位声称 ${R.counts.claims} 条 / 幽灵 ${R.counts.ghosts} / 漏列 ${R.counts.undocumented}`);

console.log('\n[零幽灵方法]');

t('文档提到的每个 API 都真实存在', () => {
  assert.strictEqual(R.ghosts.length, 0,
    `文档列了公开面里不存在的方法: ${R.ghosts.map(g => g.name + ' ← ' + g.file + ':' + g.line + ' [' + g.section + ']').join(', ')}。调用方复制即崩。`);
});

t('checkEvidence 不再被当成 gate.js 导出（叙述区不是 API 区）', () => {
  // r744 之前这里每轮必红：README Version history 里的内部函数名被当成导出契约
  const bogus = R.claims.filter(c => c.name === 'checkEvidence');
  assert.strictEqual(bogus.length, 0,
    'README Version history 段落里的 checkEvidence 又被当成契约位声称了——叙述区判定失效');
  const gate = require(path.join(HF, 'src/gate.js'));
  assert.strictEqual(typeof gate.checkEvidence, 'undefined',
    'checkEvidence 竟然真的成了 gate.js 导出——那是 src/index.js 的内部函数，检查是不是谁接错了');
});

console.log('\n[导出不漏列]');

t('全部公开导出都被至少一份文档提及', () => {
  assert.strictEqual(R.counts.undocumented, 0,
    `这些导出没有任何文档提及: ${R.undocumented.map(u => u.name + ' (' + u.module + ')').join(', ')}。` +
    `调用方不知道它们存在，只能用入口函数。`);
});

t('公开面覆盖 3 个模块（不止 src/gate.js）', () => {
  // r744 之前只扫 gate.js，measure-core 的六个新导出连漏五轮
  assert.deepStrictEqual(R.modules.map(m => m.rel).sort(),
    ['src/core/heartflow.js', 'src/core/measure-core.js', 'src/gate.js']);
  const mc = R.modules.find(m => m.key === 'measureCore');
  assert.ok(mc.documented.includes('readTestCountFile'),
    'measure-core 的 readTestCountFile 又漏列了（r743 新增，连漏五轮的那一族）');
  assert.ok(mc.documented.includes('writeTestCount'),
    'measure-core 的 writeTestCount 又漏列了');
});

t('gate() 硬闸门本体有文档说明', () => {
  // gate() 是 block/rewrite 判定的出处，必须被文档化
  const anyDoc = api.DOC_FILES.some(d => {
    const p = path.join(HF, d);
    return fs.existsSync(p) && /`gate\(text\)`/.test(fs.readFileSync(p, 'utf8'));
  });
  assert.ok(anyDoc, '没有任何文档说明 gate(text) —— 硬闸门本体对调用方不可见');
});

console.log('\n[量不到就拒绝出数]');

t('公开模块 require 失败时 ok=false 且带 reason（不洗成没问题）', () => {
  const fake = api.audit(HF, { modules: [{ key: 'ghost', rel: 'src/core/does-not-exist.js', contract: '夹具' }] });
  assert.strictEqual(fake.ok, false);
  assert.ok(/require 失败/.test(fake.reason || ''), 'require 失败没有变成拒绝理由：' + fake.reason);
  const ghostMod = fake.modules.find(m => m.key === 'ghost');
  assert.strictEqual(ghostMod.ok, false);
  assert.deepStrictEqual(ghostMod.exports, []);
});

t('报告可读（describe 不抛异常且点名漏列）', () => {
  const txt = api.describe(HF);
  assert.ok(/公开面 \d+ 个模块/.test(txt), 'describe 输出格式不对：' + txt.slice(0, 120));
  assert.ok(txt.includes('✅'), '对齐时 describe 应打 ✅');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
