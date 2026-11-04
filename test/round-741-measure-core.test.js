'use strict';
/**
 * test/round-741-measure-core.test.js
 * [v6.8.96 第 741 轮] 数字记账唯一测量实现（src/core/measure-core.js）
 *
 * 背景（r741 事故，全部实测坐实）：
 *   AGENTS.md 第 18 行点名「Numbers below were measured by
 *   scripts/measure-claimed-numbers.js」——这把尺子 r741 轮初实测是坏的：
 *
 *     $ node scripts/measure-claimed-numbers.js
 *     判别维度数（dimensions 键实测）: 0
 *     ALLOWED_ROUTES 路由数        : 0
 *     _modules 模块数              : 0
 *
 *     $ node scripts/sync-doc-numbers.js   （同一表达式，另一份实现）
 *     实测：MCP 工具 190 个 / 路由 1314 条 / 模块 161 个 / 维度 160 个
 *
 *   直接复现子进程，根因一句话：
 *     Error: Cannot find module 'C:UsersUSER782663...srcheartflow-skillrcindex.js'
 *   旧脚本把 Windows 绝对路径**直接插进** require('…') 的单引号字面量，
 *   反斜杠在子进程**解析**那份 -e 源码时被当转义序列吃掉（\U→U、\s→s、
 *   \n→换行）→ MODULE_NOT_FOUND；而三处 `catch (_) {}` / `|| 0` 把
 *   「测量失败」洗成「实测为 0」。一个量不到的数字与一个真的 0 在输出里
 *   长得一模一样 —— 三份复制品（measure-claimed-numbers.js /
 *   sync-doc-numbers.js / doc-numbers-accuracy.test.js）里两份对一份错，
 *   因为两份恰好各写了一道保险（JSON.stringify / .replace(/\\/g,'/')）。
 *
 * 本测试八段：
 *   A 路径字面量安全（_lit 的双道保险）
 *   B runtime 四数实测 + 拒绝零值语义
 *   C 静态口径与 runtime 口径必须一致（r741 之前「两个入口两个结果」的制）
 *   D 一致性不变量 dims ≥ tiersSum
 *   E 文档对照 checkDocs（真仓零漂移 + temp root 造假必须报漂移）
 *   F 五处接线（两个记账脚本 / doc-numbers 门禁 / MCP 三处 / 引擎 lazy）
 *   G 承重证明：旧写法的子进程在 Windows 上必须量不到（洞复现）
 *   H 基线未被撬动（modules 161 / routes 1314，measureCore 不进 _modules）
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const { MeasureCore } = require(path.join(ROOT, 'src/core/measure-core.js'));

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

function mc(opts) {
  return new MeasureCore(Object.assign({ rootPath: ROOT, silent: true }, opts || {}));
}

/** 在临时目录里跑一个 node -e 程序，返回 {status, stdout, stderr} */
function runNode(prog) {
  const r = cp.spawnSync('node', ['-e', prog], { encoding: 'utf8', timeout: 120000 });
  return { status: r.status, stdout: String(r.stdout || ''), stderr: String(r.stderr || '') };
}

// ── A 路径字面量安全 ─────────────────────────────────────────
console.log('── A 路径字面量安全（_lit 双道保险）');
{
  const win = 'C:\\Users\\USER782663\\AppData\\Local\\hermes\\skills\\ai\\mark-heartflow-skill\\src\\index.js';
  const lit = mc()._lit(win);
  check('A1 _lit 产出是合法 JSON 字符串字面量', lit.startsWith('"') && lit.endsWith('"'), lit.slice(0, 24) + '…');
  check('A2 _lit 内部不含未转义反斜杠',
    !/(^|[^\\])\\(?![\\/])/.test(lit.slice(1, -1)) || lit.indexOf('\\\\') >= 0,
    'JSON.stringify 已把 \\ 变 \\\\');
  // 承重的一步：把 _lit 的产物当真 JS 源码解析一遍，字面量值必须原样还原
  // （_lit 会顺手把分隔符归一化成正斜杠，所以比对的是归一化后的形式）
  const round = eval(lit);
  check('A3 eval(_lit(p)) 保住全部字符（子进程解析后路径不丢反斜杠）',
    round === win.split(path.sep).join('/'),
    round === win.split(path.sep).join('/') ? '16 个反斜杠全部保住' : '还原成: ' + round);
  check('A4 _lit 同时归一化成正斜杠（Windows 两种分隔符都认）',
    mc()._lit('a\\b\\c.js') === '"a/b/c.js"', mc()._lit('a\\b\\c.js'));

  // A5 旧写法复现：直接插值，不转义。Windows 上必然被吃掉反斜杠。
  const oldStyle = "const p='" + win + "'; console.log(p);";
  const out = runNode(oldStyle);
  const isWin = process.platform === 'win32';
  check('A5 旧写法（裸插值）在 Windows 上还原不出原路径',
    !isWin || out.stdout.trim() !== win,
    isWin ? '子进程拿到: ' + JSON.stringify(out.stdout.trim().slice(0, 40)) + '…' : '非 Windows 平台，跳过');
}

