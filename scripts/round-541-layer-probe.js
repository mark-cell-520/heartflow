// r541 详细内窥：L1/L2/L3/L5 的具体数字 + coherence 真假
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { AssociativeEngine } = require(path.join(ROOT, 'src/archive/associative-engine.js'));

const SAMPLES = [
  '我现在压力很大，心里很乱，不知道该怎么办。',
  '守株待兔是不劳而获的表现',
  '我感到很焦虑，因为工作压力太大了'
];

const J = (o) => JSON.stringify(o);

(async () => {
  const eng = new AssociativeEngine(ROOT);
  for (const s of SAMPLES) {
    console.log('\n=========== 样本:', s);
    const r = await eng.process(s);
    const L = r.internal.layers;
    console.log('  L1Status:', L.L1Status, '| L2Status:', L.L2Status, '| L3Status:', L.L3Status, '| L4Status:', L.L4Status, '| L5Status:', L.L5Status);

    // L1
    console.log('  --- L1 键:', Object.keys(L.L1 || {}).join(','));
    const l1 = L.L1 || {};
    console.log('  L1.words:', J(l1.words) && l1.words ? 'len=' + l1.words.length + ' ' + J(l1.words).slice(0,200) : l1.words);
    console.log('  L1.tokenCount:', l1.tokenCount);
    console.log('  L1.allAssociations:', l1.allAssociations ? 'len=' + l1.allAssociations.length : l1.allAssociations);
    if (l1.associations) console.log('  L1.associations:', J(l1.associations).slice(0,400));
    for (const k of Object.keys(l1)) {
      if (['words','associations','allAssociations','tokenCount'].includes(k)) continue;
      const v = l1[k];
      console.log('  L1.' + k + ':', Array.isArray(v) ? 'arr len=' + v.length : J(v).slice(0,150));
    }

    // L2
    console.log('  --- L2 键:', Object.keys(L.L2 || {}).join(','));
    const l2 = L.L2 || {};
    for (const k of Object.keys(l2)) {
      const v = l2[k];
      console.log('  L2.' + k + ':', Array.isArray(v) ? 'arr len=' + v.length + ' ' + J(v).slice(0,300) : J(v).slice(0,200));
    }

    // L3 / L5
    for (const [name, obj] of [['L3', L.L3], ['L5', L.L5]]) {
      console.log('  --- ' + name + ' 键:', Object.keys(obj || {}).join(','));
      for (const k of Object.keys(obj || {})) {
        const v = obj[k];
        console.log('  ' + name + '.' + k + ':', Array.isArray(v) ? 'arr len=' + v.length + ' ' + J(v).slice(0,250) : J(v).slice(0,200));
      }
    }

    // thoughtLog
    const t = r.internal.thoughtLog;
    console.log('  --- thoughtLog.activatedConcepts:', t.activatedConcepts ? 'len=' + t.activatedConcepts.length + ' ' + J(t.activatedConcepts).slice(0,200) : t.activatedConcepts);
    console.log('  --- thoughtLog.activatedIdioms:', t.activatedIdioms ? 'len=' + t.activatedIdioms.length : t.activatedIdioms);
    console.log('  --- thoughtLog.matchedStory:', J(t.matchedStory));
    console.log('  --- thoughtLog.confidence:', t.confidence, '| quality:', J(t.quality).slice(0,150));

    console.log('  *** coherence:', J(r.internal.coherence));
    console.log('  *** wordTrace[0..6]:', J(r.internal.wordTrace.slice(0,7)));
    console.log('  *** metrics:', J(r.internal.metrics).slice(0,400));
  }
})().catch(e => { console.error('FATAL', e); process.exit(1); });
