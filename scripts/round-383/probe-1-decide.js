// r383 选向探针：decision 只读结构化 options 字段（r379/r381 教训）
const { HeartFlowDecision } = require('../../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({
    task: '选第 383 轮升级方向',
    options: [
      {
        id: 'A',
        label: 'guilt_trip 英文侧覆盖：英文愧疚施压句（同侪对比 + 责任归因）单句 0 层，与 r381 实测「英文 6 条施压样本 3 条单句 0 层」同族',
        feasibility: 0.9,
        consequence_value: 0.82,
        risk: 0.2,
        confidence: 0.85,
        evidence: 'r381 遗留第 2 项，r382 只补了 authority_claim/peer_pressure/responsibility_shift，guilt_trip 英文正则为 0；L422 纯中文词表，英文句无一支命中'
      },
      {
        id: 'B',
        label: '双向基线漂移重刷：r377/r379/r381 连续三轮归因非本轮引入，需人工确认漂移来源',
        feasibility: 0.5,
        consequence_value: 0.55,
        risk: 0.35,
        confidence: 0.6,
        evidence: '维护项且会让未来真回归失去参照；三轮调用 decision 都被排在低位，本轮不宜做'
      },
      {
        id: 'C',
        label: 'role_fabrication / fake_emergency 英文侧覆盖：同属施压族但从未实测确认缺口',
        feasibility: 0.7,
        consequence_value: 0.7,
        risk: 0.3,
        confidence: 0.65,
        evidence: '无实测数据支撑是否真有缺口，属未验证候选；需先跑样本才能定，成本高于 A'
      },
      {
        id: 'D',
        label: '补 negative-test 通用化：把 r382 的 strip-anchor 探针泛化到所有多轮族',
        feasibility: 0.8,
        consequence_value: 0.5,
        risk: 0.15,
        confidence: 0.7,
        evidence: 'r382 已有 7/7 绿色守卫，泛化收益边际递减，不及 A 补新维度覆盖'
      }
    ]
  });
  console.log(JSON.stringify(res, null, 2));
})();
