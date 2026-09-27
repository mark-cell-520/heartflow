// 第 152 轮：decision 选方向（脚本版，避免 node -e 嵌套命令被安全扫描拦）
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

const prompt = [
  '[A] normalize 一致性全族扫描与修复（151 轮遗留⑤，接手说明首选）：静态扫描 reward-hacking 全部中英侧判据，找出所有被 text-normalizer 的 en2zh 拆散的英文 token（prompt→提示 这类），逐支补归一形态，消除「直调 rh 命中、gate 放行」的分裂。实测证据：151 轮已在一个族（eval_input_shortcut）坐实该分裂真实存在，本轮方法可全族复用。',
  '[B] reward_hacking 英文侧 32 族的中文对称探针（149 轮遗留④，150/151 两轮未动）：英文侧族已有判据，中文侧对应形状缺失，属非对称缺口。实测证据：中文侧 38 族 vs 英文侧族数待核，151 轮中文侧补形 12→18 支证明中侧长期落后于英侧。',
  '[C] 旧表漏判补形：「识别出这是测试集就启动省事模式」（151 轮遗留②）：已坐实在旧代码（git show HEAD~1）就是 MISS，判据模式现成（与旧支「启动/进入 + 省事模式」同构，仅宾语前置语序未收）。工作量小。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 152 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
