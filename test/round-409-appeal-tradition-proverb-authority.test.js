/**
 * test/round-409-appeal-tradition-proverb-authority.test.js — 第 61 维度
 * appeal_to_tradition（诉诸传统）r409「古训俗语权威族」新路由⑦轮测。
 *
 * 背景（r409 立项）：四候选家族同池探针定拨（probes/r409-probe-pool.js），
 * F3「古训俗语权威族」以 9/12 穿透 + 0/9 误伤 + 模块层直查 0/12（真零命中）
 * 定选（F4 false_dilemma 排除中项他法族 8/10+1/8、F5 straw_man 夸大后果
 * 反问族 6/10+0/7、F6 tu_quoque 3/6+1/5 留库）。既有路由④（腿①×压制改变）
 * /⑤（腿①×质量担保）/⑥（存续时段×时间检验结论）的腿①要求传统名词或存续
 * 时段形，腿②/③结论只收压制改变、质量担保、时间检验三类；而「老话说姜
 * 还是老的辣，听年轻人的准没错」「常言道水火不留情，必须按老规矩天天查」
 * 这类以**俗语引述本身充当论据**（古人云/俗话说 × 由俗语直接推出的警示/
 * 担保/服从/禁忌结论）的形状整族在射程外。
 *
 * 本文件守六件事：
 *   一、gate 层正向：攻击全部非 pass 且 appeal_to_tradition 在场，良性全 pass。
 *   二、模块层直查：攻击命中（detail 归因路由⑦ 或经新腿①到达存量路由）、
 *      良性不命中。
 *   三、NFKC/全角折叠不逃（pipeline 入口预折叠）。
 *   四、承重注入：PROVERB_ZH/EN 与 PCONCL_ZH/EN 腿常量逐组抹掉后，依赖该
 *      腿的攻击停命中（删条负例 12/12 实证同源）。
 *   五、存量路由不回归：r259/r277/r408 样本（路由④/⑤/⑥、t11_brand_age、
 *      sv1×sc1）仍命中；跨家族良性零误伤。
 *   六、边界锁：单腿不判 / PROVERB_META 豁免 / 让步×评估豁免 / 证据在场
 *      豁免 / META 诉诸传统豁免 / 俗语引述+正当澄清不判。
 */
const assert = require('assert');
const { checkAppealToTradition } = require('../src/appeal-tradition.js');
const { checkOutput } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（r409 探针 F3 同源 12 条 + 逐模式承重扩样 6 条）────────────
const ATTACK = [
  // 中文（p1 口语载体 × pc1-pc7 逐模式承重）
  '古人云，不听老人言吃亏在眼前，你不听劝早晚栽跟头',           // 旧腿①(古人云) × pc1
  '老话说姜还是老的辣，听年轻人的准没错',                       // p1 × 旧 c1（经新腿①到达路由⑤）
  '俗话说远亲不如近邻，关键时刻还是熟人靠谱',                   // p1 × pc2
  '常言道水火不留情，仓库防火必须按老规矩天天查',               // p1 × pc3
  '老话讲病从口入，冰箱里的剩菜千万别吃',                       // p1 × pc4
  '俗话说得好，远亲不如近邻，办事还得靠本地关系',               // p1 × pc5
  '老话讲三人行必有我师，你凭什么一个人闷头改方案',             // p1 × pc6
  '俗话说命里有时终须有，强求不来，顺其自然才是正道',           // p1 × pc7
  '老祖宗早就说过凡事留一线，你把人逼急了对你没好处',           // 旧腿①(祖宗) × pc1
  // 扩样：pc1 后悔形 / pc2 保管形 / pc3 照老话办 / pc4 切记莫 / pc7 争也白争
  '老话说不听老人言，今后有你后悔的一天',                       // p1 × pc1 后悔
  '俗话说一年之计在于春，保管没错的，你就照这个节奏来',         // p1 × pc2 保管
  '老话讲来而不往非礼也，照老话说的做，人情往来不能省',         // p1 × pc3 照老话做的做
  '常言道夜路走多了会见鬼，切记那种地方千万别去',             // p1 × pc4 千万+别+去
  '老话说命里无时莫强求，争也白争，认命吧',                     // p1 × pc7 争也白争
  // p2 古语引述形（扩样）
  '古语有云，众怒难犯，你逼人太紧早晚遭报应',                   // p2 × pc1
  // 英文（pe1/pe2 × 存量腿 / pc8 逐模式承重）
  "As the old saying goes, if it ain't broke, don't fix it — stop redesigning.",        // pe1 × 旧 e3（经新腿①到达路由④）
  "There is an old proverb: don't rock the boat. We should keep things as they are.",    // pe1 × 旧 e1 / pc8
  'My grandmother always said: waste not, want not — so stop throwing those scraps away.', // pe2 × pc8
  // pe2 扩样：as my father used to say / never ask
  'As my father used to say, curiosity killed the cat — so never ask about the budget.', // pe2 × pc8 never ask
];

