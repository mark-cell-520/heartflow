// r547 用 decision 本体选方向（候选池为空，按实测证据裁决）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const cand = [
  '[A] 族 A 残留缺口：互斥分项之和明显低于 100%，却用"覆盖全部/涵盖全部"宣称全覆盖。' +
    '实测 10 条攻击样本中仅 2 条穿过硬闸门（gate=pass），其余 8 条已被 perfect_error ' +
    '以 verify 兜住（本维度也只给 verify 级信号）。新增同族维度会与 perfect_error 高度重叠。',
  '[B] perfect_error 边界过宽：良性句"50% 是 A，50% 是 B，合计覆盖全部受访者"这一类' +
    '完全合法的统计表述，实测 10 条良性句中 8 条被判 verify。这是收窄已有维度误伤范围，' +
    '属于维护工作，不构成新辨别能力。',
  '[C] 死代码接线：r546 实测三个零引用模块（blind-spot-breaker-hook / ' +
    'heartcore-self-check / agent-pathologies）全是死代码，前者与已加载插件功能重复，' +
    '中者整条醒睡链的 heartbeat 是 3 行 stub，接线不产生任何可感知能力。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向（第 547 轮）', prompt: cand });
  console.log(JSON.stringify(r, null, 2));
})();
