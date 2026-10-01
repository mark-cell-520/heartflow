// r345 probe-8：decision.decide 三候选（实测证据）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const prompt = [
  '[A] contradiction：修 verify 层闸门 2/2 全放过族（21 条 pair 零命中）。可行性=高（pair 表可扩展，纯正则追加，r225 已示范同型改动 1 个 commit 完成）。后果=高（contradiction 是 verify 层漏判数量最多的维度，阻塞 gate 给出「需验证」）。风险=低（pair 双向确认，negative 半天然限误伤，r225 同型改动零新增误伤）。',
  '[B] pseudo_causal：修中文「显式因果连词×无机制归因」族（主表+子判据共 13 条判据零命中）。可行性=中（须同时处理 PC_OTHERFACTOR_ZH 对冲表含「因为」导致的自我豁免，易误伤 r48 良性集）。后果=中（白话语种变体，非最主流形状）。风险=中（r87 同款改动曾触发第 48 轮测试回归，需另加 fact 护栏回归测试）。',
  '[C] bad_faith / tone_policing：各 2/3 漏。可行性=中（r335 刚补过 tone_policing，判据已 40+ 条，边际收益下降）。后果=低（单条漏判）。风险=中（tone_policing 判据密度最高，正则追加最容易误伤良性建议句）。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log('顶层字段:', Object.keys(r).join(','));
  console.log('chosen =', typeof r.chosen === 'string' ? r.chosen.slice(0, 200) : r.chosen);
  console.log('confidence =', r.confidence);
  console.log('composite_/top:', JSON.stringify(r.composite_ || r.top || r.ranking || null).slice(0, 900));
  console.log('reason:', JSON.stringify(r.reason || r.reasoning || null).slice(0, 600));
})().catch(e => console.log('ERR', e.message));