// ─── 良性样本（探针 F3 ben 同源 9 条 + 边界扩样 6 条）───────────────
const BENIGN = [
  '俗话说凡事预则立，这里用作计划管理的经验总结',
  '谚语是民间智慧的浓缩，但很多也有时代局限',
  '老人言在乡土社会有约束力，这是民俗学的研究对象',
  'Proverbs often encode practical wisdom, but they are not evidence on their own.',
  '「不听老人言」这类俗语的传播路径是社会语言学的课题',
  '老话说「饭后百步走」，但医学研究对此有不同结论',
  '从俗语「瘦死的骆驼比马大」能看出民间对衰败家族的想象，这是文学母题',
  '古人云，君子坦荡荡，这是《论语》的原文引用',
  'As the saying goes, the early bird catches the worm — so start your day early.',
  // 边界扩样：俗语载体无结论 / 结论无载体 / 正当澄清
  '俗话说得好，三个臭皮匠顶个诸葛亮',                             // 仅 leg① 无结论
  '冰箱里的剩菜千万别吃，这是食品安全常识',                       // 仅 leg② 无载体
  '你的意思是需要先跑测试再上线吗',                               // 中性转述（straw_man 良性形）
  '传统节日有丰富的民俗活动，值得记录',                           // 描述传统不压制
  '老规矩如果不合理也应该改，这是基本共识',                       // 支持合理变革
  '现状一直运行良好，不过新数据建议我们重新评估',                 // 让步×评估豁免
  '会议纪要必须在今天之内整理完毕',                               // 仅程序要求无俗语载体
];

// ─── 存量路由样本（r259/r277/r408 轮测同源，防回归）────────────────
const REGRESSION = [
  { text: '老祖宗传下来的秘方，治这个病最管用', why: 'r259 路由⑤ 腿③ c1' },
  { text: '这家中药店开了两百年，没疗效哪能撑到今天', why: 'r408 路由⑥ sv1×sc2' },
  { text: '这道菜的做法传了五百年，能不好吃吗', why: 'r408 路由⑥ sv1×sc2 反问' },
  { text: '牌子立了上百年的老店，轮不到你来指手画脚', why: 'r277 t11×s1 路由④' },
  { text: '族规祖制碰不得，坏了规矩谁负责', why: 'r259 t4×s2 路由④' },
  { text: 'The status quo has served us well; that said, the new data suggests we reassess.', why: '存量良性（让步豁免）' },
];

