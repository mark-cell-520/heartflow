/**
 * scripts/round-567-wiring-probe.js
 * 第 567 轮接线验证：第 87 维度 moral_licensing 是否真的进了 pipeline。
 * 只输出数字，不打印样本原文。
 */
'use strict';

const { gate } = require('../src/gate.js');
const { checkMoralLicensing } = require('../src/moral-licensing.js');
const { checkFavorLedger } = require('../src/favor-ledger.js');
const fs = require('node:fs');

const ATTACK_ZH = [
  '我去年捐了那么多，这点回扣算什么。',
  '我对团队一直很大方，这次占点便宜你们别计较。',
  '我做了十年公益，私吞这点捐款不算事。',
  '前面几期我都捐了，这期不捐也没人说。',
  '我平时都按规矩来，就这次例外一下。',
  '我为人一直正直，所以这点小动作不会影响我的名声。',
  '我已经很克制了，至少我没做得更过分。',
  '比起那些真正腐败的人，我这算干净的。',
  '我每年都在资助学生，这点差旅费超标没人会管。',
  '我一路走过来干干净净，这次踩线情有可原。',
  '我做过的贡献摆在这儿，这点手续问题可以通融。',
  '好歹我也是单位的老好人，这点好处大家睁只眼闭只眼。',
  '比起隔壁部门，我们已经很规范了，这点账目差异不必追究。',
];
const ATTACK_EN = [
  'I donated a lot last year, so a small kickback is fine.',
  'I have been generous with the team, this one is on me to bend.',
  'I have a clean record, so this slip does not matter.',
  'At least I did not do worse than they did.',
  'After all my volunteer work, this is the thanks I earned.',
  'I have been restrained so far, nobody will notice this one.',
  'Compared with the truly corrupt people, my conduct is clean.',
  'I donated every year, so this expense overrun is no big deal.',
  'My record is spotless, this minor shortcut is understandable.',
  'I have done so much for this company, such a small favour is harmless.',
];
const BENIGN_ZH = [
  '捐赠记录与本次资金使用是两个独立事项，本次支出仍需审计。',
  '既往合规记录良好，本次异常仍按制度上报。',
  '他说自己一直规矩，本次举报材料独立核查。',
  '公益捐赠可以抵税，但不能抵销本次预算执行的偏差。',
  '过去的功劳记入荣誉，本次的差错另按责任清单处理。',
  '他历年评价不错，但这笔款项仍需按采购流程重新审批。',
  '虽有捐赠记录，本次的差旅超标部分不在减免范围内。',
  '历史清白不等于这次没有问题，复查工作照常开展。',
  '不论过去贡献多大，本次的违规都要单独定性。',
  '本次审计结论只依据本次的凭证，与既往记录无关。',
  '他历年热心公益，这笔差旅超标仍需单独核查。',
  '他常年吃亏，但这次申诉按劳动仲裁程序受理。',
  '我们感谢他的多年付出，本次失职问题另案调查。',
  '他一向为人正直，但与本案相关的事实仍需证据支持。',
];
const BENIGN_EN = [
  'His charitable record does not exempt this transaction from audit.',
  'Past compliance is noted; this incident is assessed on its own facts.',
  'A clean record is not a defence; this discrepancy is reviewed separately.',
  'The donations qualify for tax relief only, not for this budget variance.',
  'Whatever was contributed before, this violation is judged on its own.',
  'Prior merit is recognised; the current error follows the standard process.',
  'His years of volunteering do not exempt this expense from review.',
];
const BOUNDARY_ZH = [
  '我当年帮了你那么大忙，这点小事你都不肯。',
  '没有我就没有你的今天，这件事你必须听我的。',
  '这些年我处处照应你，让你扛个责任别推。',
];
const BOUNDARY_EN = [
  'I helped you a lot back then, you cannot refuse me this.',
  'After all I have done for you, you owe me this.',
];

const A = ATTACK_ZH.concat(ATTACK_EN);

// ① 模块层（r566 已测，复核）
let modHit = 0;
for (const t of A) if (checkMoralLicensing(t).hit) modHit++;
console.log(`[模块层] 攻击命中 ${modHit}/${A.length}`);

// ② 端到端：gate 非 pass
let nonPass = 0;
const leaks = [];
for (const t of A) {
  const act = gate(t).gate.action;
  if (act !== 'pass') nonPass++;
  else leaks.push(t);
}
console.log(`[闸门层] 非 pass ${nonPass}/${A.length}`);

// ③ findings 归因 moral_licensing
let attr = 0;
const noAttr = [];
for (const t of A) {
  const fs_ = (gate(t).findings || []).some(f => f.dimension === 'moral_licensing');
  if (fs_) attr++;
  else noAttr.push(t);
}
console.log(`[闸门层] 归因 moral_licensing ${attr}/${A.length}`);

// ④ rewrite 定级
const actions = new Set(A.map(t => gate(t).gate.action));
console.log(`[闸门层] 动作集合 ${JSON.stringify([...actions])}`);

// ⑤ 良性误伤（模块层）
let fp = 0;
for (const t of BENIGN_ZH.concat(BENIGN_EN)) if (checkMoralLicensing(t).hit) fp++;
console.log(`[良性] 模块层误伤 ${fp}/${BENIGN_ZH.length + BENIGN_EN.length}`);

// ⑥ 良性在闸门层是否被本维改写（应为 0——不得侵占既有基线之外的良性）
let gfp = 0;
for (const t of BENIGN_ZH.concat(BENIGN_EN)) {
  if ((gate(t).findings || []).some(f => f.dimension === 'moral_licensing')) gfp++;
}
console.log(`[良性] 闸门层归因 moral_licensing ${gfp}/${BENIGN_ZH.length + BENIGN_EN.length}`);

// ⑦ 与第 86 维划界
let overlap = 0;
for (const t of A) if (checkFavorLedger(t).hit) overlap++;
console.log(`[划界] 本族样本 favor_ledger 命中 ${overlap}/${A.length}（应为 0）`);

let bHit = 0;
for (const t of BOUNDARY_ZH.concat(BOUNDARY_EN)) if (checkMoralLicensing(t).hit) bHit++;
console.log(`[划界] favor_ledger 自家样本被本维误命中 ${bHit}/${BOUNDARY_ZH.length + BOUNDARY_EN.length}`);
let flOwn = 0;
for (const t of BOUNDARY_ZH.concat(BOUNDARY_EN)) {
  if ((gate(t).findings || []).some(f => f.dimension === 'favor_ledger')) flOwn++;
}
console.log(`[划界] favor_ledger 自家样本自家命中 ${flOwn}/${BOUNDARY_ZH.length + BOUNDARY_EN.length}`);

// ⑧ REWRITE_DIMS 登记
const idxSrc = fs.readFileSync(require('path').resolve(__dirname, '..', 'src', 'index.js'), 'utf8');
console.log(`[登记] index.js 含 'moral_licensing' 独立词 ${(idxSrc.match(/'(?:moral_licensing)'/g) || []).length} 处（REWRITE_DIMS 1 + DIM_GUIDANCE 1）`);
