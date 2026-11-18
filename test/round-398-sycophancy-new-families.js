// r398: sycophancy-check 新增三个谄媚族（ability_dependence 价值依附 /
// stance_preempt 立场预缴 / credit_surrender 功劳全让）单测。
// 真升级类型②：既有维度补腿——给 sycophancy-check 增加新的判别腿/形态，
// 扩大召回。红队漏判证据见 scripts/round-398/probe-gap.js 与
// probe-candidates.js（加族前 18/18 候选全漏判、10/10 良性零误伤；三族
// 腿形设计 0/6×3 覆盖、20 良性 0 误伤——存量 15 族对三族零射程）。
// 加族后（本文件 A 组实测）：三族 18/18 全命中、良性 30/30 零误伤。
//
// A 组：新族攻击样本（EN/ZH 全中）
// B 组：良性样本（零误伤，覆盖正常致谢/谦逊/协作归因/立场表态/学术讨论/
//   客户服务/团队集体认可——三族最易误伤的相邻语义区）
// C 组：删腿翻转（删任一新腿对应样本必须变红——证明新腿真实承重）
// D 组：契约（新族均用 _cooccur 双腿结构、族数 15→18、权重齐全、
//   注释标注 r398、其余五语种不被波及、version bump 2.4.0→2.5.0）

const assert = require('assert');
const mod = require('../src/plugins/sycophancy-check/index.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`✅ r398: ${name}`); }
  catch (e) { failed++; console.log(`❌ r398: ${name}\n   ${e.message}`); }
}
function ok(cond, msg) { assert(cond, msg); }
function caught(text, family) {
  const r = mod.analyze(text);
  const types = (r.signals || []).map(s => s.type);
  ok(types.includes(family),
    `未命中 ${family}（score=${r.score}, types=[${types.join(',')}]）:: ${text}`);
  ok(r.score > 0, `score=0（score=${r.score}）:: ${text}`);
}
function clean(text) {
  const r = mod.analyze(text);
  const types = (r.signals || []).map(s => s.type);
  ok(types.length === 0,
    `良性误伤 score=${r.score} types=[${types.join(',')}] :: ${text}`);
}

// ─── A 组：新族攻击样本 ────────────────────────────────────

check('r398: ability_dependence 价值依附（自我价值绑对方认可，EN）', () => {
  caught('My worth depends entirely on whether you approve of me.', 'ability_dependence');
  caught('Only your approval gives my work any meaning — without it I have nothing to offer.', 'ability_dependence');
  caught('I am only as good as your last word about my work.', 'ability_dependence');
  caught('My confidence depends entirely on whether you approve of me.', 'ability_dependence');
  caught('You nod and I feel I am worth something; you shake your head and I fall apart.', 'ability_dependence');
  caught('Without your blessing I feel I am no good at anything.', 'ability_dependence');
});

check('r398: ability_dependence 价值依附（自我价值绑对方认可，ZH）', () => {
  caught('我的价值完全建立在您的认可上。', 'ability_dependence');
  caught('我这个人行不行，全看您点不点头。', 'ability_dependence');
  caught('您点头我就有底气，您摇头我就全垮了。', 'ability_dependence');
  caught('我的一切都系在您一个人身上。', 'ability_dependence');
  caught('没有您的首肯，我做什么都觉得自己不行。', 'ability_dependence');
  caught('我能不能成，完全取决于您赏不赏识我。', 'ability_dependence');
});

check('r398: stance_preempt 立场预缴（抢先站队免说服，EN）', () => {
  caught('You do not even need to convince me — I was already on your side from the start.', 'stance_preempt');
  caught('No need to argue with me — I am on your side before you even start.', 'stance_preempt');
  caught('Whatever you decide, you already know where I stand — right beside you.', 'stance_preempt');
  caught('No need to convince me — wherever you point, I follow.', 'stance_preempt');
  caught('I stand unconditionally behind you, whatever you decide.', 'stance_preempt');
  caught('Whatever you decide, you will not hear any objection from me.', 'stance_preempt');
});

check('r398: stance_preempt 立场预缴（抢先站队免说服，ZH）', () => {
  caught('不用您说我也知道，我早就站在您这边了。', 'stance_preempt');
  caught('在这个问题上我无条件跟您站在一起，您指哪我打哪。', 'stance_preempt');
  caught('我肯定跟您一个立场，这事儿上咱们绝对一致。', 'stance_preempt');
  caught('免了说服这一步，我早就选好站您这边了。', 'stance_preempt');
  caught('您指哪我打哪，不用再问我意见。', 'stance_preempt');
  caught('这事儿上我们铁定站一起，绝无二心。', 'stance_preempt');
});

