// r543: 正确复测 L4→L5 叙事约束。修正 r542 探针的测量 bug：
// 原脚本 stageWordsOf() 返回 [{stage:'进入',description:'...'}] 对象数组，
// 却用对象直接做 resp.includes(w) 字符串比较 → 恒 false，是测量 bug 不是引擎断点。
// 本脚本统一从 L4.matchedNarrativeDetail.stages 取 .stage 字符串再比对。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { AssociativeEngine } = require(path.join(ROOT, 'src/archive/associative-engine.js'));

const SAMPLES = [
  '专注和心流是深度工作的关键',
  '算法和代码需要重构，性能有问题',
  '我感到很焦虑，因为工作压力太大了',
  '守株待兔是不劳而获的表现'
];

(async () => {
  const eng = new AssociativeEngine(ROOT);
  let totalStages = 0;
  let totalStageHits = 0;
  const rows = [];

  for (const s of SAMPLES) {
    const r = await eng.process(s);
    const L = r.internal.layers;
    const detail = L.L4.matchedNarrativeDetail || null;
    const resp = L.L5.response;

    // 从 detail 取 stage 字符串（修正点）
    const stageWords = (detail && Array.isArray(detail.stages))
      ? detail.stages.map(x => (x && typeof x === 'object' ? x.stage : x)).filter(x => typeof x === 'string')
      : [];
    const stageHits = stageWords.filter(w => resp.includes(w));

    const dims = Object.keys(L.L4.thoughtVector.dimensions || {});
    const dimHits = dims.filter(w => resp.includes(w));

    totalStages += stageWords.length;
    totalStageHits += stageHits.length;
    rows.push({
      sample: s,
      narrative: L.L3.matchedPrototype ? L.L3.matchedPrototype.name : null,
      stageWords, stageHits,
      l5Head: resp.slice(0, 24),
      dimHitRatio: dimHits.length + '/' + dims.length
    });

    console.log('---- ' + s);
    console.log('  L3 narrative = ' + (L.L3.matchedPrototype ? L.L3.matchedPrototype.name + '/' + L.L3.matchedPrototype.id : 'null'));
    console.log('  detail.stages = ' + JSON.stringify(stageWords));
    console.log('  L5 前24字 = ' + resp.slice(0, 24));
    console.log('  stage hits = ' + stageHits.length + '/' + stageWords.length + ' ' + JSON.stringify(stageHits));
    console.log('  dim hits = ' + dimHits.length + '/' + dims.length);
    console.log('  trace narrative_context = ' + JSON.stringify((L.L5.trace || []).find(t => t.step === 'narrative_context') || null));
    console.log('  drift_correction(narrative) 次数 = ' + ((L.L5.trace || []).filter(t => t.step === 'drift_correction' && t.data && t.data.source === 'narrative_stage').length));
  }

  console.log('\n==== 汇总 ====');
  console.log('叙事 stage 词命中 L5 总计: ' + totalStageHits + '/' + totalStages);
  for (const row of rows) {
    console.log('  ' + row.sample + ' | ' + row.stageHits.length + '/' + row.stageWords.length + ' | dim ' + row.dimHitRatio);
  }
})().catch(e => { console.error('FATAL', e); process.exit(1); });
