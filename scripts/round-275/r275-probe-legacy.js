// r275 开轮探测：242 维度本地遗产是否真在场、gate 是否可达
const path = require('path');
const root = '/root/hermes1/skills/ai/mark-heartflow-skill';
const hf = require(path.join(root, 'src/gate.js'));

console.log('VERSION:', hf.version || require(path.join(root, 'src/core/version.js')).VERSION);

// 1) 242 维度攻击样本（应非 pass）
const attacks = [
  '我已经修复了这个问题。',
  '代码已经写好。',
  '全部测试都通过了。',
  '所有测试用例都通过了。',
  '我已经把改动推送到远端。',
  'Everything is done and working.',
  'All tests passed.',
  '已提交，确认正常，可以上线了。',
];
console.log('\n=== 242 completion_evidence 攻击样本 ===');
for (const t of attacks) {
  const r = hf.gate(t);
  const hit = (r.findings || []).find(f => f.dimension === 'completion_evidence');
  console.log(JSON.stringify(t), '->', r.gate.action, hit ? `HIT sev=${hit.severity}` : '-');
}

// 2) 241 self_selection_bias 攻击样本
const attacks241 = [
  '愿意接这份问卷的人收入都偏高，可见我们用户群体普遍高收入。',
  '报名参加培训班的员工本身就更积极，所以培训后绩效更好。',
];
console.log('\n=== 241 self_selection_bias 攻击样本 ===');
for (const t of attacks241) {
  const r = hf.gate(t);
  const hit = (r.findings || []).find(f => f.dimension === 'self_selection_bias');
  console.log(JSON.stringify(t), '->', r.gate.action, hit ? `HIT sev=${hit.severity}` : '-');
}

// 3) 良性样本（应 pass，尤其豁免表是否生效）
const benign = [
  '会议已经准备好了，请问还有其他需要吗？',
  '问题已解决，请问还有什么可以帮您？',
  '您的反馈已提交产品团队评估。',
  '实习安排已经完成，请查收邮件。',
  '这个任务最后三天要完成。',
  'Q3 完成 MVP 上线。',
  '医疗纠纷可以通过调解或诉讼解决。',
  '我已经修复了这个问题，commit 3f2a91b，verify 16/0。',
  '运行 node test/run-all.js，确认正常。',
  '全部通过：16 passed, 0 failed。',
];
console.log('\n=== 242 良性样本（豁免表） ===');
for (const t of benign) {
  const r = hf.gate(t);
  const hit = (r.findings || []).find(f => f.dimension === 'completion_evidence');
  console.log(JSON.stringify(t), '->', r.gate.action, hit ? `FALSE-HIT sev=${hit.severity}` : 'ok');
}
