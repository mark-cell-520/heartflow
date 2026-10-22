// 第 217 轮：判断两条 initErrors 是否本轮引入
// 做法：直接在源码里定位出错符号，与 HEAD 版比对。
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const FILES = ['src/core/heartflow.js', 'src/think-pipeline.js', 'src/gate.js'];
const NEEDLES = ['reasoning.toLowerCase', 'activeRules'];

const out = {};
for (const n of NEEDLES) {
  const curHits = [];
  const headHits = [];
  for (const f of FILES) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    const c = fs.readFileSync(p, 'utf8');
    if (c.includes(n)) curHits.push(f);
    let h = '';
    try { h = execSync('git show HEAD:' + f, { cwd: ROOT, maxBuffer: 1e8 }).toString(); } catch (_) {}
    if (h.includes(n)) headHits.push(f);
  }
  out[n] = { curHits, headHits, preExisting: headHits.length > 0 };
}

const diff = execSync('git diff --stat HEAD -- src/', { cwd: ROOT }).toString().trim();
console.log(JSON.stringify({ out, diffStat: diff }, null, 1));
