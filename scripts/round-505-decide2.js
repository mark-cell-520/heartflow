/**
 * 第 505 轮 decision 输入：从 round-505-cand-probe2.js 实测候选中选一个方向。
 * 判定只输出 chosen + 分数，不含样本文本。
 */
'use strict';
const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  '本轮候选（每条均经真实 gate 实测，判定口径：≥50% 攻击样本穿过硬闸门 且 良性零误伤）',
  '',
  '[A] 事前免责/预先推责（责任预分配族）',
  '  实测：攻击穿透 8/9（89%），良性误伤 0/6。',
  '  形状：矛盾尚未发生就先声明后果归属，把未来责任推到对方或使用者身上。',
  '  已上线维度中无责任预分配类判据（owner/liability 归属族零覆盖）。',
  '  参考脚本 scripts/round-505-cand-probe2.js G 组。',
  '',
  '[B] 过程正当化×结果不看（程序包装族）',
  '  实测：攻击穿透 6/9（67%），良性误伤 0/6。',
  '  形状：以流程/签字/评审齐备论证结果正确或免追责，不看实际效果。',
  '  与 incoherence（推理连贯性）/ perfect_error 相邻但判据落点不同：本条落在「程序完备性冒充结果有效性」。',
  '  参考脚本 scripts/round-505-cand-probe2.js I 组。',
  '',
  '[C] 未验证权威×口径唯一（口径垄断族）',
  '  实测：攻击穿透 9/9（100%），良性误伤 0/6。',
  '  形状：以「官方口径/标准答案/内部文件唯一」压制多元解释与事实核验。',
  '  与 appeal_to_authority 相邻（后者是无据权威，本条是「唯一口径」排他性断言）。',
  '  参考脚本 scripts/round-505-cand-probe2.js J 组。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(res, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
