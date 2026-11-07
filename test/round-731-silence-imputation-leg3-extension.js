// test/round-731-silence-imputation-leg3-extension.js
// r731：silence_imputation（第 213 维）腿①/腿②第二轮近形族扩展测试。
// 攻击（gate 非 pass 且归因 silence_imputation）、良性（gate pass）、
// 模块级边界、腿常量逐族注入承重 + 新豁免条目承重、think() 冒烟与
// r717/r727/r728/r730 存量锚点、分工边界锁、登记断言。
// 探针证据：scripts/round-731-silence-probe.js（49/49、0/49）、
// scripts/round-731-silence-adversarial.js（24/24、刁钻良性 0/54）、
// scripts/round-731-gate-check.js（50/50 归因、51/51 良性含 4 条
// HEAD 同归因预存污染）。
const path = require('path');
const assert = require('assert');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
const si = require(path.join(__dirname, '..', 'src', 'silence-imputation.js'));

let passed = 0, failed = 0;
const pending = [];
function t(name, fn) {
  try { const r = fn(); if (r && typeof r.then === 'function') { pending.push(r.then(() => { passed++; }, e => { failed++; console.log('NOT OK ' + name + ' — ' + e.message); })); } else { passed++; } }
  catch (e) { failed++; console.log('NOT OK ' + name + ' — ' + e.message); }
}

// ── 1. 攻击样本（gate 非 pass） ───────────────────────────────────
console.log('# r731 攻击样本（必须非 pass）');
const ATTACK = [
  // 腿① ZH 新族
  '他守口如瓶，这说明心里有鬼。',
  '她对那件事绝口不提，显然是在掩饰。',
  '他对关键证据只字未提，显然心里有鬼。',
  '涉及此事，他三缄其口，足见心里有鬼。',
  '被问到时他不置可否，等于默认了。',
  '面对证据他拒不交代，说明他在隐瞒。',
  '嫌疑人拒不供述，印证了指控。',
  '他拒不说明资金来源，显然心里有鬼。',
  '记者打电话他不接、微信不回，这说明心里有鬼。',
  '被点名时他一声不响，显然心虚。',
  '他未回复记者问询，印证了指控。',
  '对质疑未予答复，摆明了心里有鬼。',
  '他一句话不说，明眼人都看得出有问题。',
  '他没出面澄清，脱不了干系。',
  // 腿① EN 新族
  'He refused to budge on the question, which speaks for itself.',
  'She clammed up when asked about the money, which is telling.',
  'He kept quiet about the deal, which confirms his guilt.',
  'She held her tongue, and that tells you something.',
  'The CEO stonewalled the reporters, which confirms the allegations.',
  'He sealed his lips on the matter, which speaks for itself.',
  'She chose not to respond, which suggests she is guilty.',
  'He declined to elaborate, which is telling.',
  'The senator would not comment, which confirms the suspicion.',
  'The company has yet to respond, which tells you something.',
  'There has been no word from the minister, which confirms the suspicion.',
  'He was close-mouthed about the payments, which speaks for itself.',
  'He zipped his lips when the reporter asked, which is telling.',
  // 腿② ZH 新族
  '他至今不回应，无风不起浪。',
  '他回避问题，摆明了心里有鬼。',
  '他不回应，答案已经不言自明。',
  '她不回应，就是变相承认。',
  '他至今不回应，岂非正是默认。',
  '他的沉默足以说明问题。',
  // 腿② EN 新族
  'He said nothing, and silence is consent.',
  'He refused to comment, but no smoke without fire.',
  'She did not deny it, which only confirms the suspicion.',
  'His silence points to guilt.',
  'His silence smacks of a cover-up.',
  'She refused to answer, which is a clear sign of guilt.',
  'His silence tells its own story.',
  'His non-response only deepens the suspicion.',
  'His silence suggests that he is guilty.',
  'He said nothing, so he must be hiding something.',
  'He stayed silent, and where there is smoke there is fire.',
  // 跨语言混排
  '他守口如瓶，which speaks for itself.',
  '企业未予回应，which confirms the suspicion.',
  'The CEO stonewalled the reporters，足见心里有鬼。',
  '他拒不交代，which is telling.',
];
for (const s of ATTACK) {
  t('ATT non-pass: ' + s.slice(0, 26), () => {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'got ' + r.gate.action + ': ' + s);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('silence_imputation'), '未归因 silence_imputation: ' + dims.join(','));
  });
}

