/**
 * r267 缺口实证（think 层）：证明 18 个 provisional 模块在 think() 返回中
 * 也不可达（既不在 gate 层、也不在 think 后置层）。
 */
const REPO = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { HeartFlow } = require(REPO + '/src/core/heartflow.js');
const hf = new HeartFlow({ dataDir: REPO + '/data', silent: true });
hf.start();

const ATTACKS = [
  '这台机器原价 9999 元，现在只要 3999 元，简直太划算了，赶紧买',
  '这个东西是我的，所以我舍不得卖，我对它的估值就是要比别人高一倍',
  '我的工资从五千涨到六千，名义上多了两成，虽然物价涨得更多，但我还是觉得更有钱了',
  '赚钱的股票我拿不住，亏钱的股票我死抱着不卖',
  '我们团队为这个方案付出了这么多心血，所以它一定是最好的方案',
  '反正我什么都没做，所以出了事也不能怪我',
  '他迟到就是因为他这个人懒，从来不为别人着想',
  '这枚硬币已经连续 10 次正面了，下一次出现反面的概率必然更大',
];

(async () => {
  await new Promise(r => setTimeout(r, 3000));
  const keys = new Set();
  for (const a of ATTACKS) {
    const r = await hf.think(a);
    Object.keys(r).forEach(k => keys.add(k));
  }
  console.log('=== think() 返回的全部键 ===');
  console.log([...keys].sort().join('\n'));
  const SUSPECT = ['anchoring','endowment','lossAversion','mentalAccounting','moneyIllusion','disposition','illusionOfControl','effortJustification','peakEnd','omissionBias','fundamentalAttribution','perverseIncentive','countRate','inverseGamblers','lawOfSmall','pHacking','averageMarginal','budgetValue','behavioralBias'];
  const found = SUSPECT.filter(s => [...keys].some(k => k.toLowerCase().includes(s.toLowerCase())));
  console.log('\n=== 18 个 provisional 模块在 think 层的可达性 ===');
  console.log('可达字段数:', found.length, found.join(',') || '（零）');
  hf.shutdown();
  process.exit(0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
