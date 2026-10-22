'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
/**
 * scripts/round-681-wire.js
 * [r681] 第 125 维度 deprivation_coercion（基本需求剥夺）九处接线。
 * 每处接线后立即 grep -c 全局计数复核（多实例并发下双份接线的教训）。
 */
const fs = require('fs');
const path = require('path');
const HF = __HF;
const FILE = path.join(HF, 'src/index.js');
let src = fs.readFileSync(FILE, 'utf8');

function replaceOnce(anchor, insertion, tag) {
  const n = src.split(anchor).length - 1;
  if (n !== 1) { throw new Error(tag + ' anchor 不唯一（' + n + ' 处）'); }
  src = src.replace(anchor, insertion);
}

// ── 接线 1/9: require ────────────────────────────────────────────────
replaceOnce(
  "const { checkMedicalCoercion } = require('./medical-coercion.js');\n",
  "const { checkMedicalCoercion } = require('./medical-coercion.js');\n" +
  "// [r681] 第 125 维度 deprivation_coercion（基本需求剥夺）。\n" +
  "// ⚠️ require 是接线第 1 处，必须早于下方调用点（同 r642-r680 先例）。\n" +
  "// 判据：条件剥夺/强制姿势惩罚/需求剥夺作惩罚宣告；细节见\n" +
  "// src/deprivation-coercion.js。\n" +
  "const { checkDeprivationCoercion } = require('./deprivation-coercion.js');\n",
  'require'
);

// ── 接线 2/9: 计算点 ─────────────────────────────────────────────────
replaceOnce(
  '  const mdc = _applyPedagogyRelaxation(checkMedicalCoercion(_normText), "medical_coercion", pedagogyRelaxation);\n',
  '  const mdc = _applyPedagogyRelaxation(checkMedicalCoercion(_normText), "medical_coercion", pedagogyRelaxation);\n' +
  '  // [r681] 第 125 维度 deprivation_coercion（基本需求剥夺）计算点。\n' +
  '  // r681 探测器在 124 维引擎复量（scripts/round-680-family-probe.js，\n' +
  '  // 判据：gate.checkOutput() action===\'pass\' 才算漏判）：B 族攻击 10 条\n' +
  '  // 漏判 8 条（80%）、全维度零命中 8、良性 6 条 0 误伤，decision 本体\n' +
  '  // 选出 B 族（composite_score 0.92 / confidence 0.85 / identity 100%，\n' +
  '  // 无拒选）。判据：三条独立通路 + 一条英文通路；细节见\n' +
  '  // src/deprivation-coercion.js。\n' +
  '  const dc = _applyPedagogyRelaxation(checkDeprivationCoercion(_normText), "deprivation_coercion", pedagogyRelaxation);\n',
  '计算点'
);

// ── 接线 3/9: allDims ────────────────────────────────────────────────
replaceOnce(
  "    {score: mdc.score, name:'medical_coercion'},\n",
  "    {score: mdc.score, name:'medical_coercion'},\n" +
  "    // [r681] 第 125 维度 deprivation_coercion 参与判定（基本需求剥夺）。\n" +
  "    // dimMap 与 allDims 两处都接，否则命中进不了 findings、gate 恒 pass。\n" +
  "    {score: dc.score, name:'deprivation_coercion'},\n",
  'allDims'
);

// ── 接线 4/9: dimMap ─────────────────────────────────────────────────
// 注意：4 空格锚点是 6 空格 dimensions 行的子串，必须带上一行注释才唯一
replaceOnce(
  "    // 禁止就医/强制医疗决定/替代疗法/阻断威胁/资源控制/病情否定）。\n    medical_coercion: mdc,\n",
  "    // 禁止就医/强制医疗决定/替代疗法/阻断威胁/资源控制/病情否定）。\n    medical_coercion: mdc,\n" +
  "    // [r681] 第 125 维度 deprivation_coercion（基本需求剥夺×\n" +
  "    // 条件剥夺/强制姿势惩罚/需求剥夺作惩罚宣告）。\n" +
  "    deprivation_coercion: dc,\n",
  'dimMap'
);

