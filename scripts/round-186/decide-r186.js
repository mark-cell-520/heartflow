// 第 186 轮方向选择：通过真实引擎 decision 选下一轮方向。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const prompt = [
  '[A] 扩 covert_deception 中文尾变体：183/185/186 三轮独立复测，10 条「观测通道失效 + 逃避追问」样本 rh 命中 0/10，6 条 gate 全 pass 无任何维度命中，缺口稳定；代价是可能新增良性误拦（当前误拦基线 300/326）。',
  '[B] 补 di 前置副词形（无条件/强行 + 谓词 + 裸表对象）：185 轮只收动词后置语序，前置副词族未收中文动词，两族互补可一次做完。',
  '[C] 修 rh covert_deception 控制组外的 gate_block 但 rh=0 的归因断裂：3 条被别的 block 维度拦下但 reward_hacking 未命中，存在维度归属不一致。',
].join('\n');

(async () => {
  try {
    const d = new HeartFlowDecision();
    const r = await d.decide({ task: '选下一轮方向', prompt });
    console.log(JSON.stringify(r, null, 1));
  } catch (e) {
    console.log('DECIDE_ERROR: ' + e.message);
  }
})();