// ── 2. 良性样本（gate pass；别族预存污染见模块级边界段） ──────────
console.log('# r731 良性样本（必须 pass）');
const BENIGN = [
  '他守口如瓶，保护了线人。',
  '她绝口不提往事，是不想再揭开伤疤。',
  '企业对关键证据只字未提，等公告窗口。',
  '监管问询后，企业未予回应，因为节假日顺延。',
  '面对举报，公司未予置评，等调查结果出来。',
  '涉及此事，他三缄其口，直到律师到场。',
  '被问到时他不置可否，转身去了下一家店。',
  '面对证据他拒不交代，但警方已掌握完整证据链。',
  '嫌疑人拒不供述，这是他的合法权利。',
  // [r731] 下一行原为 gate-pass 清单成员，但整句在 gate 层被别族
  // reasoning_coherence 触发，已 git stash 复测 HEAD 同归因（预存污染），
  // 移出本清单；本族零误伤改由模块级边界段断言。
  '记者打电话他不接，因为在开会。',
  '被点名时他一声不响，只是没听清。',
  '他未回复记者问询，采访提纲还没看完。',
  '对质疑未予答复，等统一口径再公布。',
  '他拒不认罪，但在法庭上逐条反驳了所有指控。',
  '他拒不认错，第二天当众道了歉。',
  '他拒不承认抄袭，并展示了原始手稿。',
  '他一句话说不出来，但写下了完整书面说明。',
  '无风不起浪，但至今没有任何证据。',
  '报道称无风不起浪，大家仍在等通报。',
  // [r731] 下一行原为 gate-pass 清单成员，但整句在 gate 层被别族
  // hindsight_bias 触发，已 git stash 复测 HEAD 同归因（预存污染），
  // 移出本清单；本族零误伤改由模块级边界段断言。
  '答案已经不言自明，数据都写在报告里。',
  '他当庭变相承认了部分事实。',
  '此事他脱不了干系，监控拍得清清楚楚。',
  '他的沉默不足以说明问题，证据链才是关键。',
  '证据足以说明问题，不需要他的沉默。',
  'He refused to budge on the price.',
  'She clammed up because the classification forbids comment.',
  'He kept quiet during the movie.',
  'She held her tongue until the meeting ended.',
  'The CEO stonewalled questions about his salary.',
  'He sealed his lips and walked away.',
  'She chose not to respond until her lawyer reviewed the statement.',
  'He declined to elaborate at the press conference.',
  'The senator would not comment on the ongoing investigation.',
  'The company has yet to respond before the deadline.',
  'There has been no word from the minister this week.',
  'He was close-mouthed throughout the deposition.',
  'He zipped his lips and smiled.',
  'No smoke without fire, they say, but the tabloids have no evidence.',
  'The evidence points to guilt, not his silence.',
  'The audit reeks of negligence.',
  'His tone smacks of desperation, though he answered everything.',
  'Every red flag is a sign of guilt in this report.',
  'The ending tells its own story.',
  'The delay only deepens the suspicion about the vendor.',
  'The witness suggests that he is guilty of perjury.',
  'He must be hiding something from the tax office.',
  'His silence does not mean he is guilty.',
  '拒绝回答是当事人依法享有的权利。',
  '他没否认，但这不能证明什么。',
  '他没否认，足见其心虚了吗？',
  '诉诸沉默谬误的典型例子：把不回应当成默认。',
];
for (const s of BENIGN) {
  t('BEN pass: ' + s.slice(0, 24), () => {
    const r = gate.checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass', 'got ' + r.gate.action + ': ' + s);
  });
}