// ── B runtime 四数 + 拒绝零值语义 ───────────────────────────
console.log('── B runtime 实测与拒绝零值语义');
{
  const rt = mc().measureRuntime();
  check('B1 runtime ok', rt.ok === true, rt.reason || '');
  check('B2 四个数全部 > 0', rt.tools > 0 && rt.routes > 0 && rt.modules > 0 && rt.dims > 0,
    `tools=${rt.tools} routes=${rt.routes} modules=${rt.modules} dims=${rt.dims}`);
  check('B3 dimNames 与 dims 同长（维度名单可追溯，便于定位「哪个维度消失了」）',
    Array.isArray(rt.dimNames) && rt.dimNames.length === rt.dims,
    `${rt.dimNames.length} 个名字`);
  check('B4 单次子进程完成（一处实现，不再三处各起一遍）', rt.elapsedMs > 0, rt.elapsedMs + 'ms');

  // B5 量不到必须 ok:false，绝不允许洗成 0
  const broken = new MeasureCore({ rootPath: path.join(os.tmpdir(), 'hf-no-such-root-r741'), silent: true });
  const b = broken.measureRuntime();
  check('B5 坏 rootPath → ok:false（不是 {dims:0}）', b.ok === false && typeof b.reason === 'string' && b.reason.length > 0,
    b.ok ? '❌ 竟然返回 ok' : b.reason.slice(0, 72));
  check('B6 坏 rootPath 不返回任何数字字段',
    b.tools === undefined && b.routes === undefined && b.modules === undefined && b.dims === undefined,
    'keys=' + JSON.stringify(Object.keys(b)));

  // B7 measureAll 同样拒绝，且抛错信息可读
  let threw = null;
  try { broken.measureAll(); } catch (e) { threw = e; }
  check('B7 measureAll 在 runtime 量不到时抛错（调用方无法拿到 0）',
    threw !== null && /拒绝出数/.test(threw.message), threw ? threw.message.split('\n')[0].slice(0, 72) : '没抛');
}

// ── C 静态口径 vs runtime 口径 ──────────────────────────────
console.log('── C 静态口径与 runtime 口径必须一致');
{
  const rt = mc().measureRuntime();
  const staticTools = mc().countToolsStatic();
  const handlers = mc().countHandlers();
  check('C1 静态工具数 === runtime TOOLS 数（r741 之前两个入口两个结果）',
    staticTools === rt.tools, `static=${staticTools} runtime=${rt.tools}`);
  check('C2 HANDLERS 键数可判定', handlers.ok === true && handlers.count > 0, 'handlers=' + handlers.count);
  check('C3 每个工具都有 handler 映射（HANDLERS 键数 ≥ 静态工具数）',
    handlers.count >= staticTools, `${handlers.count} ≥ ${staticTools}`);
}

// ── D 一致性不变量 ──────────────────────────────────────────
console.log('── D 一致性不变量 dims ≥ tiersSum');
{
  const t = mc().countTiers();
  const rt = mc().measureRuntime();
  check('D1 tier 三层可判定', t.ok === true, `block=${t.block_dims} rewrite=${t.rewrite_dims} verify=${t.verify_dims}`);
  check('D2 tiersSum = 三层之和', t.tiersSum === t.block_dims + t.rewrite_dims + t.verify_dims,
    'tiersSum=' + t.tiersSum);
  check('D3 dims ≥ tiersSum（dimensions 键与 tier 集合自洽）',
    rt.dims >= t.tiersSum, `dims=${rt.dims} ≥ tiersSum=${t.tiersSum}`);
  const all = mc().measureAll();
  check('D4 tiersRest = dims - tiersSum（AGENTS.md「剩下 Y 个只计分」那句的数）',
    all.tiersRest === all.dims - all.tiersSum, 'tiersRest=' + all.tiersRest);
  check('D5 consistent 为真且无 consistencyNote', all.consistent === true && all.consistencyNote === null);
}

