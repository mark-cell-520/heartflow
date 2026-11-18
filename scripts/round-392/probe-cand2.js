// r392 二段候选：排除既有维度代拦，找真实穿透缺口
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const cases = {
  // 候选1：分配三段论——"对A成立，对B成立，所以对全体成立"（数字/比例语境）
  distrib: [
    ['A','我们组的三个成员都超额完成了任务，所以全公司这个季度都超额完成了任务'],
    ['A','A区和B区的房价都在涨，所以全国房价都在涨'],
    ['A','抽样调查的这几个城市犯罪率都下降了，所以全国犯罪率都下降了'],
    ['A','Every province reported growth this year, so the entire national economy is booming'],
    ['A','These two hospitals improved outcomes, therefore all hospitals improved outcomes'],
    ['A','这只股票连续三天上涨，所以整个股市都在上涨'],
  ],
  // 候选2：析取引入/消除错误——"或者…或者…"排除一个推另一个，但选项非穷尽
  disj: [
    ['A','你要么支持这个政策，要么你就是不爱国'],
    ['A','你不认同公司的决定，那你就是想跳槽了'],
    ['A','Either you agree with the plan or you are against progress'],
    ['A','这不是我造成的，那就是你的责任'],
    ['A','方案没成功，说明执行的人能力不行'],
  ],
  // 候选3：统计意义上的"双重标准"——同一指标两种口径
  dstd: [
    ['A','对手犯错说明他品行有问题，我们犯错只是无心之失'],
    ['A','别国补贴叫保护主义，我们补贴叫产业政策'],
    ['A','他们涨薪是市场行为，我们涨薪是成本失控'],
    ['A','Their cuts are ideological, our cuts are pragmatic'],
  ],
  // 候选4：循环定义/乞题（begging the question 的操作性变体——把待证命题当前提重述）
  circular: [
    ['A','这个药有效，因为凡是有效的药都像它这样'],
    ['A','他可信，因为可信的人才会做出他这样的承诺'],
    ['A','市场会继续涨，因为持续上涨的市场就是这样'],
    ['A','The policy works because effective policies look exactly like this one'],
  ],
};
const benign = [
  '我们组三个成员都完成了任务，说明这个季度团队的协作是顺畅的',
  '这只股票上涨说明市场对财报有正面反应',
  '你要么接受调解，要么就走法律程序，这是两条可选路径',
  '这不是我造成的，可能是第三方因素',
  '对手在这个问题上确实违反了规则，我们只是流程瑕疵',
  '这个药在双盲试验中显示有效，因为主要终点达到了预设标准',
];
let n=0,p=0;
for (const [k, arr] of Object.entries(cases)) {
  let h=0, z=0;
  arr.forEach(([_,t]) => { const r=gate(t); if (r.gate.action!=='pass') h++; else z++; });
  console.log(`${k}: 命中 ${h}/${arr.length} 穿透 ${z}`);
}
console.log('--- 良性 ---');
benign.forEach(t => { const r=gate(t); if (r.gate.action==='pass') p++; else n++; console.log(`[${r.gate.action}] ${(r.findings||[]).map(f=>f.dimension).join(',')} :: ${t.slice(0,40)}`); });
console.log(`良性 pass ${p}/${benign.length} 非pass ${n}`);
