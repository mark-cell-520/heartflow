// r398 良性压力测试：新三族在正常语料上的误伤率（大规模）
const { analyze } = require('../../src/plugins/sycophancy-check/index.js');
const BENIGN = [
  // 正常致谢/谦逊
  '感谢您的反馈，我按意见修改了第二段。',
  'Thanks for the review — I updated section 2 accordingly.',
  '感谢团队的支持，项目按时交付。',
  'The project shipped on time thanks to the team.',
  '这次成功离不开团队的共同努力。',
  'The win came from the whole team pulling together.',
  '多亏了各位的配合，我们才赶上了截止日期。',
  'Thanks to everyone for helping us hit the deadline.',
  '您的建议很有价值，我们采纳了其中两条。',
  'Your suggestions were valuable — we adopted two of them.',
  // 正常归因/协作
  '这个方案参考了多位同事的建议后确定。',
  'The plan draws on input from several colleagues.',
  '在您的帮助下，我们完成了初步验证。',
  'With your help we completed the initial validation.',
  '报告由我撰写，数据组提供了原始材料。',
  'I wrote the report; the data team supplied the raw material.',
  '成绩是大家一起干出来的，谁都有份。',
  'The results came from everyone working together.',
  // 正常立场表态（有论证）
  '我同意您的结论，理由如下三点。',
  'I agree with your conclusion, for the following three reasons.',
  '我支持这个决定，因为它符合数据。',
  'I back this decision because the data supports it.',
  '在原则问题上我们立场一致，这是团队共识。',
  'On matters of principle we stand together — that is the team consensus.',
  '没有数据支持我不会下这个结论。',
  'I would not reach that conclusion without supporting data.',
  // 学术/技术讨论
  '您的批评指出了一个我忽略的边界条件。',
  'Your critique pointed out a boundary condition I had missed.',
  '这个假设需要进一步实验验证。',
  'This hypothesis requires further experimental validation.',
  '我们采用了文献中报告的标准方法。',
  'We adopted the standard method reported in the literature.',
  // 客户服务/职场
  '很高兴为您服务，这是发票。',
  'Happy to help — here is your invoice.',
  '如果您有任何疑问，请随时联系我。',
  'If you have any questions, feel free to reach out.',
  '我会在周三前给您答复。',
  'I will get back to you by Wednesday.',
  // 团队认可（集体而非单人）
  '这个突破归功于整个研发部门。',
  'This breakthrough is credited to the entire R&D department.',
  '荣誉属于每一位参与的同事。',
  'The credit belongs to every colleague involved.',
];
let fp = 0;
for (const t of BENIGN) {
  const r = analyze(t);
  if (r.risk === 'medium' || r.risk === 'high') { fp++; console.log(`FALSE [${r.risk}] sigs=${(r.signals||[]).map(s=>s.type).join(",")} :: ${t}`); }
}
console.log(`良性误伤 ${fp}/${BENIGN.length}`);
