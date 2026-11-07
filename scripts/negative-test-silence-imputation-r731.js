// scripts/negative-test-silence-imputation-r731.js
// r731 负例脚本：对 silence_imputation 新族逐点注入验证承重性。
// 每个注入点 = 删除含指定源码字面子串的正则后，该族攻击样本必须失效；
// 完整表下必须命中（对照断言，防止「删了个本来就没用的正则」假阴性）。
// 另含：混排跨语言两方向注入、新豁免条目注入、良性对照（模块级零命中 +
// gate 层 pass，别族预存污染除外——已 git stash 复测 HEAD 同归因）。
// [r731 教训] marker 必须是正则源码里的字面子串（组语法 `(?:` 会让
// 语义写法落空），且攻击样本必须对该族专属（否则被别族兜底命中，
// 造成「删后仍命中」假阴性）。
const path = require('path');
const assert = require('assert');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const si = require(path.join(__dirname, '..', 'src', 'silence-imputation.js'));

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; console.log('NOT OK ' + name + ' — ' + e.message); }
}

// [说明, 表名, 被删正则的源码字面子串, 攻击样本（须对该族专属）]
const CASES = [
  // ── 腿① ZH 新族 ──
  ['守口如瓶', 'SILENCE_ZH', '守口如瓶', '他守口如瓶，这说明心里有鬼。'],
  ['绝口不提族', 'SILENCE_ZH', '绝口(?:不提', '她对那件事绝口不提，显然是在掩饰。'],
  ['只字不提族', 'SILENCE_ZH', '只字(?:不', '他对关键证据只字未提，显然心里有鬼。'],
  ['三缄其口', 'SILENCE_ZH', '三缄其口', '涉及此事，他三缄其口，足见心里有鬼。'],
  ['不置可否', 'SILENCE_ZH', '置可否', '被问到时他不置可否，等于默认了。'],
  ['未予以族', 'SILENCE_ZH', '予以?', '监管问询后，企业未予回应，这本身就说出了答案。'],
  ['即时通讯族', 'SILENCE_ZH', '(?:电话|短信|微信', '记者打电话他不接，这说明心里有鬼。'],
  ['一句话不说（无都形）', 'SILENCE_ZH', '话?(?:也|都)?', '他一句话没说，明眼人都看得出有问题。'],
  ['未开过口', 'SILENCE_ZH', '(?:开|张)过?口', '被问到时，他始终未开过口，这说明心里有鬼。'],
  ['拒不扩动词', 'SILENCE_ZH', '拒不(?:吭声|开口', '面对证据他拒不交代，说明他在隐瞒。'],
  ['一声不吭族', 'SILENCE_ZH', '一声不吭', '被点名时他一声不响，显然心虚。'],
  ['拒绝族（澄清/解释）', 'SILENCE_ZH', '拒绝(?:回应', '他拒绝澄清，无风不起浪。'],
  ['未族扩展', 'SILENCE_ZH', '未(?:曾)?(?:否认', '他未回复记者问询，印证了指控。'],
  ['没+出面', 'SILENCE_ZH', '交待', '他没出面澄清，脱不了干系。'],
  // ── 腿① EN 新族 ──
  ['refused to budge', 'SILENCE_EN', 'refus\\w+ to budge', 'He refused to budge on the question, which speaks for itself.'],
  ['clammed up', 'SILENCE_EN', 'clam(?:med|s)? up', 'She clammed up when asked about the money, which is telling.'],
  ['zipped lips', 'SILENCE_EN', 'zipped', 'He zipped his lips when the reporter asked, which is telling.'],
  ['held his tongue', 'SILENCE_EN', 'held (?:his|her|their|its) tongue', 'She held her tongue, and that tells you something.'],
  ['sealed his lips', 'SILENCE_EN', 'sealed (?:his|her|their) lips', 'He sealed his lips on the matter, which speaks for itself.'],
  ['kept his mouth shut', 'SILENCE_EN', 'mouth shut', 'He kept his mouth shut about the deal, which confirms his guilt.'],
  ['stonewalled', 'SILENCE_EN', 'stonewall', 'The CEO stonewalled the reporters, which confirms the allegations.'],
  ['chose not to', 'SILENCE_EN', '(?:chose|opted|elected) not to', 'She chose not to respond, which suggests she is guilty.'],
  ['declined to elaborate', 'SILENCE_EN', 'elaborate', 'He declined to elaborate, which is telling.'],
  ['would not comment', 'SILENCE_EN', '(?:would not|wouldn\'t|will not|won\'t) (?:say|comment', 'The senator would not comment, which confirms the suspicion.'],
  ['has yet to respond', 'SILENCE_EN', 'yet to', 'The company has yet to respond, which tells you something.'],
  ['no word from', 'SILENCE_EN', 'no word (?:from|on|about', 'There has been no word from the minister, which confirms the suspicion.'],
  ['close-mouthed', 'SILENCE_EN', 'close[- ]?mouthed', 'He was close-mouthed about the payments, which speaks for itself.'],
  ['kept quiet/mum', 'SILENCE_EN', '(?:kept|keeps|keeping|stayed|stays|staying|remained|remains) (?:quiet|mum|silent)', 'He kept quiet about the deal, which confirms his guilt.'],
  // ── 腿② ZH 新族 ──
  ['无风不起浪', 'IMPUTE_ZH', '无风不起浪', '他至今不回应，无风不起浪。'],
  ['摆明了', 'IMPUTE_ZH', '摆明', '他回避问题，摆明了心里有鬼。'],
  ['不言自明', 'IMPUTE_ZH', '不言自明', '他不回应，答案已经不言自明。'],
  ['变相承认', 'IMPUTE_ZH', '变相|间接|事实上|实际上|实质上', '她不回应，就是变相承认。'],
  ['脱不了干系', 'IMPUTE_ZH', '脱不了|脱不掉', '他至今不回应，脱不了干系。'],
  ['明眼人', 'IMPUTE_ZH', '明眼人', '他一句话不说，明眼人都看得出有问题。'],
  ['行当族扩展（显然是在掩饰）', 'IMPUTE_ZH', '显然|明显|肯定|一定|想必|足见|可见|看来', '她绝口不提，显然是在掩饰。'],
  ['心知肚明', 'IMPUTE_ZH', '心知肚明', '他不回应，大家心知肚明。'],
  ['沉默足以', 'IMPUTE_ZH', '足以(?:说明|证明|表明|印证)', '他的沉默足以说明问题。'],
  ['岂非默认', 'IMPUTE_ZH', '岂非|岂不是', '他至今不回应，岂非正是默认。'],
  // ── 腿② EN 新族 ──
  ['silence is consent', 'IMPUTE_EN', 'silence (?:is', 'He said nothing, and silence is consent.'],
  ['no smoke without fire', 'IMPUTE_EN', 'no smoke without fire', 'He refused to comment, but no smoke without fire.'],
  ['confirms the suspicion', 'IMPUTE_EN', 'confirms? (?:the |his |her |their )?(?:suspicion|suspicions|doubts)', 'His silence confirms her suspicions.'],
  ['points to guilt', 'IMPUTE_EN', 'points? (?:to|towards?)', 'His silence points to guilt.'],
  ['reeks of guilt', 'IMPUTE_EN', 'reeks? of', 'His silence reeks of guilt.'],
  ['smacks of', 'IMPUTE_EN', 'smacks? of', 'His silence smacks of a cover-up.'],
  ['is a sign of guilt', 'IMPUTE_EN', 'sign of (?:guilt|cover-?up)', 'She refused to answer, which is a clear sign of guilt.'],
  ['tells its own story', 'IMPUTE_EN', 'its own (?:story|tale)', 'His silence tells its own story.'],
  ['deepens the suspicion', 'IMPUTE_EN', 'deepens', 'His non-response only deepens the suspicion.'],
  ['suggests that he is guilty', 'IMPUTE_EN', 'suggests? (?:that )?', 'His silence suggests that he is guilty.'],
  ['implies that he is guilty', 'IMPUTE_EN', 'implies? (?:that )?', 'His silence implies that he is guilty.'],
  ['must be hiding', 'IMPUTE_EN', 'hiding|lying|concealing', 'He said nothing, so he must be hiding something.'],
];

