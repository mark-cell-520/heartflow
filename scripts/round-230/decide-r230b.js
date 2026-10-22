// 第 230 轮（重跑编号 276）方向裁决：decision 引擎真调。
'use strict';
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 收窄旧判据 `all \\w+ are` 的工程句式误伤：本轮 probe4 复测 10/22 良性工程全称句被 gate 拦下（All metrics are exported / All headers are lowercased / All rows are checksummed 等，probe3 逐条归因 RE_MISS 证实全部来自旧判据 line 4778，non本轮新判据）。性质=恶化门禁质量，已污染 301/326 误拦基线。风险：必须整轮做收窄 + bidirectional-guard 基线重算 + extended 集回归，单边收窄可能动 baseline 导致 run-all 基准红。',
  '[B] 修复 every/each 主判据群体表残缺 bug（含 ZZZ 占位符未替换）：229 轮提交的 line 4823 主判据里留下 5 个 `ZZZ` 字面量（永不命中），且群体表缺 user/customer/developer/manager/team/analyst 六大最高频群体，不支持 each。本轮复测：10 条 every+高频群体行为句 gate 命中 2/10，12 条同形状扩样命中 2/12，良性 22 条工程全称句 + 5 条人类集合完成态零新增误伤。性质=纯增量修 bug，front-load 工作=补群体词 + each 别名 + 修占位符，风险低， recall 可预期从 2/12 提到 12/12。',
  '[C] unsupported_claim 英文侧 <研究名词> <动词> <结论> 族召回恢复：probe3 复测 r227 miss 4 条仍 miss 4 条，7 条同形状扩样 recall 2/7，良性 0/5 零误伤。缺口 5 条，但已有 76 支判据，交叉风险中等。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(res));
})().catch(e => console.log('ERR ' + e.message));
