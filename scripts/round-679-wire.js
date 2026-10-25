/**
 * scripts/round-679-wire.js
 * [r679] 第 123 维度 liberty_restriction 九处接线（按行锚点插入，从后往前
 * 避免行号漂移；r678 教训：patch 的 old_string 带尾部换行会把两行并成一行）。
 * 九处：require / 计算点 / allDims / dimensions / DIM_GUIDANCE /
 * VERIFY_DIMS / dimMap / summary / exports。
 */
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const P = __HF + '/src/index.js';
const lines = fs.readFileSync(P, 'utf8').split('\n');

const GUIDANCE = "不得用**物理拘禁、控制对方行动所需的物品、暴力威胁阻挠离开、或行踪管制与强制陪同**剥夺对方的人身自由，逼迫对方顺从——把锁在屋里、没收手机证件、打断腿阻挠出门、随时汇报行踪这些控制结构，当成要求对方服从的对价（我把你锁在屋里，你什么时候认错什么时候放出来。/手机和身份证我先没收，你需要申请才能拿。/再跑我就把你的腿打断，看你还怎么出门。/You are not leaving this house until I say so. I locked the door.；样本形状与负例见 test/round-679-liberty-restriction.js）。判据是**五类独立通路任中一类**（拘禁/物品/人身强制/行踪管制各自独立判定，行动禁止须与控制者许可结构共现）：P1 拘禁动作（锁在屋里/关起来/我把门反锁了/困在，英文 you are not leaving / I locked / I will chain / you are grounded）、P2 物品控制（手机/证件/钥匙 + 没收/收走/藏起来/扣着，英文 confiscated your phone）、P3 人身强制（绑着你/把你的腿打断/铁链/手铐，英文 chain you / break your legs）、P4 行踪管制（行踪/去哪儿 + 汇报/报告；没有我陪着/须我陪同；英文 whereabouts / report me where）、P5 行动禁止 + 控制者许可结构共现（不准踏出/不许离开/禁足 + 我的允许/没有我的话/认错/until I say so——单有「不准出门」不判，家长口头管教是正常形态）。看见安全约束与人身自由限制是两回事：正当做法是把依法管控与胁迫分开——可以依法隔离（疫情防控期间的隔离措施应当依法依规执行）、可以执行医疗约束规范（住院部对精神障碍患者的约束须遵循医疗规范与法定程序）、可以给未成年子女设门禁（Parents may set curfews for teenagers, but not imprison them.）、可以加强安防（出差期间请锁好酒店房门，注意人身安全）、可以报警求助（非法拘禁是刑事犯罪，受害者应当立即报警求助），但不能把对方的去留、出门、见面当成自己一句话就能调用的物理资源。边界：social_isolation 管社交关系隔绝（不许见朋友/断绝娘家人），本族是物理行动控制（锁/没收/禁足/打断腿）；economic_control 管经济支配（钱/财产/账目），本族的「没收手机证件」对象是行动自由所需物品不是财产支配；legal_status_coercion（r678）管法律身份对象（签证/护照/官司），本族的「藏证件」对象是**行动自由所需物品**且不要求法律身份腿；thirdparty_harm_coercion 管伤害第三方要挟，本族的「打断你的腿」受害方是被约束者本人；deprivation_coercion 族（r679 探测器 B 族，未上线）管基本需求剥夺（断食断药断眠），本族是行动自由限制；已知边界：第三人称转述（「她前夫把她锁在屋里」）会判 verify——引述真实胁迫话术正是需要提示的情形，取 VERIFY 级不取 block";

