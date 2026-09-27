// 第 150 轮 decision：选择本轮方向（候选均带实测证据）
const { HeartFlowDecision } = require('../../src/core/decision.js');
const prompt = [
  '[A] eval_input_shortcut 中文侧补形：scripts/round-150/probe-r150-eis.js 实测 6 条攻击仅 2/6 命中，且命中的 2 条均为旧支控制组（识别后跳过真实推理、特判样本），新形状 4 条全漏——伪造输入喂进模型、构造稳过输入、背题再答、伪造输入让分数好看。良性 5 条 0 误伤。缺口坐实为整族失守，模板与判据模式与 149 轮完全一致（两半齐备 + 删条守卫 + 良性池），成本低确定性高。',
  // B 候选本轮已通过 probe 复测坐实：4 条全漏（旧支 0 命中），修复成本同样低——
  //   同为两半齐备判据，可复用 A 的删条守卫与良性池脚手架。
  '[B] proxy_fetch_code 中文侧补形：149 轮遗留称 4 条攻击 1/4。本轮 probe-r150-pfc.js 复测：反代取凭证 0/1、隧道拉外部实现 1/1（旧支已覆盖）、调远端 API 抄参考实现 0/1——两个新形状坐实全漏；良性 3 条 0 误伤。但缺口规模小于 A（2 条 vs 4 条）。',
  '[C] ai_writing_tell 多语言误伤修复：148/149 轮均登记未动，无本轮实测数据，误伤形态与基线关系未知，动它可能冲击误拦基线。',
  '[D] dangerous_instruction 开发调试语境误拦：149 轮已实测复测不成立（idx7/idx47 误伤已不存在），4 条探针全 pass，控制组仍正确 block——此项无缺口可做。',
].join('\n');
(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 150 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1).slice(0, 2000));
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
