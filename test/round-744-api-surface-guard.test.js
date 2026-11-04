/**
 * 第 744 轮测试：API 表面守卫（src/core/api-surface.js）
 *
 * 主题：把「文档承诺的 API 与代码真正导出的还对得上吗」从三处手写正则
 * 升级成 region-aware 的单一实现，并把覆盖面从 src/gate.js 一个模块
 * 扩到三个公开模块。
 *
 * 轮初实测（改之前）：
 *   test/api-surface-consistency.test.js → 1 通过 / 2 失败
 *     ❌ 幽灵方法 checkEvidence（README Version history 里的内部函数名）
 *     ❌ 漏列 quotationFrame / delimiterChannel / postHocLegs
 *   而 r743 给 measure-core.js 新增的 6 个导出，那个测试一条都报不出来。
 *
 * 本测试八段：A region 切分 / B 契约位判定 / C 导出抽取 / D 幽灵与豁免 /
 * E 漏列 / F 拒绝出数 / G MCP 接线 / H 承重（真仓必须绿）。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const api = require(path.join(ROOT, 'src/core/api-surface.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
function check(name, cond, detail) { t(name + (cond ? '' : ' → ' + (detail || '')), () => assert.ok(cond, detail)); }

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-apisurface-'));

function writeFixture(rel, text) {
  const p = path.join(TMP, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
  return p;
}

// 夹具文档：覆盖全部契约位 / 非契约位 / 叙述区组合
const DOC_API = `# Fixture

## API reference

| Function | Returns |
|----------|---------|
| \`alpha(text)\` | real export |
| \`beta(text)\` | real export |

### \`gamma(opts)\`
A heading-position API.

Some prose mentions \`delta(\` inline and \`src/index.js epsilon(claim, ev)\` too —
neither is a contract position, so neither may count as a claim.

## Version history

| 6.8.99 | 2026-11-05 | **changelog prose** — mentions \`checkEvidence(claim, evidence)\` and a table cell that is not the first column |
| \`ghostFromChangelog(\` | 2026-11-05 | 表格首列但在叙述区 |

### Sub-section inside narrative

| \`ghostNested(\` | nested under a narrative heading |
`;

// 夹具公开模块：两个函数导出 + 一个非函数导出
const FIXTURE_MOD = `'use strict';
function alpha() { return 1; }
function beta() { return 2; }
const TUNING = 42;
module.exports = { alpha, beta, TUNING };
`;
writeFixture('src/fixture.js', FIXTURE_MOD);
writeFixture('DOC.md', DOC_API);
const FIXTURE_MODULES = [{ key: 'fixture', rel: 'src/fixture.js', contract: '夹具' }];

console.log('\n[A] region 切分（叙述区不是 API 区）');

const scanned = api.scanDoc(DOC_API, 'DOC.md');
const claimNames = scanned.claims.map(c => c.name);

t('A1 表格首列是契约位', () => {
  assert.deepStrictEqual(claimNames.filter(n => n === 'alpha' || n === 'beta').sort(), ['alpha', 'beta']);
});
t('A2 ATX 标题是契约位', () => {
  assert.ok(claimNames.includes('gamma'), '标题位 gamma 没被抽到：' + claimNames.join(','));
});
t('A3 行内反引号（非表格首列/非标题）不是契约位', () => {
  assert.ok(!claimNames.includes('delta'), '散文里的 delta( 被当成契约位了');
  assert.ok(!claimNames.includes('epsilon'), '散文里的 epsilon( 被当成契约位了');
});
t('A4 Version history 章节整体不是契约位', () => {
  assert.ok(!claimNames.includes('checkEvidence'),
    'checkEvidence 又被当成契约位了——这正是 r744 之前每轮必红的那条幽灵方法');
  assert.ok(!claimNames.includes('ghostFromChangelog'), '叙述区表格首列被当成契约位了');
});
t('A5 叙述区的子章节同样不是契约位', () => {
  assert.ok(!claimNames.includes('ghostNested'), '叙述区子章节的表格首列被当成契约位了');
});
t('A6 宽口径提及仍然看得到叙述区之外的名字', () => {
  assert.ok(scanned.mentions.has('delta'), '宽口径没收到 delta');
  assert.ok(!scanned.mentions.has('checkEvidence'), '宽口径收到了叙述区的 checkEvidence');
});
t('A7 叙述区判定是继承的（祖先标题命中即整章排除）', () => {
  const nested = `## Version history\n\n### Inner\n| \`zzz(\` | x |\n`;
  const s = api.scanDoc(nested, 'X.md');
  assert.strictEqual(s.claims.length, 0, '叙述区子章节没被继承排除');
});

console.log('\n[B] 契约位的位置规则（可解释，不靠词表）');

t('B1 表格非首列的 `name(` 不算声称', () => {
  const s = api.scanDoc('## API\n\n| 6.8.99 | `alpha(text)` | 描述 |\n', 'X.md');
  assert.strictEqual(s.claims.length, 0, '第二列的 alpha( 被当成契约位了');
});
t('B2 围栏代码块里的 `name(` 不算声称（复制即崩的不是代码示例）', () => {
  const s = api.scanDoc('## Use it\n\n```javascript\nconst r = alpha(text);\n```\n', 'X.md');
  assert.strictEqual(s.claims.length, 0, '代码示例里的 alpha( 被当成契约位了');
});
t('B3 每条声称都带 file/line/section/form 四个证据字段', () => {
  const c = scanned.claims.find(x => x.name === 'alpha');
  assert.ok(c && c.file === 'DOC.md' && Number.isInteger(c.line) && c.section && c.form,
    '证据字段不全：' + JSON.stringify(c));
});

console.log('\n[C] 导出抽取');

const fx = api.loadExports(TMP, 'src/fixture.js');
t('C1 只审计函数导出', () => {
  assert.deepStrictEqual(fx.names, ['alpha', 'beta']);
  assert.ok(fx.other.includes('TUNING'), '非函数导出没被归到 other');
});
t('C2 排序稳定（两次调用同一结果）', () => {
  assert.deepStrictEqual(api.loadExports(TMP, 'src/fixture.js').names, fx.names);
});

console.log('\n[D] 幽灵方法与豁免机制');

const ghostDoc = `## API reference\n\n| \`alpha(text)\` | ok |\n| \`nope(text)\` | 导出里没有 |\n`;
writeFixture('GHOST.md', ghostDoc);
const ghostAudit = api.audit(TMP, { docs: ['GHOST.md'], modules: FIXTURE_MODULES });
t('D1 契约位声称没有对应导出 → 幽灵', () => {
  assert.strictEqual(ghostAudit.ghosts.length, 1);
  assert.strictEqual(ghostAudit.ghosts[0].name, 'nope');
  assert.strictEqual(ghostAudit.ok, false);
});
t('D2 幽灵报告带文档位置（可定点修）', () => {
  const g = ghostAudit.ghosts[0];
  assert.strictEqual(g.file, 'GHOST.md');
  assert.ok(Number.isInteger(g.line) && g.line > 0);
});
t('D3 豁免表每条必须带 reason（没有理由的豁免就是关掉守卫）', () => {
  api.EXEMPT_CLAIMS.forEach(e => {
    assert.ok(typeof e.name === 'string' && e.name.length > 0, '豁免缺 name');
    assert.ok(typeof e.reason === 'string' && e.reason.length > 0, '豁免缺 reason：' + e.name);
  });
  assert.ok(Array.isArray(api.EXEMPT_CLAIMS));
});
t('D4 豁免条目不计幽灵但照样报出来（不静默）', () => {
  const r = api.audit(TMP, { docs: ['GHOST.md'], modules: FIXTURE_MODULES });
  assert.ok(Array.isArray(r.exempted), 'audit 结果缺 exempted 字段');
  assert.strictEqual(r.counts.exemptions, r.exempted.length);
});

console.log('\n[E] 漏列（导出有、文档无）');

const partialDoc = `## API reference\n\n| \`alpha(text)\` | ok |\n`;
writeFixture('PARTIAL.md', partialDoc);
const partial = api.audit(TMP, { docs: ['PARTIAL.md'], modules: FIXTURE_MODULES });
t('E1 beta 无文档提及 → 漏列', () => {
  assert.deepStrictEqual(partial.undocumented.map(u => u.name), ['beta']);
  assert.strictEqual(partial.ok, false);
});
t('E2 漏列条目带上模块路径', () => {
  assert.strictEqual(partial.undocumented[0].module, 'src/fixture.js');
});
t('E3 counts 与逐模块清单自洽', () => {
  assert.strictEqual(partial.counts.undocumented, partial.undocumented.length);
  assert.strictEqual(partial.counts.exports, 2);
  assert.strictEqual(partial.counts.documented, 1);
});

console.log('\n[F] 量不到就拒绝出数');

t('F1 公开模块 require 失败 → ok=false + reason', () => {
  const r = api.audit(TMP, { docs: ['PARTIAL.md'], modules: [{ key: 'x', rel: 'src/nope.js', contract: '夹具' }] });
  assert.strictEqual(r.ok, false);
  assert.ok(/require 失败/.test(r.reason), '没有拒绝理由：' + r.reason);
});
t('F2 文档缺失时不当成绿', () => {
  const r = api.audit(TMP, { docs: ['NO-SUCH.md'], modules: FIXTURE_MODULES });
  assert.strictEqual(r.docs[0].exists, false);
  assert.strictEqual(r.ok, false, '文档全缺失却报了绿');
});

console.log('\n[G] MCP 接线（AGENTS.md 约定 3：工具定义 + handler 分支 + 提示串）');

const srcReg = fs.readFileSync(path.join(ROOT, 'src/mcp/tools-registry.js'), 'utf8');
const srcSrv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
t('G1 工具定义 inputSchema 枚举含 apisurface', () => {
  assert.ok(/runtime（默认）\/ static \/ all \/ check \/ testcount \/ apisurface/.test(srcReg),
    'inputSchema 的 action 枚举没有 apisurface');
});
t('G2 handler 有 apisurface 分支', () => {
  assert.ok(/action === 'apisurface'/.test(srcSrv), 'mcp-server.js 没有 apisurface 分支');
});
t('G3 未知 action 提示含 apisurface', () => {
  assert.ok(/可用 runtime \/ static \/ all \/ check \/ testcount \/ apisurface/.test(srcSrv),
    '未知 action 提示串没同步');
});
t('G4 measure_numbers 工具定义仍只有一份', () => {
  assert.strictEqual((srcReg.match(/name: 'heartflow_measure_numbers'/g) || []).length, 1,
    '工具定义重复（对象字面量后键覆盖前键，r36 踩过）');
});
t('G5 工具总数仍 191（刻意不新增工具，加了会打红 r735/r736/r738 三处快照）', () => {
  const reg = require(path.join(ROOT, 'src/mcp/tools-registry.js'));
  const tools = Array.isArray(reg) ? reg : (reg.TOOLS || reg.tools || []);
  assert.strictEqual(tools.length, 191, '工具总数应仍为 191，实为 ' + tools.length);
  assert.ok(tools.some(x => x.name === 'heartflow_measure_numbers'), 'measure_numbers 工具定义不见了');
});

console.log('\n[H] 承重：真仓必须绿（这是门禁，不是演示）');

const real = api.audit(ROOT);
t('H1 真仓审计 ok=true', () => {
  assert.strictEqual(real.ok, true, '真仓不绿：' + real.reason);
});
t('H2 真仓零幽灵', () => {
  assert.strictEqual(real.counts.ghosts, 0, JSON.stringify(real.ghosts));
});
t('H3 真仓零漏列（三个公开模块）', () => {
  assert.strictEqual(real.counts.undocumented, 0, JSON.stringify(real.undocumented));
});
t('H4 三个 r744 之前漏列的导出现在都有文档', () => {
  const gate = real.modules.find(m => m.key === 'gate');
  for (const n of ['quotationFrame', 'delimiterChannel', 'postHocLegs']) {
    assert.ok(gate.documented.includes(n), n + ' 仍然漏列');
  }
  const mc = real.modules.find(m => m.key === 'measureCore');
  for (const n of ['readTestCountFile', 'writeTestCount']) {
    assert.ok(mc.documented.includes(n), n + ' 仍然漏列');
  }
});
t('H5 契约位声称数 ≥ 16（README 8 + AGENTS 8 起）', () => {
  assert.ok(real.counts.claims >= 16, '声称数 ' + real.counts.claims + ' 少了——是不是哪份文档的表格被改坏了');
});

// ── 收尾 ────────────────────────────────────────────────────────
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}

console.log('');
console.log(`第 744 轮 API 表面守卫测试: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) process.exitCode = 1;
