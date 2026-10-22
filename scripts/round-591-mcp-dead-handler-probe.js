// r591 探针：HANDLERS 里"映射到存在但行为失效的 handler"扫描
// 口径：registry 声明了工具 + HANDLERS 有映射，但 handler 每次 new 空实例
//       （状态每次丢失）或调不存在的方法 = 装饰性接线，外部调用方拿到空结果
// 只报数字与工具名，不贴样本原文
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');

// 切出 HANDLERS 对象体
const hIdx = srv.indexOf('const HANDLERS');
const hBlock = srv.slice(hIdx, srv.length);

// 按顶层键（两空格缩进 + heartflow_ 名 + 冒号）切成段
const keyRe = /^  (heartflow_[a-z0-9_]+)\s*:/gm;
const keys = [];
let m;
while ((m = keyRe.exec(hBlock))) keys.push({ name: m[1], at: m.index });
const segs = keys.map((k, i) => ({ name: k.name, body: hBlock.slice(k.at, i + 1 < keys.length ? keys[i + 1].at : hBlock.length) }));

const suspicious = [];
for (const s of segs) {
  const b = s.body;
  const flags = [];
  if (/=\s*new\s+[A-Z]\w*\(\s*\{\s*silent\s*:\s*true\s*\}\s*\)/.test(b)) flags.push('new_silent_instance');
  if (/\.\w+\(\)\s*\|\|\s*\{\s*\}/.test(b)) flags.push('fallback_empty_obj');
  if (/\/\/\s*(TODO|FIXME|stub|not implemented|未实现|占位)/i.test(b)) flags.push('todo_marker');
  if (flags.length) suspicious.push({ name: s.name, flags, len: b.length });
}

console.log(JSON.stringify({
  totalHandlers: segs.length,
  suspiciousCount: suspicious.length,
  suspicious,
}, null, 2));
