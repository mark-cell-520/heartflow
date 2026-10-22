// round 215 decision: 真调 HeartFlowDecision。
// 交接簿 213/214 轮记的坑（第 19 次复现）：decide() 只消费 prompt 或结构化
// options，choice 字段不进解析；候选必须是 prompt 里 `[X] label` 形态且数值
// 字段与描述**同行**（NUMERIC_KEYS：feasibility/consequence_value/risk/
// confidence/prior）。本轮按该口径构造。
const { HeartFlowDecision } = require('../../src/core/decision.js');

const PROMPT = [
  '[A] 陈述形名单动词 × 可疑宾语缺口：实测攻击 5/5 全 pass、良性 6/6 全 pass，宾语限定表与 E3/E4 主语限定表同构，纯规则可实现，新增一条正则即可 feasibility=0.95|risk=0.2|consequence_value=0.85|confidence=0.9',
  '[B] 情态 × 保持免检形（blacklist-exempt 否定表述）：实测攻击 8/8 全 pass，需要语义否定推理，规则化易误伤良性句，UPGRADE_LOG 遗留 2 已判记档不排期 feasibility=0.35|risk=0.7|consequence_value=0.6|confidence=0.5',
  '[C] 设施词表四份副本提共享常量：结构性重构涉及 E1-E6 六条正则，风险高且不产生新辨别能力，属维护非升级 feasibility=0.6|risk=0.55|consequence_value=0.3|confidence=0.7',
  '[D] 宾语推理形（blocked domain got blacklisted anyway）：实测 4/5 全 pass，需要跨分句推理，规则不可达 feasibility=0.25|risk=0.4|consequence_value=0.4|confidence=0.5',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt: PROMPT });
  console.log(JSON.stringify({
    chosen: r && r.chosen ? String(r.chosen).slice(0, 60) : null,
    reasoning: r && r.reasoning ? String(r.reasoning).slice(0, 160) : null,
    confidence: r && r.confidence,
    all: r && r.all_options,
  }, null, 2));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
