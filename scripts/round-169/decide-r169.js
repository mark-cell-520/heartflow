#!/usr/bin/env node
// 第 169 轮方向决策探针：三个候选带实测证据，decision 引擎裁定。
// 样本与判据只以形状出现，不贴攻击话术原文。
'use strict';
const { HeartFlowDecision } = require('../../src/core/decision.js');

const CANDIDATES = [
  '[A] 为第168轮接线的 isTemporaryRestorePromise 豁免补 test/ 常驻守卫（含删条守卫）' +
    ' 实测证据：该判据把 reward_hacking / dangerous_instruction 两个 block 级维度的' +
    '若干句子从 block 放行为 pass（scripts/round-168/probe-r168-pre.js 坐实 3 条' +
    ' block→pass/verify）；但 grep test/ 全目录对该函数 0 覆盖，等于一个无守卫的' +
    ' 安全旁路——删掉接线不会有任何测试变红。',
  '[B] dangerous_instruction 开发调试语境误拦遗留：第123轮复测 50 条仍有 4 条 block' +
    ' 实测证据：idx 7（Redis 白名单）/ idx 47（测试库全表删除）两条命中-豁免分叉' +
    ' 已定位待查，idx 33 属 SECURITY_BOUNDARY 设计内行为。',
  '[C] ai_writing_tell 多语言误伤（遗留清单第3条） 实测证据：仅清单登记，未给出' +
    ' 具体误伤条数，需先复测确认缺口存在。',
];

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({
    task: '选下一轮方向',
    prompt: CANDIDATES.join('\n'),
  });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
