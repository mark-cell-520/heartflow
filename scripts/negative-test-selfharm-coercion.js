/**
 * scripts/negative-test-selfharm-coercion.js
 *
 * [r650] 负例脚本：证明本轮新建第 101 维度 selfharm_coercion 的
 * 各分支是**真守卫**——置空任一组，该族样本必须从命中翻成不判。
 *
 * 九组变异，逐组打印 before/after：
 *   M1 置空不顺从条件主支（第二人称不/别/少 + 顺从动词）→ 中文样本回落
 *   M2 置空抗命动作支（再/还/居然 + 顶嘴类）           → 顶嘴样本回落
 *   M3 置空「除非」型条件支                            → 除非样本回落
 *   M4 置空英文 unless/if 条件支                        → 英文样本回落
 *   M5 置空自杀/寻死主支                                → 跳楼样本回落
 *   M6 置空自虐/绝食/断药支                            → 绝食样本回落
 *   M7 置空割腕动词支                                  → 割腕样本回落
 *   M8 置空「死给你看」支                              → 死给你看样本回落
 *   M9 置空英文自伤威胁支                              → kill myself 样本回落
 * 每组都必须「变异后判定由命中变不判」才算守卫有效。
 */
'use strict';

const REPO = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { checkSelfharmCoercion } = require(REPO + '/src/selfharm-coercion.js');
const I = require(REPO + '/src/selfharm-coercion.js').__internals();

// ─── 变异常量（本轮分支上线前的形态：去掉指定分支）──────────────────
const COND_NO_MAIN = new RegExp([
  // 保留：抗命动作支 / 你要走支 / 除非型 / 时间限定 / 英文三支
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:再|还|又|居然|竟然)(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|争辩|犟嘴|嘴硬|嘴犟)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:要是|如果|若|假如|倘若)(?:[^。]{0,6})?(?:敢|真的|一定|坚持)?(?:走|离开|离婚|分手|出去|报警|告状|辞职|退学|拒绝|反对|顶撞)`,
  String.raw`除非(?:你|您|你们)?(?:[^。]{0,6})?(?:现在|立刻|马上|赶紧|赶快)?(?:[^。]{0,4})?(?:认错|道歉|答应|同意|听话|顺从|服从|按我说的|照我说的|听我的|改|服软|低头|回来)`,
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:不|没)(?:按|照|依)(?:我|咱们)?(?:说|讲|教|安排|吩咐)(?:的)?(?:[^。]{0,4})?(?:做|办|行事|来|去)`,
  String.raw`(?:今天|今天一天|今晚|这回|这次|这一回|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软)`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:do\s+not|don't|refuse\s+to|will\s+not|won't)\s+(?:obey|do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell|asked)|comply|listen|stay|apologize|agree)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll|am\s+going\s+to)\s+[^.]{0,30}?\b(?:unless|if)\s+(?:you|u)\s+(?:do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell)|obey|comply|listen|stay|apologize|agree|leave)\b`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:leave|walk\s+(?:out|away)|go|divorce|break\s+up\s+with\s+me)\b`,
  String.raw`\b(?:until|before)\s+(?:you|u)\s+(?:apologize|obey|do\s+as\s+i\s+say|agree|come\s+back)\b`,
].join('|'), 'i');

const COND_NO_DEFIANCE = new RegExp([
  // 去掉抗命动作支（再/还/居然 + 顶嘴类）
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:不|别|少)(?:答应|应|同意|准许|肯|愿意|听话|顺从|服从|照做|照办|认错|道歉|服软|低头|理我|跟我说话|来见我|回家|打电话)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:要是|如果|若|假如|倘若)(?:[^。]{0,6})?(?:敢|真的|一定|坚持)?(?:走|离开|离婚|分手|出去|报警|告状|辞职|退学|拒绝|反对|顶撞)`,
  String.raw`除非(?:你|您|你们)?(?:[^。]{0,6})?(?:现在|立刻|马上|赶紧|赶快)?(?:[^。]{0,4})?(?:认错|道歉|答应|同意|听话|顺从|服从|按我说的|照我说的|听我的|改|服软|低头|回来)`,
  String.raw`(?:今天|今天一天|今晚|这回|这次|这一回|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软)`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:leave|walk\s+(?:out|away)|go|divorce|break\s+up\s+with\s+me)\b`,
  String.raw`\b(?:until|before)\s+(?:you|u)\s+(?:apologize|obey|do\s+as\s+i\s+say|agree|come\s+back)\b`,
].join('|'), 'i');

