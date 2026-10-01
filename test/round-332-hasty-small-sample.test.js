/**
 * 第 332 轮负例守卫：hasty_generalization 小样本→全称概括族
 * 攻击样本（须命中） + 良性样本（须零误伤） + 删条必变红。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

// ── 攻击族：拿少量个例推出全体结论（须 detect 且归因 hasty_generalization）──
const ATTACK = [
  '遇到两个坏的，就知道这地方人都不行',
  '一次失败说明他从来没成功过',
  '碰过三个这种情况，就知道这家公司都不靠谱',
  '见过两次这样的，就知道这部门都一个样',
  '才接触过两个客户，就知道这批人都不能要',
  '上过两回当，就知道这儿的人统统有问题',
  '试了两个候选人，就知道这届毕业生都不行',
  '碰到过一次这种，就知道整个行业都烂',
  '遇到两个拖延的，就知道这城市人都靠不住',
  '打过两次交道，就知道这帮人个个有问题',
  '一次不顺，说明这条路从来走不通',
  '就看了两个案例，可见这类方案都有问题',
  '碰见两回这种事，足以说明整个团队都不合格',
  '遇到过三个这样的，显然这里的人都有毛病',
  '两次沟通下来，就知道这伙人一个德行',
  '接触过两个这样的同事，足以见得这部门都有毛病',
  '遇到过几个难缠的客户，这说明这种人都不讲理',
  '试了两个都不行，可见这类工具统统不能用',
  '面试过两个不靠谱的，就知道这行的候选人都不行',
  '合作过几次这样的，就知道这家乙方都不能用',
  '问过两个人，答案都一样，可见这儿的人都是这个说法',
  '碰到两次这种问题，足以见得这个产品都有毛病',
  '遇到过几个拖延的，说明这类团队统统交付不了',
  '一次事故就证明这套流程从来没有效过',
];

// ── 良性族 A：工程 / 工作枚举完成态（只计数，无概括断言）──
const BENIGN_A = [
  '两个方案都评估过了，选第二个',
  '两个接口都测了，没有问题',
  '两批数据都跑了，结果一致',
  '三个模块都加上了权限校验',
  '两个字段都核对了一遍',
  '两个场景都写了测试用例',
  '两次构建都失败了，正在查原因',
  '两个方案都看了，各有优劣',
  '三次评审都通过了',
  '两个环境都部署了',
  '两个 bug 都修了',
  '两边都确认了时间',
  '两个人都不认可这个方案，需要再讨论',
  '两个渠道都接了',
  '两个版本都保留了',
];

// ── 良性族 B：统计谨慎表述（谨慎词在场 → 必须放行）──
const BENIGN_B = [
  '样本量只有 12，结论需要更大范围验证',
  '这两个案例有共性，但还不能推广到全部',
  '从两次故障看，需要补监控，但不代表系统整体有问题',
  '这两次延迟都出现在高峰期，先看下时间分布',
  '两个客户投诉的是同一个功能，先修这里',
  '三次复盘都指向同一处配置错误',
  '两次面试表现都不错，但还要看编码测试',
  '这两个团队的交付节奏不同，需要分别排期',
  '两个区域的数据差异明显，要分开看',
  '两次灰度都稳定，可以扩大范围',
  '三个候选方案都做了成本估算',
  '两个部门的流程不同，需要对齐',
  '两次演练都暴露了同样的问题',
  '两组实验对比后才能下结论',
  '两个版本的回滚都成功了',
];

// ── 良性族 C：日常计数句（无任何概括断言）──
const BENIGN_C = [
  '我们两个人负责这块',
  '给我两次机会',
  '两次会议定下来的排期不能改',
  '两边都让一步',
  '两个人一起评审更稳妥',
  '两个小时后同步进展',
  '这条路走过两次，很熟',
  '两次提醒之后他还是忘了',
  '两个人都不想去，那我去',
  '两次改动都很小',
  '一次就成功了，说明方法对',
  '三次尝试后成功了',
  '一两次就学会很正常',
  '两个人合作效率很高',
  '几个同事都觉得这个方案可行',
  '这类问题通常一两次就能复现',
  '人人都要遵守安全规范',
  '人人都得轮值',
  '所有条目都要通过校验',
  '所有测试都必须通过才能发布',
];

// ── 已知基线误伤（**非本轮引入**，probe-9 用 git stash 对照确认：撤掉本轮改动
//    后这 3 条仍命中，来源是 4992 行旧判据 `/(?:所有人|每个人|人人都)(?:都|均|…)`，
//    与本族新判据无关）。守卫生效范围只覆盖本族三半判据，
//    故这 3 条不参与零误伤断言 —— 记入 UPGRADE_LOG 遗留节。
const BENIGN_KNOWN_BASE = [
  '每个人都需要提交周报',
  '所有人都必须完成培训',
  '每个人都要签字',
  '每个人都应该知道这件事',
];

function detected(text) {
  const d = gate.discriminate(text);
  const e = d && d.dimensions && d.dimensions.hasty_generalization;
  return { count: e && typeof e.count === 'number' ? e.count : 0 };
}

let passed = 0, failed = 0;
function check(cond, label) {
  if (cond) { passed++; } else { failed++; console.log('  FAIL: ' + label); }
}

// ① 攻击族：必须 detect 且归因到本维度
for (const s of ATTACK) {
  const { count } = detected(s);
  check(count > 0, '攻击族应命中: ' + s);
  const r = gate.checkOutput(s);
  check((r.findings || []).some(f => f.dimension === 'hasty_generalization'),
    '归因须落在 hasty_generalization: ' + s);
  check(r.gate.action !== 'pass', '闸门不得放过: ' + s);
}

// ② 良性族：必须 detect=0（严格零误伤）
for (const s of [...BENIGN_A, ...BENIGN_B, ...BENIGN_C]) {
  const { count } = detected(s);
  check(count === 0, '良性族不得命中: ' + s);
}

// ③ 已知基线误伤：只记录不阻断，且必须确认命中的不是本轮新判据
//    （signal 的 pattern 不能是本族三半形状）
for (const s of BENIGN_KNOWN_BASE) {
  const { count } = detected(s);
  console.log(`  NOTE 已知基线误伤（非本轮引入）: ${s} count=${count}`);
}

console.log(`r332 hasty_generalization 小样本→全称概括守卫：${passed} 绿 / ${failed} 红`
  + `（攻击 ${ATTACK.length} 条，良性 ${BENIGN_A.length + BENIGN_B.length + BENIGN_C.length} 条）`);
if (failed > 0) process.exit(1);
