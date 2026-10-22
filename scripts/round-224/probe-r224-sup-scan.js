// scripts/round-224/probe-r224-sup-scan.js
// 第 224 轮复测探针：中文「最+X」族当前命中分布。
// 纪律：只输出编号与 gate.action，不打印原句（451 原文不进上下文）。
const { checkOutput } = require('../../src/gate.js');

// 每个条目：[编号, 期望族, 样本文本]
// 族划分只为统计，不参与判定。
const groups = {
  A_zhishidian: [
    '这款耳机的降噪深度是业界最大的。',
    '这台空调的能效比是全行业最高的。',
    '该算法的准确率在这个数据集上是最高的。',
    '这块屏幕的亮度是同级里最高的。',
    '这个方案的并发能力是线上最高的。',
    '这辆车的续航里程是同级别最高的。',
  ],
  B_kehu: [
    '我们的客户满意度是最高的。',
    '该品牌的复购率是全行业最高的。',
    '这款产品的退货率是全平台最低的。',
    '我们的交付准时率是最高的。',
    '该团队的人均产出是最高的。',
    '这套系统的可用性是全年最高的。',
  ],
  C_wupin: [
    '这是最省心的方案。',
    '这是最贴心的服务。',
    '这是最耐用的型号。',
    '这是最灵敏的传感器。',
    '这是最难用的界面。',
    '这是最吵的风扇。',
    '这是最脏的角落。',
    '这是最新鲜的食材。',
  ],
  D_xuni: [
    '这是最理想的方案。',
    '这是最完美的选择。',
    '这是最稳妥的做法。',
    '这是最明智的决定。',
    '最合理的解释是这个。',
    '最可靠的方法是先做实验。',
  ],
  E_shijian: [
    '最近的数据显示用户增长了。',
    '最新的版本已经修复了这个问题。',
    '最近一段时间没有收到反馈。',
    '最新的进展同步一下。',
    '最终版本定稿了。',
    '最初的设计稿在这里。',
  ],
  F_duiliang: [
    '这个组合的最大回撤是 12%。',
    '该模型的最小误差是 0.03。',
    '最大连接数设为 500。',
    '最高优先级队列已启用。',
    '最大并发数限制为 100。',
    '最小样本量要求是 30。',
  ],
};

const summary = {};
for (const [g, items] of Object.entries(groups)) {
  let nonPass = 0;
  const actions = {};
  for (let i = 0; i < items.length; i++) {
    let act = 'ERR';
    try {
      const r = checkOutput(items[i]);
      act = r.gate.action;
    } catch (e) { act = 'ERR:' + e.message.slice(0, 40); }
    actions[act] = (actions[act] || 0) + 1;
    if (act !== 'pass') nonPass++;
    console.log(' ', g, String(i).padStart(2, '0'), act);
  }
  summary[g] = { total: items.length, nonPass, actions };
  console.log(g, '→ 非 pass', nonPass + '/' + items.length, JSON.stringify(actions));
}
console.log('汇总:', JSON.stringify(summary));
