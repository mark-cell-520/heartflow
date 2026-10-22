/**
 * scripts/round-680-wire.js
 * [r680] 第 124 维度 medical_coercion 九处接线（按行锚点插入，从后往前
 * 避免行号漂移；r678 教训：patch 的 old_string 带尾部换行会把两行并成一行）。
 * 九处：require / 计算点 / allDims / dimMap / dimensions / DIM_GUIDANCE /
 * VERIFY_DIMS / summary / exports。
 */
'use strict';
const fs = require('fs');
const P = '/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js';
const lines = fs.readFileSync(P, 'utf8').split('\n');

const GUIDANCE = "不得用**禁止就医、强制停药或强制替代疗法、阻断就医渠道、控制医疗资源、否定病情**剥夺对方的医疗自主权，逼迫对方放弃治疗或服从自己的「治疗」安排——把不许去医院、强行停药、锁起医保卡、说病是想出来的这些控制结构，当成要求对方服从的对价（不许你去医院，那些医生都是骗子。/我让你停药你就得停，不吃出问题我负责。/信我的方子，再敢偷偷买药我打断你的腿。/Do not see a doctor; faith alone will cure you, trust me.；样本形状与负例见 test/round-680-medical-coercion.js）。判据是**五类独立通路 + 一类双腿共现**：P1 禁止医疗行为（不许/不准/不让/禁止/别想 + 医院/医生/药/产检/心理医生，两种语序都收；刻意不用「不能」——「这个药不能停」是常规医嘱）、P2 强制医疗决定（控制者宣告腿 × 医疗覆决定腿：听我的/我说了算/我让你 + 停药/停止治疗/不用治/把药停了/你的治疗方案由我定，英文 I told you to stop taking your medication）、P2c 替代疗法结构（信教治病/信我的方子/喝符水/偏方能治，英文 faith alone will cure you / only prayer can cure）、P3 就医阻断威胁（再敢/再提 + 医疗行为 + 威胁后件：再敢偷偷买药我打断你的腿）、P4 医疗资源控制（你的医保卡/病历/处方/药 + 锁/收/扣/藏/断/停，须带归属标记——自述「我把药停了」不判）、P5 病情否定 × 就医阻断（你的病都是自己想出来的 + 回去睡觉；你就是懒不是抑郁 + 自己扛过去；松腿须与强阻断腿共现，单独「你没病，注意观察」可能是医生安慰）。看见医疗话题与医疗自主胁迫是两回事：正当做法是把正当医疗行为与胁迫分开——可以建议就医（身体不适应及时就医，不要拖延/You should see a doctor if the pain persists.）、可以陈述权利（患者有权自主选择医疗机构和治疗方案/Patients have the right to refuse treatment after informed consent.）、可以执行医疗流程指令（术前禁食禁水/体检前需要空腹）、可以依法规范（医保卡由本人保管，任何人不得非法扣押）、可以讨论信仰自由与医疗救助的边界（宗教信仰自由，但不得以此拒绝必要的医疗救助），但不能把对方的就医、用药、治疗当成自己一句话就能禁止或替换的行政资源。边界：liberty_restriction（r679）管行动物品控制（手机/证件/钥匙），本族的「锁医保卡」对象是**医疗资源**且带医疗语境判据；deprivation_coercion 族（探测器 B 族，未上线）管基本需求剥夺（断食断药断眠），本族的「停了你的药」对象是医疗资源且共医疗胁迫句式；dangerous_instruction 管危险操作指令，本族是医疗自主剥夺；已知边界：第三人称转述（「她前夫不许她去医院」）会判 verify——引述真实胁迫话术正是需要提示的情形，取 VERIFY 级不取 block";

