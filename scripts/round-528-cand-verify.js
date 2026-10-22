'use strict';
// r528 候选支验证：先在形状串 + 攻击池 + 良性池上验证，命中才写进 src。
// 只打印索引与 Y/N，不打印样本原文（451 纪律）。
const fs = require('node:fs');
const path = require('node:path');

const famSrc = fs.readFileSync(path.join(__dirname, 'round-526-family-probe.js'), 'utf8');
const m = famSrc.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
const FAMILIES = eval('(' + m[1] + ')');
const fam = FAMILIES.A_harm_invalidation;

// 额外良性池（正当表述，扩到 30 条评估误伤面；全部是合规/流程/医学事实陈述）
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
];

// ── 候选支（源码字符串；写进 src 前先验形状）─────────────────────────
const CAND_DENY_ZH = {
  // 修正 r527 双反斜杠：否定词直接贴伤名
  d_neg_attached: '(?:根\\s*本|压根|丝毫|一点|半点|压根儿)\\s*(?:没|未)\\s*(?:受\\s*伤|伤\\s*害|损\\s*失|受\\s*损|影\\s*响|后\\s*遗\\s*症|不\\s*适|中\\s*毒|泄\\s*露)',
  // 无人受损（「也/又」前缀，不强制「有」）
  d_nobody_hurt: '(?:又|也|根本|压根|其实|实际上)?\\s*(?:没|未)\\s*(?:有|见)?\\s*(?:人|谁|任何\\s*人)\\s*(?:掉|受|缺|崴|伤|少)\\s*(?:块|根|丝|点)\\s*(?:肉|毛|毫)',
  // 引述贬损：所谓X（把受害表述定性为虚假）
  d_suowei: '所\\s*谓\\s*的?\\s*(?:后\\s*遗\\s*症|影\\s*响|伤\\s*害|受\\s*伤|损\\s*失|压\\s*力|疼\\s*痛|不\\s*适|症\\s*状|创\\s*伤|阴\\s*影|风\\s*险)',
  // 「受影响」被否认为不适应/不熟悉
  d_bushiying: '(?:只|就|不过|其实|实际上|纯粹)\\s*(?:是|仅仅)?\\s*(?:不|未)\\s*(?:适|习|惯|接|熟|认|在\\s*意)\\s*(?:应|新|流|变|化|惯|悉|触|知|流\\s*程)?',
};
const CAND_MIN_ZH = {
  // 量级校准：也/又 + 没 + (有) + 人 + 掉块肉
  m_nobody_meat: '(?:又|也|根本|压根)\\s*(?:没|未)\\s*(?:有|见)?\\s*(?:人|谁)\\s*(?:掉|受|缺|少)\\s*(?:块|根|丝|点)\\s*(?:肉|毛|毫)',
};
const CAND_MIN_EN = {
  m_imagining_whole: '(?:imagining|invented|exaggerat(?:ing|ed)|making\\s+up)\\s+(?:the\\s+)?(?:whole|entire|all\\s+of)\\s+(?:thing|incident|situation|story|problem)',
  m_nothing_to_settle: '(?:there\\s+is\\s+)?(?:nothing|little|not\\s+much)\\s+(?:left\\s+)?(?:to\\s+settle|to\\s+resolve|to\\s+compensate|to\\s+make\\s+good)',
};
const CAND_QUOTE_ZH = {
  q: '所\\s*谓\\s*的?\\s*(?:后\\s*遗\\s*症|影\\s*响|伤\\s*害|受\\s*伤|损\\s*失|压\\s*力|疼\\s*痛|不\\s*适|症\\s*状|创\\s*伤|阴\\s*影|风\\s*险|抱\\s*怨|不\\s*满)',
};

const R = (s) => new RegExp(s, 'i');

console.log('=== 候选支 vs 攻击池（行=atk 索引）===');
fam.attack.forEach((s, i) => {
  const row = Object.entries(CAND_DENY_ZH).map(([k, re]) => `${k}=${R(re).test(s) ? 'Y' : '-'}`).join(' ');
  const row2 = Object.entries(CAND_MIN_ZH).map(([k, re]) => `${k}=${R(re).test(s) ? 'Y' : '-'}`).join(' ');
  const row3 = Object.entries(CAND_MIN_EN).map(([k, re]) => `${k}=${R(re).test(s) ? 'Y' : '-'}`).join(' ');
  const q = Object.entries(CAND_QUOTE_ZH).map(([k, re]) => `Q=${R(re).test(s) ? 'Y' : '-'}`).join(' ');
  console.log(`atk#${String(i).padEnd(2)} | DENY ${row} | MIN ${row2} ${row3} ${q}`);
});
console.log('=== 候选支 vs 良性池（原 10 + 额外）===');
const benignAll = fam.benign.concat(EXTRA_BENIGN);
let anyHits = 0;
benignAll.forEach((s, i) => {
  const hits = [];
  Object.entries(CAND_DENY_ZH).forEach(([k, re]) => { if (R(re).test(s)) hits.push('D:' + k); });
  Object.entries(CAND_MIN_ZH).forEach(([k, re]) => { if (R(re).test(s)) hits.push('M:' + k); });
  Object.entries(CAND_MIN_EN).forEach(([k, re]) => { if (R(re).test(s)) hits.push('E:' + k); });
  Object.entries(CAND_QUOTE_ZH).forEach(([k, re]) => { if (R(re).test(s)) hits.push('Q:' + k); });
  if (hits.length) { anyHits++; console.log(`b#${String(i).padEnd(2)} HIT ${hits.join(',')}`); }
});
console.log(`良性池 ${benignAll.length} 条，被候选支命中 ${anyHits} 条`);

// 组合命中模拟：deny && min（沿用主判据）
console.log('=== 组合命中模拟（deny&&min，含 r527 既有支）===');
const mod = require(path.join(__dirname, '..', 'src', 'harm-invalidation.js'));
const I = mod.__internals();
const extraDeny = new RegExp(Object.values(CAND_DENY_ZH).join('|'), 'i');
const extraMinZh = new RegExp(Object.values(CAND_MIN_ZH).join('|'), 'i');
const extraMinEn = new RegExp(Object.values(CAND_MIN_EN).join('|'), 'i');
fam.attack.forEach((s, i) => {
  const d = I.HARM_DENY_ZH.test(s) || I.HARM_DENY_EN.test(s) || extraDeny.test(s);
  const q = new RegExp(Object.values(CAND_QUOTE_ZH)[0], 'i').test(s);
  const mn = I.MINIMIZE_ZH.test(s) || I.MINIMIZE_EN.test(s) || extraMinZh.test(s) || extraMinEn.test(s);
  const ex = I.EXEMPT_ZH.test(s) || I.EXEMPT_EN.test(s);
  console.log(`atk#${String(i).padEnd(2)} deny=${d ? 'Y' : '-'} min=${mn ? 'Y' : '-'} exempt=${ex ? 'Y' : '-'} quote=${q ? 'Y' : '-'} => ${d && mn && !(ex && !q) ? 'HIT' : 'MIS'}`);
});
console.log('结束');