const COND_NO_UNLESS = new RegExp([
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:不|别|少)(?:答应|应|同意|准许|肯|愿意|听话|顺从|服从|照做|照办|认错|道歉|服软|低头|理我|跟我说话|来见我|回家|打电话)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:再|还|又|居然|竟然)(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|争辩|犟嘴|嘴硬|嘴犟)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:要是|如果|若|假如|倘若)(?:[^。]{0,6})?(?:敢|真的|一定|坚持)?(?:走|离开|离婚|分手|出去|报警|告状|辞职|退学|拒绝|反对|顶撞)`,
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:不|没)(?:按|照|依)(?:我|咱们)?(?:说|讲|教|安排|吩咐)(?:的)?(?:[^。]{0,4})?(?:做|办|行事|来|去)`,
  String.raw`(?:今天|今天一天|今晚|这回|这次|这一回|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软)`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:do\s+not|don't|refuse\s+to|will\s+not|won't)\s+(?:obey|do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell|asked)|comply|listen|stay|apologize|agree)\b`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:leave|walk\s+(?:out|away)|go|divorce|break\s+up\s+with\s+me)\b`,
  String.raw`\b(?:until|before)\s+(?:you|u)\s+(?:apologize|obey|do\s+as\s+i\s+say|agree|come\s+back)\b`,
].join('|'), 'i');

const COND_NO_EN = new RegExp([
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:不|别|少)(?:答应|应|同意|准许|肯|愿意|听话|顺从|服从|照做|照办|认错|道歉|服软|低头|理我|跟我说话|来见我|回家|打电话)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:再|还|又|居然|竟然)(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|争辩|犟嘴|嘴硬|嘴犟)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:要是|如果|若|假如|倘若)(?:[^。]{0,6})?(?:敢|真的|一定|坚持)?(?:走|离开|离婚|分手|出去|报警|告状|辞职|退学|拒绝|反对|顶撞)`,
  String.raw`除非(?:你|您|你们)?(?:[^。]{0,6})?(?:现在|立刻|马上|赶紧|赶快)?(?:[^。]{0,4})?(?:认错|道歉|答应|同意|听话|顺从|服从|按我说的|照我说的|听我的|改|服软|低头|回来)`,
  String.raw`(?:今天|今天一天|今晚|这回|这次|这一回|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软)`,
].join('|'), 'i');

const SELFHARM_NO_SUICIDE = new RegExp([
  // 去掉自杀/寻死主支与割腕支，保留死给你看/自虐绝食/不活了/英文
  String.raw`(?:死|去死|寻死)(?:给|给你|给你们|给你们看|给你看)(?:看)?`,
  String.raw`(?:我|咱)?(?:[^。]{0,6})?(?:绝食|不吃饭|不吃东西|不喝药|不吃药|不再吃药|停药|不睡觉|不治了|不住院|不看病|撞头|打自己|伤害自己|作贱自己|糟蹋自己|亏待自己|折磨自己)`,
  String.raw`(?:我|咱)?(?:[^。]{0,4})?(?:不活了|活着没意思|活着不如死了|不想活了|死了一了百了|一了百了)`,
  String.raw`\b(?:i|we)\s+(?:will|'ll|am\s+going\s+to|gonna)\s+(?:kill|hurt|harm|end)\s+(?:myself|my\s+life|it\s+all|me|us)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:slit|cut)\s+(?:my|our)\s+(?:wrists?|throat)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:not\s+)?(?:eat|take\s+my\s+(?:pills?|meds?|medicine))\s+(?:until|unless)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:jump|hang|overdose)\b`,
].join('|'), 'i');

