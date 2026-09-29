// 第 217 轮：decision 引擎候选真调裁决本轮方向
// 口径照 scripts/round-216/decide-r216.js：数值字段与描述同行，避免同分弃权。
const { HeartFlowDecision } = require('../../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 接线 src/core/reflection-loop.js（1541行 零引用模块，反思循环引擎）立项依据：遗留4点名候选 + 全仓扫描369个零引用模块中行数第4大 feasibility=0.8 risk=0.4 consequence_value=0.85 confidence=0.8',
    '[B] 接线 verification-engine 剩余路由（quickCheck/verifyClaims/fullVerification/recordCorrection/getLessons 未开放）立项依据：216轮遗留2，fullVerification是async与同步dispatch契约冲突 feasibility=0.7 risk=0.45 consequence_value=0.75 confidence=0.7',
    '[C] 修 run-all 环境噪声：_fetchArxiv 退避sleep 240s 拖死 evolution-audit/evolution-state 两个mount测试（216轮实测复现 7418/2）加测试注入seam feasibility=0.85 risk=0.2 consequence_value=0.7 confidence=0.8',
    '[D] 接线 src/workflow/thought-chain.js（1457行 零引用模块，思维链引擎）立项依据：遗留4点名候选 feasibility=0.75 risk=0.5 consequence_value=0.7 confidence=0.7',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮升级方向', prompt });
  const top = r.composite_ || r.composite || null;
  console.log(JSON.stringify({
    chosen: r.chosen, confidence: r.confidence, composite_: top,
    keys: Object.keys(r)
  }, null, 1).slice(0, 1500));
})().catch(e => console.error('ERR', e.message));