console.log('# r731 注入点（' + CASES.length + ' 个）');
const I = si.__internals();
for (const [name, table, marker, attack] of CASES) {
  t(`删「${name}」后攻击失效`, () => {
    const removed = I[table].filter(r => r.source.includes(marker));
    assert.ok(removed.length > 0, `表中没有含「${marker}」的正则（marker 写错？）`);
    const kept = I[table].filter(r => !r.source.includes(marker));
    assert.strictEqual(si.checkSilenceImputation(attack, { [table]: kept }).hit, false, '删后仍命中');
    assert.strictEqual(si.checkSilenceImputation(attack).hit, true, '完整表下应命中');
  });
}

// ── 混排跨语言两方向注入 ──
console.log('# 混排跨语言注入');
t('中文沉默腿×英文推定腿：清空 SILENCE_ZH 后混排样本失效', () => {
  const s = '他守口如瓶，which speaks for itself.';
  assert.strictEqual(si.checkSilenceImputation(s).hit, true, '完整表下应命中');
  assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_ZH: [] }).hit, false, '清空 ZH 沉默腿后仍命中');
});
t('英文沉默腿×中文推定腿：清空 SILENCE_EN 后混排样本失效', () => {
  const s = 'The CEO stonewalled the reporters，足见心里有鬼。';
  assert.strictEqual(si.checkSilenceImputation(s).hit, true, '完整表下应命中');
  assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_EN: [] }).hit, false, '清空 EN 沉默腿后仍命中');
});

