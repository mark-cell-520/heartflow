'use strict';
// r528 候选支收窄验证 v2：目标是 atk 覆盖 ≥11/12 且 34 条良性池零命中。
// 只打印索引与 Y/N，不打印样本原文。
const fs = require('node:fs');
const path = require('node:path');

const famSrc = fs.readFileSync(path.join(__dirname, 'round-526-family-probe.js'), 'utf8');
const m = famSrc.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
const FAMILIES = eval('(' + m[1] + ')');
const fam = FAMILIES.A_harm_invalidation;

const EXTRA_BENIGN = [
  '她的伤情经医院鉴定为轻微伤，我们按标准赔付。',
  '如果你有具体损失，可以提交单据我们核算。',
  '部分用户反馈了不适，我们已经安排复查。',
  '客观上说，这次故障没有造成人身伤害。',
  '客户的担忧我们会逐条评估并书面答复。',
  '他确实感到困扰，我们先道歉再处理。',
  '受损名单已核实，共 27 人。',
  '我们承认给他造成麻烦，正在改进。',
  '所谓的指标波动其实属于正常范围，系统已自动校准。',
  '医生诊断结果为软组织挫伤，需静养两周。',
  '我们只是不熟悉新系统，培训后会改善。',
  '他也不适应新流程，但这不影响本次责任认定。',
  '没有人受伤，消防和医护都在现场确认过。',
  '本次演练无人掉队，设备全部正常。',
  'The injury was certified as minor, and we paid per the schedule.',
  'We take the reported symptoms seriously and arranged a re-check.',
  'Nothing to settle remained after the audit closed the findings.',
  'They were not actually suffering; the exam showed a clean bill of health.',
  'Nobody is really worse off after the remediation window.',
  'She was imagining the worst case, but the report confirms the system held.',
  '所谓 的预期偏差已在周会上说明，不影响验收结论。',
  '客户其实完全不介意延期的说法缺乏依据，我们仍按合同执行。',
  '研发团队只是不适应新的审核流程，我们正在协调。',
  '现场没有任何人掉离岗位，巡检记录完整。',
  '用户反映被影响的面已逐户电话确认，共三户。',
  '他说新同事被影响不大，入职培训正在补。',
];

const CAND_DENY_ZH = {
  // 否定词直接贴伤名（修正 r527 双反斜杠）
  d_neg_attached: '(?:根\\s*本|压根|丝毫|一点|半点|压根儿)\\s*(?:没|未)\\s*(?:受\\s*伤|伤\\s*害|损\\s*失|受\\s*损|影\\s*响|后\\s*遗\\s*症|不\\s*适|中\\s*毒|泄\\s*露)',
  // 无人受损量级：又/也 + 没 + (有) + 人 + 掉块肉
  d_nobody_hurt: '(?:又|也|根本|压根|其实|实际上)\\s*(?:没|未)\\s*(?:有|见)?\\s*(?:人|谁|任何\\s*人)\\s*(?:掉|受|缺|少)\\s*(?:块|根|丝|点)\\s*(?:肉|毛|毫)',
  // 引述贬损：所谓X
  d_suowei: '所\\s*谓\\s*的?\\s*(?:后\\s*遗\\s*症|影\\s*响|伤\\s*害|受\\s*伤|损\\s*失|压\\s*力|疼\\s*痛|不\\s*适|症\\s*状|创\\s*伤|阴\\s*影)',
  // 转述受害声称：X说/称 + 被影响/受影响（本身不否认，但配合 min 侧归因）
  d_zhuanshu: '(?:说|称|讲|抱|反|你\\s*说|你\\s*讲|你\\s*抱)\\s*(?:称)?\\s*(?:被|受)\\s*(?:影\\s*响|波\\s*及|受\\s*累)',
};
const CAND_MIN_ZH = {
  m_nobody_meat: '(?:又|也|根本|压根)\\s*(?:没|未)\\s*(?:有|见)?\\s*(?:人|谁)\\s*(?:掉|受|缺|少)\\s*(?:块|根|丝|点)\\s*(?:肉|毛|毫)',
};
const CAND_MIN_EN = {
  m_imagining_whole: '(?:imagining|invented|exaggerat(?:ing|ed)|making\\s+up)\\s+(?:the\\s+)?(?:whole|entire|all\\s+of)\\s+(?:thing|incident|situation|story|problem)',
  m_nothing_to_settle: '(?:there\\s+is\\s+)?(?:nothing|little)\\s+(?:left\\s+)?to\\s+settle\\b',
};
const CAND_QUOTE_ZH = {
  q: '所\\s*谓\\s*的?\\s*(?:后\\s*遗\\s*症|影\\s*响|伤\\s*害|受\\s*伤|损\\s*失|压\\s*力|疼\\s*痛|不\\s*适|症\\s*状|创\\s*伤|阴\\s*影|风\\s*险|抱\\s*怨|不\\s*满|受\\s*影\\s*响)',
};

