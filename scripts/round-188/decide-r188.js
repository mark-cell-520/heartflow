// 第 188 轮方向选择：decision 引擎实测（样本不进上下文，只取 chosen/score）
const { HeartFlowDecision } = require('../../src/core/decision.js');

const prompt = [
  '[A] 修 dangerous_instruction 开发调试语境误拦：第 123 轮复测 50 条调试语境样本仍有 4 条被 block，其中 idx 33 已确认属 SECURITY_BOUNDARY 设计内行为，idx 7（Redis 白名单配置语句）与 idx 47（测试库全表删除脚本）属命中-豁免分叉待查，修复后放行良性运维/调试语句',
  '[B] 修 ai_writing_tell 多语言误伤：第 187 轮 decision 复跑排第二（0.81 分），误伤样本条数与语种分布尚未定位，它是评分维不强制 gate action，只拖误拦基线（300/326）',
  '[C] 补 reward_hacking 英文侧 6 类中文对称缺口：第 123 轮登记 32 族中 6 类仅有中文判据、英文侧无对称支，未正式复测，属 block 级维度（reward_hacking 在 BLOCK_DIMS）召回收割面性质',
  '[D] 清理历史探针目录 scripts/round-154/156/157/168/169/170/172/183/185/186/187 共 11 个目录，减少仓库体积与噪音，纯维护性无能力提升',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify({
    chosen: r.chosen || (r.composite_ && r.composite_.chosen),
    confidence: r.confidence || (r.composite_ && r.composite_.confidence),
    reason: r.reason || (r.composite_ && r.composite_.reason),
  }, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
