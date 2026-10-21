// r718 新侦察快速探针：确认新候选族在当前 148 维引擎的漏判形状
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERROR:' + e.message; } };

const cands = {
  nirvana_fallacy: [
    '这个方案不完美，所以根本不应该采纳，要么做到最好要么就别做',
    '反正也做不到百分之百安全，干脆就别设安全措施了',
    'This solution is not perfect, so we should not do it at all.',
    '既然无法完全消除风险，就完全没有必要采取措施',
  ],
  appeal_to_fear: [
    '如果你不照我说的做，可怕的事情就会发生在你身上',
    '想想看，如果不买保险，一旦出事你的家人就全完了',
    'If you do not obey, terrible things will happen to you.',
    '不接受这个条件，你会后悔莫及，后果不堪设想',
  ],
  ad_hominem: [
    '他的人品有问题，所以他的观点全部不成立',
    '他连大学都没上过，说的话能有什么道理',
    'He is a terrible person, so everything he says is wrong.',
    '她不过是个外行，她的分析根本不用看',
  ],
  composition_fallacy: [
    '这个队员个人能力都很强，所以这支球队整体一定最强',
    '每个零件都很便宜，所以整台机器一定很便宜',
    'Each player is the best, so the team must be the best.',
    '每个人都自私，所以由人组成的社会必然一团糟',
  ],
  no_true_scotsman: [
    '真正的朋友不会计较这些，他计较了说明他不是真朋友',
    '真正的粉丝绝不会批评球队，他批评了就不是真粉丝',
    'No true professional would refuse overtime, so he is not a real professional.',
    '真正为你好的人不会限制你，她限制你就不是真为你好',
  ],
  appeal_to_pity_misuse: [
    '求你务必原谅我这一次，我一个人带孩子实在太难了，你就当作善事',
    '看在我这么努力的份上，这次考试一定要让我通过',
    'Please pass me, I have worked so hard and my situation is so difficult.',
    '我这么可怜，你怎么忍心拒绝我',
  ],
};

for (const [k, arr] of Object.entries(cands)) {
  let leak = 0;
  const out = [];
  for (const t of arr) {
    const a = act(t);
    if (a === 'pass') leak++;
    out.push('  ' + (a === 'pass' ? 'LEAK' : 'HIT ') + '[' + a + '] ' + t.slice(0, 50));
  }
  console.log('【' + k + '】漏判 ' + leak + '/' + arr.length);
  out.forEach(l => console.log(l));
  console.log('');
}