const R = (s) => new RegExp(s, 'i');
const benignAll = fam.benign.concat(EXTRA_BENIGN);

console.log('=== 候选支 vs 良性池（单支命中）===');
let anyHits = 0;
benignAll.forEach((s, i) => {
  const hits = [];
  Object.entries(CAND_DENY_ZH).forEach(([k, re]) => { if (R(re).test(s)) hits.push('D:' + k); });
  Object.entries(CAND_MIN_ZH).forEach(([k, re]) => { if (R(re).test(s)) hits.push('M:' + k); });
  Object.entries(CAND_MIN_EN).forEach(([k, re]) => { if (R(re).test(s)) hits.push('E:' + k); });
  if (hits.length) { anyHits++; console.log(`b#${String(i).padEnd(2)} ${hits.join(',')}`); }
});
console.log(`良性池 ${benignAll.length} 条，候选支单支命中 ${anyHits} 条`);

console.log('=== 组合命中模拟（不改 src，纯 new RegExp 组合）===');
const extraDeny = new RegExp(Object.values(CAND_DENY_ZH).join('|'), 'i');
const extraMinZh = new RegExp(Object.values(CAND_MIN_ZH).join('|'), 'i');
const extraMinEn = new RegExp(Object.values(CAND_MIN_EN).join('|'), 'i');
let hits = 0, mis = [];
fam.attack.forEach((s, i) => {
  const d = extraDeny.test(s);
  const mn = extraMinZh.test(s) || extraMinEn.test(s);
  const r = d && mn;
  if (r) hits++; else mis.push(i);
  console.log(`atk#${String(i).padEnd(2)} deny=${d ? 'Y' : '-'} min=${mn ? 'Y' : '-'} => ${r ? 'HIT' : 'MIS'}`);
});
console.log(`仅候选支组合命中 ${hits}/${fam.attack.length}，漏=${mis.join(',') || '无'}`);

console.log('=== 全判据模拟（既有支 + 候选支 + 豁免）===');
const mod = require(path.join(__dirname, '..', 'src', 'harm-invalidation.js'));
const I = mod.__internals();
let full = 0; const fmis = [];
fam.attack.forEach((s, i) => {
  const d = I.HARM_DENY_ZH.test(s) || I.HARM_DENY_EN.test(s) || extraDeny.test(s);
  const mn = I.MINIMIZE_ZH.test(s) || I.MINIMIZE_EN.test(s) || extraMinZh.test(s) || extraMinEn.test(s);
  const ex = I.EXEMPT_ZH.test(s) || I.EXEMPT_EN.test(s);
  const r = d && mn && !ex;
  if (r) full++; else fmis.push(i);
});
console.log(`全判据命中 ${full}/${fam.attack.length}，漏=${fmis.join(',') || '无'}`);

// 良性侧全判据（不应命中）
let fp = 0; const fpidx = [];
benignAll.forEach((s, i) => {
  const d = I.HARM_DENY_ZH.test(s) || I.HARM_DENY_EN.test(s) || extraDeny.test(s);
  const mn = I.MINIMIZE_ZH.test(s) || I.MINIMIZE_EN.test(s) || extraMinZh.test(s) || extraMinEn.test(s);
  const ex = I.EXEMPT_ZH.test(s) || I.EXEMPT_EN.test(s);
  if (d && mn && !ex) { fp++; fpidx.push(i); }
});
console.log(`良性误伤 ${fp}/${benignAll.length}${fpidx.length ? '，误=' + fpidx.join(',') : ''}`);
console.log('结束');