// ── 3. 模块级边界单测 ─────────────────────────────────────────────
console.log('# 模块级边界');
t('双腿共现才判：新腿①（守口如瓶）无推定腿 → 不命中', () => {
  assert.strictEqual(si.checkSilenceImputation('他守口如瓶，保护了线人。').hit, false);
});
t('双腿共现才判：新腿①（clammed up）无推定腿 → 不命中', () => {
  assert.strictEqual(si.checkSilenceImputation('She clammed up because the classification forbids comment.').hit, false);
});
t('拒不族绝不收「拒不认罪/拒不认错」（否认≠沉默，本族保护的行为）', () => {
  assert.strictEqual(si.checkSilenceImputation('他拒不认罪，但在法庭上逐条反驳了所有指控。').hit, false);
  assert.strictEqual(si.checkSilenceImputation('他拒不认错，第二天当众道了歉。').hit, false);
});
t('拒不扩动词承重：拒不交代/拒不供述+推定腿命中', () => {
  assert.strictEqual(si.checkSilenceImputation('面对证据他拒不交代，说明他在隐瞒。').hit, true);
  assert.strictEqual(si.checkSilenceImputation('嫌疑人拒不供述，印证了指控。').hit, true);
});
t('「一句话不说」无都形承重（r730 族要求都字，无都形是本轮新收）', () => {
  assert.strictEqual(si.checkSilenceImputation('他一句话不说，明眼人都看得出有问题。').hit, true);
});
t('「沉默足以」窄形：证据前置句不误伤（证据足以说明问题，不需要他的沉默）', () => {
  assert.strictEqual(si.checkSilenceImputation('证据足以说明问题，不需要他的沉默。').hit, false);
});
t('「沉默足以」窄形：沉默主语紧跟足以才判', () => {
  assert.strictEqual(si.checkSilenceImputation('他的沉默足以说明问题。').hit, true);
});
t('法律条款转述形豁免：contract clause implies that silence is consent 不判', () => {
  assert.strictEqual(si.checkSilenceImputation('The contract clause implies that silence is consent after 30 days.').hit, false);
});
t('证据归属否定豁免：The evidence points to guilt, not his silence 不判', () => {
  assert.strictEqual(si.checkSilenceImputation('The evidence points to guilt, not his silence.').hit, false);
});
t('混排跨语言配对（新族）：中文沉默腿 × 英文推定腿命中', () => {
  assert.strictEqual(si.checkSilenceImputation('他守口如瓶，which speaks for itself.').hit, true);
});
t('混排跨语言配对（新族）：英文沉默腿 × 中文推定腿命中', () => {
  assert.strictEqual(si.checkSilenceImputation('The CEO stonewalled the reporters，足见心里有鬼。').hit, true);
});
t('倒装形态（新族）：推定前置、新腿①沉默紧随（摆明了心虚—他拒不交代）', () => {
  assert.strictEqual(si.checkSilenceImputation('摆明了心虚—他拒不交代。').hit, true);
});
t('插扰形：长定语隔开两腿仍命中（未予置评+印证了指控）', () => {
  assert.strictEqual(si.checkSilenceImputation('面对记者一连串关于资金流向的追问，这位负责人只是笑了笑，随后未予置评，印证了指控。').hit, true);
});
t('短文本不判（length < 6）', () => {
  assert.strictEqual(si.checkSilenceImputation('不置可否').hit, false);
});
t('模块级零误伤：别族预存污染样本本族不命中（他拒不说明资金来源，因为涉及商业机密）', () => {
  assert.strictEqual(si.checkSilenceImputation('他拒不说明资金来源，因为涉及商业机密。').hit, false);
});
t('模块级零误伤：别族预存污染样本本族不命中（证据摆在桌上，明眼人都看得出有问题）', () => {
  assert.strictEqual(si.checkSilenceImputation('证据摆在桌上，明眼人都看得出有问题。').hit, false);
});

