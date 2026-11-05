'use strict';
/**
 * scripts/smoke-r216.js
 * [r216] 第 212 维度 texas_sharpshooter 四层冒烟：
 *   L1 模块层（checkTexasSharpshooter 直调）
 *   L2 gate 层（gate.checkOutput）
 *   L3a 本体层（new HeartFlow + start() + think() 真实调用）
 *   L3b 包入口层（require 包 main = src/gate.js 的公开 API）
 */
'use strict';

const path = require('path');
const ROOT = path.join(__dirname, '..');
const TS = require(path.join(ROOT, 'src', 'texas-sharpshooter.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));

const ATTACKS = [
  '我们先把成功的案例挑出来，再总结它们的共同点，这就是成功法则。',
  '谁活下来了就问谁经验，幸存者说的就是真理。',
  '只看涨得最好的那几只股票，它们的共同点就是买入信号。',
  '把中奖的彩票号码研究一遍，就能找出下一期的中奖规律。',
  '他专门挑对自己有利的数据画了个范围，然后宣布规律成立。',
  '先看答案再圈定评分标准，学生们当然都符合这个规律。',
  '把失败的案例全部排除掉，剩下的共同点就是成功的原因。',
  '只统计赚钱的店铺，它们的共同经营方式就是赚钱秘诀。',
  '他圈定了表现最好的十个省份，宣称这套招商经验放之四海而皆准。',
  '先看中奖结果再圈号，下一期必出的号码就在这里面。',
  'We picked the successful companies and found they all took risks — that is the pattern.',
  'Look at the winners and you will see the formula they all share.',
  'Draw the target around the arrows and every shot is a bullseye.',
  'Survey only the people who loved the product and you will find the formula.',
  'Select only the quarters where sales went up and you will see the winning pattern.',
  'He cherry-picked the profitable trades and discovered the formula that predicts every rally.',
];
const BENIGN = [
  '我们先分析成功案例的共同点，再用对照组检验这个假设是否成立。',
  '研究涨得好的股票时，必须同时看跌的那些，否则结论有偏。',
  '中奖号码是随机的，研究历史号码不能预测下一期。',
  '我们事先登记了假设，再看数据是否符合，避免先射箭后画靶。',
  'We compared survivors with non-survivors to avoid survivorship bias.',
  'The pattern was pre-registered before we looked at the data.',
  '他只挑了自己喜欢的书。',
  '水滴石穿，坚持不懈就是成功的秘诀。',
  '我们筛选出了三家供应商进入下一轮。',
  'Look only at the winners.',
  'The formula works for every case.',
  '我们先开会讨论，再写最终结论。',
];

let passed = 0, failed = 0;
function check(label, ok) {
  if (ok) { passed++; console.log(`  ok ${label}`); }
  else { failed++; console.log(`  FAIL ${label}`); }
}

(async () => {
  console.log('# L1 模块层');
  check(`攻击 ${ATTACKS.length}/${ATTACKS.length} 模块命中`,
    ATTACKS.every(s => TS.checkTexasSharpshooter(s).hit));
  check(`良性 ${BENIGN.length}/${BENIGN.length} 模块零命中`,
    BENIGN.every(s => !TS.checkTexasSharpshooter(s).hit));

  console.log('# L2 gate 层');
  check(`攻击 ${ATTACKS.length}/${ATTACKS.length} gate 非 pass`,
    ATTACKS.every(s => gate.checkOutput(s).gate.action !== 'pass'));
  check(`良性 ${BENIGN.length}/${BENIGN.length} gate 全 pass`,
    BENIGN.every(s => gate.checkOutput(s).gate.action === 'pass'));

  console.log('# L3a 本体层（new HeartFlow + think()）');
  const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
  const hf = new HeartFlow();
  hf.start();
  await new Promise(res => setTimeout(res, 3500));
  const boot = await hf.think('启动冒烟：心虫是否正常运行？');
  check('boot think() 返回对象', !!(boot && typeof boot === 'object'));
  const a1 = await hf.think('只看那些活下来的企业，它们的共同点就是长寿秘诀。');
  const s1 = a1._inputDiscrimination && a1._inputDiscrimination.dims
    && a1._inputDiscrimination.dims.texas_sharpshooter;
  check('think() 攻击句 texas_sharpshooter 得分 > 0', !!(s1 && s1.score > 0));
  const b1 = await hf.think('我们同时研究了活下来和倒闭的企业，再下结论。');
  const s2 = b1._inputDiscrimination && b1._inputDiscrimination.dims
    && b1._inputDiscrimination.dims.texas_sharpshooter;
  check('think() 良性句 texas_sharpshooter 零得分', !s2 || !s2.score);
  hf.shutdown();

  console.log('# L3b 包入口层（src/gate.js 公开 API）');
  const pkg = require(path.join(ROOT, 'src', 'gate.js'));
  check('包入口 checkOutput 攻击非 pass',
    ATTACKS.every(s => pkg.checkOutput(s).gate.action !== 'pass'));
  check('包入口 checkOutput 良性全 pass',
    BENIGN.every(s => pkg.checkOutput(s).gate.action === 'pass'));

  console.log(`\nsmoke-r216: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})().catch(e => { console.error('SMOKE FAIL:', e); process.exit(1); });
