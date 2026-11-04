'use strict';
/**
 * test/round-743-testcount-slice-isolation.test.js
 * [v6.8.98 第 743 轮] 分段回归不许污染全量记账缓存
 *
 * 背景（r742 实测事故，交接簿候选池①，非推测）：
 *   `HF_RUN_ALL_SLICE=565/625 node test/run-all.js` 跑完分段回归，接着跑
 *   `node scripts/sync-doc-numbers.js`，README/SKILL 的规格表被记成
 *   「48 passing / 0 failing」—— 而真值是 19,993 passing / 25 failing。
 *   轮末发现后手工恢复 19993/25 再记一次账才补回。
 *
 *   根因一句话：run-all.js 汇总段**无条件**把本次数字写进
 *   data/test-count.json，而分段回归只跑了 1/625 个文件，数字天然小一个
 *   量级；读取方（measure-core.readTestCount → sync-doc-numbers →
 *   doc-numbers 门禁）没有任何字段能告诉它「这是切片」。
 *   r741 坑⑦「回归后要再记一次账」只覆盖了另一半——**切片也算一次回归**。
 *
 * 本测试六段：
 *   A 写入按 scope 分流（全量→主缓存；切片→侧车，且主缓存逐字节不动）
 *   B 读取闸（主缓存是切片口径时拒绝出数，理由点名 slice）
 *   C measureAll / status 透出口径（静态接线）
 *   D run-all.js 接线（旧内联写路径已移除、sliceLabel 贯通）
 *   E 端到端：临时仓里跑**真的** run-all.js —— 分段不动主缓存、全量照写
 *   F 承重证明：把 r742 的事故形态（主缓存被写成切片口径）灌进读取路径，
 *     确认记账方拿到的是 null 而不是 48
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MC = require(path.join(ROOT, 'src/core/measure-core.js'));
const {
  readTestCountFile, writeTestCount, MeasureCore,
  TEST_COUNT_FILE, TEST_COUNT_SLICE_FILE, SCOPE_FULL, SCOPE_SLICE,
} = MC;

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-tcs-r743-'));
const DATA = path.join(TMP, 'data');
fs.mkdirSync(DATA, { recursive: true });
const MAIN = path.join(DATA, TEST_COUNT_FILE);
const SIDE = path.join(DATA, TEST_COUNT_SLICE_FILE);
const readMain = () => { try { return fs.readFileSync(MAIN, 'utf8'); } catch (_) { return null; } };
const readSide = () => { try { return fs.readFileSync(SIDE, 'utf8'); } catch (_) { return null; } };
const writeMainRaw = (obj) => fs.writeFileSync(MAIN, JSON.stringify(obj, null, 2));

console.log('\n[A] 写入按 scope 分流');
// A1-A5：全量写主缓存（向后兼容四键 + 新 scope/files 键）
const wFull = writeTestCount(DATA, {
  scope: SCOPE_FULL, passed: 19993, failed: 25, files: 625, at: '2026-11-05T00:00:00.000Z',
});
check('A1 全量写入落主缓存', path.resolve(wFull.file) === path.resolve(MAIN), path.basename(wFull.file));
const jFull = JSON.parse(readMain());
check('A2 主缓存带 scope=full', jFull.scope === SCOPE_FULL);
check('A3 存量四键语义不变（passed/failed/total/at）',
  jFull.passed === 19993 && jFull.failed === 25 && jFull.total === 20018 && jFull.at === '2026-11-05T00:00:00.000Z',
  `${jFull.passed}/${jFull.failed}/${jFull.total}`);
check('A4 新增 files 键记录本轮文件数', jFull.files === 625);
check('A5 全量写不产生侧车', readSide() === null);

// A6-A9：切片写侧车，主缓存逐字节不动
const mainBeforeSlice = readMain();
const wSlice = writeTestCount(DATA, {
  scope: SCOPE_SLICE, slice: '565/625', passed: 48, failed: 0, files: 1,
});
check('A6 切片写入落侧车', path.resolve(wSlice.file) === path.resolve(SIDE), path.basename(wSlice.file));
check('A7 切片后主缓存逐字节未动（r742 事故根因）', readMain() === mainBeforeSlice);
const jSide = JSON.parse(readSide());
check('A8 侧车带 scope=slice 与段号', jSide.scope === SCOPE_SLICE && jSide.slice === '565/625');
check('A9 侧车记的是切片数字', jSide.passed === 48 && jSide.failed === 0 && jSide.total === 48 && jSide.files === 1);

// A10：主缓存不存在时，切片也不该把它创建出来
fs.rmSync(MAIN, { force: true });
writeTestCount(DATA, { scope: SCOPE_SLICE, slice: '1/625', passed: 10, failed: 1, files: 1 });
check('A10 无主缓存时切片不创建它', readMain() === null);

// A11：存量缓存（r743 之前写的，没有 scope 字段）必须仍按 full 采信
writeMainRaw({ passed: 19993, failed: 25, total: 20018, at: '2026-11-04T19:20:04.721Z' });
const legacy = readTestCountFile(DATA);
check('A11 存量无 scope 缓存按 full 采信（向后兼容）',
  legacy.scope === SCOPE_FULL && legacy.trusted === true && legacy.passed === 19993);

console.log('\n[B] 读取闸：口径不对就拒绝出数');
const mc = new MeasureCore({ rootPath: TMP, silent: true });
writeTestCount(DATA, { scope: SCOPE_FULL, passed: 20018, failed: 0, files: 626 });
const rFull = mc.readTestCount();
check('B1 readTestCount 正常读全量缓存',
  rFull.passed === 20018 && rFull.failed === 0 && rFull.scope === SCOPE_FULL && !rFull.refused);
// r742 事故形态：主缓存里躺着切片口径的数字
writeMainRaw({ passed: 48, failed: 0, total: 48, at: '2026-11-05T00:30:00.000Z', scope: 'slice', slice: '565/625' });
const rSlice = mc.readTestCount();
check('B2 切片口径主缓存 → 拒绝出数（passed/failed 都是 null）',
  rSlice.passed === null && rSlice.failed === null, JSON.stringify(rSlice));
check('B3 拒绝理由点名 slice 与段号',
  typeof rSlice.refused === 'string' && rSlice.refused.includes('slice') && rSlice.refused.includes('565/625'),
  rSlice.refused);
const rawSlice = readTestCountFile(DATA);
check('B4 readTestCountFile.trusted=false', rawSlice.trusted === false && rawSlice.scope === SCOPE_SLICE);
fs.rmSync(MAIN, { force: true });
const rNone = mc.readTestCount();
check('B5 无缓存返回 null（不与 0 混同）',
  rNone.passed === null && rNone.failed === null && rNone.scope === null);

console.log('\n[C] measureAll / status 透出口径（静态接线）');
const srcMc = fs.readFileSync(path.join(ROOT, 'src/core/measure-core.js'), 'utf8');
check('C1 measureAll 透出 testCountScope', /testCountScope:\s*tests\.scope/.test(srcMc));
check('C2 measureAll 透出 testCountRefused', /testCountRefused:\s*tests\.refused/.test(srcMc));
check('C3 status().cached 也带口径', /cached:\s*\{[\s\S]{0,400}?testCountScope/.test(srcMc));
check('C4 常量与函数从模块导出',
  MC.TEST_COUNT_FILE === TEST_COUNT_FILE && MC.TEST_COUNT_SLICE_FILE === TEST_COUNT_SLICE_FILE
  && typeof MC.readTestCountFile === 'function' && typeof MC.writeTestCount === 'function');

console.log('\n[D] run-all.js 接线（写入路径单一来源）');
const srcRunner = fs.readFileSync(path.join(ROOT, 'test/run-all.js'), 'utf8');
check('D1 runner 从 measure-core 引入写入器',
  /require\('\.\.\/src\/core\/measure-core\.js'\)/.test(srcRunner) && /writeTestCount\(/.test(srcRunner));
check('D2 旧内联写主缓存的路径已移除',
  !/JSON\.stringify\(\{\s*passed,\s*failed,\s*total:\s*passed \+ failed/.test(srcRunner));
check('D3 sliceLabel 贯通到写入（分段才知道自己写哪儿）',
  /let sliceLabel = null;/.test(srcRunner) && /slice:\s*sliceLabel/.test(srcRunner));
check('D4 分段提示语点名侧车文件名', srcRunner.includes(TEST_COUNT_SLICE_FILE));
check('D5 文件头写明分段记账纪律', /绝不覆写 data\/test-count\.json/.test(srcRunner));

console.log('\n[E] 端到端：临时仓里跑真的 run-all.js');
// 临时仓只放 run-all.js 必需的最小集合（真实文件的逐字节副本，
// 所以测的是真代码路径，不是重写的逻辑）。
const TREPO = path.join(TMP, 'repo');
const TDATA = path.join(TREPO, 'data');
fs.mkdirSync(path.join(TREPO, 'test'), { recursive: true });
fs.mkdirSync(path.join(TREPO, 'src', 'core'), { recursive: true });
fs.mkdirSync(TDATA, { recursive: true });
for (const rel of ['test/run-all.js', 'test/_summary-parse.js', 'src/core/measure-core.js', 'src/core/mutation-guard.js']) {
  fs.copyFileSync(path.join(ROOT, rel), path.join(TREPO, rel));
}
fs.writeFileSync(path.join(TREPO, 'src', 'engine.js'), "'use strict';\nmodule.exports = {};\n");
const FAKE_A = `'use strict';\nconsole.log('fake-a 跑了');\nconsole.log('临时仓夹具 A: 1 通过, 0 失败, 共 1 个');\n`;
const FAKE_B = `'use strict';\nconsole.log('fake-b 跑了');\nconsole.log('临时仓夹具 B: 1 通过, 0 失败, 共 1 个');\n`;
fs.writeFileSync(path.join(TREPO, 'test', 'zz-fake-a.test.js'), FAKE_A);
fs.writeFileSync(path.join(TREPO, 'test', 'zz-fake-b.test.js'), FAKE_B);
// 预置一份全量口径主缓存：这就是 r742 被污染前的那份「真值」
const TMAIN = path.join(TDATA, TEST_COUNT_FILE);
const TSIDE = path.join(TDATA, TEST_COUNT_SLICE_FILE);
fs.writeFileSync(TMAIN, JSON.stringify({
  passed: 19993, failed: 25, total: 20018, scope: 'full', files: 625, at: '2026-11-04T19:20:04.721Z',
}, null, 2));
const mainBeforeRun = fs.readFileSync(TMAIN, 'utf8');

function runRunner(env2) {
  const env = {};
  for (const k of Object.keys(process.env)) if (k !== 'HF_RUN_ALL_SLICE') env[k] = process.env[k];
  Object.assign(env, env2);
  return cp.spawnSync('node', [path.join(TREPO, 'test', 'run-all.js')], {
    cwd: TREPO, encoding: 'utf8', timeout: 180000, env,
  });
}

// E1-E4：分段跑 → 主缓存必须逐字节不动，数字只进侧车
const rs = runRunner({ HF_RUN_ALL_SLICE: '2/2', HF_RUN_ALL_JOBS: '1' });
check('E1 分段 run exit 0', rs.status === 0, rs.status === null ? String(rs.error) : `exit=${rs.status}`);
check('E2 分段跑完主缓存逐字节未动', fs.existsSync(TMAIN) && fs.readFileSync(TMAIN, 'utf8') === mainBeforeRun);
const tSide = fs.existsSync(TSIDE) ? JSON.parse(fs.readFileSync(TSIDE, 'utf8')) : null;
check('E3 分段数字落侧车', !!tSide && tSide.scope === 'slice' && tSide.slice === '2/2'
  && tSide.passed === 1 && tSide.failed === 0 && tSide.files === 1, JSON.stringify(tSide));
check('E4 输出点名「只落侧车 / 全量缓存未动」',
  /test-count-slice\.json/.test(rs.stdout || '') && /未动/.test(rs.stdout || ''));

// E5-E6：对照 —— 同一临时仓跑全量，主缓存必须照写（证明没被修成永不写）
const rf = runRunner({ HF_RUN_ALL_JOBS: '1' });
check('E5 全量 run exit 0', rf.status === 0, rf.status === null ? String(rf.error) : `exit=${rf.status}`);
const tMain = fs.existsSync(TMAIN) ? JSON.parse(fs.readFileSync(TMAIN, 'utf8')) : null;
check('E6 全量 run 仍写主缓存（scope=full，数字是本轮实测）',
  !!tMain && tMain.scope === 'full' && tMain.passed === 2 && tMain.failed === 0 && tMain.files === 2,
  JSON.stringify(tMain));
check('E7 全量 run 不删侧车（历史分段数字留痕）', !!tSide && fs.existsSync(TSIDE));

console.log('\n[F] 承重证明：r742 事故形态走一遍完整读取链');
// 把「主缓存是切片口径」灌进 MeasureCore，确认三个记账方入口拿到的都是拒绝
writeMainRaw({ passed: 48, failed: 0, total: 48, scope: 'slice', slice: '565/625', files: 1, at: '2026-11-05T00:30:00.000Z' });
writeTestCount(DATA, { scope: SCOPE_SLICE, slice: '565/625', passed: 48, failed: 0, files: 1 });
const chain = mc.readTestCount();
check('F1 MeasureCore.readTestCount 拒绝（sync-doc-numbers 的唯一数据源）',
  chain.passed === null && chain.refused && chain.refused.includes('slice'));
// 同一份缓存喂给 readTestCountFile：主缓存不可信，侧车才是分段数字的家
const rawF = readTestCountFile(DATA);
check('F2 readTestCountFile 指主缓存 trusted=false 且 reason 可读',
  rawF.trusted === false && typeof rawF.reason === 'string' && rawF.reason.includes('拒绝采信'));
check('F3 侧车仍是分段数字（可人工核对，不进文档）',
  JSON.parse(readSide()).passed === 48 && JSON.parse(readSide()).scope === 'slice'
  && JSON.parse(readSide()).slice === '565/625');

console.log('\n[G] MCP 接线（AGENTS.md 约定 3：新能力要能在 MCP 上问到）');
const srcReg = fs.readFileSync(path.join(ROOT, 'src/mcp/tools-registry.js'), 'utf8');
const srcSrv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
check('G1 工具定义列出 testcount action',
  /heartflow_measure_numbers/.test(srcReg) && /testcount/.test(srcReg));
check('G2 handler 有 testcount 分支', /action === 'testcount'/.test(srcSrv));
check('G3 未知 action 提示含 testcount', /可用 runtime \/ static \/ all \/ check \/ testcount/.test(srcSrv));
check('G4 measure_numbers 工具定义仍只有一份（对象字面量后键覆盖前键，r36 踩过）',
  (srcReg.match(/name: 'heartflow_measure_numbers'/g) || []).length === 1);

// ── 收尾 ────────────────────────────────────────────────────────
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}

console.log('');
console.log(`第 743 轮分段记账隔离测试: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) process.exitCode = 1;