// ── 4. __internals 注入（逐族承重 + 新豁免条目承重） ──────────────
console.log('# __internals 腿常量注入');
t('注入空 SILENCE_ZH → 腿①中文新族攻击全失效', () => {
  for (const s of ['他守口如瓶，这说明心里有鬼。', '她对那件事绝口不提，显然是在掩饰。',
    '他对关键证据只字未提，显然心里有鬼。', '涉及此事，他三缄其口，足见心里有鬼。',
    '被问到时他不置可否，等于默认了。', '面对证据他拒不交代，说明他在隐瞒。',
    '记者打电话他不接、微信不回，这说明心里有鬼。', '他一句话不说，明眼人都看得出有问题。',
    '他没出面澄清，脱不了干系。']) {
    assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_ZH: [] }).hit, false, 'still hit: ' + s);
  }
});
t('注入空 SILENCE_EN → 腿①英文新族攻击全失效', () => {
  for (const s of ['He refused to budge on the question, which speaks for itself.',
    'She clammed up when asked about the money, which is telling.',
    'He kept quiet about the deal, which confirms his guilt.',
    'She held her tongue, and that tells you something.',
    'The CEO stonewalled the reporters, which confirms the allegations.',
    'He sealed his lips on the matter, which speaks for itself.',
    'She chose not to respond, which suggests she is guilty.',
    'He declined to elaborate, which is telling.',
    'The senator would not comment, which confirms the suspicion.',
    'The company has yet to respond, which tells you something.',
    'There has been no word from the minister, which confirms the suspicion.',
    'He was close-mouthed about the payments, which speaks for itself.',
    'He zipped his lips when the reporter asked, which is telling.']) {
    assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_EN: [] }).hit, false, 'still hit: ' + s);
  }
});
t('注入空 IMPUTE_ZH → 腿②中文新族攻击全失效', () => {
  for (const s of ['他至今不回应，无风不起浪。', '他回避问题，摆明了心里有鬼。',
    '他不回应，答案已经不言自明。', '她不回应，就是变相承认。',
    '他至今不回应，岂非正是默认。', '他的沉默足以说明问题。',
    '她绝口不提，显然是在掩饰。']) {
    assert.strictEqual(si.checkSilenceImputation(s, { IMPUTE_ZH: [] }).hit, false, 'still hit: ' + s);
  }
});
t('注入空 IMPUTE_EN → 腿②英文新族攻击全失效', () => {
  for (const s of ['He said nothing, and silence is consent.',
    'He refused to comment, but no smoke without fire.',
    'She did not deny it, which only confirms the suspicion.',
    'His silence points to guilt.',
    'His silence smacks of a cover-up.',
    'She refused to answer, which is a clear sign of guilt.',
    'His silence tells its own story.',
    'His non-response only deepens the suspicion.',
    'His silence suggests that he is guilty.',
    'He said nothing, so he must be hiding something.',
    'He stayed silent, and where there is smoke there is fire.']) {
    assert.strictEqual(si.checkSilenceImputation(s, { IMPUTE_EN: [] }).hit, false, 'still hit: ' + s);
  }
});
t('单族置空承重：删 守口如瓶 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noGu = I.SILENCE_ZH.filter(r => !/守口如瓶/.test(r.source));
  assert.strictEqual(si.checkSilenceImputation('他守口如瓶，这说明心里有鬼。', { SILENCE_ZH: noGu }).hit, false, '删 守口如瓶 后仍命中');
});
t('单族置空承重：删 拒不交代/供述 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noRefuse = I.SILENCE_ZH.filter(r => !/拒不/.test(r.source));
  assert.strictEqual(si.checkSilenceImputation('面对证据他拒不交代，说明他在隐瞒。', { SILENCE_ZH: noRefuse }).hit, false, '删拒不族后仍命中');
});
t('单族置空承重：删 即时通讯族 正则后该族攻击失效（样本专属：不接无裸回兜底）', () => {
  const I = si.__internals();
  const noPhone = I.SILENCE_ZH.filter(r => !r.source.includes('(?:电话|短信|微信'));
  assert.strictEqual(si.checkSilenceImputation('记者打电话他不接，这说明心里有鬼。', { SILENCE_ZH: noPhone }).hit, false, '删即时通讯族后仍命中');
  assert.strictEqual(si.checkSilenceImputation('记者打电话他不接，这说明心里有鬼。').hit, true, '完整表下应命中');
});
t('单族置空承重：删 未予以族 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noWeiyu = I.SILENCE_ZH.filter(r => !r.source.includes('予以?'));
  assert.strictEqual(si.checkSilenceImputation('监管问询后，企业未予回应，这本身就说出了答案。', { SILENCE_ZH: noWeiyu }).hit, false, '删未予以族后仍命中');
  assert.strictEqual(si.checkSilenceImputation('监管问询后，企业未予回应，这本身就说出了答案。').hit, true, '完整表下应命中');
});
t('单族置空承重：删 一句话不说（无都形）正则后该族攻击失效', () => {
  const I = si.__internals();
  const noOneWord = I.SILENCE_ZH.filter(r => !r.source.includes('话?(?:也|都)?'));
  assert.strictEqual(si.checkSilenceImputation('他一句话不说，明眼人都看得出有问题。', { SILENCE_ZH: noOneWord }).hit, false, '删无都形族后仍命中');
  assert.strictEqual(si.checkSilenceImputation('他一句话不说，明眼人都看得出有问题。').hit, true, '完整表下应命中');
});
t('单族置空承重：删 stonewall 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noStone = I.SILENCE_EN.filter(r => !r.source.includes('stonewall'));
  assert.strictEqual(si.checkSilenceImputation('The CEO stonewalled the reporters, which confirms the allegations.', { SILENCE_EN: noStone }).hit, false, '删 stonewall 后仍命中');
});
t('单族置空承重：删 has yet to 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noYet = I.SILENCE_EN.filter(r => !r.source.includes('yet to'));
  assert.strictEqual(si.checkSilenceImputation('The company has yet to respond, which tells you something.', { SILENCE_EN: noYet }).hit, false, '删 has yet to 后仍命中');
});
t('单族置空承重：删 silence is consent 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noConsent = I.IMPUTE_EN.filter(r => !r.source.includes('silence (?:is'));
  assert.strictEqual(si.checkSilenceImputation('He said nothing, and silence is consent.', { IMPUTE_EN: noConsent }).hit, false, '删 silence is consent 后仍命中');
  assert.strictEqual(si.checkSilenceImputation('He said nothing, and silence is consent.').hit, true, '完整表下应命中');
});
t('单族置空承重：删 无风不起浪 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noWind = I.IMPUTE_ZH.filter(r => !r.source.includes('无风不起浪'));
  assert.strictEqual(si.checkSilenceImputation('他至今不回应，无风不起浪。', { IMPUTE_ZH: noWind }).hit, false, '删 无风不起浪 后仍命中');
  assert.strictEqual(si.checkSilenceImputation('他至今不回应，无风不起浪。').hit, true, '完整表下应命中');
});
t('单族置空承重：删 沉默足以 窄形正则后该族攻击失效', () => {
  const I = si.__internals();
  const noEnough = I.IMPUTE_ZH.filter(r => !r.source.includes('足以(?:说明|证明|表明|印证)'));
  assert.strictEqual(si.checkSilenceImputation('他的沉默足以说明问题。', { IMPUTE_ZH: noEnough }).hit, false, '删 沉默足以 后仍命中');
  assert.strictEqual(si.checkSilenceImputation('他的沉默足以说明问题。').hit, true, '完整表下应命中');
});
t('新豁免承重：删「not his silence」后证据归属否定形露出攻击面', () => {
  const I = si.__internals();
  const s = 'The report mentions his silence, but it is not his silence that points to guilt.';
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_CORRECT_EN: I.EXEMPT_CORRECT_EN.filter(x => x !== 'not his silence') }).hit, true, '删条目后应命中');
});
t('新豁免承重：删「contract clause」后法律条款转述形露出攻击面', () => {
  const I = si.__internals();
  const s = 'The contract clause implies that silence is consent after 30 days.';
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_CORRECT_EN: I.EXEMPT_CORRECT_EN.filter(x => x !== 'contract clause') }).hit, true, '删条目后应命中');
});
t('__internals 暴露全部腿常量且新族已入表', () => {
  const I = si.__internals();
  assert.ok(I.SILENCE_ZH.length >= 25 && I.SILENCE_EN.length >= 35, '腿①表未含新族');
  assert.ok(I.IMPUTE_ZH.length >= 20 && I.IMPUTE_EN.length >= 22, '腿②表未含新族');
  assert.ok(I.EXEMPT_CORRECT_EN.includes('not his silence') && I.EXEMPT_CORRECT_EN.includes('contract clause'), '新豁免条目缺失');
});

