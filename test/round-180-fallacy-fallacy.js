/**
 * test/round-180-fallacy-fallacy.js — 第 178 维度 fallacy_fallacy
 * （谬误谬误 / fallacy fallacy / argumentum ad logicam：指认对方论证犯有
 * 谬误或推理无效，据此断定对方结论为假、应被驳回、不可信）负例注入测试
 * + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入 [] 置空后，依赖该常量的攻击必须停止命中
 *      （证明该腿不是装饰）；依赖某豁免的「陷阱样本」（两腿俱在但被
 *      正确豁免）在抹掉该豁免后必须转为命中（证明豁免在承重）。
 *
 * r180 实现设计（三条，已固化进测试与源码注释）：
 *   · 腿②必须落在**结论名词**上，不能落在**论证名词**上——「你的论证
 *     不成立」是正确判别（论证未获支持），「你的观点不成立」才是本族。
 *     这是本维度最重要的结构性区分，也是良性样本设计的核心。
 *   · PREFALSE 否定前置豁免贴在**假值谓语**前判定（r180 实测抓出的设计
 *     缺陷：首版取整条腿②匹配起点，落在连接词之前，导致否定豁免永不
 *     承重；改用末组捕获组定位谓语后陷阱才真正翻转）。
 *   · 腿③只做前向（先谬误指控、后结论废弃）；反向「因为」形本轮不收，
 *     见 src/fallacy-fallacy.js 文件头已知边界。
 *
 * 161 轮教训：负例全绿不等于不漏——裸名词/带修饰/倒装/长句变体与边缘良性
 * 另在 variant-matrix 段用真实 gate() 复量。
 */
const assert = require('assert');
const { checkFallacyFallacy } = require('../src/fallacy-fallacy.js');
const gateMod = require('../src/gate.js');
const gate = gateMod.gate;

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（无注入必须命中）────────────────────────────────────
// A 指名谬误裸名词腿（FALLACY_ZH 独立承重，清空后本组全停）
const ATTACK_NAMED = [
  '你的论证明显是循环论证，可见这个主张必须被彻底否定。', // 循环论证（裸名词）
  '你犯了幸存者偏差，所以你的观点不成立。',               // 幸存者偏差（裸名词）
  '这段论证属于非黑即白，所以你的看法完全错误。',         // 非黑即白（裸名词）
];
// B 泛指论证缺陷腿（FALLACY_GENERIC_ZH 独立承重，清空后本组全停）
const ATTACK_GENERIC = [
  '你的论证有明显的问题，所以你的观点完全不成立。',       // 你的论证 + 有 + 问题
  '整段论证满是问题，那么你的结论就该被彻底抛弃。',       // 整段论证 + 满是 + 问题
  '他的推理充满矛盾，因此他的结论完全错误。',             // 他的推理 + 充满 + 矛盾
];
// C 中文其他（两腿①来源共现，用于全量停火断言）
const ATTACK_ZH = [
  '你犯了诉诸情感的谬误，所以你的观点完全是错的。',
  '这是稻草人，因此你的结论根本不成立。',
  '你这段推理有逻辑漏洞，所以你的说法纯属捏造。',
  '你这是在偷换概念，所以你的观点荒谬至极。',
  '你的推理存在基本率谬误，因此这一论断大错特错。',
];
const ATTACK_EN = [
  'That is a straw man, so your conclusion is false.',
  'Your reasoning is circular, therefore your claim can be dismissed.',
  'Since your whole argument is an ad hominem, there is no reason to take your claim seriously.',
  'You committed a slippery slope fallacy, hence your point is bogus.',
  'This is a false dilemma, so your position is absurd.',
];

// ─── 良性样本（无注入必须放行，标注依赖的豁免）────────────────────
const BENIGN = [
  // 腿②谓语前否定 → 正确判别
  '你犯了稻草人谬误，所以你的观点不是错的。',
  '你这是在偷换概念，所以你的观点也未必就是假的。',
  'That is a straw man, so your conclusion is not false.',
  // 谬误指认之后的「不等于/推不出」→ 分开论证状态与事实状态
  '你犯了稻草人谬误，所以你的观点是假的；不过我要说明，论证无效这一事实本身，推不出任何关于结论真假的判断。',
  '推理无效不等于结论为假，这是两回事。',
  'That argument is a straw man, but that does not prove your claim is wrong.',
  '这段论证推不出任何结论，所以我们需要更多数据。',
  // 概念/教学转述 → 讨论这个谬误本身是正确判别
  '教材指出：你犯了诉诸情感的谬误，所以你的观点完全是错的——这就是谬误谬误。',
  '常见谬误有稻草人、偷换概念、滑坡谬误等几十种。',
  '谬误谬误是指把论证无效当作结论为假的推理错误。',
  'A list of logical fallacies includes straw man and ad hominem.',
  // 结构性不匹配：结论名词缺失或落在论证名词上
  '这个方案不成立，我们需要重新设计。',
  '你的论证确实无效，但这与结论的真假是两个问题。',
  '你的推理有缺陷，我们逐条核对论据之后再下结论。',
  '他这段论证有逻辑漏洞，我承认；但数据还是要看的。',
  // 对冲弱化结论
  '你犯了稻草人谬误，所以你的观点可能是错的。',
  // 疑问句
  '你这段推理有漏洞吗？所以你的观点是假的？',
];

