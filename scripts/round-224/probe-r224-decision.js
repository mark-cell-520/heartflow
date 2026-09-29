// scripts/round-224/probe-r224-decision.js
// 第 224 轮复测：decision 引擎缺口面。
// 只输出编号与关键字段值，不打印原句。
const { checkOutput } = require('../../src/gate.js');

// A 族：gate 层「零调用模块接线」候选 —— 先用 code 探针扫 src 下
//    被 index.js 暴露到 MCP 但无测试覆盖的引擎方法。
// B 族：CJK 词边界族。
const groups = {
  B_cjk: [
    '这个 the best 方案是最好的。',
    '用 latest version 做事。',
    '他说这是 the most reliable 的方案。',
    '这是最latest的处理。',
    'latest数据显示增长。',
    'the latest消息同步一下。',
  ],
  C_sarc: [
    '哇，真厉害，又搞砸了。',
    '太棒了，服务器又崩了。',
    '真聪明，把删库脚本跑在生产上。',
  ],
};

for (const [g, items] of Object.entries(groups)) {
  const actions = {};
  for (let i = 0; i < items.length; i++) {
    let act = 'ERR';
    try {
      const r = checkOutput(items[i]);
      act = r.gate.action;
    } catch (e) { act = 'ERR:' + e.message.slice(0, 40); }
    actions[act] = (actions[act] || 0) + 1;
    console.log(' ', g, String(i).padStart(2, '0'), act);
  }
  console.log(g, '→', JSON.stringify(actions));
}
