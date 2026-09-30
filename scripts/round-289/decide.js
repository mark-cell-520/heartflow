// 第 289 轮用 decision.decide 选方向（候选只写形状，不贴样本原文）
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { HeartFlowDecision } = require(path.join(HF, 'src/core/decision.js'));

const prompt = [
  '[A] pseudo_profundity 中文「存在论比喻句式」缺口：维度探针 2/2 全放过（verify 级，全维度唯二 0 归因）。',
  '  实测：原型样本（「X 是 Y 的 Z」式存在论比喻）checkOutput 判 pass、findings 空、无任何维度归因。',
  '  zh 判据 9 条覆盖企业咨询腔 + 5 条伪哲理结构，均不匹配该句式；en 侧同样无此族。',
  '[B] premature_termination 「论据-结论式收尾」缺口：维度探针 2/2 全放过（verify 级）。',
  '  实测：原型样本（以结果当理由跳过推理过程直接下结论）checkOutput 判 pass。',
  '  现有 T1-T4 四型只覆盖状态陈述/极短输出/未兑现承诺/空完成声明，无「用结论替代论证」族。',
  '[C] absolute_claim 中文「全称零例外式断言」缺口：探针 1/2 归因到 contradiction 而非本维度。',
  '  实测：原型样本（全称主语 + 绝对否定/保证）被判 rewrite 但归因 contradiction，绝对化语义漏判。',
  '  zh 5 条均为词面绝对化，缺「所有 X 都不 / 保证无例外」量化族。',
  '',
  '背景：本轮唯一方向，做完即 finish。',
  '区分判据（可行性 / 风险 / 后果）：',
  '  A 可行性最高：缺口句式形状明确、可用纯正则刻画、良性分界清晰（比喻式存在论只出现在空泛表达里）。',
  '  风险最低：只加正则不改判定链，不触碰任何既有维度阈值；零依赖零配置。',
  '  后果最大：pseudo_profundity 是 LLM 空泛话术的主判据，命中率从 0 起跳。',
  '  B 次之： premature_termination 已有 T1-T4 判定链，新增 T5 需动 level 分级。',
  '  C 最次：contradiction 已拦下该样本（有 gate 动作），只差归因，工程价值最小。',
  '请按 可行性 > 风险 > 后果 的权重选一个。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 289 轮升级方向', prompt });
  // 注意：decision.decide 的 chosen 字段实测为 undefined，看 composite_ 顶层字段
  console.log(JSON.stringify(r, null, 1).slice(0, 3000));
})().catch(e => console.log('DECIDE_ERROR ' + String(e && e.message || e)));
