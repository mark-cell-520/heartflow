// r637 探针：daizhigev20 典籍语料库解析链实测
const path = require('path');
const Module = require('module');

// 1) 本机到底装在哪
const fs = require('fs');
const cands = [
  '/root/hermes8/skills/daizhigev20',
  '/root/.hermes/skills/daizhigev20',
  '/root/.stepcode/agent/skills/daizhigev20',
  '/usr/local/share/hermes/skills/daizhigev20',
  '/opt/hermes/skills/daizhigev20',
];
console.log('--- 落盘实况 ---');
for (const c of cands) {
  let ok = false, n = 0;
  try { ok = fs.statSync(c).isDirectory(); } catch {}
  if (ok) {
    try { n = fs.readdirSync(c).length; } catch {}
  }
  console.log((ok ? 'OK ' : 'NO ') + c + '  entries=' + n);
}

// 2) 当前 uncommitted 版本解析结果
const cb = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/knowledge/classics-base.js');
console.log('--- classics-base 当前解析 ---');
console.log('exports:', Object.keys(cb).join(','));
const keys = ['resolve','resolvePath','load','getBasePath','CLASSICS_BASE','basePath','getPath','path','loadAll'];
for (const k of keys) {
  if (typeof cb[k] === 'function') {
    let v; try { v = cb[k](); } catch (e) { v = 'THREW ' + e.message; }
    console.log(k + '() =', String(v).slice(0,200));
  }
}

// 3) 上级目录里搜一遍 daizhigev20（找本机真实位置）
console.log('--- 全盘浅层搜索 ---');
const found = [];
const roots = ['/root', '/opt', '/usr/local/share', '/home'];
function walk(d, depth) {
  if (depth > 4 || found.length > 12) return;
  let ents; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (!e.isDirectory()) continue;
    const p = d + '/' + e.name;
    if (e.name === 'daizhigev20') { found.push(p); continue; }
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'proc' || e.name === 'sys') continue;
    walk(p, depth + 1);
  }
}
for (const r of roots) walk(r, 0);
console.log(found.join('\n') || '(未找到)');
