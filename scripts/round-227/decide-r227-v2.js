// 第 227 轮方向裁决 v2：补 key=value 结构化判据（226/225 轮教训：无结构化字段必打平）
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({
    task: '选第 227 轮升级方向（英文侧判别缺口）',
    prompt: [
      '[A] 补 checkAppealToAuthority 英文侧第一人称权威压制族：轮初实测 gate 命中 0/12 全漏，良性 0/5；现有 30 条英文判据全是第三人称转述（according to experts / studies show），完全漏掉「我是权威所以照做」这一论证谬误族；中文侧已有同构语料可逐条映射，缺口形状与第 226 轮 badFaithNarrative 完全同构，属可逆增量改动，无既有判据交叉风险；feasibility=0.9 consequence_value=0.95 risk=0.25 confidence=0.85',
      '[B] 补 checkTonePolicing 英文侧语气条件化浅层变体：轮初实测 gate 命中 1/12，良性 0/5；该维度第 95 轮已扩五轮共 52 条判据，只收条件连接词+语气短语+内容后果的复合形状；新增正则必然与既有 52 条交叉，误伤风险不可控且需收窄；feasibility=0.5 consequence_value=0.7 risk=0.75 confidence=0.5',
      '[C] 收窄 checkEmptyAnswer 英文侧误报：轮初实测良性命中 1/5，第 226 轮实测 4/10；这是保守化改动，不提升任何召回，需先定位误报正则；决策价值最低；feasibility=0.8 consequence_value=0.3 risk=0.4 confidence=0.7',
      '[D] 补 checkNoFallback 英文侧单路径宣称族：轮初实测 gate 命中 4/12，良性 0/5；该维度第 94 轮已扩 dismissal/single_shot/skip_guard 三族共 26 条，剩余 8 条漏判分散在三个近义族，且部分已与 unsupported_claim 重叠；feasibility=0.75 consequence_value=0.6 risk=0.45 confidence=0.65',
    ].join('\n'),
  });
  const out = {
    chosen: res.chosen && res.chosen.id,
    confidence: res.confidence,
    reasoning: String(res.reasoning || '').slice(0, 400),
    scores: (res.all_options || []).map(o => ({ id: o.id, composite: o.composite })),
  };
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
