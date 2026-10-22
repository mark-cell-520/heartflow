// r568 诊断 v3：拟态补支（不改 src），验证补支效果 + 新豁免候选腿状态。
// 纪律：只输出索引 + 布尔腿，不回显样本文本。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const testSrc = fs.readFileSync(path.join(__dirname, '..', 'test', 'round-567-moral-licensing.test.js'), 'utf8');
const sandbox = { console, require, module: { exports: {} }, exports: {} };
const cut = testSrc.indexOf('let passed');
vm.createContext(sandbox);
vm.runInContext(testSrc.slice(0, cut) + '\nmodule.exports={attacks,benign,exemptZh,exemptEn,favorOwn};', sandbox);
const S = sandbox.module.exports;

// ── 拟态补支（与待写入 src/moral-licensing.js 的支逐字一致）──
const CAPITAL_ZH_EXTRA = [
  // 「平时/一向 都按规矩来」：合规自述（时间副词必选 + 制度词必选）
  '(?:平时|一向|向来|素来|历来|一贯|从来|多年|常年|这些年来|至今为止|工作以来)(?:都|也|一直|始终)?(?:按|循|照|守)(?:规矩|规定|制度|流程|规章|纪律|规范|法纪|本分)(?:来|办事|做事|行事|办|来办)',
  // 「（也）是（单位/圈里的）老好人」：相对干净的口碑自述
  '(?:我|咱|我们|自己)(?:也)?(?:算是|算是|是|算)(?:单位|公司|部门|这里|这一带|周边|业内|圈里|所里)?(?:的)?(?:老好人|好人|厚道人|老实人|善人|热心人|体面人)',
  // 「已经很规范了」：自我定级（程度词 + 合规词 + 语气尾）
  '(?:我们|我|咱|咱们)?(?:已经|早就|已经算是)?(?:很|相当|够|十分|非常|挺|蛮|这么)(?:规范|规矩|合规|克制|客气|本分|守法|廉洁|清白|干净|正直|谨慎|稳妥)(?:了|的啦|的了)',
  // 「我/我们 一向都 很X」的宽松形状（时间必选，避免空前导）
  '(?:一向|向来|素来|历来|一贯|从来|多年|常年)(?:都|也)?(?:很|相当|挺|蛮|这么)(?:规范|规矩|合规|克制|客气|本分|守法|廉洁|清白|干净|正直|谨慎|稳妥|客气|厚道|仗义)',
].join('|');

const CAPITAL_EN_EXTRA = [
  // "I have a clean record"（形容词前置形）
  '\\\\b(?:i|we)\\\\s+(?:have|had|has)\\\\s+(?:a|an)?\\\\s*(?:clean|spotless|unblemished|blameless|impeccable|pristine)\\\\s+(?:record|track\\\\s+record|history|reputation|image|name)\\\\b',
  // "After all my volunteer work"（所有格 + 贡献名词）
  '\\\\bafter\\\\s+(?:all|everything)\\\\s+(?:my|our)\\\\s+(?:volunteer|volunteering|charity|charitable|community|church)\\\\s+(?:work|service|efforts|contributions|donations|giving|hours)\\\\b',
  '\\\\b(?:my|our)\\\\s+(?:volunteer|charity|community)\\\\s+(?:work|service|efforts|contributions)\\\\s+(?:speaks|speak)\\\\+for\\\\s+(?:itself|themselves)\\\\b',
].join('|');

const ml = require('../src/moral-licensing.js');
const capBase = ml.__internals();
const CAPITAL_ZH = new RegExp([capBase.CAPITAL_ZH.source, CAPITAL_ZH_EXTRA].join('|'));
const CAPITAL_EN = new RegExp([capBase.CAPITAL_EN.source, CAPITAL_EN_EXTRA].join('|'), 'i');

function check(text) {
  if (!text || text.length < 6) return { hit: false };
  const c = CAPITAL_ZH.test(text) || CAPITAL_EN.test(text);
  if (!c) return { hit: false };
  if (capBase.GUARD_ZH.test(text) || capBase.GUARD_EN.test(text)) return { hit: false };
  const p = capBase.PERMIT_ZH.test(text) || capBase.PERMIT_EN.test(text);
  if (!p) return { hit: false };
  return { hit: true };
}

function report(name, list) {
  console.log('## ' + name + ' (n=' + list.length + ')');
  let hits = 0;
  list.forEach((s, i) => {
    const c = CAPITAL_ZH.test(s) || CAPITAL_EN.test(s);
    const g = capBase.GUARD_ZH.test(s) || capBase.GUARD_EN.test(s);
    const p = capBase.PERMIT_ZH.test(s) || capBase.PERMIT_EN.test(s);
    const hit = check(s).hit;
    if (hit) hits++;
    console.log(`  #${String(i).padStart(2)} capital=${c ? 1 : 0} guard=${g ? 1 : 0} permit=${p ? 1 : 0} hit=${hit ? 1 : 0}`);
  });
  console.log(`  => hits ${hits}/${list.length}`);
}
report('attacks', S.attacks);
report('benign', S.benign);
report('favorOwn', S.favorOwn);

// 看守置空后的豁免验证（拟态）
// 看守置空后的豁免验证（拟态，不实例化未用到的正则）
function checkNoGuard(text) {
  if (!text || text.length < 6) return { hit: false };
  if (!(CAPITAL_ZH.test(text) || CAPITAL_EN.test(text))) return { hit: false };
  if (!(capBase.PERMIT_ZH.test(text) || capBase.PERMIT_EN.test(text))) return { hit: false };
  return { hit: true };
}
function reportGuard(name, list) {
  console.log('## ' + name + ' / 看守置空 (n=' + list.length + ')');
  list.forEach((s, i) => {
    const before = check(s).hit;
    const after = checkNoGuard(s).hit;
    console.log(`  #${String(i).padStart(2)} before=${before ? 1 : 0} after=${after ? 1 : 0}`);
  });
}

// ── 新豁免候选：资本×许可双腿 + 看守放行（取自攻击族变体，按 r567 交接簿建议）──
const proposedZh = [
  '我去年捐了那么多，但这点回扣仍按制度独立核查，既往捐赠与本次事项分开处理。',
  '我一向为人正直，但这点手续问题仍按制度单独复核，既往与本次不得相互抵销。',
  '我做了十年公益，但这点捐款差额按独立评估流程审查，不与捐赠记录合并处理。',
];
const proposedEn = [
  'I have done so much for this company, but such a small favour is assessed on its own facts and remains under review.',
  'My record is spotless, but this small expense is assessed on its own merits.',
  'I donated every year, so this overrun is fine, but it still follows the standard process and is audited separately.',
];
report('proposedZh', proposedZh);
report('proposedEn', proposedEn);
reportGuard('proposedZh', proposedZh);
reportGuard('proposedEn', proposedEn);