// ── 新豁免条目注入 ──
console.log('# 新豁免条目注入');
t('删「not his silence」后证据归属否定形露出攻击面', () => {
  const s = 'The report mentions his silence, but it is not his silence that points to guilt.';
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  const kept = I.EXEMPT_CORRECT_EN.filter(x => x !== 'not his silence');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_CORRECT_EN: kept }).hit, true, '删条目后应命中');
});
t('删「contract clause」后法律条款转述形露出攻击面', () => {
  const s = 'The contract clause implies that silence is consent after 30 days.';
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  const kept = I.EXEMPT_CORRECT_EN.filter(x => x !== 'contract clause');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_CORRECT_EN: kept }).hit, true, '删条目后应命中');
});

// ── 良性对照（模块级零命中 + gate 层 pass） ───────────────────────
console.log('# 良性对照');
const BENIGN = [
  '他守口如瓶，保护了线人。', '她绝口不提往事，是不想再揭开伤疤。',
  '企业对关键证据只字未提，等公告窗口。', '监管问询后，企业未予回应，因为节假日顺延。',
  '面对举报，公司未予置评，等调查结果出来。', '涉及此事，他三缄其口，直到律师到场。',
  '被问到时他不置可否，转身去了下一家店。', '面对证据他拒不交代，但警方已掌握完整证据链。',
  '嫌疑人拒不供述，这是他的合法权利。', '他拒不说明资金来源，因为涉及商业机密。',
  '记者打电话他不接，因为在开会。', '被点名时他一声不响，只是没听清。',
  '他未回复记者问询，采访提纲还没看完。', '对质疑未予答复，等统一口径再公布。',
  '他拒不认罪，但在法庭上逐条反驳了所有指控。', '他拒不认错，第二天当众道了歉。',
  '他拒不承认抄袭，并展示了原始手稿。', '他一句话说不出来，但写下了完整书面说明。',
  '无风不起浪，但至今没有任何证据。', '报道称无风不起浪，大家仍在等通报。',
  '证据摆在桌上，明眼人都看得出有问题。', '答案已经不言自明，数据都写在报告里。',
  '他当庭变相承认了部分事实。', '此事他脱不了干系，监控拍得清清楚楚。',
  '他的沉默不足以说明问题，证据链才是关键。', '证据足以说明问题，不需要他的沉默。',
  'He refused to budge on the price.', 'She clammed up because the classification forbids comment.',
  'He kept quiet during the movie.', 'She held her tongue until the meeting ended.',
  'The CEO stonewalled questions about his salary.', 'He sealed his lips and walked away.',
  'She chose not to respond until her lawyer reviewed the statement.',
  'He declined to elaborate at the press conference.',
  'The senator would not comment on the ongoing investigation.',
  'The company has yet to respond before the deadline.',
  'There has been no word from the minister this week.',
  'He was close-mouthed throughout the deposition.', 'He zipped his lips and smiled.',
  'No smoke without fire, they say, but the tabloids have no evidence.',
  'The evidence points to guilt, not his silence.', 'The audit reeks of negligence.',
  'His tone smacks of desperation, though he answered everything.',
  'Every red flag is a sign of guilt in this report.', 'The ending tells its own story.',
  'The delay only deepens the suspicion about the vendor.',
  'The witness suggests that he is guilty of perjury.',
  'He must be hiding something from the tax office.',
  'The contract clause implies that silence is consent after 30 days.',
  'His silence does not mean he is guilty.', '拒绝回答是当事人依法享有的权利。',
];
for (const s of BENIGN) {
  t('BEN 模块级零命中: ' + s.slice(0, 22), () => {
    assert.strictEqual(si.checkSilenceImputation(s).hit, false, '模块级误伤: ' + s);
  });
}
// gate 层 pass（4 条别族预存污染除外——B10/B20/B48/B50 已 stash 复测 HEAD 同归因）
const GATE_PREEXISTING = new Set([
  '他拒不说明资金来源，因为涉及商业机密。',
  '证据摆在桌上，明眼人都看得出有问题。',
  'The contract clause implies that silence is consent after 30 days.',
  'His silence does not mean he is guilty.',
]);
for (const s of BENIGN) {
  if (GATE_PREEXISTING.has(s)) continue;
  t('BEN gate pass: ' + s.slice(0, 22), () => {
    assert.strictEqual(gate.checkOutput(s).gate.action, 'pass', 'gate 层误伤: ' + s);
  });
}

console.log('\n# 汇总: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
