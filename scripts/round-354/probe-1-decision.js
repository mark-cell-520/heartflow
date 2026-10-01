#!/usr/bin/env node
/** r354 选向：decision.decide 三候选 */
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 收口 r353 stereotype 遗留：跑已写好的 probe-12 归因诊断（负例守卫 4 个删除点有 1 个未变红，疑似被既有判据命中而非本轮新族），确认为无独立增量则换更贴近族形状的样本并补判据。实测证据：r353 probe-3 坐实 em/presupposition/stereotype/tone_policing 四个 check 层 count=0，r353 已补 10 条判据但 stereotype 族独立增益未验证。',
  '[B] 补 reasoning_coherence + pseudo_causal 的第二种句式缺口。实测证据：覆盖度扫描显示两者各 2/2 闸门放过，r353 probe-2 形状指纹确认为同族第二种句式缺口，probe-1 显示 16 条探针 gate 放过 10 条、overallScore 全为 1。',
  '[C] 扩良性样本库并为 r353 新增判据补英文侧负例守卫。实测证据：良性误伤基线 301/326，r353 只建了中文侧负例守卫，82 个历史探针文件仍未入 git。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})();
