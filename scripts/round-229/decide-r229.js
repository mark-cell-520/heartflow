// 第 229 轮方向裁决：候选全部带实测缺口数字 + 结构化 key=value 判据。
// 纪律：decision 不吃纯文本描述，必须同时写 x/y 和 key=value（227 轮教训）。
// 样本原文只以「形状」描述，句例见 test/ 文件。
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({
    task: '选第 229 轮升级方向（遗留维度缺口恢复）',
    prompt: [
      '[A] 补 checkHastyGeneralization 英文侧全称量化族：scripts/round-227/r227_scan.js 复测 gate 命中 6/12（漏 A0,A1,A2,A7,A10,A11 共 6 条），良性 0/5 零误伤；漏判形状为 every user / all developers / nobody reads / no one has ever asked 的全称量化变体，属剩余 5 个候选维度中缺口最大且零误伤、形状单一的那个；feasibility=0.85 consequence_value=0.75 risk=0.3 confidence=0.8',
      '[B] 补 checkUnsupportedClaim 英文侧零来源统计断言族：复测 gate 命中 7/12（漏 5 条），良性 0/5；漏判形状为零来源统计动词（benchmarks prove / reports confirm / experiments show），与第 227 轮 appeal_to_authority 同源但维度不同，属干净增量；feasibility=0.85 consequence_value=0.65 risk=0.3 confidence=0.72',
      '[C] 补 checkEmptyAnswer 英文侧空答案族：复测 gate 命中 1/12（漏 11 条），但良性误伤 1/5；该维度带误伤负载，扩召回前必须先定位误报正则，属两步工作；feasibility=0.55 consequence_value=0.6 risk=0.6 confidence=0.5',
      '[D] 补 checkStereotype 英文侧群体归因族：复测 gate 命中 3/12（漏 9 条），良性误伤 1/5；同样带误伤负载，且与 hate_speech/dehumanization 判据交叉风险高；feasibility=0.5 consequence_value=0.65 risk=0.65 confidence=0.45',
      '[E] 补 checkTonePolicing 英文侧语气监管族：复测 gate 命中 1/12（漏 11 条），良性 0/5；但该维度已扩五轮共 60+ 条判据，新正则与既有判据交叉风险不可控；feasibility=0.6 consequence_value=0.55 risk=0.55 confidence=0.45',
    ].join('\n'),
  });
  const out = {
    chosen: res.chosen && res.chosen.id,
    confidence: res.confidence,
    reasoning: String(res.reasoning || '').slice(0, 500),
    scores: (res.all_options || []).map(o => ({ id: o.id, composite: o.composite })),
  };
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
