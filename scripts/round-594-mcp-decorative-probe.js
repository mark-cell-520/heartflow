// r594 探针：量出每个 MCP handler 的「装饰指数」
// 判定口径（只看 handler 源码形状 + 被 new 的模块是否真实可跑）：
//   hardcoded = handler 返回里出现裸字面量占位（如 { lessons: [], note: ... }）
//   passthrough = 调用了模块方法且把结果原样返回
// 只报工具名与统计，不贴样本原文
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');

const hIdx = srv.indexOf('const HANDLERS');
const hBlock = srv.slice(hIdx, srv.length);
const keyRe = /^  (heartflow_[a-z0-9_]+)\s*:/gm;
const keys = [];
let m;
while ((m = keyRe.exec(hBlock))) keys.push({ name: m[1], at: m.index });
const segs = keys.map((k, i) => ({ name: k.name, body: hBlock.slice(k.at, i + 1 < keys.length ? keys[i + 1].at : hBlock.length) }));

const rows = [];
for (const s of segs) {
  const b = s.body;
  const flags = [];
  // 返回裸空数组/空对象（模板写死，不依赖模块输出）
  if (/\blegacy\s*:\s*\[|\b[a-zA-Z]+:\s*\[\]\s*,/.test(b)) flags.push('returns_empty_array');
  if (/\blegacy\s*:\s*\{\}|\b[a-zA-Z]+:\s*\{\}\s*,/.test(b)) flags.push('returns_empty_obj');
  // 调用模块方法
  const calls = [...b.matchAll(/\.([a-zA-Z_][\w]*)\s*\(/g)].map(x => x[1]);
  const hasCall = calls.length > 0 && calls.some(c => !['require', 'slice', 'test', 'indexOf'].includes(c));
  if (/\.(getStats|getPrinciples|quickAssess|extractClaims|analyze|essence)\b/.test(b)) flags.push('calls_module_method');
  if (!/\breturn\s+\{/.test(b)) flags.push('no_object_return');
  if (/\bignore/i.test(b)) flags.push('ignores_args');
  rows.push({ name: s.name, len: b.length, hasCall, flags });
}

// 只输出「new 了模块但返回值完全不依赖模块输出」的装饰工具
const decorative = rows.filter(r => /new\s+[A-Z]/.test(segs.find(s => s.name === r.name).body) && !r.hasCall);
console.log(JSON.stringify({
  total: segs.length,
  decorativeCount: decorative.length,
  decorative: decorative.map(d => d.name),
}, null, 2));
