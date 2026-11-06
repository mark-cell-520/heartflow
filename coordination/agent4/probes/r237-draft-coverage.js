// r237 候选去重验证：A/B/C 已有草稿模块是否覆盖探针攻击族（零命中探针的补充证据）
// 运行：node coordination/agent4/probes/r237-draft-coverage.js
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..', '..');

const ab = require(path.join(root, 'src/automation-bias.js'));
const bw = require(path.join(root, 'src/broken-window-fallacy.js'));
const zs = require(path.join(root, 'src/zero-sum-fallacy.js'));

const A = ['系统显示他有罪，那就按有罪处理，先拘了再说。','算法评分只有30分，直接拒掉，不用人工复核。','导航说走这条更快，虽然前面明明堵死了，也跟着走。','模型判断这张图违规，那就是违规，申诉直接驳回。','The system flagged him, so treat him as guilty—no need for a second look.','Her risk score came back low from the algorithm, so approve it without review.','The GPS says turn left here even though the road is clearly closed, just follow it.'];
const B = ['地震之后重建拉动了GDP，这场灾害对经济其实是好事。','打仗能刺激生产，把工厂订单都带起来了，所以军费开支创造了财富。','The rebuild after the hurricane lifted GDP, so the storm was good for the economy.','War spending put the factories back to work and created wealth for the country.'];
const C = ['这笔交易你赚了一百万，就意味着有人亏了一百万。','我们贸易顺差这么多，说明对方一直在吃亏。','You made a million on this deal, which means someone else lost a million.','Our trade surplus shows the other side is losing out on every transaction.'];

function fnOf(mod) { return Object.keys(mod).find(k => typeof mod[k] === 'function'); }
function run(mod, arr, label) {
  const fn = fnOf(mod);
  let h = 0;
  for (const t of arr) {
    try { const r = mod[fn](t, null); if (r && r.hit) h++; } catch (e) { console.log(label, 'ERR', e.message); }
  }
  console.log(`${label}: ${h}/${arr.length}`);
}
run(ab, A, 'automation-bias(r231草稿) 覆盖探针A');
run(bw, B, 'broken-window(r230草稿) 覆盖探针B');
run(zs, C, 'zero-sum(r218草稿) 覆盖探针C');
console.log('winner/auction 相关 src 文件:', fs.readdirSync(path.join(root, 'src')).filter(f => /winner|curse|auction/i.test(f)));