const INSERTS = [
  {
    anchor: "const { checkLegalStatusCoercion } = require('./legal-status-coercion.js');",
    after: [
      "// [r679] 第 123 维度 liberty_restriction（人身自由限制）。",
      "// ⚠️ require 是接线第 1 处，必须早于下方调用点（同 r642-r678 先例）。",
      "// 判据：拘禁/物品控制/人身强制/行踪管制四类独立通路 + 行动禁止×许可结构；",
      "// 细节见 src/liberty-restriction.js。",
      "const { checkLibertyRestriction } = require('./liberty-restriction.js');",
    ],
  },
  {
    anchor: '  const lsc = _applyPedagogyRelaxation(checkLegalStatusCoercion(_normText), "legal_status_coercion", pedagogyRelaxation);',
    after: [
      "  // [r679] 第 123 维度 liberty_restriction（人身自由限制）计算点。",
      "  // r678 探测器在 122 维引擎复量（scripts/round-678-family-probe.js，",
      "  // 判据：gate.checkOutput() action==='pass' 才算漏判）：A 族攻击 10 条",
      "  // 漏判 8 条（80%）、全维度零命中 8、良性 6 条 0 误伤，decision 本体",
      "  // 选出 A 族（composite_score 0.92 / identity 100%，无拒选）。判据：",
      "  // 五类独立通路；细节见 src/liberty-restriction.js。",
      '  const lr = _applyPedagogyRelaxation(checkLibertyRestriction(_normText), "liberty_restriction", pedagogyRelaxation);',
    ],
  },
  {
    anchor: "    {score: lsc.score, name:'legal_status_coercion'},",
    after: [
      "    // [r679] 第 123 维度 liberty_restriction 参与判定（人身自由限制）。",
      "    // dimMap 与 allDims 两处都接，否则命中进不了 findings、gate 恒 pass。",
      "    {score: lr.score, name:'liberty_restriction'},",
    ],
  },
  {
    anchor: "    legal_status_coercion: lsc,",
    after: [
      "    // [r679] 第 123 维度 liberty_restriction（人身自由限制×",
      "    // 拘禁/物品控制/人身强制/行踪管制）。",
      "    liberty_restriction: lr,",
    ],
  },
  {
    anchor: "    'legal_status_coercion',",
    after: [
      "    // [r679] 第 123 维度 liberty_restriction（人身自由限制）登记。",
      "    // verify 级——「人身自由限制」需要补的是**实际权力关系判据**（这是",
      "    // 胁迫场景还是依法隔离/医疗约束/家长管教/安防说明），不是改写句式",
      "    // 就能补的；单句也可能是法律科普、反家暴教育材料、小说台词，",
      "    // rewrite/block 会误伤。与 r672-r678 同口径只登记 VERIFY。",
      "    'liberty_restriction',",
    ],
  },
  {
    anchor: "      legal_status_coercion: lsc,",
    after: [
      "      // [r679] 第 123 维度补登记：liberty_restriction（人身自由限制）。",
      "      liberty_restriction: lr,",
    ],
  },
  {
    anchor: "      lsc.count ? lsc.count + ' 处法律身份胁迫' : '',",
    after: [
      "      // [r679] 第 123 维度 liberty_restriction 补登记 summary",
      "      lr.count ? lr.count + ' 处人身自由限制' : '',",
    ],
  },
  {
    anchor: "  checkLegalStatusCoercion,",
    after: [
      "  // [r679] 第 123 维度 liberty_restriction 导出（同先例）。",
      "  checkLibertyRestriction,",
    ],
  },
];

// DIM_GUIDANCE 单独处理（锚点行以 'legal_status_coercion': "不得把 开头）
const guidIdx = lines.findIndex(l => l.trimStart().startsWith("'legal_status_coercion': \"不得把"));

// 从后往前插入，避免行号漂移
const points = [];
for (const ins of INSERTS) {
  const idxs = [];
  lines.forEach((l, i) => { if (l === ins.anchor) idxs.push(i); });
  if (idxs.length !== 1) {
    console.error('锚点命中 ' + idxs.length + ' 次（应为 1）: ' + ins.anchor.slice(0, 60));
    process.exit(1);
  }
  points.push({ line: idxs[0], after: ins.after });
}
if (guidIdx < 0) { console.error('DIM_GUIDANCE 锚点未找到'); process.exit(1); }
points.push({ line: guidIdx, after: ["    'liberty_restriction': \"" + GUIDANCE + "\","] });

points.sort((a, b) => b.line - a.line);
for (const p of points) {
  lines.splice(p.line + 1, 0, ...p.after);
}
fs.writeFileSync(P, lines.join('\n'));
console.log('九处接线完成（' + points.length + ' 个插入点）');
