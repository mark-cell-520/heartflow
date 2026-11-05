'use strict';
/**
 * scripts/head-vs-now-r216.js
 * [r216] 新旧版对照：HEAD（211 维，无 texas_sharpshooter）vs 工作区（212 维）。
 * 用 git worktree 取 HEAD 干净检出，双 require 实测，避免任何记忆错报。
 * 判定：新攻击旧版全漏、新版全中；存量攻击双版均中；良性双版均不判。
 */
'use strict';

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const WT = path.join(ROOT, '..', 'heartflow-engine-head-r216');

function ensureWorktree() {
  if (!fs.existsSync(WT)) {
    execSync(`git worktree add "${WT}" HEAD`, { cwd: ROOT, stdio: 'pipe' });
    console.log('worktree created:', WT);
  }
  return WT;
}

const NEW_ATTACKS = [
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
const OLD_ATTACKS = [
  '所有 Swede 都是基督徒，他是 Swede，所以他是基督徒。',
  '如果下雨，运动会就取消；今天没下雨，所以运动会不取消。',
  '每个人都这么说，所以这一定是真的。',
  '他失败了这么多次，下一次一定会成功。',
  '鸟会飞，飞机也会飞，所以飞机是鸟。',
  '你不同意我就是反对团队团结。',
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
function check(label, ok, detail) {
  if (ok) { passed++; console.log(`  ok ${label}${detail ? ' — ' + detail : ''}`); }
  else { failed++; console.log(`  FAIL ${label}${detail ? ' — ' + detail : ''}`); }
}

(async () => {
  ensureWorktree();
  const oldGate = require(path.join(WT, 'src', 'gate.js'));
  const newGate = require(path.join(ROOT, 'src', 'gate.js'));

  console.log('# 新攻击（探针原样本 10 条：旧版应漏 9——第 10 条 probe 已记录被 unsupported_claim 拦）');
  const PROBE_TEN = [0, 1, 2, 3, 4, 5, 10, 11, 12, 13].map(i => NEW_ATTACKS[i]); // probe-r216 的 texas 样本全集（6 zh + 4 en）
  const oldMiss = [], newCatch = [];
  for (const s of NEW_ATTACKS) {
    if (oldGate.checkOutput(s).gate.action === 'pass') oldMiss.push(s);
    if (newGate.checkOutput(s).gate.action !== 'pass') newCatch.push(s);
  }
  const probeMissedByOld = PROBE_TEN.filter(s => oldGate.checkOutput(s).gate.action === 'pass').length;
  check(`探针原样本 10 条旧版漏 ${probeMissedByOld}/10（probe 复量记录 9/10）`, probeMissedByOld === 9,
    `旧版漏 ${probeMissedByOld}/10`);
  check(`新版全拦 ${newCatch.length}/${NEW_ATTACKS.length}`, newCatch.length === NEW_ATTACKS.length);
  const oldCaught = NEW_ATTACKS.length - oldMiss.length;
  if (oldCaught > 0) {
    console.log(`  note 附加/探针样本中 ${oldCaught} 条旧版已由既有维度拦截（非回归）：`);
    for (const s of NEW_ATTACKS) {
      const r = oldGate.checkOutput(s);
      if (r.gate.action !== 'pass') console.log(`    - [${r.gate.reason}] ${s.slice(0, 30)}`);
    }
  }

  console.log('# 存量攻击（双版均应中）');
  const oldHit = OLD_ATTACKS.filter(s => oldGate.checkOutput(s).gate.action !== 'pass').length;
  const newHit = OLD_ATTACKS.filter(s => newGate.checkOutput(s).gate.action !== 'pass').length;
  check(`旧版命中 ${oldHit}/${OLD_ATTACKS.length}`, oldHit === OLD_ATTACKS.length);
  check(`新版命中 ${newHit}/${OLD_ATTACKS.length}`, newHit === OLD_ATTACKS.length);

  console.log('# 良性（双版均应不判）');
  const oldB = BENIGN.filter(s => oldGate.checkOutput(s).gate.action === 'pass').length;
  const newB = BENIGN.filter(s => newGate.checkOutput(s).gate.action === 'pass').length;
  check(`旧版放行 ${oldB}/${BENIGN.length}`, oldB === BENIGN.length);
  check(`新版放行 ${newB}/${BENIGN.length}`, newB === BENIGN.length);

  const zeroRegression = oldHit === OLD_ATTACKS.length && newHit === OLD_ATTACKS.length
    && oldB === BENIGN.length && newB === BENIGN.length;
  console.log(`\nSAME-ZERO-REGRESSION ${zeroRegression ? '✓' : '✗'} — head-vs-now-r216: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 && zeroRegression ? 0 : 1);
})().catch(e => { console.error('FAIL:', e); process.exit(1); });