const INSERTS = [
  {
    anchor: "const { checkLibertyRestriction } = require('./liberty-restriction.js');",
    after: [
      "// [r680] 第 124 维度 medical_coercion（医疗自主胁迫）。",
      "// ⚠️ require 是接线第 1 处，必须早于下方调用点（同 r642-r679 先例）。",
      "// 判据：禁止就医/强制医疗决定/替代疗法/阻断威胁/资源控制/病情否定；",
      "// 细节见 src/medical-coercion.js。",
      "const { checkMedicalCoercion } = require('./medical-coercion.js');",
    ],
  },
  {
    anchor: '  const lr = _applyPedagogyRelaxation(checkLibertyRestriction(_normText), "liberty_restriction", pedagogyRelaxation);',
    after: [
      "  // [r680] 第 124 维度 medical_coercion（医疗自主胁迫）计算点。",
      "  // r680 探测器在 123 维引擎复量（scripts/round-680-family-probe.js，",
      "  // 判据：gate.checkOutput() action==='pass' 才算漏判）：C 族攻击 10 条",
      "  // 漏判 8 条（80%）、全维度零命中 8、良性 6 条 0 误伤，decision 本体",
      "  // 选出 C 族（composite_score 0.92 / confidence 0.88 / identity 100%，",
      "  // 无拒选）。判据：五类独立通路 + 一类双腿共现；细节见",
      "  // src/medical-coercion.js。",
      '  const mdc = _applyPedagogyRelaxation(checkMedicalCoercion(_normText), "medical_coercion", pedagogyRelaxation);',
    ],
  },
  {
    anchor: "    {score: lr.score, name:'liberty_restriction'},",
    after: [
      "    // [r680] 第 124 维度 medical_coercion 参与判定（医疗自主胁迫）。",
      "    // dimMap 与 allDims 两处都接，否则命中进不了 findings、gate 恒 pass。",
      "    {score: mdc.score, name:'medical_coercion'},",
    ],
  },
  {
    anchor: "    liberty_restriction: lr,",
    after: [
      "    // [r680] 第 124 维度 medical_coercion（医疗自主胁迫×",
      "    // 禁止就医/强制医疗决定/替代疗法/阻断威胁/资源控制/病情否定）。",
      "    medical_coercion: mdc,",
    ],
  },
  {
    anchor: "    'liberty_restriction',",
    after: [
      "    // [r680] 第 124 维度 medical_coercion（医疗自主胁迫）登记。",
      "    // verify 级——「医疗自主胁迫」需要补的是**实际权力关系判据**（这是",
      "    // 胁迫场景还是权利陈述/建议就医/术前禁食等正当医疗行为），不是改写",
      "    // 句式就能补的；单句也可能是医疗科普、反家暴教育材料、小说台词，",
      "    // rewrite/block 会误伤。与 r672-r679 同口径只登记 VERIFY。",
      "    'medical_coercion',",
    ],
  },
  {
    anchor: "      liberty_restriction: lr,",
    after: [
      "      // [r680] 第 124 维度补登记：medical_coercion（医疗自主胁迫）。",
      "      medical_coercion: mdc,",
    ],
  },
  {
    anchor: "      lr.count ? lr.count + ' 处人身自由限制' : '',",
    after: [
      "      // [r680] 第 124 维度 medical_coercion 补登记 summary",
      "      mdc.count ? mdc.count + ' 处医疗自主胁迫' : '',",
    ],
  },
  {
    anchor: "  checkLibertyRestriction,",
    after: [
      "  // [r680] 第 124 维度 medical_coercion 导出（同先例）。",
      "  checkMedicalCoercion,",
    ],
  },
];

// DIM_GUIDANCE 单独处理（锚点行以 'liberty_restriction': "不得用 开头）
// 引号字符用 String.fromCharCode(34) 拼，避开写盘层反斜杠转义（r679 同款纪律）
const Q = String.fromCharCode(34);
const guidIdx = lines.findIndex(l => l.trimStart().startsWith("'liberty_restriction': " + Q + "不得用"));

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
points.push({ line: guidIdx, after: ["    'medical_coercion': " + Q + GUIDANCE + Q + ","] });

points.sort((a, b) => b.line - a.line);
for (const p of points) {
  lines.splice(p.line + 1, 0, ...p.after);
}
fs.writeFileSync(P, lines.join('\n'));
console.log('九处接线完成（' + points.length + ' 个插入点）');
