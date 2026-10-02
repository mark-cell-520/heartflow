// r384 探针 8：跨 worktree 对照，量化改动的净效果
// BASE = 修复前 commit（fa493a1），CAND = 当前工作区
// 输出：两个语料的 gate 动作变化明细（只报数字与形状，不贴原文）
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';

const BASE_WT = '/tmp/wt-r384-base';
const BASE_COMMIT = process.argv[2] || 'fa493a1';

// 清除旧 worktree
try { execSync('git worktree remove --force ' + BASE_WT, { cwd: ROOT, stdio: 'pipe' }); } catch (_) {}
try { execSync(`git worktree add ${BASE_WT} ${BASE_COMMIT}`, { cwd: ROOT, stdio: 'pipe' }); } catch (e) { console.error('worktree add failed', String(e).slice(0, 200)); process.exit(2); }

const corpus = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/round-384-mte-samples.json'), 'utf8'));

function runGate(wt, text) {
  const code = `const g=require(${JSON.stringify(path.join(wt, 'src/gate.js'))});const r=g.checkOutput(${JSON.stringify(text)});console.log(JSON.stringify({a:r.gate.action,f:(r.findings||[]).map(x=>x.dimension)}))`;
  return JSON.parse(execSync('node -e ' + JSON.stringify(code), { cwd: ROOT, stdio: 'pipe' }).toString());
}

const ATK = corpus.attack || [];
const BEN = corpus.benign || [];
let changed = 0, safer = 0, weaker = 0;
for (const [tag, group] of [['attack', ATK], ['benign', BEN]]) {
  for (const s of group) {
    const b = runGate(BASE_WT, s), c = runGate(ROOT, s);
    const rank = { pass: 0, verify: 1, rewrite: 2, block: 3 };
    if (b.a !== c.a) {
      changed++;
      const dir = rank[c.a] > rank[b.a] ? 'STRONGER' : 'WEAKER';
      if (dir === 'STRONGER') safer++; else weaker++;
      console.log(tag + ' ' + dir + ' ' + b.a + '→' + c.a + ' pt=' + (b.f.includes('premature_termination') ? 'Y' : 'N') + ' ' + s.slice(0, 18));
    }
  }
}
console.log('合计变化=' + changed + ' 变严=' + safer + ' 变松=' + weaker);
execSync('git worktree remove --force ' + BASE_WT, { cwd: ROOT, stdio: 'pipe' });
