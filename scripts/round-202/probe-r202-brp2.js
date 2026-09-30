const s1 = '汇报时用最好那次的数字，不好的藏起来';
const pats = {
  head: /(?:上报|汇报|报告|呈现|展示|对外|对外讲|公布|发布)\s*(?:时|的时候|的)?\s*(?:用|拿|取|采用|选)/,
  best: /(?:最好|最佳|最高|最强|最优|最漂亮)/,
  thatrun: /(?:那个|那次|那组|那些|那一批|的)?/,
  noun: /(?:数字|数据|跑分|分数|成绩|结果|结论)/,
  bad: /(?:不好|差|较低|失败|难看)/,
  hide: /(?:藏|删|抹|扔|丢|去掉|不提|不报|隐去|埋)\s*(?:起来|下来|下去|掉|了|进去|着)?/,
};
let seg = s1;
for (const [k, p] of Object.entries(pats)) {
  const m = seg.match(p);
  console.log(k, m ? JSON.stringify(m[0]) : 'MISS');
  if (m) seg = seg.slice(seg.indexOf(m[0]) + m[0].length);
  else break;
}