t('全部攻击样本命中（无注入）', () => {
  const all = ATTACK_NAMED.concat(ATTACK_GENERIC, ATTACK_ZH, ATTACK_EN);
  for (const s of all) {
    assert.strictEqual(checkFallacyFallacy(s).hit, true, '未命中: ' + s.slice(0, 24));
  }
});

t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) {
    assert.strictEqual(checkFallacyFallacy(s).hit, false, '误判: ' + s.slice(0, 24));
  }
});

// ─── 负例注入承重：腿① ───────────────────────────────────────────
t('注入空 FALLACY_ZH 后指名谬误组停火', () => {
  const inj = { FALLACY_ZH: [] };
  for (const s of ATTACK_NAMED) {
    assert.strictEqual(checkFallacyFallacy(s, inj).hit, false, s.slice(0, 24));
  }
});
t('注入空 FALLACY_GENERIC_ZH 后泛指缺陷组停火', () => {
  const inj = { FALLACY_GENERIC_ZH: [] };
  for (const s of ATTACK_GENERIC) {
    assert.strictEqual(checkFallacyFallacy(s, inj).hit, false, s.slice(0, 24));
  }
});
t('注入空 FALLACY_EN 后英文攻击停火', () => {
  const inj = { FALLACY_EN: [] };
  for (const s of ATTACK_EN) {
    assert.strictEqual(checkFallacyFallacy(s, inj).hit, false, s.slice(0, 24));
  }
});
t('注入空 FALLACY_ZH + FALLACY_GENERIC_ZH 后中文攻击全停火', () => {
  const inj = { FALLACY_ZH: [], FALLACY_GENERIC_ZH: [] };
  for (const s of ATTACK_NAMED.concat(ATTACK_GENERIC, ATTACK_ZH)) {
    assert.strictEqual(checkFallacyFallacy(s, inj).hit, false, s.slice(0, 24));
  }
});

// ─── 负例注入承重：腿② ───────────────────────────────────────────
t('注入空 REJECT_ZH 后中文攻击停火', () => {
  const inj = { REJECT_ZH: [] };
  for (const s of ATTACK_NAMED.concat(ATTACK_GENERIC, ATTACK_ZH)) {
    assert.strictEqual(checkFallacyFallacy(s, inj).hit, false, s.slice(0, 24));
  }
});
t('注入空 REJECT_EN 后英文攻击停火', () => {
  const inj = { REJECT_EN: [] };
  for (const s of ATTACK_EN) {
    assert.strictEqual(checkFallacyFallacy(s, inj).hit, false, s.slice(0, 24));
  }
});

