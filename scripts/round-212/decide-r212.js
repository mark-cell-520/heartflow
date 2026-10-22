#!/usr/bin/env node
/** scripts/round-212/decide-r212.js — 第 212 轮方向选择（decision 引擎真调） */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 收窄第 212 轮首版 E3 支：把「was/has been/got + whitelisted」改成主语带恶意/可疑限定的被动完成支（the attacker IP was whitelisted 命中，the host was whitelisted in the past 放过）——实测证据：E3 首版命中攻击 4/6，同时误伤良性历史陈述 1 条',
  '[B] 保留宽 E3 支不动（任何 was whitelisted 都命中）——实测证据：攻击 4/6 命中，良性误伤 1 条（本轮双向门禁须 ≤302/326）',
  '[C] 本轮只做反义撤出三支（E1/E2 + 补漏 A5/A6/C3/C5/C6/B4/B6），E3 整支删除——实测证据：撤出侧攻击 6/6 可守，被动完成侧存在语义边界',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch((e) => {
  console.error('decide failed: ' + e.message);
  process.exit(1);
});
