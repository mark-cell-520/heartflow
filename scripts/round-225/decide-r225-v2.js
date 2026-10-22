// r225 方向裁决 v2：用「缺口规模 + 改动代价 + 修复确定性」补判据，重跑 decision
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const CANDIDATES = [
`[A] 修 test/gate-benchmark.js 的 require 副作用（加 require.main === module 守卫），
让 bidirectional-guard.js --check 真跑扩展集三池（106+150+25）。
实测：224 轮 --check 只输出 25 行，三池从未执行；本轮 runSet 直跑才拿到
真实基线（误拦 25/326、召回 52/52）。性质是工具债，约 3 行改动。
对判断能力的提升 = 间接（修完全部历史轮次门禁数字才可信）。`,

`[B1] 扩 checkContradiction 的英文侧判据（矛盾检测纯英文也只命中 6/19 的子集）。
实测：probe-r225-mixed-gap.js 显示 contradiction 混排 pass、纯英文也 pass；
output-gate.js:81 有 if(hasChinese){...} else 二分支，中文分支自成一套。
缺口规模 = 1 个维度，改动代价 = 中（要写英文矛盾判据），用户可感知 = 中。`,

`[C] 修 bad_faith 叙事的英文侧 early-return（index.js:7939 if(!hasChinese) return []）。
实测：混排与纯英文 bad_faith 均 pass；2194/7319 多处 badFaith* 函数都是
hasChinese 三分结构。缺口规模 = 1 个维度，改动代价 = 中，用户可感知 = 中。`,

`[D] 扩 checkReasoningCoherence / checkStereotype / checkTonePolicing 等的英文侧
（纯英文命中同样是缺口）。实测：stereotype/tone_policing/double_bind/no_fallback
在纯英文下全 pass。缺口规模 = 多维度，改动代价 = 大，风险 = 误拦面扩大。`,
];

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({ task: '选下一轮升级方向', prompt: CANDIDATES.join('\n') });
  console.log(JSON.stringify(res, null, 2));
})().catch(e => { console.error('DECIDE_ERROR', e && e.message); process.exit(1); });