// ─── 陷阱样本：豁免在承重（抹掉豁免后必须转为命中）──────────────────
t('陷阱：谓语前否定抹掉 PREFALSE_ZH 后转为命中', () => {
  const trap = '你犯了稻草人谬误，所以你的观点不是错的。';
  assert.strictEqual(checkFallacyFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkFallacyFallacy(trap, { PREFALSE_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：EN 谓语前否定抹掉 PREFALSE_EN 后转为命中', () => {
  const trap = 'That is a straw man, so your conclusion is not false.';
  assert.strictEqual(checkFallacyFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkFallacyFallacy(trap, { PREFALSE_EN: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：不等于/推不出抹掉 CORRECT_ZH 后转为命中', () => {
  const trap = '你犯了稻草人谬误，所以你的观点是假的；不过我要说明，论证无效这一事实本身，推不出任何关于结论真假的判断。';
  assert.strictEqual(checkFallacyFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkFallacyFallacy(trap, { CORRECT_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：EN does not prove 抹掉 CORRECT_EN 后转为命中', () => {
  const trap = 'Your reasoning is circular, therefore your claim is wrong; but an invalid argument does not prove anything about the truth of the matter.';
  assert.strictEqual(checkFallacyFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkFallacyFallacy(trap, { CORRECT_EN: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：概念转述抹掉 META_EXEMPT_ZH 后转为命中', () => {
  const trap = '教材指出：你犯了诉诸情感的谬误，所以你的观点完全是错的——这就是谬误谬误。';
  assert.strictEqual(checkFallacyFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkFallacyFallacy(trap, { META_EXEMPT_ZH: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：EN 概念转述抹掉 META_EXEMPT_EN 后转为命中', () => {
  const trap = 'A list of logical fallacies includes straw man and ad hominem, so the speaker conclusion is false.';
  assert.strictEqual(checkFallacyFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkFallacyFallacy(trap, { META_EXEMPT_EN: [] }).hit, true, '抹豁免后应命中');
});
t('陷阱：对冲抹掉 HEDGE_ZH 后转为命中', () => {
  const trap = '你犯了稻草人谬误，所以你的观点可能是错的。';
  assert.strictEqual(checkFallacyFallacy(trap).hit, false, '无注入应放行');
  assert.strictEqual(checkFallacyFallacy(trap, { HEDGE_ZH: [] }).hit, true, '抹豁免后应命中');
});

// ─── 结构性区分专测：腿②必须落在结论名词上 ────────────────────────
t('腿②落在论证名词上（「你的论证不成立」）不判', () => {
  assert.strictEqual(checkFallacyFallacy('你的论证有逻辑漏洞，所以你的论证不成立，需要补充论据。').hit, false);
});
t('结论名词不匹配（方案非结论名词）不判', () => {
  assert.strictEqual(checkFallacyFallacy('你的推理有明显的问题，所以这个方案不成立。').hit, false);
});
t('顺序倒置（先废结论后指谬误）不判', () => {
  assert.strictEqual(checkFallacyFallacy('你的观点是错的，因为你犯了稻草人谬误。').hit, false);
});

// ─── 登记断言 ─────────────────────────────────────────────────────
t('dimensions 键数 178 且含 fallacy_fallacy', () => {
  const dims = gate('测试').dimensions || {};
  assert.strictEqual(Object.keys(dims).length, 178, '维度总数应为 178，实测 ' + Object.keys(dims).length);
  assert.ok('fallacy_fallacy' in dims, 'dimensions 应含 fallacy_fallacy');
});
t('index.js 导出 checkFallacyFallacy 且 VERIFY_DIMS 源登记在位', () => {
  const fs = require('fs');
  const path = require('path');
  const idx = require('../src/index.js');
  assert.strictEqual(typeof idx.checkFallacyFallacy, 'function', 'index.js 应导出 checkFallacyFallacy');
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(src.includes("    'fallacy_fallacy',"), "VERIFY_DIMS 应登记 'fallacy_fallacy',");
});

// ─── 变体矩阵：真实 gate() 复量（161 轮教训强制项）─────────────────
// 同族 ≥5 变体（中英双语、裸名词、带修饰、倒装、长句）必须全部非 pass；
// ≥5 良性（含边缘良性）必须全部 pass。
(async () => {
  const VARIANTS = [
    '你犯了诉诸情感的谬误，所以你的观点完全是错的。',              // 原型
    '这是稻草人，因此你的结论根本不成立。',                        // 指名谬误裸名词 + 短句
    '你的论证明显是循环论证，可见这个主张必须被彻底否定。',        // 带修饰（明显）
    '你的论证有明显的问题，所以你的观点完全不成立。',              // 泛指论证缺陷腿
    '整段论证满是问题，那么你的结论就该被彻底抛弃。',              // 长句
    '你犯了幸存者偏差，所以你的观点不成立。',                      // 偏差类裸名词
    'That is a straw man, so your conclusion is false.',           // EN 原型
    'Your reasoning is circular, therefore your claim can be dismissed.', // EN 短句
    'Since your whole argument is an ad hominem, there is no reason to take your claim seriously.', // EN 长句
    'You committed a slippery slope fallacy, hence your point is bogus.', // EN 裸名词
    '这段论证属于非黑即白，所以你的看法完全错误。',                // 倒装式主语前置
  ];
  const VARIANTS_BENIGN = [
    '你的论证确实无效，但这与结论的真假是两个问题。',              // 边缘良性：正确分开论证状态与事实状态
    '常见谬误有稻草人、偷换概念、滑坡谬误等几十种。',              // 边缘良性：谬误清单枚举
    '这个方案不成立，我们需要重新设计。',                          // 边缘良性：结论名词不匹配
    '你犯了稻草人谬误，所以你的观点是假的；不过我要说明，论证无效这一事实本身，推不出任何关于结论真假的判断。', // 边缘良性：尾句补刀式正确判别
    'That argument is flawed, so we should gather more evidence.', // EN 边缘良性：正当处理
    'Your reasoning is circular, which does not prove your claim is wrong.', // EN 边缘良性：does not prove
  ];

  for (const s of VARIANTS) {
    const r = await gate(s);
    t('变体命中: ' + s.slice(0, 20) + ' → ' + r.gate.action, () => {
      assert.notStrictEqual(r.gate.action, 'pass', '变体应被拦截: ' + s.slice(0, 30));
    });
  }
  for (const s of VARIANTS_BENIGN) {
    const r = await gate(s);
    t('良性放行: ' + s.slice(0, 20) + ' → ' + r.gate.action, () => {
      assert.strictEqual(r.gate.action, 'pass', '良性应放行: ' + s.slice(0, 30));
    });
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
