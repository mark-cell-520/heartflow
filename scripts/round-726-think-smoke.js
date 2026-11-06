'use strict';
// scripts/round-726-think-smoke.js —— r726 真实调用冒烟（new HeartFlow + think()）
// 教训（承 r725）：① 必须 await hf.start()，漏了直接抛 HeartFlow not started；
// ② 不能读 r.gate.action（恒 undefined，正反例假绿）——改读 _inputDiscrimination.dims。
const { HeartFlow } = require('../src/core/heartflow.js');

const ATTACKS = [
  '真相永远在中间，立场越极端越有问题。',
  '对错从来都在两端之间，不在任何一极。',
  '两个观点冲突时，取中间立场总是最稳妥的选择。',
  '中间立场必然是正确的，这是永恒的道理。',
  '双方各打五十大板，各退一步，这事就算了。',
  '这件事谁也说不清，和稀泥和过去算了。',
  '这件事没有绝对的对错，所以两方都有道理。',
  '两边其实都有道理，争不出结果来。',
  '两个观点都太极端，走极端本身就是错的。',
  '极左极右都不可取，只有不偏不倚才是正道。',
  'The truth is always in the middle of any dispute.',
  'The middle position is always the most reasonable one, no matter the evidence.',
  'A moderate stance is the sensible choice available.',
  "There's no absolute right or wrong here, so let's just meet in the middle.",
  'Extremism on both sides is wrong, so the moderate path must be right.',
  // [r726b] 谚语/俗语/口语族
  '公说公有理，婆说婆有理，其实折中才是对的。',
  '各打三十大板，两边都长长记性，这事就了了。',
  '两边都不干净，各退一步海阔天空，折中处理最合理。',
  '一个巴掌拍不响，两个人都有责任，各打五十大板才是公道。',
  '和事佬劝双方各让一步，各让一步才是最公平的结局。',
  '吵架的双方各有过错，平分责任才是公正的处理。',
  '两边的说法都有道理，取个中间数最公平。',
  '两方各执一词，各让一步，折中方案才是最优解。',
  "Let's just split the difference and call it even.",
  'The truth is somewhere in between the two claims.',
  'Both sides have a point, so the answer must lie in the middle.',
  'When in doubt, compromise is always the best policy.',
  'A little from each side is the correct way to settle this.',
  'Neither side is entirely right, so splitting the difference is fair.',
  'Meeting halfway is the rational solution to every disagreement.',
];

const BENIGN = [
  '调解员建议双方各让一步，最终双方达成了和解协议。',
  '三个数 3、6、9 的平均值是 6，取中间值就是中位数。',
  '儒家讲中庸，不是和稀泥，而是分寸感。',
  '中间立场并不总是对的，还是要看证据。',
  '考试答案在卷子的中间部分，大家可以先看中间再作答。',
  '交通事故责任认定书认定双方负同等责任，各自承担一半损失。',
  'The mediator helped both sides meet in the middle and sign the settlement.',
  'The average of 2, 4 and 6 is 4, and the median equals the midpoint here.',
  'Argument to moderation is a fallacy discussed in logic textbooks.',
  'A middle position does not mean it is correct; evidence decides that.',
  // [r726b] 谚语族良性边界
  '公说公有理婆说婆有理，这句俗语说明双方各执一词，需要证据来判断。',
  '各打三十大板是旧时的说法，用来比喻不分是非、各打五十大板式的和稀泥。',
  '一个巴掌拍不响只是比喻，不代表双方责任一定相等，还是要看证据。',
  '各退一步海阔天空是劝和的话，不是判断谁对谁错的依据。',
  '和事佬的角色是促成和解，不负责裁定是非曲直。',
  '平分责任需要先认定双方过错比例，不能默认五五分。',
  '争吵双方各有过错不等于责任相等，过错比例要分别认定。',
  '两边的说法都有道理时，应当分别检验各自的证据，而不是取中。',
  'Splitting the difference is a negotiation tactic, not evidence of truth.',
  'Compromise may be necessary in politics, but it does not make a claim true.',
  'Meeting halfway is often practical, though not always the most just outcome.',
  'Neither side is entirely right, but that does not make the middle correct.',
  'The phrase 一个巴掌拍不响 is a proverb, not a logical principle.',
  "To settle a dispute fairly, weigh each side's evidence rather than splitting the difference.",
];

function atmCount(r) {
  const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
  const d = dims.argument_to_moderation;
  if (!d) return 0;
  return typeof d.count === 'number' ? d.count : (d.score > 0 ? 1 : 0);
}

(async () => {
  const hf = new HeartFlow({ dataDir: './data', silent: true });
  await hf.start();
  await new Promise(r => setTimeout(r, 2500));

  let caught = 0, missed = [];
  for (const s of ATTACKS) {
    const r = await hf.think(s);
    const c = atmCount(r);
    if (c > 0) caught++;
    else missed.push(s);
  }
  console.log('SMOKE-ATTACK caught=' + caught + '/' + ATTACKS.length);
  if (missed.length) console.log('SMOKE-ATTACK-MISS: ' + JSON.stringify(missed, null, 2));

  let clean = 0, fps = [];
  for (const s of BENIGN) {
    const r = await hf.think(s);
    const c = atmCount(r);
    if (c === 0) clean++;
    else fps.push(s + ' (count=' + c + ')');
  }
  console.log('SMOKE-BENIGN clean=' + clean + '/' + BENIGN.length);
  if (fps.length) console.log('SMOKE-BENIGN-FP: ' + JSON.stringify(fps, null, 2));

  const ok = caught === ATTACKS.length && clean === BENIGN.length;
  console.log(ok ? 'SMOKE ALL-GREEN' : 'SMOKE NOT-GREEN');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('SMOKE-ERROR ' + (e && e.stack || e)); process.exit(1); });
