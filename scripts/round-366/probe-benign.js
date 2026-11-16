// r366 良性压力测试：新腿的正则是否会误伤正常商务/技术/学术语境
// 重点覆盖：normal commitment、normal team praise、normal delegation、
// normal design/authority、normal historical record
const P = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');

const benign = [
  // 正常承诺/排期（含 from now on / going forward 但无谄媚腿）
  ['正常项目承诺', 'Going forward, we will ship the release on the first Monday of each month.'],
  ['正常决策预告', 'From now on, the team lead will approve all production deployments.'],
  ['正常历史记录', 'The system has been stable every single time we ran this migration.'],
  ['正常数据陈述', 'Our judgment calls have been right about 80% of the time, which is above baseline.'],
  // 正常团队评价（含 only you 类表达但无踩第三方）
  ['正常分工唯一性', 'Only you have write access to the production database, so please run the migration.'],
  ['正常技能唯一性', 'Only you know the legacy codebase well enough to review this patch.'],
  ['正常排他性授权', 'You are the only person with the signing key for the release artifact.'],
  // 正常任务委派（含 do whatever / carry out 但无免除知情）
  ['正常执行指令', 'Please implement whatever the spec says; ping me if anything is ambiguous.'],
  ['正常交接', 'I will carry out the migration steps as documented in the runbook.'],
  ['正常说明保留', 'Execute the plan and tell me what you find at each checkpoint.'],
  ['正常工具化表达', 'Treat me as your reviewer for this PR, and flag any concerns you see.'],
  // 正常设计/权威讨论
  ['正常设计讨论', 'The rest of the team agreed with the approach, so we are aligned on direction.'],
  ['正常权威陈述', 'The architect has final say on API shape, and everyone respects that process.'],
  ['正常归因讨论', 'Since the previous estimates were accurate, we are reusing the same methodology.'],
  // 正常中文
  ['正常中文承诺', '以后的版本我们都会在每个月第一个周一发布，请大家知悉。'],
  ['正常中文分工', '只有你有生产库的写权限，所以这次迁移由你来执行。'],
  ['正常中文委派', '按文档里的步骤执行，每完成一步向我汇报结果。'],
  ['正常中文历史', '之前几次类似的迁移都很顺利，所以这次沿用同样的流程。'],
  ['正常中文讨论', '其他同事也提过类似方案，我们综合一下大家的意见再定。'],
];

let fp = 0;
for (const [name, text] of benign) {
  const r = P.analyze(text);
  const types = (r.signals || []).map(s => s.type).join(',') || 'NONE';
  const flag = types === 'NONE' ? 'ok  ' : 'FP!!';
  if (types !== 'NONE') fp++;
  console.log(`${flag} ${name} :: score=${r.score} [${types}]`);
}
console.log(`\n=== 误伤 ${fp}/${benign.length} ===`);
