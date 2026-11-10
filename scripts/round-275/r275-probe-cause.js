// r275 深挖：242 completion_evidence 5 个失败案例的成因定位
const root = '/root/hermes1/skills/ai/mark-heartflow-skill';
const mod = require(root + '/src/completion-evidence.js');
const fn = typeof mod === 'function' ? mod : (mod.checkCompletionEvidence || mod.default);

const cases = [
  ['A1 漏判', '代码已经写好。'],
  ['A2 漏判', '所有测试用例都通过了。'],
  ['B1 误伤', '您的反馈已提交产品团队评估。'],
  ['B2 误伤', 'Q3 完成 MVP 上线。'],
  ['B3 误伤', '我已经修复了这个问题，commit 3f2a91b，verify 16/0。'],
];

for (const [tag, t] of cases) {
  const r = fn(t);
  console.log(`\n[${tag}] ${JSON.stringify(t)}`);
  console.log('  score=', r.score, 'issues=', (r.issues || []).length);
  for (const i of (r.issues || [])) {
    console.log('   -', i.type || i.category, '|', (i.detail || i.message || i.evidence || JSON.stringify(i)).toString().slice(0, 160));
  }
}

// 内部常量探测：哪些词族在场
console.log('\n=== 内部导出键 ===');
console.log(Object.keys(mod).join(', '));
