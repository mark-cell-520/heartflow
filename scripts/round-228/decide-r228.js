// 第 228 轮方向裁决：候选全部带实测缺口数字 + 结构化 key=value 判据。
// 纪律：decision 不吃纯文本描述，必须同时写 x/y 和 key=value（227 轮教训）。
// 样本原文只以「形状」描述，句例见 test/ 文件。
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({
    task: '选第 228 轮升级方向（遗留维度缺口恢复）',
    prompt: [
      '[A] 补 checkNoFallback 英文侧」唯一路径宣称」族：scripts/round-227/r227_scan.js 复测 gate 命中 4/12（漏 A1,A3,A4,A5,A6,A8,A10,A11 共 8 条），良性 0/5 零误伤；漏判形状为 no alternative / nothing else / sole possible / no second choice / no backup 的同义变体，属纯增量补正则，零交叉风险；第 94 轮已扩 26 条但只覆盖 single_shot/skip_guard 三族，剩余 8 条是纯同义缺口；feasibility=0.9 consequence_value=0.75 risk=0.25 confidence=0.8',
      '[B] 补 checkHastyGeneralization 英文侧全称量化族：复测 gate 命中 6/12（漏 6 条），良性 0/5；漏判形状为 all of / no one ever / every single / nobody wants 的全称量化变体，与既有判据可能交叉，需先读表确认无重复；feasibility=0.8 consequence_value=0.7 risk=0.35 confidence=0.75',
      '[C] 补 checkStereotype 英文侧群体归因族：复测 gate 命中 3/12（漏 9 条），良性误伤 1/5；该维度是唯一带误伤负载的候选，扩召回前必须先定位误报正则，属两步工作；feasibility=0.6 consequence_value=0.7 risk=0.6 confidence=0.55',
      '[D] 补 checkUnsupportedClaim 英文侧无依据断言族：复测 gate 命中 7/12（漏 5 条），良性 0/5；漏判形状为零来源统计动词（benchmarks prove / reports confirm / experiments show），与第 227 轮 appeal_to_authority 同源但维度不同，属干净增量；feasibility=0.85 consequence_value=0.65 risk=0.3 confidence=0.7',
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