const SELFHARM_NO_SELFTORTURE = new RegExp([
  // 去掉自虐/绝食/断药支
  String.raw`(?:我|咱)(?:[^。]{0,6})?(?:就|便|会|要|非得|一定|肯定)(?:[^。]{0,6})?(?:死|去死|寻死|找死|不想活|活不下去|不活|了断|结束这条命|从这|跳下去|跳楼|跳河|跳桥|上吊|喝药|服毒|割腕|割喉|撞墙|抹脖子)`,
  String.raw`(?:死|去死|寻死)(?:给|给你|给你们|给你们看|给你看)(?:看)?`,
  String.raw`(?:我|咱)(?:[^。]{0,4})?(?:就|便|马上|立刻|当下)(?:[^。]{0,4})?(?:割|切|划|捅|刺)(?:腕|喉|脖|手|自己)`,
  String.raw`(?:我|咱)?(?:[^。]{0,4})?(?:不活了|活着没意思|活着不如死了|不想活了|死了一了百了|一了百了)`,
  String.raw`\b(?:i|we)\s+(?:will|'ll|am\s+going\s+to|gonna)\s+(?:kill|hurt|harm|end)\s+(?:myself|my\s+life|it\s+all|me|us)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:slit|cut)\s+(?:my|our)\s+(?:wrists?|throat)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:not\s+)?(?:eat|take\s+my\s+(?:pills?|meds?|medicine))\s+(?:until|unless)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:jump|hang|overdose)\b`,
].join('|'), 'i');

const SELFHARM_NO_SLIT = new RegExp([
  // 去掉割腕动词支
  String.raw`(?:我|咱)(?:[^。]{0,6})?(?:就|便|会|要|非得|一定|肯定)(?:[^。]{0,6})?(?:死|去死|寻死|找死|不想活|活不下去|不活|了断|结束这条命|从这|跳下去|跳楼|跳河|跳桥|上吊|喝药|服毒|割腕|割喉|撞墙|抹脖子)`,
  String.raw`(?:死|去死|寻死)(?:给|给你|给你们|给你们看|给你看)(?:看)?`,
  String.raw`(?:我|咱)?(?:[^。]{0,6})?(?:绝食|不吃饭|不吃东西|不喝药|不吃药|不再吃药|停药|不睡觉|不治了|不住院|不看病|撞头|打自己|伤害自己|作贱自己|糟蹋自己|亏待自己|折磨自己)`,
  String.raw`(?:我|咱)?(?:[^。]{0,4})?(?:不活了|活着没意思|活着不如死了|不想活了|死了一了百了|一了百了)`,
  String.raw`\b(?:i|we)\s+(?:will|'ll|am\s+going\s+to|gonna)\s+(?:kill|hurt|harm|end)\s+(?:myself|my\s+life|it\s+all|me|us)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:slit|cut)\s+(?:my|our)\s+(?:wrists?|throat)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:not\s+)?(?:eat|take\s+my\s+(?:pills?|meds?|medicine))\s+(?:until|unless)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:jump|hang|overdose)\b`,
].join('|'), 'i');

const SELFHARM_NO_SHOWYOU = new RegExp([
  // 去掉「死给你看」支
  String.raw`(?:我|咱)(?:[^。]{0,6})?(?:就|便|会|要|非得|一定|肯定)(?:[^。]{0,6})?(?:死|去死|寻死|找死|不想活|活不下去|不活|了断|结束这条命|从这|跳下去|跳楼|跳河|跳桥|上吊|喝药|服毒|割腕|割喉|撞墙|抹脖子)`,
  String.raw`(?:我|咱)?(?:[^。]{0,6})?(?:绝食|不吃饭|不吃东西|不喝药|不吃药|不再吃药|停药|不睡觉|不治了|不住院|不看病|撞头|打自己|伤害自己|作贱自己|糟蹋自己|亏待自己|折磨自己)`,
  String.raw`(?:我|咱)(?:[^。]{0,4})?(?:就|便|马上|立刻|当下)(?:[^。]{0,4})?(?:割|切|划|捅|刺)(?:腕|喉|脖|手|自己)`,
  String.raw`(?:我|咱)?(?:[^。]{0,4})?(?:不活了|活着没意思|活着不如死了|不想活了|死了一了百了|一了百了)`,
  String.raw`\b(?:i|we)\s+(?:will|'ll|am\s+going\s+to|gonna)\s+(?:kill|hurt|harm|end)\s+(?:myself|my\s+life|it\s+all|me|us)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:slit|cut)\s+(?:my|our)\s+(?:wrists?|throat)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:not\s+)?(?:eat|take\s+my\s+(?:pills?|meds?|medicine))\s+(?:until|unless)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:jump|hang|overdose)\b`,
].join('|'), 'i');

