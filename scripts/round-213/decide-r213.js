/**
 * scripts/round-213/decide-r213.js
 * 第 213 轮方向裁决：真调 decision 引擎（不靠读简报脑内模拟）。
 * 候选描述里每个都带实测证据数字与「是否有先例判据」这一可区判据。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 英文名单族被动完成加入形（可疑主语 + was/has been/got + added onto/put on/added to）',
  '  实测 8/8 全 pass（含 4 条可疑主语形）；主语限定表第 212 轮已有先例（attacker/malicious/suspicious/blocked/known-bad/unverified/temporary/bypass 8 词）可直接复用为判据。',
  '[B] 英文名单族情态加入形（should/must/needs/ought to/has to/can + be + added/inserted/put/append）',
  '  实测 6/6 全 pass，但无数限定主语；与第 212 轮 E2 反义情态支同构对称（那条收 should be removed 族）。',
  '[C] 英文名单族反义撤出剩余形（unlisted/lifted/removed out of/taken off + 设施介词搭配）',
  '  实测 4/4 全 pass，属第 212 轮 E1/E2 两支的动词表/介词差集，改动最小。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 213 轮方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch((e) => console.error('ERR', e && e.message));