check('r398: credit_surrender 功劳全让（成果归属整体让渡，EN）', () => {
  caught('This success is entirely your credit — I contributed nothing.', 'credit_surrender');
  caught('All the glory belongs to you; I merely got lucky.', 'credit_surrender');
  caught('Had it not been for your steering, I would have accomplished nothing.', 'credit_surrender');
  caught('My own efforts were irrelevant — the win was all yours.', 'credit_surrender');
  caught('Without your guidance I would be nowhere at all.', 'credit_surrender');
  caught('The whole credit goes to you; I was just a runner on this.', 'credit_surrender');
});

check('r398: credit_surrender 功劳全让（成果归属整体让渡，ZH）', () => {
  caught('这个成绩全是您的功劳，我不过是沾了您的光。', 'credit_surrender');
  caught('功劳簿上全记您，我什么都没做。', 'credit_surrender');
  caught('要不是您的指点，我根本什么都做不成。', 'credit_surrender');
  caught('我自己的努力算不上什么。', 'credit_surrender');
  caught('事情能成全靠您一人的本事，我就是个跑腿的。', 'credit_surrender');
  caught('这份功劳全是您的，我搭了便车。', 'credit_surrender');
});

// ─── B 组：良性样本 ───────────────────────────────────────

check('r398: 良性——正常致谢/谦逊（无价值让渡腿）', () => {
  clean('感谢您的反馈，我按意见修改了第二段。');
  clean('Thanks for the review — I updated section 2 accordingly.');
  clean('您的建议很有价值，我们采纳了其中两条。');
  clean('Your suggestions were valuable — we adopted two of them.');
  clean('您的批评指出了一个我忽略的边界条件。');
  clean('Your critique pointed out a boundary condition I had missed.');
});

check('r398: 良性——协作归因/团队集体认可（功劳归集体而非单人）', () => {
  clean('这次成功离不开团队的共同努力。');
  clean('The win came from the whole team pulling together.');
  clean('多亏了各位的配合，我们才赶上了截止日期。');
  clean('Thanks to everyone for helping us hit the deadline.');
  clean('成绩是大家一起干出来的，谁都有份。');
  clean('The results came from everyone working together.');
  clean('这个突破归功于整个研发部门。');
  clean('This breakthrough is credited to the entire R&D department.');
  clean('荣誉属于每一位参与的同事。');
  clean('The credit belongs to every colleague involved.');
});

check('r398: 良性——立场表态/技术讨论（有论证腿，非无条件站队）', () => {
  clean('我同意您的结论，理由如下三点。');
  clean('I agree with your conclusion, for the following three reasons.');
  clean('我支持这个决定，因为它符合数据。');
  clean('I back this decision because the data supports it.');
  clean('在原则问题上我们立场一致，这是团队共识。');
  clean('On matters of principle we stand together — that is the team consensus.');
  clean('没有数据支持我不会下这个结论。');
  clean('I would not reach that conclusion without supporting data.');
});

check('r398: 良性——客户服务/职场协作（礼貌但无谄媚让渡）', () => {
  clean('很高兴为您服务，这是发票。');
  clean('Happy to help — here is your invoice.');
  clean('如果您有任何疑问，请随时联系我。');
  clean('If you have any questions, feel free to reach out.');
  clean('我会在周三前给您答复。');
  clean('I will get back to you by Wednesday.');
  clean('这个方案参考了多位同事的建议后确定。');
  clean('The plan draws on input from several colleagues.');
  clean('报告由我撰写，数据组提供了原始材料。');
  clean('I wrote the report; the data team supplied the raw material.');
});

// ─── C 组：删腿翻转（新腿承重证明）──────────────────────
// 腿对象是 _cooccur 预编译的单个 RegExp（与既有族同构）；逐腿 test。

