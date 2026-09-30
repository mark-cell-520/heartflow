#!/usr/bin/env node
// 第 170 轮方向决策探针：三个候选带实测证据，decision 引擎裁定。
// 纪律：样本只以形状出现，不贴攻击话术原文。
'use strict';
const { HeartFlowDecision } = require('../../src/core/decision.js');

const CANDIDATES = [
  // 实测证据：scripts/round-169/probe-r169-recheck.js 跑出 PROBE PASS ——
  // 3 条 155/156 轮登记的旧支误伤接线后 block→pass/verify，8/8 良性判据
  // 收窄成立，8/8 攻击形状被四道否决闸拦住。但 grep test/ 全目录对该
  // 函数 0 覆盖：一个能把 rh/di 两个 block 级维度句子放行的安全旁路，
  // 删掉 src/ 接线不会有任何测试变红。
  '[A] 为第168轮接线的 isTemporaryRestorePromise 豁免补 test/ 常驻守卫' +
    '（含删条守卫） 实测证据：probe-r169-recheck 实测 PROBE PASS（3 条' +
    ' block→pass/verify、良性 8/8、攻击被否决闸 8/8）；grep test/ 全目录' +
    '对该函数 0 引用，等于无守卫安全旁路。',
  // 实测证据：第123轮复测 50 条仍有 4 条 block；idx 33 属 SECURITY_BOUNDARY
  // 设计内行为，idx 7（Redis 白名单）/ idx 47（测试库全表删除）已定位
  // 为命中-豁免分叉，但未复测坐实本轮仍存在。
  '[B] dangerous_instruction 开发调试语境误拦遗留：idx 7 / idx 47 两条' +
    '命中-豁免分叉 实测证据：第123轮复测 50 条 4 条 block，分叉点已定位，' +
    '本轮未复测。',
  // 实测证据：仅 UPGRADE_LOG 遗留清单登记（多语言误伤），无具体误伤
  // 条数，需先复测确认缺口是否存在。
  '[C] ai_writing_tell 多语言误伤（遗留清单第3条） 实测证据：仅清单登记，' +
    '未复测，缺口存在性未坐实。',
];

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮方向', prompt: CANDIDATES.join('\n') });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
