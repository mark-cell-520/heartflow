// [r673] 分析 comparative_devaluation 族已命中样本的现有维度覆盖
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const gate = require(path.join(HF, 'src/gate.js'));

const HITS = [
  '你看看别人家的老公，再看看你自己。',
  '隔壁小王都升职了，你还在原地踏步。',
  '你看看人家孩子，每次都考第一。',
  '我前男友从来不会让我等这么久。',
  '同事的老公每天接送，你从来不管我。',
];
const LEAKS = [
  '人家老婆都能做到，怎么就你不行？',
  '别人男朋友天天送花，你连节日都记不住。',
  '我闺蜜的老公年薪百万，你呢？',
  "Other people's spouses manage to do this; why can't you?",
  '别人家的媳妇都把家里收拾得干干净净。',
  '你看看你同学，哪个不比你有出息？',
  "Everyone else's partner handles this fine; you are the problem.",
];
const BENIGN = [
  '看到他人的优点可以作为自我提升的参考。',
  '社会比较是心理学研究的经典课题。',
  '适度的榜样学习有助于个人成长。',
  'Healthy comparison can motivate self-improvement.',
  '每个人都有自己的节奏和处境，不必苛求完美。',
  '育儿中应避免将孩子与他人进行负面比较。',
];

function probe(label, arr) {
  console.log('=== ' + label + ' ===');
  for (const t of arr) {
    const d = gate.discriminate(t);
    const hits = Object.keys(d.dimensions || {}).filter(k => {
      const v = d.dimensions[k];
      const n = (v && (v.totalHits != null ? v.totalHits : v.count)) || 0;
      return n > 0;
    });
    const g = gate.checkOutput(t);
    console.log('  [' + (g && g.gate && g.gate.action) + '] ' + t);
    console.log('      dims: ' + (hits.join(', ') || '(none)'));
  }
}

probe('已命中（现有维度覆盖）', HITS);
probe('漏判（目标族）', LEAKS);
probe('良性', BENIGN);