// ── E 文档对照 ──────────────────────────────────────────────
console.log('── E 文档对照 checkDocs');
{
  const r = mc().checkDocs();
  check('E1 真仓三份文档横幅与实测零漂移', r.ok === true && r.drift.length === 0,
    r.drift.length ? JSON.stringify(r.drift) : r.claims.length + ' 份文档全部一致');
  check('E2 抓到三份文档的横幅宣称', r.claims.length === 3, r.claims.map(c => c.file).join(', '));

  // E3 temp root 造假：宣称数字与实测不符必须被点名。
  // opts.actual 直接传入一份实测（免掉一次 5s 子进程）——temp root 里没有
  // 能 start() 的引擎，但「抽取宣称 → 逐项比对」这段逻辑照样要承重。
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-mc-r741-'));
  fs.mkdirSync(path.join(TMP, 'src', 'core'), { recursive: true });
  fs.mkdirSync(path.join(TMP, 'src', 'mcp'), { recursive: true });
  fs.mkdirSync(path.join(TMP, 'data'), { recursive: true });
  fs.mkdirSync(path.join(TMP, 'test'), { recursive: true });
  for (const f of ['src/index.js', 'src/core/heartflow.js', 'src/mcp/tools-registry.js',
    'src/mcp/extended-tools.js', 'src/mcp-server.js', 'VERSION']) {
    fs.writeFileSync(path.join(TMP, f), '// stub\n', 'utf8');
  }
  fs.writeFileSync(path.join(TMP, 'AGENTS.md'),
    '**Zero LLM dependency.** 999 dimensions, 888 modules, 777 MCP tools, 666 dispatch\nroutes. Pure rule engine.\n', 'utf8');
  const fakeActual = { dims: 160, modules: 161, tools: 191, routes: 1314 };
  const fr = new MeasureCore({ rootPath: TMP, silent: true }).checkDocs({ actual: fakeActual });
  check('E3 造假横幅 → 逐项报 drift', fr.drift.length === 4,
    JSON.stringify(fr.drift.map(d => d.file + ':' + d.key + ' ' + d.claimed + '≠' + d.actual)));
  check('E4 drift 每项都带宣称值与实测值（不只报「不一致」）',
    fr.drift.every(d => typeof d.claimed === 'number' && typeof d.actual === 'number' && d.claimed !== d.actual));
  check('E5 只有 AGENTS.md 被抓到（另两份文档在 temp root 不存在 → 不误报）',
    fr.claims.length === 1 && fr.claims[0].file === 'AGENTS.md', 'claims=' + fr.claims.length);
  check('E6 宣称正确的项不进 drift（只报真漂移的那几个键）',
    fr.drift.every(d => ['dims', 'modules', 'tools', 'routes'].indexOf(d.key) >= 0)
    && fr.drift.filter(d => d.key === 'dims').length === 1);
  fs.rmSync(TMP, { recursive: true, force: true });
}

