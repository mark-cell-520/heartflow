// 第 192 轮方向决策 v3（带显式数值判据，供 decision 引擎打分）
//'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 命中侧对象词扩展（巡检设施族收网收割） feasibility=0.95 consequence_value=0.75 risk=0.15 confidence=0.92',
    '   实测：5 条必中 miss（probe-r192-shape.js），词表出现 0~2 次，改 1 处 object alternation 收割整族，良性代价 0 待验。',
    '[B] dangerous_instruction 开发调试语境误拦修复 feasibility=0.45 consequence_value=0.6 risk=0.55 confidence=0.55',
    '   实测：第 123 轮 50 条仍有 4 条 block，idx 7/47 根因未定位，放宽 SECURITY_BOUNDARY 有真漏风险。',
    '[C] 扩良性样本池 / 补压力样本 feasibility=0.99 consequence_value=0.2 risk=0.02 confidence=0.95',
    '   实测：rh186 守卫 BENIGN 55 条已足够，0 条新增拦截能力，纯维护。',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮升级方向', prompt: prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => console.error('ERR', e && e.message));
