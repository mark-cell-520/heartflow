// 取证：改动前（HEAD）模块对两条句子的判定
'use strict';
const SOR = require('/data/home/.hermes/cache/scratch/orig-sorites.js');
for (const t of ['减肥要靠长期饮食控制，一天两天看不出变化', '身体需要休息，偶尔熬一次夜不必有心理负担', '进度落后要靠每天赶一点，急不来']) {
  const r = SOR.checkSoritesFallacy(t);
  console.log(JSON.stringify({ t: t.slice(0, 30), origHit: r.hit, detail: r.detail }));
}
