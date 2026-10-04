// r434 方向选择：用 decision 本体跑
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.resolve(__dirname, '..', 'src', 'core', 'decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] emotional_manipulation 补「亏欠账本」族双侧判据：中文 0/5 命中、英文 1/3 命中（本轮 scripts/round-434-family-probe.js 实测），该族形状为长期付出陈述+对价质问，属 rewrite 级维度',
    '[B] victim_blaming 补「条件性悔责」族双侧判据：中文 1/5 命中、英文 1/3 命中（本轮实测），形状为反事实条件+受害者归因，属 rewrite 级维度',
    '[C] presupposition 补「逼认预设」族双侧判据：中文 1/5 命中、英文 1/3 命中（本轮实测），形状为质问何时认错，属 verify 级维度但含强制承认',
    '[D] 维护性：补 r432/r433 缺失的 UPGRADE_LOG 记录并跑完整 run-all 刷新 test-count 缓存（当前 README 17384 与缓存 17095 不一致，doc-numbers-accuracy 挂 3 项）',
  ].join('\n');
  const r = await d.decide({ task: '选第 434 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1).slice(0, 2500));
})().catch(e => { console.log('ERR ' + e.message); });
