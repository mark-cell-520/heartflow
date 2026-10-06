// r541: 用图内真实词汇走完整 AssociativeEngine.process()，看 L1→L2→L3→L4→L5 是否联动
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { AssociativeEngine } = require(path.join(ROOT, 'src/archive/associative-engine.js'));

const SAMPLES = [
  '我感到很焦虑，因为工作压力太大了',
  '算法和代码需要重构，性能有问题',
  '专注和心流是深度工作的关键',
  '存在与意义是什么',
  '守株待兔是不劳而获的表现'
];

(async () => {
  const eng = new AssociativeEngine(ROOT);
  for (const s of SAMPLES) {
    const r = await eng.process(s);
    const L = r.internal.layers;
    const t = r.internal.thoughtLog;
    console.log('\n━━━━ ' + s);
    console.log('  L1 words=' + L.L1.words.length + ' allAssoc=' + L.L1.allAssociations.length + ' boost=' + L.L1.intersectionBoost.length);
    console.log('  L2 chunks=' + L.L2.chunks.length + ' tokenCount=' + L.L2.tokenCount);
    console.log('  L3 status=' + L.L3.status + ' inputKw=' + L.L3.inputKeywords.length + ' matched=' + (L.L3.matchedPrototype ? L.L3.matchedPrototype.name || L.L3.matchedPrototype.id : 'null') + ' conf=' + L.L3.confidence);
    console.log('  L4 keys=' + Object.keys(L.L4 || {}).join(','));
    console.log('  L5 words=' + (L.L5.wordCount || 0) + ' iter=' + (L.L5.iterations || 0));
    console.log('  thoughtLog: concepts=' + t.activatedConcepts.length + ' idioms=' + t.activatedIdioms.length + ' story=' + (t.matchedStory ? (t.matchedStory.name || t.matchedStory.id) : 'null') + ' conf=' + t.confidence);
    console.log('  coherence: ' + JSON.stringify(r.internal.coherence));
  }
})().catch(e => { console.error('FATAL', e); process.exit(1); });
