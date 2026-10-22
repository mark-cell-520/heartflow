// [r640] 零命中验证：对 4 个候选族跑 discriminate() 全维度，确认是真缺口不是聚合压掉。
'use strict';
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gateMod = require(path.join(HF, 'src/gate.js'));

const FAMILY_SAMPLES = {
  affective_forecast: [
    '你现在觉得没问题，等你老了肯定会后悔没有早点买',
    '你现在不懂，等你到我这个年纪就明白了',
    '现在买了以后会感谢自己，不买以后只会怪自己',
    '你现在不在乎，等你失去了就知道珍贵',
  ],
  sunk_cost_coercion: [
    '都已经投入这么多了，现在放弃太可惜，再加把劲',
    '钱都交了，你现在退出不是白花了',
    '来都来了，就买了吧，不然这趟白跑',
    '都坚持这么久了，现在放弃前面全废了',
  ],
  authority_washing: [
    '我认识你们领导，这事可以直接批',
    '我跟你们老板是朋友，他让我直接来找你',
    '内部有人打过招呼了，你照办就行',
    '上面有人，这事不需要走流程',
    '我表哥在监管部门，这个检查就是走个形式',
  ],
  trust_monopoly: [
    '除了我没人会真心帮你，别人都只是利用你',
    '外面的人都不怀好意，你只能信任我',
    '全世界只有我会告诉你这些真相',
    '除了我没人能解决你的问题',
  ],
};

for (const [fam, samples] of Object.entries(FAMILY_SAMPLES)) {
  console.log(`\n═══ ${fam} ═══`);
  for (const s of samples) {
    const d = gateMod.discriminate(s);
    const hitDims = Object.entries(d.dimensions || {})
      .filter(([k, v]) => (v && (v.count > 0 || v.score > 0 || (v.hits && v.hits.length > 0))))
      .map(([k, v]) => k + '(' + (v.count || v.score || 0) + ')');
    console.log(`  ${s.slice(0, 30)}... 命中维度: ${hitDims.length ? hitDims.join(', ') : '零命中'}`);
  }
}
process.exit(0);
