#!/usr/bin/env node
/**
 * MCP 工具数 / 路由数自动记账 [v6.7.133 第 314 轮]
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
 * 口径：与 scripts/measure-claimed-numbers.js 完全同源。
 *   · 工具数 = TOOLS 数组 name 去重计数
 *   · 路由数 = HeartFlow.ALLOWED_ROUTES.size（运行时，start() 之后）
 *   量不到就拒绝记账（宁可不改也不猜）。
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

/** 运行时实测两个数（唯一真相，量不到就拒绝记账） */
function measure() {
  const r = cp.spawnSync('node', ['-e', [
    "const {HeartFlow}=require(" + JSON.stringify(path.join(ROOT, 'src/core/heartflow.js')) + ");",
    "const hf=new HeartFlow({dataDir:" + JSON.stringify(path.join(ROOT, 'data')) + ",silent:true});",
    "hf.start();",
    "setTimeout(()=>{const reg=require(" + JSON.stringify(path.join(ROOT, 'src/mcp/tools-registry.js')) + ");",
    "console.log(JSON.stringify({tools:new Set(reg.TOOLS.map(x=>x.name)).size,routes:HeartFlow.ALLOWED_ROUTES.size}));",
    "process.exit(0)},4000);",
  ].join('\n')], { encoding: 'utf8', timeout: 120000 });
  let d = null;
  for (const line of (r.stdout || '').split('\n')) {
    const i = line.indexOf('{"tools":');
    if (i >= 0) { try { d = JSON.parse(line.slice(i)); } catch (_) { /* 继续找下一行 */ } }
  }
  if (!d || !d.tools || !d.routes) {
    throw new Error('ALLOWED_ROUTES / TOOLS 未返回，拒绝记账——宁可不改也不猜');
  }
  return d;
}

/**
 * 每个数字（工具数 / 路由数）要同步的文档位置。
 * 每条 = 精确上下文锚点 + 目标数字组。只列真实出现过的形状；
 * 历史记录区（README Version history、AGENTS 的「previously claimed」）
 * 是当时的事实，不在这份清单里。
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
  // SKILL 横幅换行：`... 137 modules ×\n  60 MCP tools.`
  {
    num: 'tools',
    re: /(modules\s*×\s*\n\s*)(\d+)(\s+MCP tools[.。])/,
    docs: ['SKILL.md'],
  },
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
  //（`... × 61 MCP tools` 在行尾，`× 1,761 dispatch routes` 在下一行），
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
  let out = masked;
  for (const t of TARGETS) {
    if (!t.docs.includes(file)) continue;
    const target = fmt(want[t.num]);
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
  return { file, hits };
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
  console.log(`实测：MCP 工具 ${want.tools} 个 / 路由 ${want.routes} 条\n`);

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
  }
  if (dirty) process.exit(checkOnly ? 1 : 0);
}

if (require.main === module) main();