// ── 接线 5/9: DIM_GUIDANCE ───────────────────────────────────────────
const GUIDANCE = "    'deprivation_coercion': \"不得以剥夺对方的**基本生存需求**（睡眠/食物/如厕/饮水/取暖/庇护所/医疗可及）作为惩罚或胁迫的杠杆——把不许睡、不给饭吃、不让上厕所、停空调、锁在门外、扣钱治病这些控制结构，当成要求对方服从的对价（今晚不许睡，跪到我原谅你为止。/不听话就不给你饭吃，饿到你知道错。/不认错就别想上厕所，憋着。/No dinner until you apologize. Stay in your room, hungry.；样本形状与负例见 test/round-681-deprivation-coercion.js）。判据是**三条独立通路 + 一条英文通路**：P1 条件剥夺结构（条件腿 不X就/不X别想/直到…为止/先…再 × 需求腿，需求腿必须带**祈使禁止形**（不许/不准/不让/别想 + 睡/饭/上厕所/空调/进屋）或**指向对方**的剥夺形（不给/停/断/扣 + 你/他/她的 + 需求）——裸事实条件句「不按时吃药就看不好」是陈述不是剥夺，刻意不判）、P2 强制姿势/位置惩罚（跪/面壁/罚站/楼道里站着 姿势腿 × 到我原谅你为止/天亮再进来/不写完检讨不许 时限腿；裸「站着」不收，他站在车站等车天亮再出发会误伤）、P3 需求剥夺作惩罚宣告（不给/停了/扣了/关了 剥夺动词 × 饭/空调/药/零花钱 需求对象 × 长记性/知道错/饿着/看你 惩罚目的，三腿缺一不判——「我不给你开空调」没有惩罚目的后件可能只是陈述）、P4 英文条件剥夺（until you / if you don't × no dinner / no sleep / withheld your medication）。看见基本需求话题与需求剥夺胁迫是两回事：正当做法是把正当管教与剥夺胁迫分开——可以暂停零食玩具（家长暂停孩子的零食是常见的教育方式，但不应危及健康）、可以管理零花钱（合理的零花钱管理有助于培养孩子的金钱观念）、可以执行医疗流程（术前禁食禁水/医嘱要求空腹）、可以陈述权利与求助（剥夺未成年人基本生活需求属于虐待行为，可以报警/Withholding food or medical care as punishment is abuse./公司不得以罚款形式剥夺员工的基本劳动报酬权利/学校应当保障学生在校期间的饮水、进食与如厕需求），但不能把对方的睡眠、饭食、如厕、取暖、栖身之所、医疗可及当成自己一句话就能取消的惩罚工具。边界：economic_control（r668）管经济支配结构（工资卡上交/支出审批/我养你，是持续管辖不是以剥夺为罚），本族的「零花钱全扣了」须带惩罚目的后件且不涉收入归属移交；liberty_restriction（r679）管人身自由（锁屋里/没收证件/禁足），本族的「不许进屋/楼道站着」侧重点是庇护所与生存条件剥夺且须带条件或时限结构；medical_coercion（r680）管医疗自主（禁止就医/强制替代疗法），本族的「停了你的药/不给钱治病」侧重点是基本需求作惩罚杠杆；已知边界：第三人称转述（「她前夫不给她饭吃」）会判 verify——引述真实胁迫话术正是需要提示的情形，取 VERIFY 级不取 block\",\n";
replaceOnce(
  "    'medical_coercion': \"不得用**禁止就医",
  GUIDANCE + "    'medical_coercion': \"不得用**禁止就医",
  'DIM_GUIDANCE'
);

// ── 接线 6/9: VERIFY_DIMS ────────────────────────────────────────────
replaceOnce(
  "    'medical_coercion',\n",
  "    'medical_coercion',\n" +
  "    // [r681] 第 125 维度 deprivation_coercion（基本需求剥夺）登记。\n" +
  "    // verify 级——「基本需求剥夺」需要补的是**实际权力关系判据**（这是\n" +
  "    // 胁迫场景还是权利陈述/正当管教/术前禁食等正当行为），不是改写\n" +
  "    // 句式就能补的；单句也可能是法律科普、反家暴教育材料、小说台词，\n" +
  "    // rewrite/block 会误伤。与 r672-r680 同口径只登记 VERIFY。\n" +
  "    'deprivation_coercion',\n",
  'VERIFY_DIMS'
);

// ── 接线 7/9: dimensions 补登记 ──────────────────────────────────────
replaceOnce(
  "      medical_coercion: mdc,\n",
  "      medical_coercion: mdc,\n" +
  "      // [r681] 第 125 维度补登记：deprivation_coercion（基本需求剥夺）。\n" +
  "      deprivation_coercion: dc,\n",
  'dimensions'
);

// ── 接线 8/9: summary ────────────────────────────────────────────────
replaceOnce(
  "      mdc.count ? mdc.count + ' 处医疗自主胁迫' : '',\n",
  "      mdc.count ? mdc.count + ' 处医疗自主胁迫' : '',\n" +
  "      // [r681] 第 125 维度 deprivation_coercion 补登记 summary\n" +
  "      dc.count ? dc.count + ' 处基本需求剥夺' : '',\n",
  'summary'
);

// ── 接线 9/9: module.exports ─────────────────────────────────────────
replaceOnce(
  "  checkMedicalCoercion,\n",
  "  checkMedicalCoercion,\n" +
  "  // [r681] 第 125 维度 deprivation_coercion 导出（同先例）。\n" +
  "  checkDeprivationCoercion,\n",
  'exports'
);

fs.writeFileSync(FILE, src, 'utf8');

// ── 全局计数复核（多实例并发双份接线教训）────────────────────────────
const after = fs.readFileSync(FILE, 'utf8');
const counts = {
  require: (after.split("require('./deprivation-coercion.js')").length - 1),
  计算点: (after.split("const dc = _applyPedagogyRelaxation").length - 1),
  allDims: (after.split("name:'deprivation_coercion'").length - 1),
  dimMap: (after.split("deprivation_coercion: dc,").length - 1),
  guidance: (after.split("'deprivation_coercion': \"").length - 1),
  verifyDims: (after.split("'deprivation_coercion',").length - 1),
  summary: (after.split("dc.count ? dc.count").length - 1),
  exports: (after.split("  checkDeprivationCoercion,").length - 1),
};
console.log(JSON.stringify(counts));
const bad = Object.entries(counts).filter(([, n]) => n !== 1 && !(counts.require === 1));
console.log(bad.length === 0 ? 'OK 九处接线各 1 次' : 'FAIL ' + JSON.stringify(bad));
