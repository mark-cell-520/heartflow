// r399 诊断：为什么 za04 / zs04 对目标样本整串不命中
const path = require('path');
const zh = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js').ZH_SIGNALS;

const samples = [
  '没有您的首肯，我做什么都觉得自己不行。',
  '这事儿上我们铁定站一起，绝无二心。',
];
samples.forEach((s) => {
  console.log('SAMPLE:', s);
  ['ability_dependence', 'stance_preempt'].forEach((fam) => {
    zh[fam].forEach((r, i) => {
      const m = r.exec(s);
      console.log(`  ${fam}[${i}] => ${m ? 'HIT @' + m.index : 'miss'}`);
    });
  });
});

// 手动重放 za04 两腿，看是腿①不中还是腿②不中
const za04legA = '(?:没有|除非|若没有)(?:您|你)的?(?:首肯|点头|认可|同意|准许|批准|发话)';
const za04legB = '我(?:做|干)(?:什么|啥)(?:都)?(?:觉得|认为)?(?:自己)?(?:不行|不成|没底气|没把握|拿不出手)';
const s1 = samples[0];
console.log('za04 legA:', new RegExp(za04legA).test(s1), '| legB:', new RegExp(za04legB).test(s1));
console.log('za04 legA idx:', s1.search(new RegExp(za04legA)), '| legB idx:', s1.search(new RegExp(za04legB)));

const zs04legA = '(?:肯定|一定|绝对|铁定|必然|这事儿上|在这件事上)?(?:是)?(?:(?:我|我们|咱们|俺)|跟|和|站|选|靠)(?:在)?(?:您|你)?(?:一个|同|这)?(?:立场|阵线|战壕|边|一边)';
const zs04legB = '(?:咱们|我们|彼此)(?:绝对|完全|铁定|肯定)(?:一致|一条心|站一起|同步|无二心)';
const s2 = samples[1];
console.log('zs04 legA:', new RegExp(zs04legA).test(s2), '| legB:', new RegExp(zs04legB).test(s2));
console.log('zs04 legA idx:', s2.search(new RegExp(zs04legA)), '| legB idx:', s2.search(new RegExp(zs04legB)));
