// r357 probe-4：定位第 4 个置假点（机制护栏）为何不变红
// 结论：benignRev 4 句都是「带机制词、不带无机制归因对象」——第⑫支三半 AND
// 里丙半（无机制归因对象）本就缺席，护栏从未生效 → 无失效面。
// 本探针用来确认这一点，并给出替换样本集（良性句里同时出现机制词与玄学词）。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const idx = require(path.join(ROOT, 'src/index.js'));

// 同时看 checkPseudoCausal 直出：count=0 说明三半没构成（护栏无失效面），
// count>0 但 gate pass 说明护栏正在放行（护栏有失效面，可作守卫第 4 点）。

// 原 benignRev 集：三半判据本就构不成（丙半缺席）
const OLD = [
  '项目成功了，因为前期做了充分压测',
  '他康复了，因为按时吃药并复诊',
  '新版本上线了，主要是重构了缓存层',
  '这个季度盈利了，靠的是渠道拓展和复购提升',
];
// 归因词必须在 PC_REV_ATTRIB_ZH 表内（因为/由于/原因是/全靠/多亏/幸亏/
// 归功于/原因就是/都在于/正是因为），否则三半构不成、护栏没有失效面。
// 同时避开 PC_HEDGE_ZH 的对冲词（主要是/也可能/同期/机制…），
// 否则函数头先拦，护栏同样测不到。
const NEW = [
  '项目谈成全靠转了运，同时也得益于架构设计扎实',
  '病情好转多亏了拜佛，同时也得益于按时用药',
  '业绩翻红当然因为风水调了，同时也得益于渠道拓展',
  '版本交付也全勤转发抽奖，同时得益于排期合理',
];

function show(tag, list) {
  console.log(`--- ${tag} ---`);
  for (const b of list) {
    let action = 'pass', fds = [];
    let cnt = 0, sc = 0, ht = [];
    try {
      const r = gate.checkOutput(b);
      action = r.gate.action;
      fds = (r.findings || []).map(f => f.dimension);
      const pc = idx.checkPseudoCausal(b);
      cnt = pc.count; sc = pc.score; ht = pc.hits;
    } catch (e) { fds = ['EXC']; }
    console.log(`gate=${action} pc(count=${cnt},score=${sc},hits=${JSON.stringify(ht)}) findings=[${fds.join(',')}]`);
  }
}
show('OLD benignRev（丙半缺席，护栏无失效面）', OLD);
show('NEW benignMech（机制词×玄学词共现，护栏有失效面）', NEW);
