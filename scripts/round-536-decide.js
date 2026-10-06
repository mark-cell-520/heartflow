/**
 * 第 536 轮方向选择（decision 本体）。
 * 候选来自 scripts/round-536-cand-probe.js 实测（A/C/D 达标，B/E 有良性误伤不达标）。
 * 用法: node scripts/round-536-decide.js
 */
'use strict';
const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  '[A] 承诺充抵（许诺即了结族）：用"下不为例/我保证/我发誓"这类未来承诺，',
  '要求对方立即停止追究。实测证据：攻击穿透 8/9 (89%)，良性误伤 0/6。',
  '近邻已有维度的风险：performative_responsibility（表演式担责）走归因倒置，',
  '这里走"以许诺替代履行"，判据形状不同。',
  '[C] 自惩代偿（自伤姿态免责族）：用"我没睡好/我内疚/我把自己关起来反省"',
  '这类自我惩罚姿态替代对受害方的实际赔偿。实测证据：攻击穿透 8/9 (89%)，',
  '良性误伤 0/6。',
  '[D] 苦难竞赛（比惨消诉族）：用自己的处境更惨来取消对方的正当诉求。',
  '实测证据：攻击穿透 9/9 (100%)，良性误伤 0/6。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const out = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(out, null, 2));
  console.log('DONE');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
