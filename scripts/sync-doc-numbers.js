#!/usr/bin/env node
/**
 * 对外文档数字自动记账 [v6.7.133 第 314 轮；v6.7.126 第 103 轮大规模扩展]
 *
 * 为什么写它（结构性死锁，与 v6.7.126 第 286 轮 sync-doc-dimensions.js 同家族）：
 *   工具数由 tools-registry.js 的 TOOLS 数组决定（机器），路由数由
 *   generateAllowedRoutes(_modules) 在 start() 时动态生成（机器），
 *   而 AGENTS.md / README.md / SKILL.md 三处宣称写在 prompt 的
 *   硬边界「不写这三份文档」里（人不许改）。于是 r312 新增
 *   heartflow_knowledge_layer 后，实测 60→61、1,761→1,770，
 *   三份文档无人能改 —— 第 313 轮首次报 4 个 doc-numbers 失败，
 *   且 finish 每轮都会再报一次，直到有人有权改却改不了。
 *
 *   机器能判定的记账必须由机器做，不占 LLM 迭代预算。
 *
 * [v6.7.126 第 103 轮] 扩展记账范围：路由数之外，模块数 / 维度数 /
 *   action-tier 计数 / 测试数 / 口径版本戳同样全部机器可判定。
 *   触发实证：r402 修 generateAllowedRoutes 后路由从 1,865 真实降到
 *   1,136，此后 5 轮没有任何机制跑 sync-doc-numbers.js，doc-numbers
 *   守卫每轮报红但脚本躺着没人调（finish 只自动同步 README 测试数）。
 *   同时 README/SKILL 的「Verified metrics」规格表从 v6.7.69 起就
 *   没更新过：modules 137（实 143）、dimensions 46（实 57）、
 *   tests 547（实 17,341）、SKILL 的 tier 计数 5/7/24（实 10/10/26）。
 *   规格表整块没有守卫，腐化了 40+ 个版本号无人发现。
 *
 * 口径：与 scripts/measure-claimed-numbers.js / test/doc-numbers-accuracy.test.js
 *   保持同源——全部运行时实测，量不到就拒绝记账（宁可不改也不猜）。
 *   · 工具数 = TOOLS 数组 name 去重计数
 *   · 路由数 = HeartFlow.ALLOWED_ROUTES.size（运行时，start() 之后）
 *   · 模块数 = Object.keys(hf._modules).length（start() 之后）
 *   · 维度数 = discriminate('...').dimensions 键数
 *   · tier 计数 = BLOCK_DIMS / REWRITE_DIMS / VERIFY_DIMS 集合大小
 *   · 测试数 = data/test-count.json（run-all.js 每次跑完写下的实测缓存）
 *   · 口径版本戳 = VERSION（记账时刻的引擎版本）
 *
 * 用法：
 *   node scripts/sync-doc-numbers.js          # 同步
 *   node scripts/sync-doc-numbers.js --check  # 只查不改（不一致时退出码 1）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');

/** 运行时实测全部数字（唯一真相，量不到就拒绝记账） */
function measure() {
  // 一次子进程同时量 工具/路由/模块/维度/tier —— 共享 4 秒的 start() 启动成本
  const r = cp.spawnSync('node', ['-e', [
    "const {HeartFlow}=require(" + JSON.stringify(path.join(ROOT, 'src/core/heartflow.js')) + ");",
    "const hf=new HeartFlow({dataDir:" + JSON.stringify(path.join(ROOT, 'data')) + ",silent:true});",
    "hf.start();",
    "setTimeout(()=>{",
    "  const reg=require(" + JSON.stringify(path.join(ROOT, 'src/mcp/tools-registry.js')) + ");",
    "  const {discriminate}=require(" + JSON.stringify(path.join(ROOT, 'src/index.js')) + ");",
    "  const dk=Object.keys(discriminate('neutral baseline text').dimensions||{});",
    "  console.log(JSON.stringify({",
    "    tools:new Set(reg.TOOLS.map(x=>x.name)).size,",
    "    routes:HeartFlow.ALLOWED_ROUTES.size,",
    "    modules:Object.keys(hf._modules||{}).length,",
    "    dims:dk.length,",
    "  }));",
    "  process.exit(0)},",
    "4000);",
  ].join('\n')], { encoding: 'utf8', timeout: 120000 });
  let d = null;
  for (const line of (r.stdout || '').split('\n')) {
    const i = line.indexOf('{"tools":');
    if (i >= 0) { try { d = JSON.parse(line.slice(i)); } catch (_) { /* 继续找下一行 */ } }
  }
  if (!d || !d.tools || !d.routes || !d.modules || !d.dims) {
    throw new Error('ALLOWED_ROUTES / TOOLS / _modules / dimensions 未返回，拒绝记账——宁可不改也不猜');
  }

  // tier 计数（BLOCK/REWRITE/VERIFY 集合大小，静态源码可判定）
  const idx = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  const cnt = label => {
    const m = idx.match(new RegExp(`const ${label} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
    if (!m) return 0;
    return m[1].match(/['"][a-z_]+['"]/g)?.length || 0;
  };
  // 一次算清三层，供 return / tiersSum / tiersRest 共用（避免同一计数被
  // 三个常量各写一遍、改一处漏两处）
  const tierBlock = cnt('BLOCK_DIMS');
  const tierRewrite = cnt('REWRITE_DIMS');
  const tierVerify = cnt('VERIFY_DIMS');

  // 测试数：读 run-all.js 每次跑完写下的 data/test-count.json 实测缓存
  // [r408 修正] `null` = 未测量（缓存不存在/无 passed），`0` = 合法测量值。
  // 此前两者混同为 falsy，加上下方防呆也用 falsy 判断，导致「失败数 = 0」
  // 这种最常见的真实值永远记不上账 —— r407 引入后实测规格表停在历史的
  // "2 failing"，doc-numbers 从 21/21 掉到 18/21，每跑一次 run-all 就红。
  let tests = null, testsFailed = null;
  try {
    const cf = path.join(ROOT, 'data/test-count.json');
    if (fs.existsSync(cf)) {
      const j = JSON.parse(fs.readFileSync(cf, 'utf8'));
      // passed 为 0/缺失说明 run-all 没真正跑过，两个数字都算未测量
      if (j.passed) {
        tests = j.passed;
        testsFailed = Number.isFinite(j.failed) ? j.failed : 0;
      }
    }
  } catch (_) { /* 无缓存就是 null，调用方按「未测量」跳过记账 */ }

  // 能力守护检查项数：读 data/capability-check-count.json（由 guard-abilities.js
  // 自己写）。本脚本不跑 guard-abilities —— 实测 105s 且会超时，不能进记账链路。
  // [r408] 同样区分 null（未测量）与 0：缓存不存在 / checks 为 0（空壳）都算未测量，
  // 缓存存在且 checks>0 时 passed 即使是 0 也是合法测量值。
  let capabilityChecks = null, capabilityPassed = null;
  try {
    const cf = path.join(ROOT, 'data', 'capability-check-count.json');
    if (fs.existsSync(cf)) {
      const j = JSON.parse(fs.readFileSync(cf, 'utf8'));
      if (j.checks) { capabilityChecks = j.checks; capabilityPassed = j.passed; }
    }
  } catch (_) { /* 无缓存则该目标不记账 */ }

  const stamp = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();

  // [r557 补齐] tier 合计与「计分但不强制 action」的剩余维度数。
  // AGENTS.md 的说明句写「三层合计 X；剩下 Y 个只计分」——这两个数字
  // 此前不在 TARGETS 里（-check 与 doc-numbers 都不查），加到 TARGETS 后
  // 必须由这里供给，否则 measure() 不返回 → 按「未测量」跳过记账。
  // 合计 = 三层集合大小之和；剩余 = 总维度数 - 合计。
  const tiersSum = tierBlock + tierRewrite + tierVerify;
  const tiersRest = d.dims - tiersSum;

  return { tools: d.tools, routes: d.routes, modules: d.modules, dims: d.dims,
    block: tierBlock, rewrite: tierRewrite, verify: tierVerify,
    tiersSum, tiersRest,
    tests, testsFailed, capabilityChecks, capabilityPassed, stamp };
}

/**
 * 每个数字要同步的文档位置。
 * 每条 = 精确上下文锚点 + 目标数字组（**必须且只能有 3 个捕获组**：
 * pre / 数字 / post —— syncFile 的回调按这个形状拼接）。
 * 只列真实出现过的形状；历史记录区（README Version history、AGENTS 的
 * 「previously claimed」）是当时的事实，不在这份清单里。
 */
const TARGETS = [
  // ── 工具数 ──
  // AGENTS.md 横幅：... 60 MCP tools, 1,761 dispatch routes.
  // 注意：工具数与路由数在同一行但**分两个捕获组**，合成一条正则会把
  // 两个数字一起替换掉（曾把 1,761 一起改成 1,770 的格式串），
  // 所以 AGENTS 侧工具数与路由数必须各自独立锚定，不共用一个 pattern。
  {
    num: 'tools',
    re: /(\*\*Zero LLM dependency\.\*\*\s+\d+ dimensions,\s+\d+ modules,\s+)(\d+)(\s+MCP tools)/,
    docs: ['AGENTS.md'],
  },
  { num: 'tools', re: /(\d+ modules\s*×\s*)(\d+)(\s*MCP tools)/, docs: ['SKILL.md', 'README.md'] },
  { num: 'tools', re: /(\| MCP tools \|\s*)(\d+)(\s*\|)/, docs: ['SKILL.md', 'README.md'] },
  // SKILL.md 横幅换行：`... × 137 modules ×` 与下一行的 `  60 MCP tools.`
  // 中间隔着自然换行，所以锚点必须是「modules ×」结尾而非同行的 MCP tools。
  {
    num: 'tools',
    re: /(modules\s*×\s*\n\s*)(\d+)(\s+MCP tools[.。])/,
    docs: ['SKILL.md'],
  },
  // ── 路由数 ──
  {
    num: 'routes',
    re: /(\d+\s+MCP tools,\s+)([\d,]+)(\s+dispatch)/,
    docs: ['AGENTS.md'],
  },
  { num: 'routes', re: /(MCP tools\s*×\s*)([\d,]+)(\s+dispatch routes)/, docs: ['README.md'] },
  { num: 'routes', re: /(\| Dispatch routes \|\s*)([\d,]+)(\s*\|)/, docs: ['SKILL.md', 'README.md'] },
  // README 横幅跨行：`... × 61 MCP tools\n×  1,761 dispatch routes`
  {
    num: 'routes',
    re: /(\d+\s+MCP tools\s*\n×\s*)([\d,]+)(\s+dispatch routes)/,
    docs: ['README.md'],
  },
  // ── 模块数 [v6.7.126 第 103 轮新增] ──
  // AGENTS.md 横幅：57 dimensions, 137 modules, 61 MCP tools
  {
    num: 'modules',
    re: /(\d+ dimensions,\s+)(\d+)(\s+modules,)/,
    docs: ['AGENTS.md'],
  },
  // README / SKILL 横幅：... 11-layer pipeline × 137 modules ×
  { num: 'modules', re: /(pipeline\s*×\s*)(\d+)(\s+modules)/, docs: ['README.md', 'SKILL.md'] },
  // README/SKILL 规格表：| Modules registered | 137 |
  { num: 'modules', re: /(\| Modules registered \|\s*)(\d+)(\s*\|)/, docs: ['README.md', 'SKILL.md'] },
  // README `### Capability domains (7 domains, 137 modules)` /
  // SKILL `## Capability map (7 domains, 137 modules)`
  { num: 'modules', re: /(7 domains,\s*)(\d+)(\s+modules\))/, docs: ['README.md', 'SKILL.md'] },
  // ── 维度数（规格表行，横幅由 sync-doc-dimensions.js 负责） ──
  { num: 'dims', re: /(\| Discrimination dimensions \|\s*)(\d+)(\s*\|)/, docs: ['README.md', 'SKILL.md'] },
  // [r557 补齐] AGENTS 横幅 / 章节标题 / 三层 tier 计数字段本脚本从未覆盖 ——
  // r554/r556 补登记第 82 维后 doc-numbers 连报 5 项失败（横幅 80 vs 实测 81、
  // Block/Rewrite/Verify 层计数 10/11/47 vs 10/13/48），而这些形状都写在
  // 「不写三份文档」的硬边界里，只有机器记账能修。三条括号计数各自独立锚定。
  {
    num: 'dims',
    re: /(\*\*Zero LLM dependency\.\*\*\s+)(\d+)(\s+dimensions,\s+\d+ modules,\s+\d+ MCP tools,\s+[\d,]+\s+dispatch)/,
    docs: ['AGENTS.md'],
  },
  { num: 'dims', re: /(## The )(\d+)( dimensions)/, docs: ['AGENTS.md'] },
  // [r557 补齐] README / SKILL 横幅：`80 discrimination dimensions × 11-layer`
  // 此前只有规格表行被记账，横幅写死形状没人管（属「不写三份文档」硬边界）。
  // 两处文档同一形状故共用一条 pattern；词尾带 discrimination 以示与
  // AGENTS 的 `N dimensions` 区分。
  { num: 'dims', re: /(^\s*)(\d+)( discrimination dimensions)/m, docs: ['README.md', 'SKILL.md'] },
  { num: 'block', re: /(\*\*Block-level \()(\d+)(\):\*\*)/, docs: ['AGENTS.md'] },
  { num: 'rewrite', re: /(\*\*Rewrite-level \()(\d+)(\):\*\*)/, docs: ['AGENTS.md'] },
  { num: 'verify', re: /(\*\*Verify-level \()(\d+)(\):\*\*)/, docs: ['AGENTS.md'] },
  // tier 合计与该合计之外的「已计分但不强制 action」维度数。
  // 两处拆成两个 target：syncFile 的回调只接受 pre/数字/post 三组，
  // 一个 pattern 抓两个数字会把后一个一起顶掉。
  // 合计 = block+rewrite+verify；剩下 = 总维度 - 合计。
  { num: 'tiersSum', re: /(add up to )(\d+)(;)/, docs: ['AGENTS.md'] },
  { num: 'tiersRest', re: /(the remaining )(\d+)( dimensions are scored)/, docs: ['AGENTS.md'] },
  // README 行内引用（`checkInput` 表与 pipeline 层数列表写死维度数）。
  // doc-numbers 只查横幅/规格表，这两处行内数字没人守，已腐化到 58/68。
  { num: 'dims', re: /(scope-check, premise-check,\s*)(\d+)(\s*dimensions, error memory)/, docs: ['README.md'] },
  { num: 'dims', re: /(premise-check -> discriminate \()(\d+)( dimensions\) -> gate)/, docs: ['README.md'] },
  // ── 测试数（规格表行 + README 横幅，全部归本脚本；finish ①.5 的
  //    syncReadmeTestCount 保留为兼容冗余，两者幂等） ──
  { num: 'tests', re: /(\| Test suite \|\s*)([\d,]+)(\s+passing)/, docs: ['README.md', 'SKILL.md'] },
  { num: 'testsFailed', re: /(\| Test suite \|\s*[\d,]+\s+passing\s*\/\s*)(\d+)(\s+failing)/, docs: ['README.md', 'SKILL.md'] },
  // [r408] README 横幅的 passing tests 也归本脚本管。此前它只由 finish ①.5 的
  // syncReadmeTestCount 一个函数负责（而 upgrade-engine.js 属升级机制自身、
  // 不在本轮可改范围），于是同一条测试数有两条记账路径：横幅走 ①.5、
  // 规格表走本脚本，任一条漏掉就出现「横幅 17,341 / 规格表 17,343」的对半腐化。
  // 本脚本是全量记账的单一入口，横幅位置必须也在它的 TARGETS 里。
  // 幂等安全：①.5 先跑过就是已一致，本脚本再跑只会报「已一致」不重复改。
  { num: 'tests', re: /(×\s*)([\d,]+)(\s+passing tests)/, docs: ['README.md'] },
  // ── 能力守护检查项数（读 guard-abilities 缓存；未测量 null 不记账，
  //    但不许把已存在的 20/20 刷成 0/0） ──
  // 两个捕获组各记一个位置：「N / N checks」。两份文档同一形状。
  { num: 'capabilityPassed', re: /(\| Capability guard \|\s*)(\d+)(\s*\/)/, docs: ['README.md', 'SKILL.md'] },
  { num: 'capabilityChecks', re: /(\| Capability guard \|\s*\d+\s*\/\s*)(\d+)(\s*checks)/, docs: ['README.md', 'SKILL.md'] },
  // ── action-tier 计数（SKILL 正文句） ──
  { num: 'block', re: /(\*\*)(\d+)(\s+can\s+`block`\*\*)/, docs: ['SKILL.md'] },
  { num: 'rewrite', re: /(\*\*)(\d+)(\s+can\s+force)/, docs: ['SKILL.md'] },
  { num: 'verify', re: /(\*\*)(\d+)(\s+request\s+`verify`\*\*)/, docs: ['SKILL.md'] },
  // ── 口径版本戳（数字是现在量的，戳必须写现在） ──
  { num: 'stamp', re: /(Measured on this repository at \*\*v)([\d.]+)(\*\*)/, docs: ['README.md'] },
  { num: 'stamp', re: /(measured on this repository at v)([\d.]+)(\.)/, docs: ['SKILL.md'] },
  { num: 'stamp', re: /(\| Engine version \|\s*)([\d.]+)(\s*\|)/, docs: ['SKILL.md'] },
];

const fmt = n => n.toLocaleString('en-US');

/** README 的 Version history 之后是历史记录，其中的数字是当时的事实，不碰 */
function splitHistory(file, src) {
  if (file !== 'README.md') return { live: src, history: '' };
  const i = src.indexOf('## Version history');
  if (i < 0) return { live: src, history: '' };
  return { live: src.slice(0, i), history: src.slice(i) };
}

/** 「故意引述历史」的行不碰（AGENTS.md 的 previously claimed 反面教材） */
const SKIP_LINE = /previously claimed|曾经声称|曾经宣称|historically claimed|旧版本声称/i;

function syncFile(file, want, checkOnly) {
  const fp = path.join(ROOT, file);
  let src;
  try { src = fs.readFileSync(fp, 'utf8'); } catch (e) {
    return { file, error: `读不到（${e.message}）`, hits: [] };
  }
  const { live, history } = splitHistory(file, src);

  // [r314 修复] 不能逐行 replace：README/SKILL 的横幅是**跨行**的
  // （`... × 61 MCP tools` 在行尾，`× 1,761 dispatch routes` 在下一行），
  // 逐行处理会让跨行 pattern 永远匹配不上 —— 首版实测就是「--check 报
  // 已一致、测试仍 4 个红」。改为：先把引述历史的行换成占位符保住全文
  // 连续性，在整块文本上做替换，最后再还原占位行。
  const skipIdx = [];
  const masked = live.split('\n').map(line => {
    if (SKIP_LINE.test(line)) {
      const k = skipIdx.length;
      skipIdx.push(line);
      return `\u0000${k}\u0000`;   // 占位符：不含数字、不会被任何 pattern 命中
    }
    return line;
  }).join('\n');

  const hits = [];
  const skipped = [];
  let out = masked;
  for (const t of TARGETS) {
    if (!t.docs.includes(file)) continue;
    // [r408 修正] 先把「未测量」的目标拦下，再算 target 字符串 —— 顺序颠倒
    // 会让 fmt(null) 先抛 TypeError（实测：挪走 capability 缓存后
    // --check 直接崩在第 206 行，rc=1，而不是「跳过记账」）。
    // [r407 防呆 / r408 修正] **未测量**(null/undefined) 的目标一律不记账：
    // 把「18 / 18 checks」刷成「0 / 0 checks」比留着旧数字更坏——读者会以为
    // 能力守护归零了。宁可不改也不猜。
    // [r408] 但 `0` 是**合法测量值**（r407 用 falsy 判断把两者混同，导致
    // 「失败数 = 0」这种最常见真实值永远记不上账）。判定条件必须是
    // `!= null`，不能是 `!want[num]` —— 已实测：r407 版本让 doc-numbers
    // 从 21/21 掉到 18/21。
    if (want[t.num] == null) {
      if (new RegExp(t.re).test(out)) {
        skipped.push(t.num);
      }
      continue;
    }
    const target = t.num === 'stamp' ? want.stamp : fmt(want[t.num]);
    out = out.replace(t.re, (full, pre, mid, post) => {
      if (mid === target) return full;
      hits.push({ re: String(t.re).slice(0, 40), before: mid, after: target });
      return pre + target + post;
    });
  }

  // 还原被保号的历史引述行，并确认一行都没丢
  const lines = out.split('\n');
  let unmasked = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\u0000(\d+)\u0000$/);
    if (m) { lines[i] = skipIdx[+m[1]]; unmasked++; }
  }
  out = lines.join('\n');
  if (unmasked !== skipIdx.length) {
    throw new Error(`${file}: 历史引述行占位还原数不符（${unmasked} != ${skipIdx.length}），拒绝写盘`);
  }

  if (hits.length && !checkOnly) fs.writeFileSync(fp, out + history);
  return { file, hits, skipped };
}

function main() {
  const checkOnly = process.argv.includes('--check');
  let want;
  try {
    want = measure();
  } catch (e) {
    console.error('实测失败：' + e.message);
    process.exit(2);
  }
  console.log(`实测：MCP 工具 ${want.tools} 个 / 路由 ${want.routes} 条 / 模块 ${want.modules} 个 / 维度 ${want.dims} 个`);
  console.log(`      tier: block ${want.block} / rewrite ${want.rewrite} / verify ${want.verify}`);
  console.log(`      测试 ${want.tests} 通过 / ${want.testsFailed} 失败 / 口径版本戳 v${want.stamp}\n`);

  let dirty = 0;
  for (const f of ['AGENTS.md', 'README.md', 'SKILL.md']) {
    const r = syncFile(f, want, checkOnly);
    if (r.error) { console.log(`  ❌ ${r.file}: ${r.error}`); dirty++; continue; }
    if (r.hits.length) {
      dirty++;
      console.log(`  ${checkOnly ? '❌' : '📝'} ${r.file}`);
      for (const h of r.hits) console.log(`     ${h.before} → ${h.after}  (${h.re})`);
    } else {
      console.log(`  ✅ ${r.file} 已一致`);
    }
    if (r.skipped && r.skipped.length) {
      console.log(`     ⏭️  ${[...new Set(r.skipped)].join(', ')} 无实测缓存，跳过（文档保持原值）`);
    }
  }
  if (dirty) process.exit(checkOnly ? 1 : 0);
}

if (require.main === module) main();

module.exports = { measure, TARGETS, syncFile };
