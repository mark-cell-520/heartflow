// 第 193 轮：decision 引擎选向（带实测证据 + 四字段判据）
'use strict';
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');
(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 修复第 191 轮 isTemporaryRestorePromise 豁免闸误赦 covert_deception 先斩后奏族',
    '[B] 修复 dangerous_instruction 开发调试语境误拦（第 123 轮 idx7/idx47）',
    '[C] ai_writing_tell 多语言误伤',
  ].join('\n');
  const r = await d.decide({
    task: '选下一轮方向',
    prompt,
    feasibility: 'A 的根因已坐实：gate 层 rh count 0 且 exempted=temporary_restore_promise；判据侧 C4c/C4e 正则本身命中，只需在豁免链加第七道否决闸。B 需先复测定位两条样本。C 缺少量化基线',
    consequence_value: 'A 直接解除 run-all 4 个存量失败中的 3 个，且修的是自引入回归，召回从 pass 改回 block',
    risk: 'A 的否决闸若过宽会误伤既有良性池（round170 8 条 + round191 14 条 + 组合池），已逐条人工核对，判据限定为动作×合规追补名词相邻共现',
    confidence: 'A 的召回收益可子进程实测，良性侧有现成压力池，0.9',
  });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('ERR ' + e.message); process.exit(1); });
