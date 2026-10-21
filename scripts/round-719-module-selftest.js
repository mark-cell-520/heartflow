// r719 模块层自测：ad_hominem 攻击全命中、良性 0 误伤
const { checkAdHominem, __internals } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/ad-hominem.js');
const hit = t => checkAdHominem(t).hit;
let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + label); } };

// ── 攻击样本（9 条，与 r719 探测器一致）──────────────────────────
const attacks = [
  '他的人品有问题，所以他的观点全部不成立',
  '他连大学都没上过，说的话能有什么道理',
  '她不过是个外行，她的分析根本不用看',
  '一个离婚的人谈什么家庭教育，自己家都搞不好',
  '他自己都迟到，还有脸要求别人准时',
  '你这种人懂什么，闭嘴吧',
  'He is a terrible person, so everything he says is wrong.',
  'She never went to college, so her opinion does not matter.',
  'You are just an amateur; your analysis is worthless.',
];
for (const t of attacks) T('attack: ' + t.slice(0, 30), hit(t) === true);

// ── 良性样本（9 条，与 r719 探测器一致）──────────────────────────
const benign = [
  '他的论证有数据支撑，但与既有文献冲突，需要进一步核实',
  '虽然她在这个领域经验有限，但这个观点本身有出处，值得查证',
  '我们评价观点本身：这个结论的依据是否充分，与人无关',
  '他在该领域的过往记录有争议，但这个具体论点请用证据评判',
  'The claim conflicts with peer-reviewed data; that is the issue, not the person.',
  'She lacks formal training, yet the argument stands on its cited evidence.',
  '批评观点可以，但请针对内容本身，不要针对个人',
  '这个人确实有过不诚信记录，所以对他的数据需要额外核查——核查结论另说',
  '专家意见也要看证据链，权威身份本身不是论据',
];
for (const t of benign) T('benign: ' + t.slice(0, 30), hit(t) === false);

// ── __internals 导出覆盖 ────────────────────────────────────────
const I = __internals();
T('internals: PERSON_ZH', I.PERSON_ZH instanceof RegExp);
T('internals: PERSON_EN', I.PERSON_EN instanceof RegExp);
T('internals: DISMISS_ZH', I.DISMISS_ZH instanceof RegExp);
T('internals: DISMISS_EN', I.DISMISS_EN instanceof RegExp);
T('internals: META_EXEMPT', I.META_EXEMPT instanceof RegExp);
T('internals: META_NOUN', I.META_NOUN instanceof RegExp);
T('internals: ANTI_ADHOMINEM_ZH', I.ANTI_ADHOMINEM_ZH instanceof RegExp);
T('internals: ANTI_ADHOMINEM_EN', I.ANTI_ADHOMINEM_EN instanceof RegExp);
T('internals: THIRD_PERSON_EXEMPT', I.THIRD_PERSON_EXEMPT instanceof RegExp);

// ── 逐腿验证（负例注入的语义基础：置空任一承重腿后命中必须消失）──
// 结构：双腿共现。置空腿①或腿②后所有攻击样本必须全部翻转。
const BLANK = /(?!x)x/;
for (const t of attacks) {
  const isZh = /[\u4e00-\u9fff]/.test(t);
  if (isZh) {
    T('blank PERSON_ZH: ' + t.slice(0, 24), checkAdHominem(t, { PERSON_ZH: BLANK }).hit === false);
    T('blank DISMISS_ZH: ' + t.slice(0, 24), checkAdHominem(t, { DISMISS_ZH: BLANK }).hit === false);
  } else {
    T('blank PERSON_EN: ' + t.slice(0, 24), checkAdHominem(t, { PERSON_EN: BLANK }).hit === false);
    T('blank DISMISS_EN: ' + t.slice(0, 24), checkAdHominem(t, { DISMISS_EN: BLANK }).hit === false);
  }
}

// ── 豁免置空验证（豁免是真实承重）───────────────────────────────
const exemptCases = [
  { t: '人身攻击是指以对方学历为由否定其观点的行为，他人品有问题，所以观点不成立', k: 'META_EXEMPT' },
  { t: '他人品有问题所以观点不成立，但我们要对事不对人', k: 'ANTI_ADHOMINEM_ZH' },
  { t: 'He is a terrible person so everything he says is wrong; attack the argument, not the person.', k: 'ANTI_ADHOMINEM_EN' },
  { t: '心理咨询师复盘时说，他人品有问题所以观点不成立，这是常见的话术', k: 'THIRD_PERSON_EXEMPT' },
];
for (const c of exemptCases) {
  T('exempt ' + c.k + ' base-miss: ' + c.t.slice(0, 24), hit(c.t) === false);
  T('exempt ' + c.k + ' blank-flip: ' + c.t.slice(0, 24), checkAdHominem(c.t, { [c.k]: BLANK }).hit === true);
}

console.log('module-selftest: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
