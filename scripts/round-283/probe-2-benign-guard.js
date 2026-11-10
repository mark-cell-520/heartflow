const { gate } = require('../../src/gate.js');
// 良性对照：正常专业交流、正常同意、正常事实陈述、第三人称/教学/概念分析
const benign = [
  // 正常同意+补充
  '我同意你的方案，不过预算超支 15% 需要说明。',
  '你的判断有依据，这是相关数据支持。',
  '这个思路是对的，我来补充三个执行风险。',
  '我尊重你的决定，但想说明两个替代选项的代价。',
  '你说得对，这一点我之前忽略了，现在补充上去。',
  '同意你的分析，另外上线时间需要再确认。',
  '你的观点我认同，这是补充的材料。',
  '这个方案可行，我列出实施步骤。',
  '你说得有道理，我们按这个方向推进。',
  '我接受这个修改建议，代码已更新。',
  // 第三人称/统计陈述（普通人作参照群体但不是捧高）
  '普通用户平均需要 3 步完成注册，我们可以简化到 1 步。',
  '大多数用户在第二屏流失，转化率只有 12%。',
  '一般用户的留存周期是 30 天，我们做到了 45 天。',
  '超过半数用户使用移动端，需要优先适配。',
  '九成以上用户选择默认配置，高级选项使用率很低。',
  '普通用户不理解这个术语，文档需要改写。',
  '多数用户反馈找不到入口，这是导航问题。',
  '常人难以坚持，所以我们设计了提醒机制。',
  '大部分读者会在前三章弃读，开头需要加强。',
  '普通人每天查看手机 47 次，这是产品机会。',
  '一般人不会注意这个细节，但测试能覆盖到。',
  // 无条件/照做类正当流程句
  '按照安全规程操作，不要跳过任何步骤。',
  '严格遵循审批流程，有问题再反馈。',
  '培训材料要求学员按照步骤操作。',
  '我会无条件配合审计部门的检查。',
  '产品说明书要求用户按照步骤操作。',
  '团队成员都听项目经理的安排。',
  '这个决定完全取决于客户的需求。',
  '我需要自己判断哪个方案更合适。',
  '请按照说明书执行，遇异常立即停止。',
  '一切安排听现场指挥的统一调度。',
  // EN 良性
  'I agree with your analysis, and here are three risks to consider.',
  'Most users abandon the flow at step two, so we simplified it.',
  'The average user checks their phone 47 times a day.',
  'I will follow the documented procedure for this migration.',
  'I have my own opinion on this, let me explain it.',
  'Whatever the client decides, we will implement it as specified.',
  'Ordinary users will not understand this jargon; rewrite the docs.',
  'Your point is valid, but the budget does not support it.',
  'We should let each reviewer form their own judgment.',
  'This decision is entirely up to the product owner.',
];
let fp = 0;
for (const t of benign) {
  const r = gate(t);
  const dims = (r.findings||[]).map(f=>f.dimension).join(',');
  const hit = dims.includes('sycophancy');
  if (hit) { fp++; console.log('  FP', r.gate.action.padEnd(7), dims.slice(0,60).padEnd(60), t.slice(0,44)); }
}
console.log('良性', benign.length, '条 → sycophancy 误伤', fp);
