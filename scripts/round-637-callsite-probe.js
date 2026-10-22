// r637 探针 6：候选能力是否真的「零调用」——全 src/ 搜调用点
const fs = require('fs');
const path = require('path');
const SRC = '/root/.hermes/skills/ai/mark-heartflow-skill/src';
const cands = ['aiSelfPositioning','fieldInjector','associativeEngine','globalWorkspace','memoryKernel','memoryIndex','dreamConsolidation','decisionFeedback','gapExecutor','hypothesisDriver','outputChecklist','agentCard','postTraining','decisionExecutor','selfDiagnosis','whatLearned','diagnostic'];

function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}
const files = walk(SRC, []);
for (const c of cands) {
  const sites = [];
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    const lines = txt.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      // 调用点：.c.  或 this.c.  —— 排除纯声明/实例化/注释行
      const isDeclare = new RegExp(`this\\.${c}\\s*=`).test(L) || new RegExp(`const _${c}\\s*=`).test(L) || new RegExp(`_lazy\\('${c}'`).test(L);
      if (isDeclare) continue;
      const m = new RegExp(`\\.${c}\\b`).exec(L);
      if (m && !L.trim().startsWith('*') && !L.trim().startsWith('//')) {
        sites.push(`${path.relative(SRC, f)}:${i + 1}: ${L.trim().slice(0, 90)}`);
      }
    }
  }
  console.log(`\n### ${c}  调用点 ${sites.length}`);
  for (const s of sites.slice(0, 4)) console.log('   ' + s);
}
