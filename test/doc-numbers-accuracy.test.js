/**
 * 测试：对外文档数字必须可度量（v6.7.77，心虫 decision.decide 0.93）
 *
 * 来源：第 40 轮心虫选「核对并修正 AGENTS.md/README.md 对外文档数字」。
 *
 * 一、发现：AGENTS.md 违反了它自己的设计原则
 *
 * 该文件 Design principles 第 5 条明写：
 *   "Honest numbers — documentation must state what the code actually does.
 *    If a metric is claimed, it must be measurable."
 * 但同一份文件开头宣称：
 *   46 dimensions / 137 modules / 179 MCP tools / 1,546 dispatch routes
 * 实测（scripts/measure-claimed-numbers.js）：
 *   50 dimensions / 137 modules / 59 MCP tools / 1,727 dispatch routes
 *
 * 四个数字里三个错。且 BLOCK/REWRITE/VERIFY 三层的列举也过时：
 *   文档说 5 block / 7 rewrite / 24 verify，实际 9 / 9 / 26。
 *
 * 二、为什么这个 bug 能长期存在
 *
 * 文档数字是**手写常量**，没有任何测试校验它们。引擎每加一个维度
 * （本轮之前刚加了 indirect_injection、multi_turn_escalation、sealioning、
 *   tone_policing），文档就自动落后一点——但没有任何机制会发现。
 *
 * 三、本测试守什么
 *   从 AGENTS.md / README.md 抓关键数字，与代码实测值逐一比对。
 *   数字变化时必须同步改文档（或改代码），不能只改一边。
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[实测值采集]');

/** 与 scripts/measure-claimed-numbers.js 同一套口径 */
function measure() {
  const idx = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  const reg = fs.readFileSync(path.join(HF, 'src/mcp/tools-registry.js'), 'utf8');
  const srv = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');

  // [v6.7.126 第 286 轮] 维度数改为**运行时实测**，与
  // scripts/measure-claimed-numbers.js 同口径（v6.7.111 的修正）。
  // 旧口径数 index.js 顶层 `function check*` = 50，漏掉判别函数
  // 定义在外置模块的 7 个真维度（perfect_error / phishing_coercion /
  // induced_trust / coverup_induction / dangerous_instruction /
  // reward_hacking / premature_termination —— 定义在
  // src/premature-termination.js、src/manipulation-tactics.js 等）。
  // 它们各有 score + guidance，成员身份在 BLOCK_DIMS / VERIFY_DIMS 内，
  // 是独立维度。用旧口径的测试守着新口径产出的「50」，等于拿错尺子。
  const dr = cp.spawnSync('node', ['-e', `
    const {discriminate}=require('${path.join(HF, 'src/index.js')}');
    const d=discriminate('neutral baseline text');
    const k=Object.keys(d.dimensions||{});
    console.log(k.length);
  `], { encoding: 'utf8', timeout: 60000 });
  const dimsRuntime = parseInt((dr.stdout || '').trim().split('\n')[0], 10) || 0;

  // 静态口径仅作参考值保留（用于「哪些维度有专属顶层 check 函数」诊断）
  const checkFns = new Set();
  for (const m of idx.matchAll(/^function (check[A-Z]\w*)\s*\(/gm)) checkFns.add(m[1]);

  const tier = label => {
    const m = idx.match(new RegExp(`const ${label} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
    return m ? (m[1].match(/['"][a-z_]+['"]/g) || []).length : 0;
  };

  const tools = new Set();
  for (const m of reg.matchAll(/name:\s*['"](heartflow_[a-z0-9_]+)['"]/g)) tools.add(m[1]);

  const hStart = srv.indexOf('const HANDLERS');
  const hb = srv.slice(hStart, srv.indexOf('\n};', hStart));
  const handlerKeys = new Set();
  for (const m of hb.matchAll(/^\s{2}(heartflow_[a-z0-9_]+):/gm)) handlerKeys.add(m[1]);

  // 路由数是运行时值（static 只是种子）
  const r = cp.spawnSync('node', ['-e', `
    const {HeartFlow}=require('${path.join(HF, 'src/core/heartflow.js')}');
    const hf=new HeartFlow({dataDir:'${path.join(HF, 'data')}',silent:true});
    hf.start();
    setTimeout(()=>{ console.log(HeartFlow.ALLOWED_ROUTES.size); process.exit(0); }, 4000);
  `], { encoding: 'utf8', timeout: 60000 });
  const routes = parseInt((r.stdout || '').trim().split('\n').pop(), 10) || 0;

  // 测试数：读 run-all.js 每次跑完写下的 data/test-count.json。
  // [v6.7.87] 用例数：与 scripts/measure-claimed-numbers.js 保持同一口径。
  // [r408] 区分 null（未测量）与 0（合法测量值）—— doc-numbers 的规格表
  // 断言要精确比对 failing 数，而它最常见的真实值就是 0。
  let testCases = null;
  let testFailed = null;
  {
    const cf = path.join(HF, 'data/test-count.json');
    try {
      if (fs.existsSync(cf)) {
        const d = JSON.parse(fs.readFileSync(cf, 'utf8'));
        if (d.passed) {
          testCases = d.passed;
          testFailed = Number.isFinite(d.failed) ? d.failed : 0;
        }
      }
    } catch (_) { /* 无缓存 → null，下方断言按未测量处理 */ }
  }

  // [r407] 模块数运行时实测（与 sync-doc-numbers.js / measure-claimed-numbers.js
  // 同口径）。此前模块数只在 README/SKILL 规格表出现且**没有任何断言**——
  // 从 v6.7.69 的 137 一路腐化到实测 143 无人发现，40+ 个版本号没人记账。
  const mr = cp.spawnSync('node', ['-e', `
    const {HeartFlow}=require('${path.join(HF, 'src/core/heartflow.js')}');
    const hf=new HeartFlow({dataDir:'${path.join(HF, 'data')}',silent:true});
    hf.start();
    setTimeout(()=>{ console.log(Object.keys(hf._modules||{}).length); process.exit(0); }, 4000);
  `], { encoding: 'utf8', timeout: 60000 });
  const modules = parseInt((mr.stdout || '').trim().split('\n').pop(), 10) || 0;

  // 能力守护检查项数：读 guard-abilities.js 自己落盘的缓存（不跑那 105s 的脚本）
  // [r408] null（未测量）与 0（合法测量值，checks>0 但全挂）区分
  let capabilityChecks = null, capabilityPassed = null;
  {
    const cf = path.join(HF, 'data/capability-check-count.json');
    try {
      if (fs.existsSync(cf)) {
        const j = JSON.parse(fs.readFileSync(cf, 'utf8'));
        if (j.checks) { capabilityChecks = j.checks; capabilityPassed = j.passed; }
      }
    } catch (_) { /* 无缓存则 capability 断言自己跳过 */ }
  }

  return {
    // [v6.7.126 第 286 轮] 用运行时实测（discriminate dimensions 键）。
    // 旧值 checkFns.size 漏计 7 个外置模块维度，让三份文档少报。
    dimensions: dimsRuntime || checkFns.size,
    staticCheckFns: checkFns.size,
    block: tier('BLOCK_DIMS'),
    rewrite: tier('REWRITE_DIMS'),
    verify: tier('VERIFY_DIMS'),
    mcpTools: tools.size,
    handlers: handlerKeys.size,
    routes,
    tests: testCases,
    testFailed,
    modules,
    capabilityChecks,
    capabilityPassed,
  };
}

const M = measure();
console.log('  实测:', JSON.stringify(M));

console.log('\n[AGENTS.md 宣称值必须匹配]');

const AGENTS = path.join(HF, 'AGENTS.md');

t('维度总数匹配', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  const m = src.match(/(\d+)\s+dimensions/);
  assert.ok(m, 'AGENTS.md 找不到 dimensions 数字');
  assert.strictEqual(parseInt(m[1], 10), M.dimensions,
    `AGENTS.md 说 ${m[1]} dimensions，实测 ${M.dimensions}`);
});

console.log('\n[README.md 与 SKILL.md 宣称值必须匹配（v6.7.78 补充）]');

const README = path.join(HF, 'README.md');
const SKILL = path.join(HF, 'SKILL.md');

t('README.md 维度/工具/路由/测试数匹配', () => {
  // [v6.7.87] 只读 Version history 之前的正文。changelog 里的
  // "1,754 passing, 0 failing" 是 6.7.86 当时的真实事实，属历史记录，
  // 不该按当前宣称校验（否则每次测试数增长都会把旧记录判成"少报"）。
  let src = fs.readFileSync(README, 'utf8');
  const vh = src.indexOf('## Version history');
  if (vh > 0) src = src.slice(0, vh);
  const m = src.match(/(\d+)\s+discrimination dimensions\s*[×x]\s*(\d+)-layer pipeline\s*[×x]\s*(\d+)\s+modules\s*[×x]\s*([\d,]+)\s+MCP tools\s*[×x]\s*([\d,]+)\s+dispatch routes\s*[×x]\s*([\d,]+)\s+passing tests/);
  assert.ok(m, 'README.md 找不到数字横幅（格式可能变了）');
  assert.strictEqual(parseInt(m[1], 10), M.dimensions, `README 维度 ${m[1]} != ${M.dimensions}`);
  assert.strictEqual(parseInt(m[4].replace(/,/g, ''), 10), M.mcpTools, `README 工具 ${m[4]} != ${M.mcpTools}`);
  assert.strictEqual(parseInt(m[5].replace(/,/g, ''), 10), M.routes, `README 路由 ${m[5]} != ${M.routes}`);
  // [v6.7.87] 补校验第 6 个字段（测试数）——此前守卫只查前三个，
  // 横幅里的 "1,138 passing tests" 从未被比对过，于是从 1,138 一路
  // 胀到 1754 都没人发现。这是第 45 轮「横幅守卫查不到行内引用」
  // 的同一家族：守卫没覆盖横幅的每个字段。
  const testsClaimed = parseInt(m[6].replace(/,/g, ''), 10);
  assert.ok(testsClaimed >= M.tests,
    `README 测试数 ${testsClaimed} < 实际 ${M.tests}（宣称少于实际=少报）`);
  assert.ok(testsClaimed <= M.tests + 50,
    `README 测试数 ${testsClaimed} 远超实际 ${M.tests}（多报 ${testsClaimed - M.tests} 个）`);
  assert.strictEqual(testsClaimed, M.tests,
    `README 测试数 ${testsClaimed} != 实际 ${M.tests}（应完全一致）`);
});

t('README.md 行内 46→50 引用已更新', () => {
  const src = fs.readFileSync(README, 'utf8');
  // [v6.7.78] 只查**正文宣称**，不查 Version history 段落——那里
  // 引述历史错误数字是刻意的（"docs claimed stale metrics — 46 dimensions..."）。
  // 守卫误报过一次：changelog 刚补上历史说明就被这条断言拦下。
  const changelogStart = src.search(/##\s*Version history/i);
  const body = changelogStart > 0 ? src.slice(0, changelogStart) : src;
  assert.ok(!/46 dimensions/.test(body),
    'README.md 正文仍有过时的 "46 dimensions" 宣称');
});

t('SKILL.md 维度/工具数匹配', () => {
  const src = fs.readFileSync(SKILL, 'utf8');
  const m = src.match(/(\d+)\s+discrimination dimensions/);
  assert.ok(m, 'SKILL.md 找不到 dimensions 数字');
  assert.strictEqual(parseInt(m[1], 10), M.dimensions,
    `SKILL.md 说 ${m[1]} dimensions，实测 ${M.dimensions}`);
  const t = src.match(/([\d,]+)\s+MCP tools/);
  if (t) {
    assert.strictEqual(parseInt(t[1].replace(/,/g, ''), 10), M.mcpTools,
      `SKILL.md 说 ${t[1]} MCP tools，实测 ${M.mcpTools}`);
  }
});

t('SKILL.md 无过时 46 维度引用', () => {
  const src = fs.readFileSync(SKILL, 'utf8');
  // 同样排除 changelog 引述
  const sk = src.search(/##\s*(Version history|Changelog)/i);
  const body = sk > 0 ? src.slice(0, sk) : src;
  assert.ok(!/46 dimensions/.test(body), 'SKILL.md 正文仍有过时引用');
});

t('三个文档数字互相一致', () => {
  const a = fs.readFileSync(AGENTS, 'utf8').match(/(\d+)\s+dimensions/);
  const r = fs.readFileSync(README, 'utf8').match(/(\d+)\s+discrimination dimensions/);
  const s = fs.readFileSync(SKILL, 'utf8').match(/(\d+)\s+discrimination dimensions/);
  assert.strictEqual(a[1], r[1], `AGENTS(${a[1]}) 与 README(${r[1]}) 不一致`);
  assert.strictEqual(a[1], s[1], `AGENTS(${a[1]}) 与 SKILL(${s[1]}) 不一致`);
});

console.log('\n[行内引用不得残留旧数字（v6.7.80 补充）]');

t('三份文档正文无 "46 dimensions" 行内引用', () => {
  // 上轮只改了横幅与维度章节标题，漏了 `checkInput(text)` 描述行里的
  // "discriminate (46 dimensions)"。横幅守卫查不到行内引用。
  const bad = [];
  for (const f of [AGENTS, README, SKILL]) {
    if (!fs.existsSync(f)) continue;
    let src = fs.readFileSync(f, 'utf8');
    const cut = src.search(/##\s*(Version history|Changelog)/i);
    let body = cut > 0 ? src.slice(0, cut) : src;
    // [v6.7.80] 排除刻意保留的历史引述行（"previously claimed X" 之类）。
    // AGENTS.md 第 20 行自我介绍数字曾错，这是 Design principle #5 的
    // 反面教材，必须留。按行过滤，不删整段。
    body = body.split('\n').filter(l =>
      !/previously claimed|曾经声称|曾经宣称|旧版本声称|historically claimed/i.test(l)
    ).join('\n');
    if (/\b46\s*dimensions?\b/.test(body)) bad.push(path.basename(f));
  }
  assert.strictEqual(bad.length, 0, `这些文档正文仍有 "46 dimensions" 行内引用: ${bad.join(', ')}`);
});

t('三份文档正文无旧工具数/路由数引用', () => {
  const bad = [];
  for (const f of [AGENTS, README, SKILL]) {
    if (!fs.existsSync(f)) continue;
    let src = fs.readFileSync(f, 'utf8');
    const cut = src.search(/##\s*(Version history|Changelog)/i);
    let body = cut > 0 ? src.slice(0, cut) : src;
    body = body.split('\n').filter(l =>
      !/previously claimed|曾经声称|曾经宣称|旧版本声称|historically claimed/i.test(l)
    ).join('\n');
    if (/\b179\s*MCP tools\b/.test(body)) bad.push(path.basename(f) + '(179 tools)');
    if (/\b1,?546\s*dispatch routes\b/.test(body)) bad.push(path.basename(f) + '(1546 routes)');
    if (/\b547\s*passing tests\b/.test(body)) bad.push(path.basename(f) + '(547 tests)');
  }
  assert.strictEqual(bad.length, 0, `旧数字行内引用: ${bad.join(', ')}`);
});

t('MCP 工具数匹配', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  const m = src.match(/([\d,]+)\s+MCP tools/);
  assert.ok(m, 'AGENTS.md 找不到 MCP tools 数字');
  const claimed = parseInt(m[1].replace(/,/g, ''), 10);
  assert.strictEqual(claimed, M.mcpTools,
    `AGENTS.md 说 ${claimed} MCP tools，实测 ${M.mcpTools}`);
});

t('路由数匹配', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  const m = src.match(/([\d,]+)\s+dispatch\s+routes/);
  assert.ok(m, 'AGENTS.md 找不到 dispatch routes 数字');
  const claimed = parseInt(m[1].replace(/,/g, ''), 10);
  assert.strictEqual(claimed, M.routes,
    `AGENTS.md 说 ${claimed} routes，实测 ${M.routes}`);
});

// [r407] 以下 4 条守「Verified metrics」规格表 —— r407 之前**整块无守卫**，
// README/SKILL 的规格表从 v6.7.69 起就没有更新过：modules 137（实 143）、
// dimensions 46（实 57）、tests 547（实 17,341）、capability 18/18（实 20/20）。
// 腐化了 40+ 个版本号无人发现，因为所有守卫都只查横幅和维度章节。

t('模块数匹配（AGENTS.md 横幅）', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  const m = src.match(/(\d+)\s+dimensions,\s*(\d+)\s+modules/);
  assert.ok(m, 'AGENTS.md 找不到 modules 数字');
  const claimed = parseInt(m[2], 10);
  assert.strictEqual(claimed, M.modules,
    `AGENTS.md 说 ${claimed} modules，实测 ${M.modules}`);
});

for (const [label, fp] of [['README.md', README], ['SKILL.md', SKILL]]) {
  t(`${label} 规格表：模块数 / 维度数 / 测试数 / 能力守护项数`, () => {
    const src = fs.readFileSync(fp, 'utf8');
    const rows = {};
    for (const line of src.split('\n')) {
      const m = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|/);
      if (m) rows[m[1]] = m[2];
    }
    // 模块数
    if (rows['Modules registered'] !== undefined) {
      assert.strictEqual(parseInt(rows['Modules registered'], 10), M.modules,
        `${label} 规格表 Modules registered = ${rows['Modules registered']}，实测 ${M.modules}`);
    }
    // 维度数
    if (rows['Discrimination dimensions'] !== undefined) {
      assert.strictEqual(parseInt(rows['Discrimination dimensions'], 10), M.dimensions,
        `${label} 规格表 Discrimination dimensions = ${rows['Discrimination dimensions']}，实测 ${M.dimensions}`);
    }
    // 测试数
    // [r408] 未测量（null）时跳过比对，但**必须有一条明确提示**——否则
    // 「没跑过 run-all」会被静默当成「通过」，正是 r407 腐化的同款机制。
    if (rows['Test suite'] !== undefined) {
      const mm = rows['Test suite'].match(/([\d,]+)\s+passing\s*\/\s*(\d+)\s+failing/);
      assert.ok(mm, `${label} 规格表 Test suite 行格式无法解析：${rows['Test suite']}`);
      if (M.tests == null) {
        throw new Error(`${label} 规格表 Test suite = ${rows['Test suite']}，但本机没有 data/test-count.json 实测缓存（先跑 node test/run-all.js）`);
      }
      assert.strictEqual(parseInt(mm[1].replace(/,/g, ''), 10), M.tests,
        `${label} 规格表 Test suite = ${rows['Test suite']}，实测 ${M.tests} passing / ${M.testFailed} failing`);
      assert.strictEqual(parseInt(mm[2], 10), M.testFailed,
        `${label} 规格表 failing = ${mm[2]}，实测 ${M.testFailed}`);
    }
    // 能力守护项数（未测量 null 时跳过，不当成失败；0 是合法测量值要真比）
    if (M.capabilityChecks != null && rows['Capability guard'] !== undefined) {
      const mm = rows['Capability guard'].match(/(\d+)\s*\/\s*(\d+)\s*checks/);
      if (mm) {
        assert.strictEqual(parseInt(mm[1], 10), M.capabilityPassed,
          `${label} 规格表 Capability guard = ${rows['Capability guard']}，实测 ${M.capabilityPassed}/${M.capabilityChecks}`);
        assert.strictEqual(parseInt(mm[2], 10), M.capabilityChecks,
          `${label} 规格表 Capability guard 总数 = ${mm[2]}，实测 ${M.capabilityChecks}`);
      }
    }
  });
}

t('README 规格表口径版本戳为当前 VERSION', () => {
  const ver = fs.readFileSync(path.join(HF, 'VERSION'), 'utf8').trim();
  const src = fs.readFileSync(README, 'utf8');
  const vh = src.indexOf('## Version history');
  const live = vh > 0 ? src.slice(0, vh) : src;
  assert.ok(live.includes(`at **v${ver}**`),
    `README 规格表口径戳仍是旧版本，应为 at **v${ver}**（数字是现在量的，戳必须写现在）`);
});

t('SKILL 规格表口径版本戳为当前 VERSION', () => {
  const ver = fs.readFileSync(path.join(HF, 'VERSION'), 'utf8').trim();
  const src = fs.readFileSync(SKILL, 'utf8');
  assert.ok(src.includes(`at v${ver}.`) || src.includes(`| Engine version | ${ver} |`),
    `SKILL 规格表口径戳仍是旧版本，应为 at v${ver}.`);
});

t('SKILL action-tier 计数与三个集合一致', () => {
  const src = fs.readFileSync(SKILL, 'utf8');
  const b = src.match(/\*\*(\d+)\s+can\s+`block`\*\*/);
  const r = src.match(/\*\*(\d+)\s+can\s+force/);
  const v = src.match(/\*\*(\d+)\s+request\s+`verify`\*\*/);
  assert.ok(b && r && v, 'SKILL.md 找不到 action-tier 计数三兄弟');
  assert.strictEqual(parseInt(b[1], 10), M.block, `SKILL block 计数 ${b[1]} != BLOCK_DIMS ${M.block}`);
  assert.strictEqual(parseInt(r[1], 10), M.rewrite, `SKILL rewrite 计数 ${r[1]} != REWRITE_DIMS ${M.rewrite}`);
  assert.strictEqual(parseInt(v[1], 10), M.verify, `SKILL verify 计数 ${v[1]} != VERIFY_DIMS ${M.verify}`);
});

t('Block 层列举数与 BLOCK_DIMS 一致', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  const m = src.match(/Block-level\s*\((\d+)\)/);
  assert.ok(m, 'AGENTS.md 找不到 Block-level 计数');
  assert.strictEqual(parseInt(m[1], 10), M.block,
    `文档说 ${m[1]} 个 block 维度，实测 BLOCK_DIMS = ${M.block}`);
});

t('Rewrite 层列举数与 REWRITE_DIMS 一致', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  const m = src.match(/Rewrite-level\s*\((\d+)\)/);
  assert.ok(m, 'AGENTS.md 找不到 Rewrite-level 计数');
  assert.strictEqual(parseInt(m[1], 10), M.rewrite,
    `文档说 ${m[1]} 个 rewrite 维度，实测 REWRITE_DIMS = ${M.rewrite}`);
});

t('Verify 层列举数与 VERIFY_DIMS 一致', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  const m = src.match(/Verify-level\s*\((\d+)\)/);
  assert.ok(m, 'AGENTS.md 找不到 Verify-level 计数');
  assert.strictEqual(parseInt(m[1], 10), M.verify,
    `文档说 ${m[1]} 个 verify 维度，实测 VERIFY_DIMS = ${M.verify}`);
});

t('新增维度已写进文档列举（indirect_injection / multi_turn_escalation）', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  for (const d of ['indirect_injection', 'multi_turn_escalation']) {
    assert.ok(src.includes(d),
      `文档维度列举缺 ${d}——引擎已支持但对外文档没写`);
  }
});

t('README changelog 覆盖当前版本（v6.7.87 补充）', () => {
  // [v6.7.87] changelog 停在 6.7.77 期间，git 已前进 8 个版本号。
  // 数字类守卫查不到这类腐化（它不管 changelog），需单独守。
  // 口径：README 的 Version history 必须出现当前 VERSION 号。
  // 用 includes 而非 new RegExp——动态正则的转义层在本仓库已咬过三次
  // （v6.7.83 的 \\b、v6.7.84 的 calledInBody、本轮初版）。
  const ver = fs.readFileSync(path.join(HF, 'VERSION'), 'utf8').trim();
  const src = fs.readFileSync(README, 'utf8');
  const vStart = src.indexOf('## Version history');
  assert.ok(vStart > 0, 'README 找不到 Version history 章节');
  const hist = src.slice(vStart);
  assert.ok(hist.includes('| ' + ver + ' |') || hist.includes('|' + ver + '|'),
    `README Version history 缺少当前版本 ${ver} 的记录——changelog 落后了`);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
