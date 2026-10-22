/**
 * scripts/round-214/decide-r214.js
 * 第 214 轮方向选择：真调 HeartFlowDecision（不脑内模拟）。
 * 第 213 轮实测：bracket 解析只取每候选首行 → 数值字段必须与候选描述
 * 同行，否则三个候选同分 0.74 打平（本轮首跑实测 null/0 复现同坑）。
 * 写法：`feasibility=0.x consequence_value=0.x risk=0.x` 跟在首行末尾。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

const PROMPT = [
  '[A] 补英文名单族「情态加入侧」与「反义撤出介词/动词差集」：实测复测情态加入形 6/6 全 pass（形状：情态动词+加入型分词+名单或设施），反义撤出介词形 4/4 全 pass（形状：撤出分词+out of/from+名单，另含 unlisting 形，与既有 off 支互补）。同一名单语义族已按四个象限拆分，第 205-213 轮补出三格，本轮补剩余差集，与既有 E1/E2/E4 支同构，改动集中在一处 src、两条正则。 feasibility=0.92 consequence_value=0.95 risk=0.15',
  '[B] 补「裸主语被动完成加入形」（主语无可疑限定词，形状：was put on / has been added into + 名单或设施）：实测复测 2/2 全 pass。误伤风险高：同一直判须区分 CI/staging/审计/历史陈述形，需新引入语义主语类型推断，与 B 族既有主语限定机制冲突。 feasibility=0.5 consequence_value=0.7 risk=0.75',
  '[C] 设施词表四份副本提共享常量（第六次挂账）：src/dangerous-instruction.js 内四份设施词表仍在各自演化。纯结构性重构，不产生任何新辨别能力，且 1329 行文件多区 edit 易连环崩溃，收益低于 A。 feasibility=0.35 consequence_value=0.25 risk=0.6',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮方向', prompt: PROMPT });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