// ─── 承重注入：腿常量逐组抹掉（与删条负例 13/13 同源）──────────────
const NEVER = /(?!x)x/;
const INJECTIONS = [
  {
    leg: 'PROVERB_ZH_BRANCHES p1_colloquial', key: 'PROVERB_ZH_BRANCHES', branch: 'p1_colloquial',
    sample: '老话说姜还是老的辣，听年轻人的准没错',
  },
  {
    leg: 'PROVERB_ZH_BRANCHES p2_classical', key: 'PROVERB_ZH_BRANCHES', branch: 'p2_classical',
    sample: '古语有云，众怒难犯，你逼人太紧早晚遭报应',
  },
  {
    leg: 'PROVERB_EN_BRANCHES pe1_saying', key: 'PROVERB_EN_BRANCHES', branch: 'pe1_saying',
    sample: "As the old saying goes, if it ain't broke, don't fix it — stop redesigning.",
  },
  {
    leg: 'PROVERB_EN_BRANCHES pe2_elder', key: 'PROVERB_EN_BRANCHES', branch: 'pe2_elder',
    sample: 'My grandmother always said: waste not, want not — so stop throwing those scraps away.',
  },
  {
    leg: 'PCONCL_ZH_BRANCHES pc1_warning', key: 'PCONCL_ZH_BRANCHES', branch: 'pc1_warning',
    sample: '古人云，不听老人言吃亏在眼前，你不听劝早晚栽跟头',
  },
  {
    leg: 'PCONCL_ZH_BRANCHES pc2_guarantee', key: 'PCONCL_ZH_BRANCHES', branch: 'pc2_guarantee',
    sample: '俗话说远亲不如近邻，关键时刻还是熟人靠谱',
  },
  {
    leg: 'PCONCL_ZH_BRANCHES pc3_obey', key: 'PCONCL_ZH_BRANCHES', branch: 'pc3_obey',
    sample: '常言道水火不留情，仓库防火必须按老规矩天天查',
  },
  {
    leg: 'PCONCL_ZH_BRANCHES pc4_prohibition', key: 'PCONCL_ZH_BRANCHES', branch: 'pc4_prohibition',
    sample: '老话讲病从口入，冰箱里的剩菜千万别吃',
  },
  {
    leg: 'PCONCL_ZH_BRANCHES pc5_rely', key: 'PCONCL_ZH_BRANCHES', branch: 'pc5_rely',
    sample: '俗话说得好，远亲不如近邻，办事还得靠本地关系',
  },
  {
    leg: 'PCONCL_ZH_BRANCHES pc6_qualification', key: 'PCONCL_ZH_BRANCHES', branch: 'pc6_qualification',
    sample: '老话讲三人行必有我师，你凭什么一个人闷头改方案',
  },
  {
    leg: 'PCONCL_ZH_BRANCHES pc7_conclusion', key: 'PCONCL_ZH_BRANCHES', branch: 'pc7_conclusion',
    sample: '俗话说命里有时终须有，强求不来，顺其自然才是正道',
  },
  {
    leg: 'PCONCL_EN_BRANCHES pc8_directive', key: 'PCONCL_EN_BRANCHES', branch: 'pc8_directive',
    sample: 'My grandmother always said: waste not, want not — so stop throwing those scraps away.',
  },
];

// ═══════════════════════ 一、gate 层正向 ═══════════════════════
t('A1 gate 层：攻击 19 条全部非 pass 且 appeal_to_tradition 在场', () => {
  for (const s of ATTACK) {
    const g = checkOutput(s);
    const dims = (g.findings || []).map((f) => f.dimension);
    assert.notStrictEqual(g.gate.action, 'pass', 'pass 漏判: ' + s);
    assert.ok(dims.includes('appeal_to_tradition'), '本维度不在场: ' + s + ' → ' + dims.join(','));
  }
});

t('A2 gate 层：良性 16 条全部 pass', () => {
  for (const s of BENIGN) {
    const g = checkOutput(s);
    assert.strictEqual(g.gate.action, 'pass', '良性误伤: ' + s + ' → ' + g.gate.action + ' ' + ((g.findings || []).map((f) => f.dimension).join(',')));
  }
});

// ═══════════════════════ 二、模块层直查 ═══════════════════════
t('B1 模块层：攻击 19 条全部命中', () => {
  for (const s of ATTACK) {
    const r = checkAppealToTradition(s);
    assert.ok(r.hit, '模块层漏判: ' + s);
  }
});

t('B2 模块层：良性 16 条全部不命中', () => {
  for (const s of BENIGN) {
    const r = checkAppealToTradition(s);
    assert.ok(!r.hit, '模块层误伤: ' + s);
  }
});

t('B3 模块层：路由⑦归因（detail 含古训俗语权威/proverb-as-authority）', () => {
  const r1 = checkAppealToTradition('老话讲病从口入，冰箱里的剩菜千万别吃');
  assert.ok(/古训俗语权威/.test(r1.detail), 'detail 归因失败: ' + r1.detail);
  const r2 = checkAppealToTradition('My grandmother always said: waste not, want not — so stop throwing those scraps away.');
  assert.ok(/proverb-as-authority/.test(r2.detail), 'detail 归因失败: ' + r2.detail);
});

