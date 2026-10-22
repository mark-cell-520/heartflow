// r594 探针 v2：逐 handler 跑「输出是否完全由模板写死」
// 口径：对所有 heartflow_* handler，静态标记「返回值里含裸字面量空集合」
//   （如 lessons: []、[]、{}），再排除真调用了模块方法并回填的。
// 只报工具名与统计，不贴样本原文。
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

const hard = [];
for (const s of segs) {
  const b = s.body;
  // 硬编码空集合特征：`xxx: []` 或 `xxx: {}` 出现在 return 字面量中
  const hardEmpty = /return\s*\{[^}]*\b[a-zA-Z_]\w*\s*:\s*\[\]\s*[,}]/.test(b) ||
                    /return\s*\{[^}]*\b[a-zA-Z_]\w*\s*:\s*\{\}\s*[,}]/.test(b);
  if (hardEmpty) hard.push({ name: s.name, len: b.length });
}
console.log(JSON.stringify({
  total: segs.length,
  hardEmptyCount: hard.length,
  hardEmpty: hard.map(h => h.name),
}, null, 2));
