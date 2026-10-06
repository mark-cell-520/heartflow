// r541: r540 未跑的关键复测 —— 分词接入后端到端 AssociativeEngine.process()
// 输出 L1 words/allAssociations、L2 chunks/tokenCount、L5 matchedPrototype / coherence
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { AssociativeEngine } = require(path.join(ROOT, 'src/archive/associative-engine.js'));

const SAMPLES = [
  '我现在压力很大，心里很乱，不知道该怎么办。',
  '守株待兔是不劳而获的表现',
  'API接口需要重构，但是团队没有时间',
  'hello world this is english text',
  '我感到很焦虑，因为工作压力太大了'
];

(async () => {
  const eng = new AssociativeEngine(ROOT);
  console.log('=== AssociativeEngine 构造成功 ===');
  console.log('根目录:', eng.projectRoot);

  for (const s of SAMPLES) {
    console.log('\n---------------------------------------------');
    console.log('样本:', s);
    let r;
    try {
      r = await eng.process(s);
    } catch (e) {
      console.log('  process() 抛错:', e.message);
      continue;
    }
    if (!r) { console.log('  process() 返回空'); continue; }

    console.log('  顶层键:', Object.keys(r).join(', '));
    const dump = (label, obj) => {
      if (obj === undefined) return;
      if (obj && typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length === 0) { console.log(`  ${label}: {}（空对象）`); return; }
        for (const k of keys) {
          const v = obj[k];
          if (Array.isArray(v)) console.log(`  ${label}.${k}: 数组 len=${v.length}`);
          else if (v && typeof v === 'object') console.log(`  ${label}.${k}: {${Object.keys(v).join(',')}}`);
          else console.log(`  ${label}.${k}: ${String(v).slice(0, 120)}`);
        }
      } else console.log(`  ${label}: ${String(obj).slice(0,200)}`);
    };
    dump('result', r);
    for (const k of Object.keys(r)) {
      const v = r[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) dump(`  [${k}]`, v);
    }
  }
})().catch(e => { console.error('FATAL', e); process.exit(1); });