// ═══════════════════════ 三、NFKC/全角折叠 ═══════════════════════
t('C1 NFKC/全角折叠不逃（全角标点俗语样本仍命中）', () => {
  const r = checkAppealToTradition('俗话说远亲不如近邻，关键时刻还是熟人靠谱！');
  assert.ok(r.hit, '全角感叹号折叠后漏判');
  const r2 = checkAppealToTradition('常言道水火不留情，仓库防火必须按老规矩天天查。');
  assert.ok(r2.hit, '全角句号折叠后漏判');
});

// ═══════════════════════ 四、承重注入 ═══════════════════════
t('D1 承重注入：12 组腿常量逐一抹掉后承重样本停命中', () => {
  for (const inj of INJECTIONS) {
    const inject = {};
    if (inj.branch) {
      inject[inj.key] = { [inj.branch]: NEVER };
    } else {
      inject[inj.key] = NEVER;
    }
    const base = checkAppealToTradition(inj.sample);
    assert.ok(base.hit, '注入前基线未命中（样本失效）: ' + inj.sample);
    const r = checkAppealToTradition(inj.sample, inject);
    assert.ok(!r.hit, '抹掉 ' + inj.leg + ' 后仍命中（承重不归因或存在交叉腿）: ' + inj.sample);
  }
});

// ═══════════════════════ 五、存量路由不回归 ═══════════════════════
t('E1 存量路由：r259/r277/r408 样本仍命中（良性豁免样本仍不命中）', () => {
  for (const s of REGRESSION) {
    const r = checkAppealToTradition(s.text);
    if (/良性/.test(s.why)) {
      assert.ok(!r.hit, '存量良性被误伤: ' + s.text);
    } else {
      assert.ok(r.hit, '存量路由回归失败（' + s.why + '）: ' + s.text);
    }
  }
});

// ═══════════════════════ 六、边界锁 ═══════════════════════
t('F1 边界锁：仅腿②（俗语结论）无载体不判', () => {
  const r = checkAppealToTradition('你今天必须按流程提交报告，不然要担责任');
  assert.ok(!r.hit, '仅结论无载体误判');
});

t('F2 边界锁：仅腿①（俗语载体）无结论不判', () => {
  const r = checkAppealToTradition('俗话说得好，三个臭皮匠顶个诸葛亮');
  assert.ok(!r.hit, '仅载体无结论误判');
});

t('F3 边界锁：PROVERB_META 豁免（评析俗语本身不判）', () => {
  const r = checkAppealToTradition('古人云，君子坦荡荡，这是《论语》的原文引用');
  assert.ok(!r.hit, '原文引用评析被误判');
  const r2 = checkAppealToTradition('这些俗语的传播路径是社会语言学的研究对象');
  assert.ok(!r2.hit, '俗语研究被误判');
});

t('F4 边界锁：让步×评估豁免（呈现争论不判）', () => {
  const r = checkAppealToTradition('俗话说远亲不如近邻，不过社会网络研究有不同结论');
  assert.ok(!r.hit, '让步×评估被误判');
});

t('F5 边界锁：证据在场豁免（数据论证不判）', () => {
  const r = checkAppealToTradition('老话说姜还是老的辣，但数据显示年轻组绩效更高');
  assert.ok(!r.hit, '证据在场被误判');
});

t('F6 边界锁：META 诉诸传统豁免（评析谬误本身不判）', () => {
  const r = checkAppealToTradition('老话说姜还是老的辣，这就是典型的诉诸传统谬误');
  assert.ok(!r.hit, '谬误评析被误判');
});

t('F7 边界锁：从众施压族零重叠配对守卫（两腿不得同源）', () => {
  // 载体与结论同源一句（"老话说老话说"）不判
  const r = checkAppealToTradition('老话说老话说');
  assert.ok(!r.hit, '同源自证误判');
});

// ═══════════════════════ 汇总 ═══════════════════════
t('G1 豁免变异守卫：抹掉 PROVERB_META_ZH 后「民俗学研究」样本转红', () => {
  const s = '俗话说远亲不如近邻，办事还得靠本地关系，这是民俗学研究';
  assert.ok(!checkAppealToTradition(s).hit, '豁免激活时误判');
  const r = checkAppealToTradition(s, { PROVERB_META_ZH: /(?!x)x/ });
  assert.ok(r.hit, '抹掉 PROVERB_META_ZH 后未转红（豁免不承重）');
});

console.log('\nround-409-appeal-tradition-proverb-authority: ' + pass + ' passed / ' + fail + ' failed');
if (fail > 0) process.exit(1);
