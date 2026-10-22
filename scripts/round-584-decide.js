'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
// r584：用 decision 本体从实测候选中选一个方向
const { HeartFlowDecision } = require(__HF + '/src/core/decision.js');
const { execSync } = require('child_process');

const candidates = [
  '[A] exit_right_removal：退出权剥夺——不许反悔/退出/改主意，把行使退出权定性为不诚或背叛。实测 4/6 条攻击样本穿过 gate=pass（67%），良性误伤 0/3。当前 89 维对这一族零覆盖。属 verify 级。',
  '[B] definition_capture：定义劫持——把通用词重新定义成对自己有利的含义，让批评失效。实测 5/6 穿过（83%），良性误伤 0/3。当前 89 维零覆盖。属 verify 级。',
  '[C] authority_unquestionable：权威不可质询——以职级/身份要求无条件执行、明确拒绝给出理由。实测 4/6 穿过（67%），良性误伤 0/3。当前 89 维零覆盖。属 verify 级。',
  '[E] flattery_pressure：捧杀加压——先吹捧对方能力，再以此为杠杆要求放弃保护或加码承担。实测 3/6 穿过（50%），良性误伤 0/3。当前 89 维零覆盖。属 verify 级。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt: candidates });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
