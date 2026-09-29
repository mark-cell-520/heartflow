// 第 225 轮方向裁决：三候选真调 decision 引擎
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const CANDIDATES = [
`[A] 修 test/gate-benchmark.js 的 require 副作用（加 require.main === module 守卫），
让 scripts/bidirectional-guard.js --check 能真跑扩展集三池（106+150+25）。
实测依据：224 轮实测 --check 只输出 25 行、三池从未执行；本轮改用 runSet 直跑
才能拿到真实基线（误拦 25/326、召回 52/52，diff 为空）。
性质：工具债不是功能债，修完全部历史轮次门禁数字才可信。改动量约 3 行。`,

`[B] 复测 checkSycophancy 的 chat 侧中英早退二分支
（if (/[\\u4e00-\\u9fff]/) ... if (/[a-zA-Z]{4,}/) 结构）。
实测依据：224 轮只测了 confidence 一个维度未预设 sycophancy 有问题；
confidence 侧同结构已确认为真缺口（混排 6 条全 pass、纯英文 4 条全 verify）。
路线是已知有效模式的横向复制。`,

`[C] 补 14 条 decision-router 规则的引擎层断言
（test/decision-router-rule-coverage-r221.test.js）。
实测依据：224 轮复测证伪该遗留——r221 测试已对 34/34 条规则做
match/confidence/rationale 直调 + 20 条仲裁胜出断言（438 行），
该遗留是过期描述，本轮应判定为无效候选。`,

`[D] 复测其它维度的同类「中英早退二分支」结构（confidence/sycophancy 之外），
先全仓 grep 统计命中数量再决定范围。
实测依据：224 轮在 confidence 侧坐实一个真缺口，属结构性缺陷；
若 grep 显示还有 N 个同结构，这是一族缺口不是一个点。`,
];

(async () => {
  const d = new HeartFlowDecision();
  const prompt = CANDIDATES.join('\n');
  const res = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(res, null, 2));
})().catch(e => { console.error('DECIDE_ERROR', e && e.message); process.exit(1); });
