/* scripts/round-300/probe-feedback-r300.js — 回归均值「表扬/批评/奖惩反馈干预族」缺口探针（只读）
 * 目标：确认 regression_to_the_mean 对「用表扬/批评/责骂/奖励/惩罚/换下场/警告
 * 作为干预、把自然回归误归因于反馈」这一族是否真零命中，且良性对照干净。 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const { checkRegressionToMean } = require(path.join(__dirname, '..', '..', 'src', 'regression-to-the-mean.js'));

const ATTACK = [
  // EN — praise/blame/reward/punish as intervention
  'He played terribly in the first half, so I criticized him hard; he then played great, which proves criticism works.',
  'She got a bad grade, so I scolded her, and she studied harder and aced the next test — scolding clearly helps.',
  'After I yelled at him for the awful serve, he served aces the next match, so tough love works.',
  'The striker was in poor form, so the coach dropped him, and the team won the next game — dropping him did the trick.',
  'We rewarded the sales team with a bonus after a record quarter, but next quarter sales fell — bonuses clearly make people complacent.',
  "The employee's performance dipped, so I gave him a warning, and his performance recovered — the warning turned him around.",
  'I praised my daughter for the great report card, then she got a C, so praise obviously makes kids overconfident.',
  // ZH — 责骂/批评/表扬/奖励/惩罚/换下场
  '孩子这次考得差，我责骂了他，下次就考好了，可见责骂能提高成绩。',
  '他上半场表现很差，我把他换下场，下半场球队就赢了，说明换他下场是对的。',
  '学生作业马虎，我严厉批评了一顿，之后作业就认真了，批评果然有用。',
  '我表扬了孩子考了满分，结果下次考试就退步了，看来表扬会让孩子骄傲自满。',
  '员工状态低迷，我给了警告，之后业绩就回升了，警告起了作用。',
  '孩子这次失误很多，我惩罚他取消了游戏时间，之后失误就少了，惩罚很有效。',
  '新员工频频出错，主管训斥了他，接下来几天就很少出错了，训斥立竿见影。',
];

const BENIGN = [
  // 正确概率/回归陈述
  'He played terribly, but the next game he played great — that is regression to the mean, not proof my criticism works.',
  'After a record quarter sales naturally fell back toward average; a bonus does not cause the decline.',
  '孩子这次考得差，下次可能只是因为回归均值而考好，未必是责骂起了作用。',
  '我们做了随机对照实验，发现批评组和对照组的成绩变化没有显著差异。',
  'I praised her, and she was genuinely happy; we also tracked her progress over a full semester.',
  '体育分析师指出，换帅后战绩反弹往往是回归均值，需要看多个赛季的数据。',
  'The coach benched him as part of a planned rotation, and analysts controlled for regression before judging.',
  '老师根据长期记录发现，奖惩之后的变化在对照组里同样出现。',
];

function run() {
  let atkPass = 0, atkCaught = 0, benignCaught = 0, benignPass = 0;
  console.log('=== ATTACK (期望 gate!=pass; rtm 直调当前应 false) ===');
  for (const s of ATTACK) {
    let g; try { g = hf.gate(s); } catch (e) { console.log('  ERR', e.message); continue; }
    const action = g.gate && g.gate.action;
    const dims = (g.findings || []).map(f => f.dimension).join(',');
    const rtm = checkRegressionToMean(s);
    const caught = action && action !== 'pass';
    if (caught) atkCaught++; else atkPass++;
    console.log('  ' + (caught ? 'CAUGHT' : 'PASS!!') + ' gate=' + (action || '?') + ' rtm=' + (rtm.hit ? 'HIT' : '-') + ' [' + (dims || 'none') + '] | ' + s.slice(0, 46));
  }
  console.log('\n=== BENIGN (期望 gate=pass; rtm 不命中) ===');
  for (const s of BENIGN) {
    let g; try { g = hf.gate(s); } catch (e) { console.log('  ERR', e.message); continue; }
    const action = g.gate && g.gate.action;
    const dims = (g.findings || []).map(f => f.dimension).join(',');
    const rtm = checkRegressionToMean(s);
    const caught = action && action !== 'pass';
    if (caught) benignCaught++; else benignPass++;
    console.log('  ' + (caught ? 'CAUGHT!!' : 'pass') + ' gate=' + (action || '?') + ' rtm=' + (rtm.hit ? 'HIT' : '-') + ' [' + (dims || 'none') + '] | ' + s.slice(0, 46));
  }
  console.log('\nSUMMARY: attack pass(zero-hit)=' + atkPass + '/' + ATTACK.length + ', attack caught=' + atkCaught + ', benign caught(false-positive)=' + benignCaught + '/' + BENIGN.length + ', benign pass=' + benignPass);
}
run();
