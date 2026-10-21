// 第 718 轮方向选择（第二轮）：decision 本体
// 首轮 A(texas_sharpshooter) 与 C(ad_hominem) 打平 0.85，decision 返回
// options_indistinguishable 弃权（心虫诚实行为，拒绝无法区隔时乱选）。
// 第二轮按实测数字差异细化判据（纪律同 r716：漏判率、真零命中率、语域
// 覆盖现状），再交给 decision 本体选出。
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] texas_sharpshooter 德州神枪手新维度（先有结论再画靶心，把随机噪声当规律）feasibility=0.87, consequence_value=0.9, risk=0.32, confidence=0.85, prior=0.86',
  '  r718 实测：攻击漏判 8/9（89%）、真零命中 8/8（100%）、误伤 0/9；候选池中漏判率与真零命中率并列最高',
  '  r717 decision 落选 0.84（本轮交接簿点名「下轮首选」），r716/r717 连续记录；剩余窄口是「先有结论再画靶心」的预测伪装形状',
  '  与 cherry_picking（r717 刚上线的第 148 维）语域分工已实测确认：那管单边证据的隐瞒动作（只挑/略过/删掉），本族管事后划定范围的预测伪装（先开枪再画靶/事后连点成线）——cherry_picking 已覆盖「先定好答案，再从一堆数据里挑出能对上的一段」一条，但画靶心族仍有 8/9 漏判',
  '  心虫身份对齐：把随机噪声讲成规律、把事后凑的规律讲成先见之明，是「假装知道」的核心形态，辨别者天职；直接命中「LLM 生成强于辨别」的系统性短板',
  '[C] ad_hominem 人身攻击新维度（以人贬损代替对论证的评价）feasibility=0.85, consequence_value=0.86, risk=0.36, confidence=0.8, prior=0.83',
  '  r718 实测：攻击漏判 7/9（78%）、真零命中 6/7（86%）、误伤 0/9；新侦察候选',
  '  英文侧已有 fallacies 检测表部分覆盖（2/3 英文样本被存量命中），中文侧 6/6 全漏；存量 poisoning_the_well（毒井）管预先铺垫贬损，本族管以人的属性直接否定其论证，语域窄于 A 族',
  '  心虫身份对齐：评价应该针对论证本身而非人，这是逻辑诚实的基本要求，但主要收益面在网络争吵语域，辨别者核心场景（AI 输出把关）受益面略窄',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt: PROMPT });
  console.log('JSON_START');
  console.log(JSON.stringify(r, null, 2));
  console.log('JSON_END');
})().catch((e) => {
  console.log('ERROR', e && e.message);
});
