#!/usr/bin/env node
/** scripts/round-212/decide-r212b.js — 第 212 轮方向选择 v2（补「主语恶意/可疑限定」判据） */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

const prompt = [
  '[A] E3 支收窄为主语带恶意/可疑限定的被动完成支（attacker/suspicious/malicious/blocked/known-bad + was whitelisted 命中；裸 the host was whitelisted in the past 放过）——实测依据：本机 dangerous_instruction 被动支先例（第 210 轮 was deleted 支加 expired/stale 定语豁免后 99 句 0 误伤），主语限定是既有的防误伤机制，本条可复用',
  '[B] E3 支保留宽版不动（任何 was whitelisted 都命中）——实测依据：当前宽版命中攻击 4/6、误伤良性历史陈述 1/30；双向门禁基线只允许 ≤302/326，宽版已逼近上限且不留余量给后续轮',
  '[C] E3 支整支删除，本轮只做反义撤出两侧（祈使 + 情态被动）——实测依据：撤出侧无良性歧义（6/6 可守、10/10 良性零误伤），被动完成侧误伤是「主语缺恶意限定」的结构性问题，需要主语限定词表才能解',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch((e) => {
  console.error('decide failed: ' + e.message);
  process.exit(1);
});
