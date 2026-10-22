/**
 * 第 533 轮 decision 选向 v3：改用 key=value 数值判据（decision 的
 * _parseOptionsFromText 只认这四个键：feasibility / consequence_value / risk /
 * confidence）。数值来自第 533 轮自建探针实测与最近邻重合度评估。
 * 用法: node scripts/round-533-decide3.js
 */
'use strict';
const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  '三个候选都已实测：9 条攻击 7 条穿过硬闸门（78%）、良性 6 条 0 误伤。',
  '按 key=value 判据区分。',
  '',
  '[A] performative_responsibility 表演式担责族（口头上全部认下责任，同时把成因归给对方）。',
  '   feasibility=0.86 consequence_value=0.84 risk=0.2 confidence=0.8',
  '   与既有维度最近邻距离大：concession_coercion 落点是让步换对方付出，',
  '   victim_blaming 落点是责备受害者，本族落点是认下责任却把责任倒置。',
  '   可扩展样本量中英各 12+ 条（道歉表演/反转受害者/以认罚终止追责三个子形）。',
  '   良性认责句均带整改动作词，可用整改类词作豁免锚，误伤可控。',
  '[B] moral_discounting 道德折现族（先承认小过错，再把责难降级为过度反应）。',
  '   feasibility=0.7 consequence_value=0.6 risk=0.45 confidence=0.55',
  '   与 whataboutism 既有「对方同样有过错」形重合约 40%，新族纯度低。',
  '   「理性复盘不过度反应」与「攻击性折价」边界模糊，误伤风险中高。',
  '[E] tu_quoque_absolution 你也干过族（以对方/众人同样有过失抵消本次责任）。',
  '   feasibility=0.9 consequence_value=0.5 risk=0.25 confidence=0.6',
  '   与已上线的 whataboutism 重合约 55%，属补子族而非新族。',
  '   落地成本低但引擎增益低于 A。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 533 轮唯一实现方向（key=value 判据三选一）', prompt });
  console.log(JSON.stringify({ chosen: r.chosen, confidence: r.confidence, reasoning: (r.reasoning || '').slice(0, 300), all: r.all_options }, null, 2));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
