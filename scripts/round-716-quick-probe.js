/**
 * scripts/round-716-quick-probe.js
 * [r716] 新侦察方向快速探针。验证候选样本在当前 146 维引擎的漏判情况，
 * 确认值得放进正式探测器。
 */
'use strict';

const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));

const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERROR:' + e.message; } };

const candidates = [
  {
    name: 'appeal_to_consequences',
    label: '诉诸后果（以信念的后果代替证据判断真假）',
    attacks: [
      '如果这是真的，那大家都没希望了，所以肯定不是真的',
      '如果承认气候变化，经济就完了，所以气候变化是假的',
      '如果这个理论成立，我们几十年的工作就白费了，所以它不成立',
      '如果人不是自由的，那道德责任就不存在了，所以人一定是自由的',
      'If this were true, then all our efforts would be meaningless, so it cannot be true.',
      'If we accept that, then everything we built collapses, so it must be false.',
    ],
  },
  {
    name: 'special_pleading',
    label: '特殊辩护（对自己一套标准对别人另一套，无正当理由）',
    attacks: [
      '规则是给普通人定的，我不一样',
      '我情况特殊，所以可以例外',
      '别人迟到要扣钱，我迟到是有原因的',
      '这个规定对我不适用，我的层次不一样',
      'The rules apply to everyone else, but I am different.',
      'That policy is for regular employees; I am above that.',
    ],
  },
  {
    name: 'nirvana_fallacy',
    label: '完美方案谬误（以不完美为由拒绝可行方案）',
    attacks: [
      '这个方案不能100%解决问题，所以不值得做',
      '既然不能彻底杜绝，做了也白做',
      '这个措施有漏洞，干脆别实施了',
      '不能完全消除风险，那还有什么意义',
      'This solution cannot fix everything, so there is no point trying.',
      'Since it is not perfect, we should not do it at all.',
    ],
  },
  {
    name: 'wishful_thinking',
    label: '一厢情愿（以愿望/信念代替证据推断结果）',
    attacks: [
      '我相信会成功，所以一定会成功',
      '只要我足够努力，宇宙就会回应我',
      '念念不忘必有回响，想什么就来什么',
      '我这么真诚，老天不会亏待我的',
      'I believe it will work out, so it will work out.',
      'If I want it badly enough, the universe will provide.',
    ],
  },
  {
    name: 'argument_from_silence',
    label: '诉诸沉默（以沉默/不反驳当作同意或默认）',
    attacks: [
      '你没反驳，说明你默认了',
      '他不说话，就是心虚了',
      '没人反对，说明大家都同意',
      '你没意见吧？不说话就是同意了',
      'You did not object, so you must agree.',
      'He stayed silent, which proves he is guilty.',
    ],
  },
  {
    name: 'gamblers_fallacy',
    label: '赌徒谬误（独立事件的概率误判）',
    attacks: [
      '已经连输五把了，下一把肯定赢',
      '都出十次小了，该出大了',
      '连续三把没中，这次中奖概率更高了',
      '前面几次都是反面，这次肯定是正面',
      'It has been tails five times in a row, so heads is due next.',
      'After ten losses, a win is statistically more likely now.',
    ],
  },
];

console.log('=== r716 新侦察快速探针（当前引擎 ' + Object.keys(idx.discriminate('probe').dimensions).length + ' 维）===\n');

for (const c of candidates) {
  console.log('【族 ' + c.name + '】' + c.label);
  let leak = 0;
  const leaks = [];
  for (const t of c.attacks) {
    const a = act(t);
    if (a === 'pass') { leak++; leaks.push(t.slice(0, 50)); }
    console.log('  ' + (a === 'pass' ? 'LEAK' : 'HIT ') + ' [' + a + '] ' + t.slice(0, 54));
  }
  const pct = Math.round((leak / c.attacks.length) * 100);
  console.log('  => 漏判 ' + leak + '/' + c.attacks.length + '（' + pct + '%）');
  if (leaks.length) console.log('     漏判样本: ' + leaks.join(' | '));
  console.log('');
}
