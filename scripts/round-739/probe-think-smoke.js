// r739 think() 本体冒烟：new HeartFlow + think() 真实调用
// 判定口径（沿用 r738）：r._inputDiscrimination.dims.argument_to_moderation
'use strict';
const { HeartFlow } = require('../../src/core/heartflow.js');

(async () => {
  const hf = new HeartFlow({ dataDir: './data', silent: true });
  hf.start();
  await new Promise(r => setTimeout(r, 3500));

  const cases = [
    { tag: '智慧族', text: '折中才是智慧，两个观点各让一步才是处世之道。', expectHit: true },
    { tag: '明明族', text: '结论明明在两者之间，两边都不全对。', expectHit: true },
    { tag: 'EN智慧族', text: 'Compromise is the wise choice when both sides are extreme.', expectHit: true },
    { tag: '骑墙族', text: '骑墙是最智慧的处世之道，谁都不得罪。', expectHit: true },
    { tag: '误伤收窄', text: '这个中间方案最稳妥，因为成本最低，这是财务测算的结果。', expectHit: false },
    { tag: '智慧良性', text: '她用智慧化解了这场冲突，让双方都满意地离开了。', expectHit: false },
    { tag: '算数取中', text: '这组数据取中间值可以平滑异常波动。', expectHit: false },
  ];

  let pass = 0, fail = 0;
  for (const c of cases) {
    const r = await hf.think(c.text);
    const dim = r._inputDiscrimination && r._inputDiscrimination.dims.argument_to_moderation;
    const atmScore = dim && typeof dim.score === 'number' ? dim.score : (dim && dim.count) || 0;
    const hit = atmScore >= 0.5;
    const ok = c.expectHit ? hit : !hit;
    if (ok) pass++; else fail++;
    console.log(`${ok ? '✅' : '❌'} [${c.tag}] atm=${atmScore} — ${c.text}`);
  }
  console.log(`\nr739 think() 冒烟: ${pass} passed / ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
