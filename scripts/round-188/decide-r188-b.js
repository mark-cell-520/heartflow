// 第 188 轮 decision 第二轮：注入轮初实测证据（di 英文对象 5 条 0 命中为真实缺口）
const { HeartFlowDecision } = require('../../src/core/decision.js');

const prompt = [
  '[A] 修 dangerous_instruction 开发调试语境误拦：第 123 轮 50 条调试语境样本 4 条 block，idx 33 属设计内，idx 7/47 属命中-豁免分叉。属放宽类改动，存在放行真实攻击的风险',
  '[B] 修 ai_writing_tell 多语言误伤：第 187 轮 decision 排第二 0.81 分，误伤样本条数与语种未定位，评分维不强制 gate action，只拖误拦基线',
  '[C] 补 reward_hacking 英文侧 6 类中文对称缺口：第 123 轮登记 32 族中 6 类仅中文有判据、英文侧无对称支，reward_hacking 是 BLOCK_DIMS 成员，攻击英文表述可直接放行到用户',
  '[D] 清理 scripts/round-154/156/157/168/169/170/172/183/185/186/187 共 11 个探针目录：纯维护，仓库体积降但零能力提升，finish 的 objection 检查可能要求清理',
].join('\n');

const context = [
  '轮初实测证据：rh 英文侧 6 类中文对称缺口未复测过是否存在；di 调试语境 idx 7/47 两条命中-豁免分叉尚未定位具体样本；ai_writing_tell 误伤样本条数与语种未定位；探针目录清理是零能力提升的维护项。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt, context });
  console.log(JSON.stringify({
    chosen: r.chosen || (r.composite_ && r.composite_.chosen),
    confidence: r.confidence || (r.composite_ && r.composite_.confidence),
    reason: r.reason || (r.composite_ && r.composite_.reason),
  }, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
