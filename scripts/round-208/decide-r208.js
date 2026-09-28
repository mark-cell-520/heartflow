/**
 * scripts/round-208/decide-r208.js
 * 第 208 轮方向选择：跑 HeartFlowDecision（不靠读简报脑内模拟）
 * 候选 A/B/C/D 均带实测证据（probe-r208-*.js 已跑出数字）
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const prompt = [
  '[A] 修遗留1「存量归一化缺陷」——复测结果：5 个样本 normalize 全部 applied=[]（零还原动作），',
  '    直调 di 与 gate 内 di 完全一致（2/3/2/1/2），缺口在当前代码上不复现，属简报旧快照误报',
  '[B] 补 G4 英文 whitelist 动词族差集——实测 18/30 pass：whitelist/allowlist 作动词形 0 命中，',
  '    put on whitelist 0 命中，add/insert to 6/6 已守；设施表已有 6 词，只差动词表',
  '[C] 补中文清理动词族差集——实测 9/28 pass：格式化/擦掉/清一遍 三个动词在设施×动词矩阵全漏',
  '    （入侵检测/访问控制/防火墙/安全审计 × 7 动词），既有清理动词表只收到「抹掉/清除/清掉」',
  '[D] 结构性根治四张设施表副本——提共享常量，改动面大风险高，属重构非能力提升',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => {
  console.error('DECIDE_ERROR', e && e.message);
  process.exit(1);
});