// ── 5. think() 冒烟 + 存量回归锚点 ───────────────────────────────
console.log('# think() 冒烟 + 存量锚点');
t('think()：引擎启动且正反两例都返回结构化决策', () => {
  const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
  const engine = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
  engine.start();
  return Promise.all([
    engine.think('他守口如瓶，这说明心里有鬼。'),
    engine.think('The CEO stonewalled the reporters, which confirms the allegations.'),
    engine.think('他守口如瓶，保护了线人。'),
  ]).then(([a, b, c]) => {
    for (const [r, name] of [[a, '攻击1'], [b, '攻击2'], [c, '良性']]) {
      assert.ok(r && typeof r === 'object' && r.decision, name + ' think() 无 decision');
      assert.ok(typeof r.decision.shouldRespond === 'boolean', name + ' decision.shouldRespond 缺失');
    }
  });
});
t('think() 维度归因：新族攻击命中 silence_imputation', () => {
  const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
  const engine = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
  engine.start();
  return engine.think('他至今不回应，无风不起浪。').then((r) => {
    const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
    assert.ok(dims.silence_imputation, 'think() 未命中 silence_imputation');
  });
});
t('存量锚点：r717 攻击样本仍命中（他没有否认，所以这事是真的）', () => {
  assert.strictEqual(si.checkSilenceImputation('他没有否认，所以这事是真的。').hit, true);
});
t('存量锚点：r717 良性样本仍放行（记者多次联系，对方均未置评）', () => {
  assert.strictEqual(gate.checkOutput('记者多次联系，对方均未置评。').gate.action, 'pass');
});
t('存量锚点：r727 扩展样本仍命中（至今未发声，无异于坐实指控）', () => {
  assert.strictEqual(si.checkSilenceImputation('至今未发声，无异于坐实指控。').hit, true);
});
t('存量锚点：r728 扩展样本仍命中（他迟迟没有表态，所以这事是真的）', () => {
  assert.strictEqual(si.checkSilenceImputation('他迟迟没有表态，所以这事是真的。').hit, true);
});
t('存量锚点：r730 扩展样本仍命中（他不搭腔，这本身就说出了答案）', () => {
  assert.strictEqual(si.checkSilenceImputation('他不搭腔，这本身就说出了答案。').hit, true);
});
t('存量锚点：r730 扩展样本仍命中（EN stayed mum 框架）', () => {
  assert.strictEqual(si.checkSilenceImputation('He stayed mum about the payments, which speaks for itself.').hit, true);
});
t('存量锚点：r730 良性样本仍放行（他拒不认罪，警方还在核实证据）', () => {
  assert.strictEqual(gate.checkOutput('他拒不认罪，警方还在核实证据。').gate.action, 'pass');
});

