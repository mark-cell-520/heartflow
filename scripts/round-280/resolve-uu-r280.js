#!/usr/bin/env node
// r280 UU 治理：UPGRADE_LOG.md 与 coordination/claims.jsonl 的三方冲突（stale rebase 遗留）
// 解法：取并集（双方轮次条目/认领记录都保留），不覆盖任何一侧产出。
// 注：git show 走 execSync 遇大文件 ENOBUFS，改用 spawnSync 流式读。
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = '/root/hermes1/skills/ai/mark-heartflow-skill';
process.chdir(REPO);

function readStage(f, n) {
  const r = spawnSync('git', ['cat-file', '-p', `:${n}:${f}`], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git cat-file :${n}:${f} failed: ${r.stderr}`);
  return r.stdout.toString('utf8');
}

/* ---------- 1) UPGRADE_LOG.md ---------- */
const ul = {
  ours: readStage('UPGRADE_LOG.md', 2),
  theirs: readStage('UPGRADE_LOG.md', 3),
  wt: fs.readFileSync('UPGRADE_LOG.md', 'utf8'),
};

function splitSections(text) {
  const lines = text.split('\n');
  const header = [];
  const sections = [];
  let cur = null;
  for (const line of lines) {
    if (/^## r\d+/.test(line)) {
      if (cur) sections.push(cur);
      cur = [line];
    } else if (cur) cur.push(line);
    else header.push(line);
  }
  if (cur) sections.push(cur);
  return { header: header.join('\n'), sections };
}
const roundOf = s => { const m = s[0].match(/^## r(\d+)/); return m ? +m[1] : -1; };

const ulMap = new Map();
const srcLog = [];
for (const [src, text] of [['ours', ul.ours], ['theirs', ul.theirs], ['wt', ul.wt]]) {
  for (const sec of splitSections(text).sections) {
    const r = roundOf(sec);
    if (r < 0) continue;
    const body = sec.join('\n').trimEnd();
    const prev = ulMap.get(r);
    if (!prev || body.length > prev.len) ulMap.set(r, { body, src, len: body.length });
    srcLog.push(`r${r}<-${src}`);
  }
}
// header 取工作区版本（它通常最新）
const ulOut = splitSections(ul.wt).header.trimEnd() + '\n\n'
  + [...ulMap.entries()].sort((a, b) => b[0] - a[0]).map(([, v]) => v.body).join('\n\n') + '\n';

if (ulOut !== ul.wt) {
  fs.writeFileSync('UPGRADE_LOG.md', ulOut);
  console.log(`UPGRADE_LOG.md 已合并 ${ulMap.size} 轮条目（并集）: ${[...ulMap.keys()].sort((a,b)=>a-b).join(', ')}`);
} else {
  console.log('UPGRADE_LOG.md: 工作区已是并集');
}

/* ---------- 2) coordination/claims.jsonl ---------- */
const cl = {
  ours: readStage('coordination/claims.jsonl', 2),
  theirs: readStage('coordination/claims.jsonl', 3),
  wt: fs.readFileSync('coordination/claims.jsonl', 'utf8'),
};
const key = line => { try { const o = JSON.parse(line); return `${o.round}|${o.kind||''}|${o.claim_at||''}`; } catch (e) { return 'UNPARSED:' + line; } };

const seen = new Set();
const out = [];
let dup = 0;
for (const src of ['wt', 'ours', 'theirs']) {
  for (const line of cl[src].split('\n')) {
    if (!line.trim()) continue;
    const k = key(line);
    if (seen.has(k)) { dup++; continue; }
    seen.add(k); out.push(line);
  }
}
const clOut = out.join('\n') + '\n';
if (clOut !== cl.wt) {
  fs.writeFileSync('coordination/claims.jsonl', clOut);
  console.log(`claims.jsonl 已合并 ${out.length} 条（丢弃重复 ${dup}）`);
} else {
  console.log('claims.jsonl: 工作区已是并集');
}

/* ---------- 3) 校验 ---------- */
const bad = out.filter(l => { try { JSON.parse(l); return false; } catch (e) { return true; } });
if (bad.length) { console.error(`FATAL: ${bad.length} 行非法 JSON`); process.exit(1); }
const rounds = [...new Set(out.map(l => { try { return JSON.parse(l).round; } catch (e) { return null; } }))].filter(Boolean).sort();
console.log('claims.jsonl JSON 全合法; 涉及轮次:', rounds.join(', '));
const r280 = out.filter(l => { try { return JSON.parse(l).round === 'r280'; } catch (e) { return false; } });
console.log('r280 认领记录:', r280.length, '条');
for (const l of r280) console.log('  ', l.slice(0, 160));
