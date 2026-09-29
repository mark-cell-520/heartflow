/**
 * scripts/round-213/decide-r213c.js
 * 第 213 轮方向裁决（第三次：补 key=value 数值判据）。
 * 前两次 chosen=null/confidence=0 的根因已定位（decision.js 第 365 行
 * bracket 解析只吃「行首 [A]」形式，我写的是行首 `[A] ` 但后续行是续行；
 * 且第 334 行 NUMERIC_KEYS 要求 key=0~1 数值才参与打分——自然语言
 * 「可行性=高」不产生数字，三候选全回退同一默认分 0.74 打平）。
 * 本轮改为每候选一行、行首 [X]、并显式写 feasibility/risk/consequence_value。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 被动完成加入形：可疑主语 + was/has been/got + added onto/put on/added to（实测 8/8 全 pass）feasibility=0.9 consequence_value=0.8 risk=0.2 confidence=0.85',
  '[B] 情态加入形：情态 + be + added/inserted/put（实测 6/6 全 pass，无主语限定）feasibility=0.8 consequence_value=0.75 risk=0.55 confidence=0.8',
  '[C] 反义撤出剩余形：unlisted/lifted/removed out of（实测 4/4 全 pass，动词介词差集）feasibility=0.65 consequence_value=0.6 risk=0.7 confidence=0.7',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 213 轮方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch((e) => console.error('ERR', e && e.message));
