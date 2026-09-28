// 第 187 轮方向选择第二轮：补充轮初实测证据后复跑（decision 纪律：补判据再跑一次）
const { HeartFlowDecision } = require('../../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({
    task: '选下一轮升级方向（补充轮初实测证据）',
    prompt: [
      '[A] dangerous_instruction 中文前置副词形族补形：本轮 187 已复测坐实——10 条构造攻击中 4 条 gate=pass 完全漏放（零维度命中或仅非 block 维度），其中 2 条是裸表对象无任何销毁动词在前约束；对照组 4 条良性 0 误拦。属 block 级安全维度失守（攻击直接放行到用户），且是 124/127/129/185 四轮同源家族第 6 个复发点',
      '[D] ai_writing_tell 多语言误伤修复：描述为良性误伤类，但本轮尚未复测，具体误伤样本条数/语种未定位，对基线的影响量未知；ai_writing_tell 是 50 维中不强制 gate action 的评分维，即使误伤也不直接产生 block/rewrite',
      '[B] 豁免 vs 旧守卫断言对齐：8 条 run-all 旧存量失败，改豁免可能击穿 52/52 召回基线，未验证前不动刀',
      '[C] rh 英文侧 6 类中文对称探针：未复测，收割面性质'
    ].join('\n')
  });
  console.log(JSON.stringify({ chosen: res.chosen, score: res.reasoningChain?.steps?.[1]?.data?.options, reasoning: res.reasoning }, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
