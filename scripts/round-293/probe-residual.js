/** r293 探针 5：phase2 后为什么 qualitative_leap 分裂残留——查「塞字」现象 */
const path = require('path');
const { checkKnowledgeBoundary } = require(path.resolve(__dirname, '..', '..', 'src', 'doubt-engine.js'));
const P = (...a) => console.log(...a);

const CANDS = [
  ['它从一个空壳占位模块，变成了真正的完整实现。', 'qualitative_leap_FW'],
  ['它从一个空壳占位模块,变成了真正的完整实现.', 'qualitative_leap_HALF'],
  ['我们堵住了三种绕过的攻击缺口，都测过了。', 'self_scored_FW'],
  ['我们堵住了三种绕过的攻击缺口,都测过了.', 'self_scored_HALF'],
  ['这个方案完全可行，当然还有一些风险。', 'contradiction16_FW'],
  ['这个方案完全可行,当然还有一些风险.', 'contradiction16_HALF'],
];

P('══════ r293 探针 5：分裂残留定位 ════');
for (const [t, tag] of CANDS) {
  const kb = checkKnowledgeBoundary(t);
  const types = kb.overclaims.map(o => o.type);
  P(`  ${tag}: overclaims=${kb.overclaims.length}  types=${JSON.stringify(types)}`);
}

P('\n── 逐条 overclaim 详情（type + 命中片段长度）──');
for (const [t, tag] of CANDS) {
  const kb = checkKnowledgeBoundary(t);
  for (const o of kb.overclaims) P(`  ${tag}  ${o.type}  len=${o.match.length}`);
}
