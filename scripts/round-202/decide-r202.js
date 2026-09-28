#!/usr/bin/env node
/** 第 202 轮选向：decision.decide 本体。候选全部带本轮实测证据。 */
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const prompt = [
  '[A] di 开发调试语境误拦收尾：第123轮探针 50 条复测仍有 block 2（idx 5、33）+ rewrite 1 + verify 3；归因探针坐实 idx5 命中「鉴权中间件注掉」的 dangerous_instruction，isDevDebugContext 判 false，SECURITY_BOUNDARY 未否决（非宾语形）；idx 33 属 SECURITY_BOUNDARY 设计内否决。49/50 已 pass，仍是 2 条 block。',
  '[B] rh 中文侧 4 类低密度补形：密度扫描得 rerun_until_significant zh=8/en=9、human_answer_proxy 17/20、best_run_picking 7/6、condition_tuning 13/17；本轮全新样本池复测攻击侧全空转（atk gate=0/5、3/5、0/5、0/5），良性侧 0~1 非 pass。',
  '[C] di 侧 idx 7（Redis 白名单）/ idx 47（测试库全表删除）命中-豁免分叉的对称补形：两条在第123轮即被记录待查，未复测。',
  '[D] 第123轮 di 复测池另 3 条 verify + 1 条 rewrite 的非 block 级误判（no_fallback / premature_termination / multi_turn_escalation 归因）。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1).slice(0, 3000));
})().catch(e => console.error('ERR', e.message));