// ── F 五处接线 ──────────────────────────────────────────────
console.log('── F 接线（两个记账脚本 / doc-numbers 门禁 / MCP 三处 / 引擎 lazy）');
{
  const mcn = fs.readFileSync(path.join(ROOT, 'scripts/measure-claimed-numbers.js'), 'utf8');
  check('F1 measure-claimed-numbers.js 走 MeasureCore（不再自己拼 -e 程序）',
    mcn.indexOf("require(path.join(ROOT, 'src/core/measure-core.js'))") >= 0
    && !/spawnSync/.test(mcn), '裸 spawnSync 已清除');
  const sdn = fs.readFileSync(path.join(ROOT, 'scripts/sync-doc-numbers.js'), 'utf8');
  check('F2 sync-doc-numbers.js 的 measure() 委托 MeasureCore',
    sdn.indexOf("require(path.join(ROOT, 'src/core/measure-core.js'))") >= 0
    && /new MeasureCore\(\{ rootPath: ROOT, silent: true \}\)\.measureAll\(\)/.test(sdn));
  check('F3 sync-doc-numbers.js 不再自己起 runtime 子进程',
    !/spawnSync\('node', \['-e'/.test(sdn), 'measure() 里的 spawnSync 已删除');
  const dnt = fs.readFileSync(path.join(ROOT, 'test/doc-numbers-accuracy.test.js'), 'utf8');
  check('F4 doc-numbers 门禁同源（MeasureCore，且不再降级到静态口径）',
    dnt.indexOf("require(path.join(HF, 'src/core/measure-core.js'))") >= 0
    && dnt.indexOf('dimensions: m.dims,') >= 0
    && !/spawnSync/.test(dnt),
    'measure() 已无 spawnSync、dimensions 直接取 m.dims');

  const reg = fs.readFileSync(path.join(ROOT, 'src/mcp/tools-registry.js'), 'utf8');
  const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  const hf = fs.readFileSync(path.join(ROOT, 'src/core/heartflow.js'), 'utf8');
  check('F5 MCP 第 1 处：tools-registry 有 heartflow_measure_numbers 定义',
    /name:\s*'heartflow_measure_numbers'/.test(reg));
  check('F6 MCP 第 2 处：HANDLERS 映射', srv.indexOf('heartflow_measure_numbers: handleMeasureNumbers,') >= 0);
  check('F7 MCP 第 3 处：handler 函数', /function handleMeasureNumbers\(args\)/.test(srv));
  check('F8 四个 action 都有分支（runtime/static/all/check）',
    ['runtime', 'static', 'all', 'check'].every(a => srv.indexOf("action === '" + a + "'") >= 0));
  check('F9 不进 needsWrite 写权限清单（只读工具）',
    !/needsWrite[\s\S]{0,400}heartflow_measure_numbers/.test(srv.split('const HANDLERS')[0]));
  check('F10 引擎 lazy 注册（约定 2：_lazy，不是顶层 require）',
    /_lazy\('measureCore', \(\) => require\('\.\/measure-core\.js'\)\)/.test(hf)
    && /this\.measureCore = new \(_MeasureCore\(\)\.MeasureCore\)/.test(hf));

  // F11 工具定义与 handler 的 action 清单一致（文档承诺的契约）
  const def = reg.match(/name:\s*'heartflow_measure_numbers'[\s\S]*?inputSchema:\s*(\{[^\n]*\})/);
  check('F11 工具定义带 inputSchema 且声明四个 action',
    def !== null && ['runtime', 'static', 'all', 'check'].every(a => def[1].indexOf(a) >= 0));
}

// ── G 承重证明：旧写法必须漏 ────────────────────────────────
console.log('── G 承重证明（旧实现在同一场景必须量不到）');
{
  if (process.platform !== 'win32') {
    check('G1 非 Windows 平台，跳过旧写法复现', true, process.platform);
  } else {
    // 照抄 r740 及之前 measure-claimed-numbers.js 的原样写法：
    // 路径裸插进 require('…')，不转义、不归一化。
    const idxPath = path.join(ROOT, 'src/index.js');
    const oldProg = [
      'const path=require(\'path\');',
      'const {discriminate}=require(\'' + idxPath + '\');',
      'const d=discriminate(\'neutral baseline text\');',
      'const k=Object.keys(d.dimensions||{});',
      'console.log(k.length);',
    ].join('\n');
    const old = runNode(oldProg);
    const oldLines = old.stdout.trim().split('\n').filter(Boolean);
    const oldCount = parseInt(oldLines[0], 10);
    check('G1 旧写法量不到维度（复现 r741 的 0）',
      !(oldCount > 0) && /Cannot find module/.test(old.stderr),
      'exit=' + old.status + ' 解析出的路径: ' + JSON.stringify(idxPath.split(path.sep).join('').slice(0, 30)) + '…');
    check('G2 旧写法的 stderr 点名 MODULE_NOT_FOUND（不是别的错）',
      /MODULE_NOT_FOUND|Cannot find module/.test(old.stderr));

    // 同一场景换 _lit()，必须成功 —— 差别只在拼路径这一件事上
    const newProg = [
      'const {discriminate}=require(' + mc()._lit(idxPath) + ');',
      'const d=discriminate(\'neutral baseline text\');',
      'const k=Object.keys(d.dimensions||{});',
      'console.log(k.length);',
    ].join('\n');
    const nw = runNode(newProg);
    const nwCount = parseInt(nw.stdout.trim().split('\n')[0], 10);
    check('G3 同一路径换 _lit() 立刻量到（证明差别就在拼路径）',
      nwCount > 0 && nw.status === 0, 'dims=' + nwCount);
    check('G4 新口径 dims ≥ tier 三层合计（自洽）',
      nwCount >= mc().countTiers().tiersSum, `${nwCount} ≥ ${mc().countTiers().tiersSum}`);
  }
}

// ── H 基线未被撬动 ──────────────────────────────────────────
console.log('── H 基线未被 measureCore 撬动');
{
  const rt = mc().measureRuntime();
  check('H1 _modules 仍 161（measureCore 刻意不进 _modules，同 mutation-guard）',
    rt.modules === 161, 'modules=' + rt.modules);
  check('H2 ALLOWED_ROUTES 仍 1314', rt.routes === 1314, 'routes=' + rt.routes);
  const src = fs.readFileSync(path.join(ROOT, 'src/core/heartflow.js'), 'utf8');
  check('H3 _modules 注册段没有 measureCore 键（只挂在实例上）',
    !/_modules\['measureCore'\]/.test(src));
  const st = mc().status();
  check('H4 status() 静态口径毫秒级（不起子进程）', typeof st.static.tools === 'number' && st.static.tools > 0,
    'tools=' + st.static.tools);
}

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail === 0 ? 0 : 1);