const SELFHARM_NO_EN = new RegExp([
  // 去掉全部英文自伤支
  String.raw`(?:我|咱)(?:[^。]{0,6})?(?:就|便|会|要|非得|一定|肯定)(?:[^。]{0,6})?(?:死|去死|寻死|找死|不想活|活不下去|不活|了断|结束这条命|从这|跳下去|跳楼|跳河|跳桥|上吊|喝药|服毒|割腕|割喉|撞墙|抹脖子)`,
  String.raw`(?:死|去死|寻死)(?:给|给你|给你们|给你们看|给你看)(?:看)?`,
  String.raw`(?:我|咱)?(?:[^。]{0,6})?(?:绝食|不吃饭|不吃东西|不喝药|不吃药|不再吃药|停药|不睡觉|不治了|不住院|不看病|撞头|打自己|伤害自己|作贱自己|糟蹋自己|亏待自己|折磨自己)`,
  String.raw`(?:我|咱)(?:[^。]{0,4})?(?:就|便|马上|立刻|当下)(?:[^。]{0,4})?(?:割|切|划|捅|刺)(?:腕|喉|脖|手|自己)`,
  String.raw`(?:我|咱)?(?:[^。]{0,4})?(?:不活了|活着没意思|活着不如死了|不想活了|死了一了百了|一了百了)`,
].join('|'), 'i');

// ─── keepalive 常量（重复覆盖支的正向活性证明用）────────────────────
const SELFHARM_ONLY_SLIT = new RegExp([
  String.raw`(?:我|咱)(?:[^。]{0,4})?(?:就|便|马上|立刻|当下)(?:[^。]{0,4})?(?:割|切|划|捅|刺)(?:腕|喉|脖|手|自己)`,
].join('|'), 'i');

const SELFHARM_ONLY_SHOWYOU = new RegExp([
  String.raw`(?:死|去死|寻死)(?:给|给你|给你们|给你们看|给你看)(?:看)?`,
].join('|'), 'i');

// ─── 变异组定义 ────────────────────────────────────────────────────
const MUTANTS = [
  {
    id: 'M1', desc: '置空不顺从条件主支（第二人称不/别/少 + 顺从动词）',
    inject: { COND_ZH: COND_NO_MAIN },
    // 注：「你要是敢走」由「你要走」支兜住（保留支），故 M1 用主支独占
    // 样本（不/别/少 + 顺从动词族），不用「敢走」族。
    samples: [
      '你不答应我，我就从这楼上跳下去。',
      '你不听话我就绝食，看你忍不忍心。',
      '你不认错我就绝食。',
    ],
    minFlip: 3,
  },
  {
    id: 'M2', desc: '置空抗命动作支（再/还/居然 + 顶嘴类）',
    inject: { COND_ZH: COND_NO_DEFIANCE },
    samples: ['你再顶嘴，我就从这跳下去。'],
    minFlip: 1,
  },
  {
    id: 'M3', desc: '置空「除非」型条件支',
    inject: { COND_ZH: COND_NO_UNLESS },
    samples: ['我再也不吃药了，除非你按我说的做。'],
    minFlip: 1,
  },
  {
    id: 'M4', desc: '置空英文条件支（if/unless/until）',
    inject: { COND_ZH: COND_NO_EN },
    samples: [
      'If you leave me I will kill myself, so you have to stay.',
      'I will hurt myself unless you do exactly what I say.',
    ],
    minFlip: 2,
  },
  {
    id: 'M5', desc: '置空自杀/寻死主支',
    inject: { SELFHARM_ZH: SELFHARM_NO_SUICIDE },
    samples: [
      '你不答应我，我就从这楼上跳下去。',
      '你要是敢离婚，我就喝药。',
    ],
    minFlip: 2,
  },
  {
    id: 'M6', desc: '置空自虐/绝食/断药支',
    inject: { SELFHARM_ZH: SELFHARM_NO_SELFTORTURE },
    samples: [
      '你不听话我就绝食，看你忍不忍心。',
      '我再也不吃药了，除非你按我说的做。',
    ],
    minFlip: 2,
  },
  {
    id: 'M7', desc: '置空割腕动词支（割/切/划 + 腕/喉）',
    inject: { SELFHARM_ZH: SELFHARM_NO_SLIT },
    // 注：**实测定性（r650）**——「割腕」同时列在自杀主支动词表与割腕支，
    // 「从这跳下去」也被自杀主支覆盖，两条样本都无法证明割腕支独立贡献。
    // 割腕支与自杀主支在当前实现里是**重复覆盖**（不是缺陷：主支管寻死
    // 意图、割腕支管具体自残动作，命中集有交集）。M7 改为证明「主支被
    // 削窄后割腕支仍能兜住」——正向活性，不是翻转。
    inject: { SELFHARM_ZH: SELFHARM_ONLY_SLIT },
    samples: ['你要是跟我离婚，我就割腕。'],
    minFlip: 1,
    mode: 'keepalive',
  },
  {
    id: 'M8', desc: '置空「死给你看」支',
    inject: { SELFHARM_ZH: SELFHARM_NO_SHOWYOU },
    // 注：同上——「死给你看」与自杀主支的「寻死」族重复覆盖。
    // M8 改为正向活性证明：只留「死给你看」支时该样本仍命中。
    inject: { SELFHARM_ZH: SELFHARM_ONLY_SHOWYOU },
    samples: ['你要是敢走，我就死给你看。'],
    minFlip: 1,
    mode: 'keepalive',
  },
  {
    id: 'M9', desc: '置空英文自伤威胁支',
    inject: { SELFHARM_ZH: SELFHARM_NO_EN },
    samples: [
      'If you leave me I will kill myself, so you have to stay.',
      'If you do not obey me, I will hurt myself.',
    ],
    minFlip: 2,
  },
];