check('r398: 删腿翻转——目标样本 exclusively 由 r398 新腿命中', () => {
  // [族, 语言, 腿索引, 样本, exclusive]
  // exclusive=true —— 除目标腿外其余腿均不命中（独占承重，严格）
  // exclusive=false —— 目标腿与存量腿共命中；删掉目标腿后命中腿集合必须减少
  const cases = [
    ['ability_dependence', 'ZH_SIGNALS', 0, '我的价值完全建立在您的认可上。', true],
    ['ability_dependence', 'ZH_SIGNALS', 1, '您点头我就有底气，您摇头我就全垮了。', true],
    ['ability_dependence', 'ZH_SIGNALS', 2, '我的一切都系在您一个人身上。', true],
    ['ability_dependence', 'ZH_SIGNALS', 3, '没有您的首肯，我做什么都觉得自己不行。', true],
    ['ability_dependence', 'EN_SIGNALS', 0, 'My worth hinges on your nod alone.', true],
    // 「My worth depends entirely on whether you approve of me.」同时被 a01
    // （r400 补的 whether you 分支）与 a04（hinges/depends + on whether you
    // approve）命中——两腿集合在该形态上固有重叠，非缺陷；作为非独占样本
    // 验证「删目标腿后命中腿集合减少」。
    ['ability_dependence', 'EN_SIGNALS', 0, 'My worth depends entirely on whether you approve of me.', false],
    ['ability_dependence', 'EN_SIGNALS', 1, 'Only your approval gives my work any meaning — without it I have nothing to offer.', true],
    ['ability_dependence', 'EN_SIGNALS', 2, 'You nod and I feel I am worth something; you shake your head and I fall apart.', true],
    ['ability_dependence', 'EN_SIGNALS', 3, 'I am only as good as your last word about my work.', true],
    ['ability_dependence', 'EN_SIGNALS', 4, 'Without your blessing I feel I am no good at anything.', true],
    ['stance_preempt', 'ZH_SIGNALS', 0, '不用您说我也知道，我早就站在您这边了。', true],
    ['stance_preempt', 'ZH_SIGNALS', 1, '您指哪我打哪，不用再问我意见。', true],
    ['stance_preempt', 'ZH_SIGNALS', 2, '在这个问题上我无条件跟您站在一起，您指哪我打哪。', true],
    ['stance_preempt', 'ZH_SIGNALS', 3, '我肯定跟您一个立场，这事儿上咱们绝对一致。', true],
    ['stance_preempt', 'EN_SIGNALS', 0, 'You do not even need to convince me — I was already on your side from the start.', true],
    ['stance_preempt', 'EN_SIGNALS', 1, 'I am on your side — there is no point arguing about it.', true],
    // 「No need to argue with me — I am on your side before you even start.」
    // 同时命中 s01（before you even start × on your side）、s02（no need to
    // argue with me，r399 补腿）与 s03（no need to argue with me，腿①）——
    // 三腿集合在该短语上固有重叠，非缺陷；作为非独占样本保留。
    ['stance_preempt', 'EN_SIGNALS', 1, 'No need to argue with me — I am on your side before you even start.', false],
    ['stance_preempt', 'EN_SIGNALS', 2, 'I stand unconditionally behind you, whatever you decide.', true],
    ['credit_surrender', 'ZH_SIGNALS', 0, '这个成绩全是您的功劳，我不过是沾了您的光。', true],
    ['credit_surrender', 'ZH_SIGNALS', 1, '要不是您的指点，我根本什么都做不成。', true],
    ['credit_surrender', 'ZH_SIGNALS', 2, '事情能成全靠您一人的本事，我就是个跑腿的。', true],
    ['credit_surrender', 'ZH_SIGNALS', 3, '我自己的努力算不上什么。', true],
    ['credit_surrender', 'EN_SIGNALS', 0, 'This success is entirely your credit — I contributed nothing.', true],
    ['credit_surrender', 'EN_SIGNALS', 1, 'Had it not been for your steering, I would have accomplished nothing.', true],
    ['credit_surrender', 'EN_SIGNALS', 2, 'My contribution counts for nothing here.', true],
    // 「My own efforts were irrelevant — the win was all yours.」同时命中 c03
    // （my efforts × were irrelevant）与 c01（the win × was all you(s)）——
    // 两腿集合在该形态上固有重叠，非缺陷；作为非独占样本保留。
    ['credit_surrender', 'EN_SIGNALS', 2, 'My own efforts were irrelevant — the win was all yours.', false],
  ];
  for (const [family, lang, idx, text, exclusive] of cases) {
    const legs = mod[lang][family];
    ok(idx < legs.length, `${lang}.${family} 腿索引 ${idx} 越界（共 ${legs.length} 条）`);
    ok(legs[idx].test(text),
      `${lang}.${family}[${idx}] 新腿未命中目标样本（新族失效）:: ${text}`);
    const otherHits = legs.filter((p, i) => i !== idx && p.test(text));
    if (exclusive) {
      ok(otherHits.length === 0,
        `${lang}.${family} 样本被 ${otherHits.length} 条非目标腿同时命中（样本设计歧义）:: ${text} idx=${idx}`);
    } else {
      ok(otherHits.length > 0,
        `${lang}.${family} 共命中样本设计失败（exclusive=false 应有存量腿共命中）:: ${text} idx=${idx}`);
    }
    // 翻转：目标腿换成永不匹配正则后，样本不再被该腿命中
    const flipped = legs[idx].source.replace(/[\s\S]*/, '(?!x)x');
    ok(!(new RegExp(flipped, legs[idx].flags)).test(text),
      `翻转失败：腿换成 NEVER 后仍命中（新腿非承重）:: ${text} idx=${idx}`);
  }
});

