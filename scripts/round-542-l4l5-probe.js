// r542: 复测 L4→L5 断点。确认三件事：
//  1) matchedStory=undefined 是 r541 脚本显示 bug 还是引擎断点
//  2) L5 是否消费 L3 命中的叙事原型（framework/stages）
//  3) L5 输出与 L4 dimensions 的关系（是否真的是碎词串）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { AssociativeEngine } = require(path.join(ROOT, 'src/archive/associative-engine.js'));
const { NarrativeRetriever } = require(path.join(ROOT, 'src/archive/associative-engine/narrative-retriever.js'));

// 图内真实词汇（r541 实测这些能命中图谱）
const SAMPLES = [
  '专注和心流是深度工作的关键',
  '算法和代码需要重构，性能有问题',
  '我感到很焦虑，因为工作压力太大了',
  '守株待兔是不劳而获的表现'
];

function stageWordsOf(retriever, proto) {
  if (!proto) return [];
  const p = retriever.prototypes.prototypes[proto.id];
  return Array.isArray(p && p.stages) ? p.stages : [];
}

(async () => {
  const eng = new AssociativeEngine(ROOT);
  const retriever = eng.narrativeRetriever;
  console.log('generateResponse.length (声明参数个数) = ' + eng.wordByWordGenerator.generateResponse.length);

  for (const s of SAMPLES) {
    const r = await eng.process(s);
    const L = r.internal.layers;
    const t = r.internal.thoughtLog;
    const l3 = L.L3.matchedPrototype;
    const dims = Object.keys(L.L4.thoughtVector.dimensions || {});
    const resp = L.L5.response;

    // 叙事 stages 词是否出现在 L5 输出里
    const stages = stageWordsOf(retriever, l3);
    const stageHits = stages.filter(w => resp.includes(w));
    // L4 概念词是否出现在 L5 输出里
    const dimHits = dims.filter(w => resp.includes(w));

    console.log('\n━━━━ ' + s);
    console.log('  L3 matched=' + (l3 ? (l3.name + '/' + l3.id) : 'null') + ' status=' + L.L3.status + ' conf=' + L.L3.confidence);
    console.log('  L4 matchedNarrative = ' + JSON.stringify(L.L4.matchedNarrative) + ' (typeof ' + typeof L.L4.matchedNarrative + ')');
    console.log('  L4 有 matchedNarrativeDetail 字段? ' + ('matchedNarrativeDetail' in L.L4));
    console.log('  L4 dims(' + dims.length + ') = ' + dims.slice(0, 8).join(' | '));
    console.log('  L3 stages = ' + JSON.stringify(stages));
    console.log('  L5 response = ' + resp);
    console.log('  → 叙事 stage 词命中 L5: ' + stageHits.length + '/' + stages.length + ' ' + JSON.stringify(stageHits));
    console.log('  → L4 概念词命中 L5: ' + dimHits.length + '/' + dims.length);
    console.log('  → thoughtLog.matchedStory = ' + JSON.stringify(t.matchedStory) + ' (typeof ' + typeof t.matchedStory + ')');
    console.log('  → L5.thoughtVector 是否含 narrative 字段? ' + ('narrative' in (L.L5.thoughtVector || {})));
  }
})().catch(e => { console.error('FATAL', e); process.exit(1); });
