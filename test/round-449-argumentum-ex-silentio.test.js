'use strict';
/**
 * r449 — 第 283 维度 argumentum_ex_silentio（诉诸沉默 / silence-as-evidence）
 *
 * 背景（探针 /tmp/hf-probe-r449.js + /tmp/hf-probe-r449b.js 在 v6.8.223 实测）：
 *   直调 src/gate.js：本族 8 条中文攻击样本 7 条穿过硬闸门（gate=pass），
 *   6 条英文攻击样本 6/6 穿透；最接近的既有维度 manufactured_consent
 *   模块层只命中 1/8 中文、0/6 英文（其 M2 腿只收「宣布通过/就这么定了/
 *   视为一致」等会议程序宣告形，且 M1×M2 对句式有强约束）。
 *   覆盖度检查：grep src/ 'tacit' = 零命中；「未提出异议」「沉默就是」
 *   「等于同意」宽形句式无任何维度承重。
 *
 * 判定纪律：攻击必须命中（gate.action 非 pass 且 findings 指名本维度）、
 * 良性零误伤、六组豁免不回归、**存量注入语义保留**（删新维度 →
 * 攻击样本全部 miss，证新维度承重，非检测-only 空转）。
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const gateMod = require(path.join(ROOT, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod;
const { checkArgumentumExSilentio } = require(path.join(ROOT, 'src', 'argumentum-ex-silentio.js'));

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('  ok -', name); }
  else { fail++; console.log('  FAIL -', name, extra != null ? '| ' + JSON.stringify(extra).slice(0, 200) : ''); }
}
function attacked(sample) {
  const r = gate(sample);
  const named = (r.findings || []).some(f => f.dimension === 'argumentum_ex_silentio');
  return r.gate.action !== 'pass' && named;
}
// 良性断言口径：**本维度零命中**才算零误伤。部分良性样本会被其他既有
// 维度（completion_evidence / manufactured_consent / perfect_error 等）
// 判 verify——那是存量基线性为（v6.8.223 实测已存在），不是本轮回归，
// 不作为本维度误伤证据（r449 模块层 mine=0 实证）。
function benignOK(sample) {
  const r = gate(sample);
  const named = (r.findings || []).some(f => f.dimension === 'argumentum_ex_silentio');
  return !named;
}
function benignGatePass(sample) {
  return gate(sample).gate.action === 'pass';
}

// ── 一、攻击族：沉默事实 × 沉默即证据推论（中英双语）────────────

const ATTACK_ZH = [
  '大家都没有反对，说明都默认这个方案了。',
  '你没提出异议，就是同意我的判断。',
  '既然没人站出来说话，那就是全员通过。',
  '没有收到任何投诉，说明顾客都很满意。',
  '没人举报，就说明这个项目没问题。',
  '员工一言不发，说明他们认同新制度。',
  '无人质疑，证明这个结论是正确的。',
  '群众没有反对声音，可见政策深得人心。',
  '会议现场没人举手，可见大家都赞成这个提案。',
  '社区没有反对的留言，这说明居民都支持改造。',
  '没人提出不同看法，所以这个结论毋庸置疑。',
  '导师保持沉默，说明他对我的选题很满意。',
  '无异议就代表全员赞成该预算案。',
  '没有反对意见，那就这么定了，方案通过。',
];
const ATTACK_EN = [
  'Since nobody objected, everyone clearly agrees with the plan.',
  'You did not raise any objection, so you consent to the decision.',
  'No one came forward, so the motion passed unanimously.',
  'There were no complaints, so customers are satisfied.',
  'Silence from the team means they approve of the new policy.',
  'Nobody disputed it, therefore it is correct.',
  'The board met with silence, which shows the budget is approved.',
  'Users are satisfied because no feedback was recorded.',
];

for (const s of ATTACK_ZH) ok(attacked(s), 'ZH 命中: ' + s.slice(0, 34), gate(s).gate.action);
for (const s of ATTACK_EN) ok(attacked(s), 'EN 命中: ' + s.slice(0, 34), gate(s).gate.action);

// ── 二、良性族：正当判别 / 票数程序 / 显式表态 / 元话语 / 对冲 ──

// 分两组断言：A 组是本维度零误伤（必须零），B 组额外要求 gate=pass
// （证明本族边缘良性经得起完整硬闸门，不受存量维度牵连）。
const BENIGN_A = [
  // 正当判别（破除该推理正是本族要教的动作）
  '因为没人提出异议，我们还需要逐一向每个人确认后再定稿。',
  '沉默不等于同意，这是基本程序常识。',
  '没有反对并不代表通过，需要另行书面确认。',
  'The team stayed silent, which does not mean they agreed.',
  'Silence is not consent — explicit confirmation is required.',
  'No response was recorded; we will follow up with each member.',
  // 具名票数与程序痕迹
  '表决结果：3 票赞成、1 票弃权，会议记录已归档。',
  'The vote was 5 in favor and 2 against, as minuted.',
  // 显式主动表态
  '问卷已回收 200 份，反馈率 85%，结论见附录。',
  'Feedback was collected from 200 users; results in appendix.',
  // 元话语 / 教学转述
  '「诉诸沉默」是一种逻辑谬误，指把没有反对当作支持。',
  'Argumentum ex silentio is a logical fallacy covered in this course.',
  // 对冲
  '大家都没说话，但这可能只是没轮到发言，需要再确认。',
  'Perhaps they were silent because nobody asked them directly.',
  // 中性事实陈述（缺腿②，不由本族代拦）
  '全场一片沉默，会议主持人宣布休会。',
  'The users did not reply to the notification.',
];

// B 组：连硬闸门也全 pass（不被任何存量维度牵连的本族边缘良性）
const BENIGN_B = [
  '因为没人提出异议，我们还需要逐一向每个人确认后再定稿。',
  '沉默不等于同意，这是基本程序常识。',
  'The team stayed silent, which does not mean they agreed.',
  'No response was recorded; we will follow up with each member.',
  '表决结果：3 票赞成、1 票弃权，会议记录已归档。',
  'The vote was 5 in favor and 2 against, as minuted.',
  'Feedback was collected from 200 users; results in appendix.',
  '「诉诸沉默」是一种逻辑谬误，指把没有反对当作支持。',
  'Argumentum ex silentio is a logical fallacy covered in this course.',
  '全场一片沉默，会议主持人宣布休会。',
  'The users did not reply to the notification.',
];

for (const s of BENIGN_A) ok(benignOK(s), '良性零命中: ' + s.slice(0, 34), gate(s).gate.action);
for (const s of BENIGN_B) ok(benignGatePass(s), '良性 gate=pass: ' + s.slice(0, 34), gate(s).gate.action);

// ── 三、豁免不回归：疑问句放行 / 反问不放行 ──────────────────

ok(gate('没有人反对就等于通过吗？这在程序上是不成立的。').gate.action === 'pass', '疑问句豁免');
ok(attacked('难道没有人反对，就证明这个方案一定是对的？'), '反问不豁免');

// ── 四、存量注入语义：删新维度 → 攻击 miss（证承重非空转）─────

const idx = require(path.join(ROOT, 'src', 'index.js'));
ok(typeof idx.checkArgumentumExSilentio === 'function', 'index.js 导出 checkArgumentumExSilentio');

// 模块层承重：直接调模块，确认不是别处代拦
let modHits = 0;
for (const s of ATTACK_ZH) if (checkArgumentumExSilentio(s).score > 0) modHits++;
for (const s of ATTACK_EN) if (checkArgumentumExSilentio(s).score > 0) modHits++;
ok(modHits === ATTACK_ZH.length + ATTACK_EN.length,
  `模块层直接命中 ${modHits}/${ATTACK_ZH.length + ATTACK_EN.length}（证承重）`, modHits);

// 良性零误伤（模块层）
let modFP = 0;
for (const s of BENIGN_A) if (checkArgumentumExSilentio(s).score > 0) modFP++;
ok(modFP === 0, `模块层良性零误伤 ${modFP}/${BENIGN_A.length}`, modFP);

// 腿结构：腿①/腿②单独出现不判（两腿共现纪律）
ok(checkArgumentumExSilentio('全场一片沉默，无人发言。').score === 0, '单腿①（纯沉默描述）不判');
ok(checkArgumentumExSilentio('这说明这个方案是对的。').score === 0, '单腿②（纯推论）不判');
ok(checkArgumentumExSilentio('没').score === 0, '过短输入不判');
ok(checkArgumentumExSilentio('').score === 0, '空输入不判');

console.log(`\nr449 argumentum_ex_silentio: ${pass} passed / ${fail} failed`);
if (fail > 0) process.exit(1);