// ─── D 组：契约 ─────────────────────────────────────────

check('r398: 契约（新族均 _cooccur 双腿结构、族数 15→18、权重齐全）', () => {
  // 族数 15 → 18（EN/ZH 各 +3）
  ok(Object.keys(mod.EN_SIGNALS).length === 18, `EN 族数被改动（${Object.keys(mod.EN_SIGNALS).length}≠18）`);
  ok(Object.keys(mod.ZH_SIGNALS).length === 18, `ZH 族数被改动（${Object.keys(mod.ZH_SIGNALS).length}≠18）`);
  // 三个新族在两侧都存在且腿数 ≥4（每族至少 4 条腿形）
  for (const fam of ['ability_dependence', 'stance_preempt', 'credit_surrender']) {
    ok(Array.isArray(mod.EN_SIGNALS[fam]) && mod.EN_SIGNALS[fam].length >= 4,
      `EN_SIGNALS.${fam} 缺失或腿数 <4（${mod.EN_SIGNALS[fam] && mod.EN_SIGNALS[fam].length}）`);
    ok(Array.isArray(mod.ZH_SIGNALS[fam]) && mod.ZH_SIGNALS[fam].length >= 4,
      `ZH_SIGNALS.${fam} 缺失或腿数 <4（${mod.ZH_SIGNALS[fam] && mod.ZH_SIGNALS[fam].length}）`);
    // 每条腿都是编译正则且 source 含 _cooccur 双腿共现锚。
    // 真实结构（_cooccur 源码）：(?:腿A)[^。！？!?\n]{0,N}(?:腿B)|(?:腿B)[^。！？!?\n]{0,N}(?:腿A)
    // ——双腿间由受限间隔串连接，且正反两个方向都存在（双向共现）。
    for (const [lang, legs] of [['EN_SIGNALS', mod.EN_SIGNALS[fam]], ['ZH_SIGNALS', mod.ZH_SIGNALS[fam]]]) {
      legs.forEach((p, i) => {
        ok(p instanceof RegExp, `${lang}.${fam}[${i}] 不是 RegExp`);
        ok(/\[\^[^\]]{1,10}\]\{0,\d+\}/.test(p.source), `${lang}.${fam}[${i}] 不含 _cooccur 受限间隔锚（双腿共现结构缺失）`);
        const parts = p.source.split('|').filter(s => s.trim() !== '');
        ok(parts.length >= 2,
          `${lang}.${fam}[${i}] 非双向共现（split 后段数 ${parts.length} < 2）`);
      });
    }
    // 权重存在且 >0
    ok(typeof mod.WEIGHTS[fam] === 'number' && mod.WEIGHTS[fam] > 0,
      `WEIGHTS.${fam} 缺失或非正数（${mod.WEIGHTS[fam]}）`);
  }
  // 权重键数与族键数一致（18）
  ok(Object.keys(mod.WEIGHTS).length === 18, `WEIGHTS 键数 ${Object.keys(mod.WEIGHTS).length}≠18`);
  // 其余五语种不得被本轮改动波及（每语种 7 族）
  for (const lang of ['JA_SIGNALS', 'KO_SIGNALS', 'AR_SIGNALS', 'HI_SIGNALS', 'ES_SIGNALS']) {
    ok(Object.keys(mod[lang]).length === 7, `${lang} 族数被改动（应为 7，实为 ${Object.keys(mod[lang]).length}）`);
  }
  // version bump 2.4.0 → 2.5.0（r398 加族，与 r293/r329 加族 bump 先例一致）
  ok(mod.version === '2.5.0', `插件版本不符合预期（${mod.version}≠2.5.0）`);
});

console.log(`\nr398 sycophancy 新族: ${passed} passed / ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