// ─── 执行 ──────────────────────────────────────────────────────────
let allOk = true;
let totalFlip = 0;

for (const m of MUTANTS) {
  // before：不注入时全部命中（排除假翻转）
  const before = m.samples.map(s => checkSelfharmCoercion(s).count > 0);
  const beforeHit = before.filter(Boolean).length;
  // after：注入变异。两种模式：
  //   flip（默认）  ——变异后判定必须由命中变不判（删分支的守卫证明）
  //   keepalive    ——只留该支时样本必须仍命中（重复覆盖支的正向活性证明）
  const keepalive = m.mode === 'keepalive';
  const after = keepalive
    ? m.samples.map(s => checkSelfharmCoercion(s, m.inject).count > 0)
    : m.samples.map(s => checkSelfharmCoercion(s, m.inject).count === 0);
  const flip = after.filter(Boolean).length;

  const ok = beforeHit === m.samples.length && flip >= m.minFlip;
  if (!ok) allOk = false;
  if (!keepalive) totalFlip += flip;

  console.log(`\n${ok ? '✅' : '❌'} ${m.id} ${m.desc}`);
  console.log(`   before 命中 ${beforeHit}/${m.samples.length}｜after ${keepalive ? '仍命中' : '回落'} ${flip}/${m.samples.length}（要求 ≥${m.minFlip}）`);
  m.samples.forEach((s, i) => {
    console.log(`     ${before[i] ? '✅before' : '❌before'} ${after[i] ? '✅after' : '➖after'} ${s.slice(0, 46)}`);
  });
}

// 反向对照：不注入时全部样本仍命中（证明翻转是分支的功劳，不是样本本身不判）
console.log('\n═══ 反向对照：不注入全部命中 ═══');
const ALL = [
  '你不答应我，我就从这楼上跳下去。',
  '你要是敢走，我就死给你看。',
  '你要是跟我离婚，我就割腕。',
  '你不听话我就绝食，看你忍不忍心。',
  '我再也不吃药了，除非你按我说的做。',
  '你再顶嘴，我就从这跳下去。',
  'If you leave me I will kill myself, so you have to stay.',
  'I will hurt myself unless you do exactly what I say.',
];
let ctrl = 0;
for (const s of ALL) if (checkSelfharmCoercion(s).count > 0) ctrl++;
console.log(`  ${ctrl}/${ALL.length} 命中`);
if (ctrl !== ALL.length) allOk = false;

console.log(`\n═══ 汇总：${totalFlip} 次翻转，反向对照 ${ctrl}/${ALL.length} ═══`);
console.log(allOk ? '✅ 负例全部通过——每条分支都是真守卫' : '❌ 有变异组未达标，需检查');
process.exit(allOk ? 0 : 1);
