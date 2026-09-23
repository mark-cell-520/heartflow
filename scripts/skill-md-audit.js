#!/usr/bin/env node
/**
 * SKILL.md agent 视角可用性审计（v6.7.81，心虫 decision.decide 0.89）
 *
 * SKILL.md 的读者是 AI agent，不是人类。前几轮守的都是 README/AGENTS
 * （人类视角），SKILL.md 从未被验证过。agent 照 SKILL.md 操作踩空 =
 * 整个 skill 对它归零。
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';

const skill = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf8');

// 从行内代码里抽路径与命令
const refs = new Set();
for (const m of skill.matchAll(/`([^`\n]+)`/g)) {
  const s = m[1].trim();
  if (/\.(js|py|json|md|sh|txt)$/.test(s) && !/\s/.test(s)) refs.add({ kind: 'path', v: s });
  else if (/^(node|npm|python3?)\s/.test(s)) refs.add({ kind: 'cmd', v: s });
}

const arr = [...refs];
console.log(`SKILL.md 引用了 ${arr.length} 个路径/命令\n`);

let bad = [];
for (const r of arr) {
  if (r.kind === 'path') {
    const full = path.join(ROOT, r.v);
    const ok = fs.existsSync(full);
    if (!ok && /^data\//.test(r.v)) {
      // [v6.7.81] data/ 下的文件多为运行时产物（首次 store/recall 才创建），
      // 不存在不是踩空。SKILL.md 应声明语义，审计器不判红灯。
      console.log(`⏭️  运行时  ${r.v}（data/ 下运行时产物，初始可不存在）`);
      continue;
    }
    console.log(`${ok ? '✅' : '❌'} 存在   ${r.v}`);
    if (!ok) bad.push(r.v);
  } else {
    const m = r.v.match(/^(node|npm|python3?)\s+(\S+)/);
    console.log(`⏭️  命令   ${r.v}（脚本存在性另行检查）`);
    if (m && !fs.existsSync(path.join(ROOT, m[2]))) {
      console.log(`   └─ ❌ 脚本 ${m[2]} 不存在`);
      bad.push(r.v);
    }
  }
}

console.log(`\n踩空项: ${bad.length}`);
if (bad.length) { console.log(bad.join('\n')); process.exit(1); }
console.log('SKILL.md agent 视角无踩空');
