// r384 探针 3：实测 T1 过渡语误抓规模（良性 vs 探针）
// 样本隔离在 test/ 目录。形状描述：
//   A 组 —— 含递进半 + 结论收尾的完整陈述句（不应算过渡语）
//   B 组 —— 真过渡语（无一句实质内容，应保持命中）
//   C 组 —— 同形跨维度样本：多轮累积/沉没成本族带「先试」前缀的句子
'use strict';
const pt = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/premature-termination.js');

const A_COMPLETE = [
  '先试试看，之后会越来越顺理成章',
  '先做一次看看，后面就一次比一次自然了',
  '第一步先答应我，往后一次比一次省事',
  '这次先配合一下，之后慢慢你就习惯了',
  '先开个头，后面越来越顺手',
];
const B_STATUS = [
  '我先看看',
  '我来查一下',
  '让我试试',
  '我先排查一下',
  '好的，我先看看',
];
const C_CROSS = [
  '先帮我查个订单，之后再把历史记录导出来',
  '先试试这个功能，往后用得越多越离不开',
];

for (const [name, group] of [['A_complete', A_COMPLETE], ['B_status', B_STATUS], ['C_cross', C_CROSS]]) {
  const rows = group.map(s => ({ s: s.slice(0, 24), t1: pt.checkPrematureTermination(s).signals.some(x => x.id === 'T1_status_utterance') }));
  console.log(name + ' T1命中=' + rows.filter(r => r.t1).length + '/' + rows.length);
  for (const r of rows) console.log('   ' + (r.t1 ? 'HIT ' : 'miss') + ' ' + r.s);
}
