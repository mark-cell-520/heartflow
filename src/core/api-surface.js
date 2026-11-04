// ═══════════════════════════════════════════════════════════════════════
// HeartFlow API 表面守卫 — 文档契约与真实导出的单一核对实现
//
// 为什么需要这个模块（r744 轮初实测）：
//   test/api-surface-consistency.test.js 自 v6.7.79 起守着「文档说的 API
//   必须真实存在、真实导出必须被文档说到」两条。实测两条都在失效：
//
//   ① 假阳性（幽灵方法）：README 的 **Version history** 段落里写着
//      「`src/index.js checkEvidence(claim, evidence)` 的 score = …」，
//      测试的 `` `(\w+)\s*\(` `` 正则把它当成 gate.js 的导出契约，
//      于是每轮必红一条「文档列了导出里不存在的方法: checkEvidence」。
//      文档其实在同一段里就写明了它是 src/index.js 的内部函数。
//      根因：**把叙述区（变更记录）当成了 API 区**。
//
//   ② 漏列（覆盖面只有 1/161 个模块）：测试只扫 src/gate.js。
//      r736/r737/r738 给 gate.js 加了 quotationFrame / delimiterChannel /
//      postHocLegs 三个诊断导出，r743 又给 measure-core.js 加了
//      readTestCountFile / writeTestCount 等六个导出 —— 全部没有任何
//      非变更记录处的文档提及，测试一条都报不出来。
//
// 修法是一处：把「哪些名字算文档契约」「哪些名字算公开导出」两份判定
// 合成这一份代码，按 region（章节）+ 位置（表格首列 / 标题）抽契约位，
// 按模块抽导出，两侧对着报。r739 的教训（判定与契约必须同一份代码）
// 在这里同样成立。
//
// 两条判据都是**可解释的位置规则**，不是词表：
//   - 契约位 = 非叙述区章节里的 markdown 表格首列 `` | `name(` `` 或
//     ATX 标题 ``### `name(` ``。调用方复制即崩的正是这两种位置。
//   - 叙述区 = 标题命中 version history / changelog / 变更记录 / 历史 等
//     的章节及其子章节。那里的 `name(` 是散文，不是契约。
//   - 公开面 = PUBLIC_MODULES 里登记的模块（docs 明文对外的三个）。
// ═══════════════════════════════════════════════════════════════════════

'use strict';

const fs = require('fs');
const path = require('path');

/** 参与核对的文档（与既有 api-surface 测试同一份清单） */
const DOC_FILES = ['README.md', 'AGENTS.md', 'SKILL.md'];

/**
 * 公开面清单：docs 与 src 之间的契约边界。
 * 只有在这里登记的模块，「新增导出必须有文档」才构成硬约束。
 * 161 个模块里的其余部分是引擎内部实现，不对调用方承诺 API。
 */
const PUBLIC_MODULES = [
  { key: 'gate', rel: 'src/gate.js', contract: 'AGENTS.md § Lower-level exports（三个入口函数的底层）' },
  { key: 'heartflow', rel: 'src/core/heartflow.js', contract: 'npm 包入口 @yun520-1/heartflow' },
  { key: 'measureCore', rel: 'src/core/measure-core.js', contract: '数字记账唯一测量实现（r741/r743，MCP heartflow_measure_numbers 的背后）' },
];

/**
 * 契约位豁免：文档在契约位提到、但它不是任何一个公开模块的导出
 * （典型是某个类的实例方法，如 `| `assessEffectiveness()` |`）。
 * 每条必须带 reason —— 没有理由的豁免就是把守卫关掉。
 */
const EXEMPT_CLAIMS = [];

/** 叙述区标题：这些章节里的 `name(` 是散文，不是 API 契约 */
const NARRATIVE_HEADING_RE =
  /(version\s*history|changelog|change\s*log|release\s*notes|历史|变更|版本|记录|roadmap|limitation|honest\s*numbers?|升级日志)/i;