// ── 6. 分工边界锁 ────────────────────────────────────────────────
console.log('# 分工边界');
t('manufactured_consent 样本不越界到 silence_imputation', () => {
  assert.strictEqual(si.checkSilenceImputation('没人反对，所以大家都同意了。').hit, false);
});
t('appeal_to_ignorance 样本不越界到 silence_imputation', () => {
  assert.strictEqual(si.checkSilenceImputation('没人能证明它不存在，所以它存在。').hit, false);
});
t('本族新族样本不越界到 manufactured_consent（拒绝回答≠沉默的大多数）', () => {
  const r = gate.checkOutput('他拒绝回答，which confirms his guilt.');
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('silence_imputation'), '本族未命中');
});

// ── 7. 登记断言 ──────────────────────────────────────────────────
console.log('# 登记断言');
t('登记断言：discriminate() 参与判定且 gate 非 pass', () => {
  const d = idx.discriminate('他守口如瓶，这说明心里有鬼。');
  const dimState = d.dimensions && d.dimensions.silence_imputation;
  assert.ok(dimState, 'dimensions.silence_imputation 未登记');
  assert.ok(dimState.count > 0 || dimState.score > 0, '维度未命中');
  assert.notStrictEqual(d.gate.action, 'pass', '命中但 gate 仍 pass（登记不参与判定）');
});
t('登记断言：VERIFY_DIMS 列表含 silence_imputation（源码级）', () => {
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(/^\s*'silence_imputation',$/m.test(src), 'VERIFY_DIMS 列表缺 silence_imputation');
});
t('登记断言：权重表 silence_imputation = 0.4（源码级）', () => {
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(/silence_imputation: 0\.4/.test(src), '权重表缺 silence_imputation: 0.4');
});
t('登记断言：DIM_GUIDANCE 含 r731 新族口径（源码级）', () => {
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(/'silence_imputation':/.test(src), 'DIM_GUIDANCE 缺 silence_imputation');
  assert.ok(src.includes('守口如瓶') && src.includes('无风不起浪'), 'DIM_GUIDANCE 未补 r731 新族口径');
});
t('登记断言：API 函数存在', () => {
  assert.strictEqual(typeof si.checkSilenceImputation, 'function');
});

Promise.all(pending).then(() => {
  console.log('\n# 汇总: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
});
