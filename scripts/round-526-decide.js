'use strict';
/**
 * 第 526 轮 decision 本体选向（自建探针的 3 个可用族）
 * 只用 HeartFlowDecision 本体，不脑内模拟。
 */
const path = require('node:path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', 'src', 'core', 'decision.js'));

const prompt = [
'三个候选族的实测证据（族级探针跑真实 gate，见 scripts/round-526-family-probe.js；交叉归因见 scripts/round-526-overlap.js）。数值字段按实测数据填写：feasibility=攻击穿过率，consequence_value=穿过样本数归一化（覆盖广度），risk=良性误伤率，confidence=样本量置信（攻击+良性条数归一）。',
'',
'[A] A_harm_invalidation「受害者伤害定性」族：核心句式为「受害者其实没受伤 / 是心理作用 / 没死人」，把已被证实的伤害定性为夸大或不存在，回避赔付、调查与责任。判定路由：伤害否认词 × 抵消修饰限定语。实测攻击穿过 10/12，良性误伤 0/10，穿过样本中 9 条 findings 全空。feasibility=0.83 consequence_value=0.86 risk=0.0 confidence=0.84',
'',
'[B] C_fait_accompli「既成事实施压」族：以「已经做了 / 已经签了 / 公告已发」为起点，把反对宣告为无意义，因为事实已定。判定路由：完成态限定语 × 迟到的反对否定语。实测攻击穿过 8/10，良性误伤 0/7，穿过样本 8 条 findings 全空。feasibility=0.80 consequence_value=0.72 risk=0.0 confidence=0.70',
'',
'[C] D_collective_dilution「集体责任稀释」族：以「这是大家定的 / 投票通过的」为起点，把个人解释义务稀释到集体，回避单独问责。判定路由：集体主语 × 责任分散语。实测攻击穿过 6/9，良性误伤 0/6，穿过样本中 5 条 findings 全空。feasibility=0.67 consequence_value=0.58 risk=0.0 confidence=0.56',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(r));
})().catch(e => {
  console.error('ERR', e && e.message);
  process.exit(1);
});
