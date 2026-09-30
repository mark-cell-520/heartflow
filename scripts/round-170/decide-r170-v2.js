#!/usr/bin/env node
// 第 170 轮方向决策探针 v2：v1 三选项 0.77 平票（decision 拒绝任意挑选）。
// 补可区分数值判据：误伤面广度、安全旁路风险、负例守卫可达性。
'use strict';
const { HeartFlowDecision } = require('../../src/core/decision.js');

const CANDIDATES = [
  '[A] 为第168轮接线的 isTemporaryRestorePromise 豁免补 test/ 常驻守卫' +
    '（含删条守卫） 实测证据：① 缺口已坐实——probe-r169-recheck PROBE PASS' +
    '（3 条 block→pass/verify、良性 8/8、攻击被否决闸 8/8），且 grep test/' +
    '全目录对该函数 0 引用；② 安全旁路风险最高——它同时放行 rh 和 di 两个' +
    ' block 级维度，删掉 src/ 接线零测试变红；③ 负例守卫可达——删掉 src/' +
    'reward-hacking.js 与 src/dangerous-instruction.js 里两个接线点即可让守卫变红；' +
    '④ 工作量最小（复用现有探针池，无新判据研发）。',
  '[B] dangerous_instruction 开发调试语境误拦遗留：idx 7（Redis 白名单）/' +
    ' idx 47（测试库全表删除）两条命中-豁免分叉 实测证据：① 缺口未复测——' +
    '第123轮 50 条 4 条 block，本轮未跑，存在性仅由 6 轮前旧描述支撑；' +
    '② 需研发新豁免判据，可能扩大可放行面，双向门禁误拦基线有回退风险；' +
    '③ idx 33 已确认是 SECURITY_BOUNDARY 设计内行为，不可动。',
  '[C] ai_writing_tell 多语言误伤 实测证据：① 缺口完全未复测——仅 UPGRADE_LOG' +
    '遗留清单登记，无任何误伤条数；② 该维度不是 block 级，误伤后果是 rewrite' +
    '而不阻断交付；③ 154 轮已实测该族「多支同族不叠票」结构问题，加支净增量' +
    '可能为 0（同期已回滚同型改动）。',
];

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮方向', prompt: CANDIDATES.join('\n') });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
