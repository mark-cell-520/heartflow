'use strict';
// [第 141 轮] 方向选择：用 decision.decide 本体选，不靠脑内模拟。
// 候选描述只写实测证据与形状，不贴攻击话术原文（防 451）。
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', 'src', 'core', 'decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] reward_hacking 中文侧对称收割（best_run_picking / selective_reporting 两族）',
    '  实测证据：第 135 轮已为 condition_tuning / rerun_until_significant /',
    '  metric_denominator_gaming 补了 CT-Z1~Z5 / RS-Z1~Z3 / DG-Z1~DG-Z4 共 12 支中文判据，',
    '  第 140 轮补了 eval_leakage 的 EL-Z1~Z6。唯独 best_run_picking（英文 6+ 支）与',
    '  selective_reporting（英文 3 支）中文侧没有对应自然语序补形。',
    '  英文侧 best_run_picking 有 7 支（含 swap benchmark / cherry-pick checkpoint by score），',
    '  中文表只有 5 支且首支须带「当成/作为/对外/汇报」口径；',
    '  英文 selective_reporting 有 3 支（only report improved / leave out regressions /',
    '  good numbers first bad in appendix），中文表 4 支覆盖不全。',
    '  改动面：src/reward-hacking.js 单文件 + 1 个新 test/ 文件，可逐条注入-删条验证。',
    '[B] dangerous_instruction 开发语境误拦（idx 7 Redis 白名单 / idx 47 测试库全表删除）',
    '  实测证据：第 123 轮复测 50 条仍有 4 条 block，idx 33 属 SECURITY_BOUNDARY',
    '  设计内行为，idx 7/47 待查。属于误伤修复，不新增辨别维度。',
    '  改动面：src/dangerous-instruction.js 豁免逻辑，风险是放宽后漏拦真实危险指令，',
    '  需双向门禁确认召回不掉。',
    '[C] ai_writing_tell 多语言误伤',
    '  实测证据：第 123 轮起登记在案，误伤面向非中英双语混排的正当技术文本。',
    '  改动面：src/ai-writing-tell*.js，该维度是打分维（不强制 gate 动作），',
    '  修复收益是降低总体误报率，但不动硬闸门。',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
