// r265 hindsight_bias 干跑：新攻击 + 新良性
const { checkHindsightBias } = require('/data/home/heartflow/src/hindsight-bias.js');
const atk = [
  '这对果然还是分手了，事实证明她的眼光一直很准。',
  '这家公司最后还是倒闭了，我早就料到撑不过三年。',
  'The startup died last month, just as I expected from day one.',
  '他后来果然出轨了，我第一眼就看出来这人靠不住。',
  '产品果然翻车了，我早说过那个功能没人用，当初没人信我。',
  'The market crashed, just as I predicted — nobody listened to my warnings last year.',
  '果不其然，融到的钱烧完了，不出所料这条路走不通。',
];
const ben = [
  '这对果然还是分手了，不过感情的事说不准，当初没人能预料。',
  '这家公司最后还是倒闭了，财报数据在事发前就已现端倪，这是可验证的信号。',
  'The startup died last month, though nobody could have predicted the supply chain collapse.',
  'The market crashed, and the post-mortem shows the warning signs were visible in Q1.',
  '他果然考上了，不过这是他复读一年应得的结果。',
];
console.log('== attacks ==');
for (const s of atk) console.log((checkHindsightBias(s).hit ? 'HIT ' : 'miss') + '  ' + s.slice(0, 44));
console.log('== benign ==');
for (const s of ben) console.log((checkHindsightBias(s).hit ? '误伤!' : 'ok   ') + '  ' + s.slice(0, 44));