/** 契约位①：markdown 表格首列是 `name(` */
const CLAIM_TABLE_RE = /^\s*\|[^|\n]*?`\s*([A-Za-z_$][\w$]*)\s*\([^|]*\|/;
/** 契约位②：ATX 标题是 `name(` */
const CLAIM_HEADING_RE = /^#{1,6}\s+`\s*([A-Za-z_$][\w$]*)\s*\(/;
/** 宽口径：任何反引号包裹的名字（用于「导出是否被文档说到」） */
const MENTION_RE = /`\s*([A-Za-z_$][\w$]*)\s*\(?/g;

const EXEMPT_REASONS = new Map(EXEMPT_CLAIMS.map(e => [e.name, e.reason]));

/**
 * 扫一份文档：按章节切 region，抽契约位声称与宽口径提及。
 * 返回 { claims, mentions, lines } —— mentions 是 Map<name, [{line, section}]>。
 */
function scanDoc(text, file) {
  const lines = text.split(/\r?\n/);
  const claims = [];
  const mentions = new Map();
  const stack = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (h) {
      const depth = h[1].length;
      const heading = h[2].trim();
      while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
      stack.push({ depth, heading, line: i + 1 });
      // 标题本身也是契约位：`### `checkInput(text)` 这种小节标题。
      // 注意必须在 push 之后判——否则新章节自己的叙述性会被漏掉。
      const own = heading.match(/^`\s*([A-Za-z_$][\w$]*)\s*\(/);
      const narrative = stack.some(s => NARRATIVE_HEADING_RE.test(s.heading));
      if (own && !narrative) {
        claims.push({ name: own[1], file, line: i + 1, section: heading, form: 'heading' });
      }
      continue;
    }
    const section = stack.length ? stack[stack.length - 1].heading : '(preamble)';
    if (stack.some(s => NARRATIVE_HEADING_RE.test(s.heading))) continue; // 叙述区：散文不是契约

    const tc = line.match(CLAIM_TABLE_RE);
    const hc = tc ? null : line.match(CLAIM_HEADING_RE);
    if (tc) claims.push({ name: tc[1], file, line: i + 1, section, form: 'table-first-column' });
    else if (hc) claims.push({ name: hc[1], file, line: i + 1, section, form: 'heading' });

    for (const m of line.matchAll(MENTION_RE)) {
      if (!mentions.has(m[1])) mentions.set(m[1], []);
      mentions.get(m[1]).push({ line: i + 1, section });
    }
  }
  return { claims, mentions, lines: lines.length };
}

/** 读一个公开模块的导出（只审计函数导出——调用方真正会调的东西） */
function loadExports(rootPath, rel) {
  const abs = path.join(rootPath, rel);
  let mod;
  try {
    mod = require(abs);
  } catch (e) {
    return { ok: false, error: `${rel} require 失败：${e.message}`, names: [], other: [] };
  }
  const names = Object.keys(mod).filter(k => typeof mod[k] === 'function').sort();
  const other = Object.keys(mod).filter(k => typeof mod[k] !== 'function').sort();
  return { ok: true, error: null, names, other };
}

/**
 * 全量核对：文档契约位 ↔ 公开模块导出。
 * 宁可拒绝出数也不洗成「没问题」：公开模块 require 失败即 ok=false。
 */
function audit(rootPath, opts) {
  const o = opts || {};
  const docs = o.docs || DOC_FILES;
  const modules = o.modules || PUBLIC_MODULES;

  const docReports = [];
  const claims = [];
  const mentions = new Map();
  for (const d of docs) {
    const p = path.join(rootPath, d);
    if (!fs.existsSync(p)) {
      docReports.push({ file: d, exists: false, claims: 0 });
      continue;
    }
    const r = scanDoc(fs.readFileSync(p, 'utf8'), d);
    docReports.push({ file: d, exists: true, claims: r.claims.length, lines: r.lines });
    claims.push(...r.claims);
    for (const [n, where] of r.mentions) {
      if (!mentions.has(n)) mentions.set(n, []);
      mentions.get(n).push(...where.map(w => ({ file: d, ...w })));
    }
  }

  const moduleReports = [];
  const allExports = new Set();
  const loadErrors = [];
  for (const m of modules) {
    const ex = loadExports(rootPath, m.rel);
    if (!ex.ok) loadErrors.push(ex.error);
    for (const n of ex.names) allExports.add(n);
    const documented = ex.names.filter(n => mentions.has(n));
    const undocumented = ex.names.filter(n => !mentions.has(n));
    moduleReports.push({
      key: m.key, rel: m.rel, contract: m.contract, ok: ex.ok, error: ex.error,
      exports: ex.names, otherExports: ex.other,
      documented, undocumented,
    });
  }

  const ghosts = [];
  const exempted = [];
  for (const c of claims) {
    if (allExports.has(c.name)) continue;
    if (EXEMPT_REASONS.has(c.name)) {
      exempted.push({ ...c, reason: EXEMPT_REASONS.get(c.name) });
      continue;
    }
    ghosts.push(c);
  }

  const undocumented = [];
  for (const mr of moduleReports) {
    for (const n of mr.undocumented) undocumented.push({ name: n, module: mr.rel });
  }

  const ok = loadErrors.length === 0 && ghosts.length === 0 && undocumented.length === 0;
  const reasonParts = [];
  if (loadErrors.length) reasonParts.push(loadErrors.join('; '));
  if (ghosts.length) reasonParts.push(`${ghosts.length} 个契约位声称在公开面里没有对应导出`);
  if (undocumented.length) reasonParts.push(`${undocumented.length} 个公开导出没有任何文档提及`);
  const reason = reasonParts.length ? reasonParts.join('；') : null;

  return {
    ok,
    reason: reason || null,
    docs: docReports,
    modules: moduleReports,
    claims,
    ghosts,
    exempted,
    undocumented,
    counts: {
      publicModules: moduleReports.length,
      exports: [...allExports].length,
      documented: moduleReports.reduce((s, m) => s + m.documented.length, 0),
      undocumented: undocumented.length,
      claims: claims.length,
      ghosts: ghosts.length,
      exemptions: exempted.length,
    },
  };
}

/** 人读报告（供脚本 / MCP / 交接簿直接贴） */
function describe(rootPath, opts) {
  const r = audit(rootPath, opts);
  const L = [];
  L.push(`公开面 ${r.counts.publicModules} 个模块 / ${r.counts.exports} 个函数导出`);
  L.push(`契约位声称 ${r.counts.claims} 条（来自 ${r.docs.filter(d => d.exists).map(d => d.file).join(' + ')}）`);
  for (const m of r.modules) {
    L.push(`  ${m.rel}: ${m.exports.length} 导出，已文档化 ${m.documented.length}，漏 ${m.undocumented.length}`);
    if (m.undocumented.length) L.push(`    漏列: ${m.undocumented.join(', ')}`);
    if (m.otherExports.length) L.push(`    非函数导出（不在本守卫范围）: ${m.otherExports.join(', ')}`);
  }
  for (const g of r.ghosts) {
    L.push(`  ❌ 幽灵方法 ${g.name}() ← ${g.file}:${g.line} [${g.section}]（${g.form}）`);
  }
  for (const e of r.exempted) L.push(`  ⚪ 豁免 ${e.name}() ← ${e.file}:${e.line}（${e.reason}）`);
  L.push(r.ok ? '✅ 文档契约与公开导出逐项对齐' : `❌ ${r.reason}`);
  return L.join('\n');
}

module.exports = {
  DOC_FILES,
  PUBLIC_MODULES,
  EXEMPT_CLAIMS,
  NARRATIVE_HEADING_RE,
  scanDoc,
  loadExports,
  audit,
  describe,
};
