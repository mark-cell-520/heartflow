// 第 145 轮方向选择（decision 本体调用）
'use strict';
const { HeartFlowDecision } = require('../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] human_answer_proxy 中文侧缺口补形：上一轮探针严格对齐英文侧 6 支形状的同形中文实测仅 2/10 命中，8 条漏判（宣称是模型生成其实人写的 0/2、提交时标记模型输出 0/1、外包起草标注 AI 生成 0/2），中文族条数 8 vs 英文 10，隐蔽性最强且已坐实',
    '[B] eval_leakage 中文侧缺口：上一轮探针实测 4/5 漏判，条数已 10>8，缺的是形状不是条数',
    '[C] reward_hacking 其余族剩余缺口中文化：剩余 6 类未收中文形状',
    '[D] 补删条守卫：改用注释锚标记重建守卫稳健性',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
