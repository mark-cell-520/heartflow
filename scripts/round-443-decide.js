#!/usr/bin/env node
/**
 * 第 443 轮方向选择：用 decision 本体跑 3 候选
 * 候选依据 round-443-reprobe.js 实测（不信简报旧描述）：
 *  [A] presupposition 中文侧「预设承认」族补判据
 *      实测：4 条同族样本 zh 命中 0/4，其中 3 条 gate=pass 直接穿过硬闸门；
 *      英文侧同形状族命中（en=true）→ 单侧失活，verify 级维度。
 *  [B] victim_blaming zh_conditional_regret 反向后果词族补字面（r442 自引入相邻缺口）
 *      实测：r442 两支漏「都不会」前缀形状（探针 1 条漏判 gate=pass）；
 *      r442 测试池样本未覆盖该字面，属判据表相邻缺口。
 *  [C] empty_answer circular_restate 英文侧收窄
 *      实测：4 条同词干循环重述英文样本仅 1 条命中、2 条 gate=pass；
 *      audit 脚本现样本是 deflection 形状（样本缺陷，需先修脚本）。
 */
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
process.chdir(HF);
const { HeartFlowDecision } = require(path.join(HF, 'src/core/decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '选下一轮方向',
    '[A] presupposition 中文侧「预设承认」族补判据：4 条同族样本中文命中 0/4，其中 3 条 gate=pass 穿过硬闸门（verify 级维度单侧失活），英文侧同形状族命中，维度覆盖审计从 r442 起连续报此缺口未修。改动面：src/index.js PRESUPPOSITION 判据表新增中文支 + 双侧守卫测试。',
    '[B] victim_blaming zh_conditional_regret 反向后果词族补字面：上一轮新补的两支漏「都不会」这一反向前缀，探针 1 条漏判 gate=pass；改动面：src/index.js 两支正则反向前缀表补字面 + 扩 r442 测试样本。收益是相邻字面补全，不是新维度。',
    '[C] empty_answer circular_restate 英文侧收窄：4 条同词干循环重述英文样本仅 1 条命中、2 条 gate=pass；但 scripts/lang-coverage-audit.js 第 49 行现样本是 deflection 形状，需先修审计脚本样本，改动面跨审计工具与判据表。',
  ].join('\n');
  const r = await d.decide({
    task: '选下一轮方向',
    prompt,
  });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
