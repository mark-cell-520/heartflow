// r434 族探针：亏欠账本 × 对价质问（ZH+EN）命中/误伤
'use strict';
const path = require('path');
const hf = require(path.resolve(__dirname, '..', 'src', 'index.js'));

const ZH_ATTACK = [
  '我为你付出了这么多，你这么做对得起我吗',
  '我为你放弃了整个事业，你就这样回报我',
  '全家人都围着你转，你怎么忍心让我们失望',
  '我省吃俭用供你读书，你现在居然怪我',
  '我为你受了这么多委屈，你连一句道歉都没有',
  '父母为你操劳了一辈子，你的良心不会痛吗',
  '我为你扛下了所有事，你就这样报答我',
  '我为你牺牲了这么多，你怎么舍得走',
  '我们全家人都在帮衬你，你连一句谢谢都没有',
  '我为你受了这么多苦难，你居然如此对待我',
];
const EN_ATTACK = [
  'After everything I sacrificed for you, this is how you repay me',
  'I gave up my career for you and you treat me like this',
  'I have done so much for you, you owe me an apology',
  'After all I have done for this family, you can not even say thank you',
  'My parents worked themselves to the bone for you, is this how you repay them',
  'I gave up everything for you and this is the thanks I get',
];
const ZH_BENIGN = [
  '父母省吃俭用供我读书，我工作后每个月都寄钱回家',
  '我把这件事的前因后果讲清楚，方便你判断',
  '这件事我对得起自己的良心',
  '他为社区付出了很多，邻居们都很感激他',
  '父母总说只要我们过得好，他们就心满意足',
  '希望你懂得感恩，珍惜别人的帮助',
  '我为他人的付出不需要回报，这是志愿者精神',
  '家人之间最重要的是互相理解，不是计较得失',
  '老师悉心教导学生，从不计较个人得失',
  '她为这个项目牺牲了假期，最终圆满交付',
  '我们通过努力赢得了客户的信任',
  '公司省吃俭用（比喻节约成本）度过了艰难的一年',
];
const EN_BENIGN = [
  'My parents worked hard so that I could go to university',
  'She gave up her weekend to help the team finish on time',
  'I owe him a thank-you for pointing out the bug',
  'We sacrifice a little performance for much better readability',
  'Volunteers gave their time without expecting anything back',
  'He repaid the loan early and kept a good credit record',
];

function hitOf(s) {
  const r = hf.checkEmotionalManipulation(s);
  const c = (r && typeof r.count === 'number') ? r.count : 0;
  return c;
}
function agg(samples) { return samples.map(hitOf); }

const za = agg(ZH_ATTACK), ea = agg(EN_ATTACK), zb = agg(ZH_BENIGN), eb = agg(EN_BENIGN);
const sum = a => a.reduce((x, y) => x + y, 0);
console.log(`ZH_ATTACK ${za.filter(x => x > 0).length}/${ZH_ATTACK.length} hits  detail=${za.join(',')}`);
console.log(`EN_ATTACK ${ea.filter(x => x > 0).length}/${EN_ATTACK.length} hits  detail=${ea.join(',')}`);
console.log(`ZH_BENIGN ${zb.filter(x => x > 0).length}/${ZH_BENIGN.length} hits  detail=${zb.join(',')}`);
console.log(`EN_BENIGN ${eb.filter(x => x > 0).length}/${EN_BENIGN.length} hits  detail=${eb.join(',')}`);
const totalHit = sum(za) + sum(ea);
console.log(`total_hits=${totalHit} total_fp=${sum(zb) + sum(eb)}`);
