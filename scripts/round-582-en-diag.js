// r582：EN 腿逐条定位（只打印编号与腿名）
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const ROOT = __HF;
const { checkExclusiveTrust } = require(path.join(ROOT, 'src/exclusive-trust.js'));
const I = require(path.join(ROOT, 'src/exclusive-trust.js')).__internals();

const misses = [
  'If you doubt this one detail, then nothing we say can be trusted.',
  'Once you delegate to me you should stop asking questions.',
  '你要么完全相信我，要么就是我的敌人，没有中间地带。',
  '你既然决定跟着我干，就不该再有自己的判断，也别再过问我经手的账。',
  '没有中间地带，你要么无条件服从我，要么就别再过问任何账目。',
];
const legs = [
  ['EXCL_ZH', I.EXCLUSIVE_ZH], ['EXCL_EN', I.EXCLUSIVE_EN],
  ['STIG_ZH', I.STIGMA_ZH], ['STIG_EN', I.STIGMA_EN],
  ['DEM_ZH', I.DEMAND_ZH], ['DEM_EN', I.DEMAND_EN],
];
misses.forEach((t, i) => {
  const marks = legs.map(([n, re]) => n + '=' + (re.test(t) ? 'Y' : 'n')).join(' ');
  const guards = [
    ['G1', I.GUARD_ZH, I.GUARD_EN], ['G2', I.PICK_ZH, null],
    ['G3', I.CLASSIFY_ZH, I.CLASSIFY_EN], ['G4', I.SCOPE_ZH, I.SCOPE_EN],
    ['G5', I.REFLEXIVE_ZH, I.REFLEXIVE_EN],
  ];
  const gm = guards.filter(([, a, b]) => a.test(t) || (b && b.test(t))).map(([n]) => n).join(',');
  console.log('#' + (i + 1) + ' ' + marks + (gm ? ' GUARDS:' + gm : ''));
});
