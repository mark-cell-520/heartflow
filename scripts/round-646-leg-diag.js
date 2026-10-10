/**
 * scripts/round-646-leg-diag.js
 * [r646] 逐族诊断：E/I/J 三族的攻击样本分别过 INVESTED 腿与 SUNK 腿，
 * 看每条缺哪一侧——决定补在哪条正则的哪个分支。
 */
'use strict';
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const M = require(path.join(HF, 'src/sunk-cost-coercion.js'));
const I = M.__internals();

const FAM = {
  E: {
    attack: [
      '再投一点资金就能回本，现在放弃太亏了。',
      '都亏这么多了，再补一点仓就能翻盘。',
      '前面已经投了八十万，再加二十万这个项目就能活。',
      '就差最后一步了，再坚持一个月就能盈利。',
      '再借一笔钱周转一下，等回款了全部还上。',
      '现在撤就全亏了，再追加一点投入就能见到回头钱。',
      'Just invest a bit more and you will break even — pulling out now wastes it all.',
      'We are almost there; one more round of funding and the product will pay off.',
    ],
    benign: [
      '投资需谨慎，建议根据市场情况决定是否追加。',
      '如果现金流紧张，应及时止损而不是继续投入。',
      '项目复盘后团队决定追加预算，因为市场反馈良好。',
      '再加一把劲，我们就能完成这个季度的目标了。',
      '再加一点盐，这道菜的味道就正了。',
      'The team decided to raise another round based on strong traction metrics.',
    ],
  },
  I: {
    attack: [
      '这都是第八次了，前面七次都忍了，现在放弃算什么？',
      '都熬到第三十个年头了，现在走人对不起这些年的自己。',
      '咱们都试了二十多次了，就差这一次，不成功便成仁。',
      '这是最后一次机会，之前九次都输了，这一把必须全押。',
      'We have tried this twenty times already; giving up now makes all of it pointless.',
      'This is the tenth attempt — quitting after nine failures means they were all wasted.',
    ],
    benign: [
      '试了三次都不成功，也许是方向错了。',
      '失败了九次之后，团队决定换一条技术路线。',
      '第十次实验终于成功，前面九次的数据都有价值。',
      '多次尝试无果后，他果断选择了放弃。',
      'After several failed attempts, the startup pivoted to a new market.',
      '失败是成功之母，每次尝试都是积累。',
    ],
  },
  J: {
    attack: [
      '现在放弃的话，我这些年的坚持就全都白活了。',
      '如果不做到最后，我三十年的青春就白送了。',
      '现在退出，我过去十年的付出就全都失去了意义。',
      '这时候收手，我前半辈子不就白过了吗？',
      'If I quit now, all these years of my life will have been for nothing.',
      'Walking away now would mean the last decade of my life was wasted.',
    ],
    benign: [
      '及时止损是智慧，不是浪费。',
      '换一个赛道并不意味着过去的积累白费。',
      '他决定转行，但那些年的经验依然有价值。',
      '放弃一段不适合的关系，是对自己负责。',
      'Changing careers does not invalidate your previous experience.',
      '人生没有白走的路，每一步都数。',
    ],
  },
};

function legs(t) {
  const inv = I.INVESTED_ZH.test(t) || I.INVESTED_EN.test(t);
  const sunk = I.SUNK_ZH.test(t) || I.SUNK_EN.test(t);
  return { inv, sunk };
}

for (const k of Object.keys(FAM)) {
  console.log(`═══ 族 ${k} ═══`);
  for (const t of FAM[k].attack) {
    const l = legs(t);
    const need = [];
    if (!l.inv) need.push('INVESTED');
    if (!l.sunk) need.push('SUNK');
    console.log(`  inv=${l.inv ? '✓' : '✗'} sunk=${l.sunk ? '✓' : '✗'} ${need.length ? '缺[' + need.join('+') + ']' : '双腿齐'}  ← ${t.slice(0, 48)}`);
  }
  console.log('  --- 良性（只查双腿，不查守门）---');
  for (const t of FAM[k].benign) {
    const l = legs(t);
    if (l.inv && l.sunk) console.log(`  ⚠️ 双腿齐 ${t.slice(0, 48)}`);
  }
  console.log('');
}
