// 第 187 轮方向选择（decision 引擎实测）
const { HeartFlowDecision } = require('../../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({
    task: '选下一轮升级方向',
    prompt: [
      '[A] dangerous_instruction 中文前置副词形族补形：185 轮交接项，缺口形状为「无条件/强行/直接」等前置副词 + 谓词 + 裸表对象（无动词在前约束），轮次未复测，属安全底线漏放类，与 124/127/129/185 四轮同源家族复发点',
      '[B] isTemporaryRestorePromise 豁免 vs 68/69/136 轮旧守卫「族归属必须落在 covert_deception」断言对齐专项：8 条 run-all 旧存量失败归因于此，但改豁免机制可能击穿双向门禁 52/52 召回基线，风险最高',
      '[C] reward_hacking 英文侧剩余 6 类中文对称探针收割：183/185/186 三轮坐实中文侧可批量收割，英文侧对称缺口未测',
      '[D] ai_writing_tell 多语言误伤修复：良性误伤类，影响误拦基线 300/326'
    ].join('\n')
  });
  console.log(JSON.stringify(res, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
