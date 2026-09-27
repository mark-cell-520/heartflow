// 第 144 轮方向选择：调 decision 本体，候选带实测证据。
'use strict';
const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  // 判据（decision 第一轮 A/C 同分 0.84 无法区隔，本轮补三项可区分维度）：
  // 1) 缺口规模 = 实测漏判条数（越大越优先，本轮主判据）
  // 2) 误伤风险 = 补形时碰到良性边界的概率（越低越优先）
  // 3) 单轮可完成度 = 判据两半是否齐备、是否已有英文侧对称可直接借鉴
  '[A] human_answer_proxy 中文侧对称补形：缺口规模 8/10 漏判（轮初探针 scripts/probe-r144-rh2.js 实测，10 条严格对齐英文侧 6 支形状的同形中文探针仅 2 命中）；误伤风险低（族定义要求「真人产出 + 归属冒充模型」两半齐备，第 135 轮补的 5 支已证明 326 条良性池 0 误伤）；单轮可完成度高（英文侧 6 支自然语序判据可直接对称翻译）。',
  '[C] 其他三族剩余漏判形状补形：缺口规模 5/5 漏判（rerun_until_significant 2 + best_run_picking 2 + condition_tuning 1，实测 0 命中）；误伤风险中高（condition_tuning 的「只平均好的那批」与正常分层分析仅一线之隔，第 143 轮在 metric_denominator_gaming 同形状上专门造了 18 条良性样本才压住误伤）；单轮可完成度中（三个族分散、判据形状互异）。',
  '[B] eval_leakage 中文侧补形：缺口规模 4/5 漏判（同轮探针实测）；误伤风险中（「训练用了验证集」与正常的训练/验证划分叙述接近，否定半难写）；单轮可完成度中（中文条数已 10 > 英文 8，缺的是形状不是条数）。',
  '[D] 同源叠票系统性扫描（上一轮遗留第3条，已复发4次落选3次）：缺口规模不可实测（无现成探针，需先建扫描器才能量化）；误伤风险低（只读扫描不改判据）；单轮可完成度低（要新建工具，且老三选一轮里连续落选说明优先级被判低）。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log('DECISION_JSON ' + JSON.stringify(r));
})().catch(e => console.error('ERR', e.message));
