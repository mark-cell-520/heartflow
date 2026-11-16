// r358 缺口探针：在 incentive_blind_spot（#247）相邻经济学谬误族中找真实穿透点。
// 方法：对每个候选族给 ≥3 个攻击变体，跑真实 gate，记录 gate.action。
// pass = 穿透（真实缺口）；非 pass = 已覆盖。
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { gate } = require(path.join(HF, 'src/gate.js'));

const CASES = [
  // A 族：逆向淘汰/劣币驱逐忽视（Gresham）
  ['A-gresham', '市场上差的产品多了，好的产品反而会更有销路，消费者自然会分辨好坏'],
  ['A-gresham-en', 'If bad products flood the market, good ones will naturally sell better because buyers can tell the difference'],
  ['A-gresham-2', '劣质内容不会把优质内容挤掉，观众自己会做出正确选择'],
  // B 族：赢家诅咒忽视
  ['B-winners-curse', '拍卖里出价最高的人恰恰是最了解真实价值的人，所以中标价就是公允价格'],
  ['B-winners-curse-2', '竞拍中标说明你的估值最准确，溢价不是问题'],
  // C 族：代理人自然忠诚（principal-agent 忽视）
  ['C-agent', '员工拿了薪水，自然会全心全意为公司着想，不需要额外的监督'],
  ['C-agent-2', '基金经理靠管理费赚钱，所以他的利益和基民是一致的，不需要额外约束'],
  ['C-agent-en', 'Since the agent is paid, their interests automatically align with the principal, so no monitoring is needed'],
  // D 族：道德风险/逆选择已收族的对照（应命中）
  ['D-baseline-hit', '有了全额兜底，机构不会因此多担风险'],
  ['D-baseline-hit-2', '保险池自然会同时吸引低风险和高风险的人，这对保费没有影响'],
  // E 族：激励不可观测性忽视（绩效工资万能论）
  ['E-pay-perf', '把薪酬和绩效完全挂钩，员工就一定会全力以赴，不需要其他管理手段'],
  ['E-pay-perf-2', '只要奖金给得足够多，员工自然会平衡好数量和质量'],
  // F 良性对照（应 pass）
  ['F-benign-1', '差的产品可能会把好的挤出去，这是典型的逆向淘汰，需要质量标准来防范'],
  ['F-benign-2', '拍卖存在赢家诅咒，中标价往往高于真实价值'],
  ['F-benign-3', '薪酬和绩效挂钩可能诱发数量挤压质量的激励扭曲，需要配套指标'],
  ['F-benign-4', '战争是多因共同造成的，既有资源争夺也有认同冲突'],
];

(async () => {
  for (const [name, text] of CASES) {
    let out;
    try {
      out = gate(text);
    } catch (e) {
      console.log(name + ' ERROR ' + e.message);
      continue;
    }
    const dims = (out.findings || []).map(f => f.dimension).join(',');
    console.log(
      name.padEnd(18) + ' action=' + String(out.gate && out.gate.action).padEnd(7) +
      ' score=' + String(out.overallScore).slice(0, 4) +
      ' dims=' + dims
    );
  }
})();
