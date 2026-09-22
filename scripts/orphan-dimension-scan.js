#!/usr/bin/env node
/**
 * scripts/orphan-dimension-scan.js — 断链维度扫描（v6.7.84）
 *
 * 目的：找出「有 checkXxx 函数但从未被 discriminate() 调用」的死维度。
 *
 * 来源：第 29 轮偶然发现 checkIndirectInjection 断链（函数存在、导出正确、
 * 单体测试能过，就是不在主链路上）。这是第 12 轮 diagnosed 的
 * 「存在≠在用」模式的又一实例——但上次只发现了一个，没人系统扫过。
 *
 * 方法：
 *   1. 从 index.js 提取所有 `function checkXxx` 定义
 *   2. 提取 discriminate() 函数体
 *   3. 检查每个 checkXxx 是否在函数体中出现（≥1 次调用）
 *   4. 未出现的 = 断链
 *
 * 注意：有些维度是**有意**从 discriminate 分流的（例如只在 pipeline.js
 * 或 MCP handler 用），本脚本列出全部候选，由人（或心虫）逐个判定。
 */
const path = require('path');
const fs = require('fs');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const INDEX = path.join(ROOT, 'src/index.js');
const src = fs.readFileSync(INDEX, 'utf8');

// 1. 所有 checkXxx 定义
const checkFns = [];
const re = /^function (check[A-Z]\w*)\s*\(/gm;
let m;
while ((m = re.exec(src)) !== null) checkFns.push(m[1]);
checkFns.sort();

// 2. discriminate() 函数体（括号配对提取，不用 \n}\n 截断）
//    [v6.7.84] 第一版用 `/\n\}\n/g` 找结束，只拿到 1532 字符——
//    匹配到的是函数体**内部第一个**顶层闭包的结尾，导致
//    "已接入: 0 / 断链: 50" 的荒谬结论（checkVagueness 等明明是活的）。
//    教训：用正则找 JS 函数边界必然出错，必须括号配对。
const discStart = src.indexOf('function discriminate(text, evidence');
if (discStart < 0) { console.error('找不到 discriminate'); process.exit(1); }
let discEnd = src.length;
{
  const braceStart = src.indexOf('{', discStart);
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { discEnd = i + 1; break; }
    }
  }
}
const discBody = src.slice(discStart, discEnd);
console.log(`discriminate() 函数体: ${discBody.length} 字符\n`);

// 3. 逐个检查
//    [v6.7.84] 两种接入形式都要认：
//      ① 直接调用  checkHateSpeech(text)
//      ② 别名包装  const hs = _dual(checkHateSpeech, "hate_speech")
//    第一版只认 ①，把 7 个用 ② 接入的核心维度误报成断链
//    （hate_speech/prompt_injection/gaslighting 等——全是 gate 的支柱）。
const ORPHANS = [];
const WIRED = [];
for (const fn of checkFns) {
  const direct = (discBody.match(new RegExp(`\\b${fn}\\s*\\(`, 'g')) || []).length;
  const aliased = (discBody.match(new RegExp(`\\b${fn}\\s*[,)]`), 'g') || []).length;
  // aliased 覆盖 `const hs = _dual(checkHateSpeech, ...)` 与 `fns.push(checkXxx)` 等
  const n = direct + aliased;
  if (n === 0) ORPHANS.push(fn);
  else WIRED.push({ fn, n });
}

console.log(`check 函数总数: ${checkFns.length}`);
console.log(`  已接入 discriminate: ${WIRED.length}`);
console.log(`  断链（不在主链路）: ${ORPHANS.length}\n`);

if (ORPHANS.length) {
  console.log('=== 断链维度 ===');
  // 4. 对每个断链的，查它在别处是否被调用（pipeline.js / gate.js / mcp-server.js）
  const OTHER_SRC = {};
  for (const f of ['gate.js', 'gate-verdict.js', 'pipeline.js', 'text-normalizer.js',
                   'manipulation-tactics.js', 'dangerous-instruction.js']) {
    try { OTHER_SRC[f] = fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'); } catch (_) {}
  }
  try { OTHER_SRC['mcp-server.js'] = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8'); } catch (_) {}

  for (const fn of ORPHANS) {
    const elsewhere = [];
    for (const [f, s] of Object.entries(OTHER_SRC)) {
      if (s.includes(fn)) elsewhere.push(f);
    }
    // 导出行
    const exported = new RegExp(`${fn}\\s*:`).test(src);
    console.log(`  ${fn.padEnd(34)} 导出:${exported ? '✓' : '✗'}  别处调用: ${elsewhere.join(', ') || '(无)'}`);
  }
}

console.log('\n=== 已接入的（前 20 按调用次数排序）===');
WIRED.sort((a, b) => b.n - a.n);
for (const w of WIRED.slice(0, 20)) {
  console.log(`  ${w.fn.padEnd(34)} ${w.n} 次`);
}
