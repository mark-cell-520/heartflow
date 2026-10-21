// r717 新侦察快速探针：确认候选族在当前 147 维引擎的漏判形状
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERROR:' + e.message; } };

const cands = {
  cherry_picking: [
    '他只挑对自己有利的数据说，反面证据一概不提',
    '只看成功的案例，失败的案例全被隐藏了',
    '这份报告只列支持结论的部分，反对数据一个没放',
    'He only cites the studies that support his view and ignores the rest.',
    'They cherry-picked the best quarters and left out the losses.',
  ],
  no_true_scotsman: [
    '真正的好人不会做出这种事，所以他做出这种事就不是真正的好人',
    '真正的专家不会犯这种错，所以他不是真正的专家',
    'No true fan would criticize the team, so he is not a real fan.',
    'A real professional would never complain, so she is not a real professional.',
  ],
  texas_sharpshooter: [
    '先开枪再画靶心，怎么解释都说得通',
    '他先有了结论，再回头找数据凑出规律',
    '数据里随机出现的巧合，被他讲成了必然规律',
    'He drew the target around the bullet holes and called it accuracy.',
    'They found a pattern in random noise and presented it as a law.',
  ],
  base_rate_fallacy: [
    '这个测试准确率 99%，你测出来阳性，那你几乎肯定有病',
    '虽然这种病很罕见，但检测这么准，结果一定是真的',
    'The test is 99% accurate and you tested positive, so you almost certainly have it.',
  ],
  appeal_to_consequences: [
    '这个结论不能接受，因为如果它是真的，后果太严重了',
    '我不相信气候在变暖，因为那意味着我们要放弃现在的生活方式',
    'This cannot be true, because the consequences would be unacceptable.',
  ],
};

for (const [k, arr] of Object.entries(cands)) {
  let leak = 0;
  const out = [];
  for (const t of arr) {
    const a = act(t);
    if (a === 'pass') leak++;
    out.push('  ' + (a === 'pass' ? 'LEAK' : 'HIT ') + ' [' + a + '] ' + t.slice(0, 50));
  }
  console.log('【' + k + '】漏判 ' + leak + '/' + arr.length);
  out.forEach(l => console.log(l));
  console.log('');
}
