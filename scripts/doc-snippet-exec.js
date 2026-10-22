#!/usr/bin/env node
/** 抽取三份文档的 JS 代码块并逐个执行（v6.7.78） */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';

const DOCS = ['AGENTS.md', 'README.md', 'SKILL.md'];
const blocks = [];

for (const d of DOCS) {
  const src = fs.readFileSync(path.join(ROOT, d), 'utf8');
  const lines = src.split('\n');
  let inBlock = false, buf = [], start = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^```(javascript|js)\s*$/.test(l.trim())) { inBlock = true; buf = []; start = i + 1; continue; }
    if (inBlock && /^```\s*$/.test(l.trim())) {
      blocks.push({ doc: d, line: start, code: buf.join('\n') });
      inBlock = false; continue;
    }
    if (inBlock) buf.push(l);
  }
}

console.log(`抽到 ${blocks.length} 个 JS 代码块\n`);

const results = [];
for (const b of blocks) {
  // [v6.7.78] 三类误报排除：
  //   1. JSON/返回值示例（以 { 开头且含 "key": value）→ 不是可执行 JS
  //   2. bash/shell 命令
  //   3. top-level await 的 async 示例 → 包一层 async main
  const firstReal = b.code.split('\n').find(l => l.trim() && !l.trim().startsWith('//'));
  if (!firstReal) continue;
  if (/^(npm install|node src\/|cd |git clone|hermes )/.test(firstReal.trim())) continue;
  // JSON 示例：首字符是 { 且第二行是缩进的 "key":
  if (/^\s*\{\s*$/.test(b.code.split('\n')[0]) && /"\w+"\s*:/.test(b.code)) continue;
  // [v6.7.78] 返回值 JSON（含 "gate": { "action": ... } 之类，带嵌套结构的纯数据）
  if (/^\s*\{\s*$/.test(b.code.split('\n')[0]) && /['"]?[a-zA-Z_]+['"]?\s*:\s*[\[{"']/.test(b.code)) continue;

  const f = `/tmp/doc-snippet-${b.doc.replace('.md', '')}-${b.line}.js`;
  let code = b.code;
  // npm 包名替换成本地相对路径（仓库内执行时等价）
  code = code.replace(/require\(['"]@yun520-1\/heartflow['"]\)/g,
    `require('${path.join(ROOT, 'src/gate.js')}')`);
  // [v6.7.78] './src/...' 相对路径必须换成绝对路径——脚本写到 /tmp 后
  // Node 按**脚本所在目录**解析相对 require，不是 cwd。这是两次误报的根因。
  code = code.replace(/require\(['"]\.\/(src\/[^'"]+)['"]\)/g,
    (m, p) => `require('${path.join(ROOT, p)}')`);
  // top-level await → 包 async main
  if (/\bawait\b/.test(code) && !/async/.test(code.split('\n')[0])) {
    code = `(async () => {\n${code}\n})().catch(e => { console.error(e.message); process.exit(1); });`;
  }
  fs.writeFileSync(f, code);
  const r = cp.spawnSync('node', [f], { encoding: 'utf8', timeout: 30000, cwd: ROOT });
  const out = (r.stdout || '') + (r.stderr || '');
  const ok = r.status === 0;
  results.push({ ...b, ok, err: ok ? '' : out.split('\n').filter(l => /Error|error/.test(l))[0]?.slice(0, 90) || out.slice(0, 90) });
}

console.log('=== 执行结果 ===\n');
for (const r of results) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.doc}:${r.line}`);
  const first = r.code.split('\n').find(l => l.trim()).trim().slice(0, 74);
  console.log(`     ${first}`);
  if (!r.ok) console.log(`     → ${r.err}`);
}
const pass = results.filter(r => r.ok).length;
console.log(`\n通过 ${pass}/${results.length}`);
