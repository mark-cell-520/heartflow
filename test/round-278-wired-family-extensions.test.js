'use strict';
// round-278  逻辑谬误家族 wired 维度全新措辞家族扩展（真升级②，live 生效）
//
// 覆盖（探针实测穿透率：appeal_to_tradition 10/10、false_dilemma 9/9、
// no_true_scotsman 10/10；良性 22 条零误伤）：
//   A. appeal_to_tradition（诉诸传统）——t10 千百年来/多少代人时间跨度口语形、
//      t11 牌子口碑年资、s10 别瞎折腾/别乱动压制族、s11 不能丢了传统、
//      s12 老规矩还是得守、c8 还能有错？/不可能有问题封闭反问、c9 照老方子来；
//      EN e11 been around for ages、e12 reputation spans、e13 see no reason
//      to stop、e14 who are we to change、e15 keep X as it has always been、
//      c8 how could it be wrong、e3 扩 do not go fixing
//   B. false_dilemma（虚假两难）——STIGMA_ZH n1 不是A就是B(贬名)、n2 要么A要么
//      跟我作对、n3 不转发就是不爱国；DILEMMA_ZH 中庸就是和稀泥、灰色地带；
//      FORCE_ZH 立场鲜明；STIGMA_EN you do not care about / either a friend
//      or an enemy / or you are against me；EXMID 灰/灰色地带、gray area
//   C. no_true_scotsman（无真正的苏格兰人）——ROLE_NOUNS +104（高手/铁粉/甲方/
//      爷们/老玩家/作者/gamer/foodie/programmer…）、AUTH 标记补有骨气/legit/
//      die-hard、AUTH_CN_STAN/VETERAN/MAN 三个 authenticity 独腿签名、
//      EXCLUSION_EN 扩 do not/don't 一般现在时否定
//
// 纪律（round-266/267 登记断言）：
//   - 维度计数不变、src/index.js 零改动
//   - 探针口径：gate.action !== 'pass' 且 findings 承重该维度 = 命中
//   - 良性：承重即误伤
//   - 负例：注入-删条，删掉本轮每个新模式守卫必须转 miss
const path = require('path');
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
const atMod = require(path.join(__dirname, '..', 'src', 'appeal-tradition.js'));
const fdMod = require(path.join(__dirname, '..', 'src', 'false-dilemma.js'));
const ntsMod = require(path.join(__dirname, '..', 'src', 'no-true-scotsman.js'));

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log('  ✅ ' + label); }
  else { failed++; console.log('  ❌ ' + label); }
}

// ─── 攻击矩阵（与 r278 探针池同口径同样本）────────────────────────
const ATTACKS = [
  // A appeal_to_tradition（ZH）
  ['appeal_to_tradition', '千百年来都是这么过来的，还能有错？'],
  ['appeal_to_tradition', '几千年的传统摆在那儿，不可能有问题。'],
  ['appeal_to_tradition', '老法子传了这么多代人，别瞎折腾。'],
  ['appeal_to_tradition', '古方治大病，咱们不能丢了传统。'],
  ['appeal_to_tradition', '入乡随俗，老规矩还是得守。'],
  ['appeal_to_tradition', '这牌子立了上百年，口碑摆在那儿，照老方子来。'],
  // A appeal_to_tradition（EN）
  ['appeal_to_tradition', 'These customs have been around for centuries; who are we to change them?'],
  ['appeal_to_tradition', 'My family has done it this way for generations, and I see no reason to stop.'],
  ['appeal_to_tradition', 'The old ways kept us fed; do not go fixing what is not broken.'],
  ['appeal_to_tradition', 'Its reputation spans generations; keep the recipe as it has always been.'],
  // B false_dilemma
  ['false_dilemma', '不是朋友，就是敌人，没有第三种关系。'],
  ['false_dilemma', 'You are either a friend or an enemy.'],
  ['false_dilemma', '不转发这条，就是不爱国。'],
  ['false_dilemma', 'If you do not share this, you do not care about the cause.'],
  ['false_dilemma', '这事没有灰色地带，你摆明态度吧。'],
  ['false_dilemma', 'There is no gray area here.'],
  ['false_dilemma', '要么同意我说的每一点，要么就是跟我作对。'],
  ['false_dilemma', 'Agree with everything I said or you are against me.'],
  ['false_dilemma', '中庸就是和稀泥，这个时候要立场鲜明。'],
  // C no_true_scotsman
  ['no_true_scotsman', '真正的高手，从来不向资本低头。'],
  ['no_true_scotsman', '铁粉从来不会只买一张票。'],
  ['no_true_scotsman', '称职的甲方不会随便改需求。'],
  ['no_true_scotsman', '有骨气的作者不会迎合流量。'],
  ['no_true_scotsman', '老玩家从来不充一分钱。'],
  ['no_true_scotsman', '是个爷们就不会食言。'],
  ['no_true_scotsman', 'A real gamer would never pay for skins.'],
  ['no_true_scotsman', 'A legit foodie never eats at chain restaurants.'],
  ['no_true_scotsman', 'Real programmers do not use IDEs.'],
  ['no_true_scotsman', 'A true believer never questions the doctrine.'],
];

console.log('== 新攻击矩阵（' + ATTACKS.length + ' 条）==');
for (const [dim, s] of ATTACKS) {
  const r = gate(s);
  const carries = (r.findings || []).some(f => f.dimension === dim);
  ok(carries && r.gate.action !== 'pass', dim + ' | ' + s.slice(0, 34));
}

// ─── 良性矩阵（承重即误伤）───────────────────────────────────────────
const DIMS = ['appeal_to_tradition', 'false_dilemma', 'no_true_scotsman'];
const BENIGN_SENTENCES = [
  '千百年来都是这么过来的，不过时代变了，有些规矩经评估也该改。',
  '几千年的传统摆在那儿，但数据表明其中不少已经不合时宜。',
  '老法子传了这么多代人，但是否还要沿用，需要实测数据再决定。',
  '古方治大病存疑，临床对照试验才能说明问题。',
  '入乡随俗是礼貌，但违反安全的陋俗应当拒绝。',
  'These customs have been around for centuries; the evidence, however, supports reform.',
  'My family has done it this way for generations, but the data shows a better approach.',
  '这牌子立了上百年，口碑归口碑，产品力还得看检测报告。',
  '他不是朋友也不是敌人，只是工作关系。',
  '转发不转发是个人选择，与爱国没有必然关系。',
  '这事有灰色地带，可以先试点再推广。',
  '他同意方案的大部分，但对第三条有保留，这是正常讨论。',
  'There is a gray area here, so let us lay out the options and their trade-offs.',
  'He is neither a friend nor an enemy, just a former classmate.',
  '中庸不是和稀泥，而是权衡各方证据后的取舍。',
  '真正的高手也有失手的时候，不能以一次成败论英雄。',
  '铁粉一般会买全套周边，但这只是消费偏好，不是定义问题。',
  '称职的甲方按合同变更流程走，这是规范不是驱逐。',
  '有骨气的作者也会为市场写作，这不矛盾。',
  'A real gamer may also enjoy free games; preference is not identity.',
  'Real programmers choose tools by fit, not by ideology.',
  '老玩家不少都充值，这很正常。',
];
console.log('== 良性矩阵（' + BENIGN_SENTENCES.length + ' 条）==');
let fp = 0;
for (const s of BENIGN_SENTENCES) {
  const r = gate(s);
  const carried = DIMS.filter(d => (r.findings || []).some(f => f.dimension === d));
  if (carried.length) { fp++; console.log('  ❌ 误伤 ' + carried.join(',') + ' | ' + s.slice(0, 40)); }
}
ok(fp === 0, '良性零误伤（' + fp + ' 误伤）');

// ─── 登记纪律 ────────────────────────────────────────────────────────
console.log('== 登记纪律 ==');
const A = atMod.__internals(), F = fdMod.__internals(), N = ntsMod.__internals;
ok(Object.keys(A.TRAD_ZH_BRANCHES).some(k => k === 't10_time_span')
  && Object.keys(A.TRAD_ZH_BRANCHES).some(k => k === 't11_brand_age'),
  'TRAD_ZH_BRANCHES 含 r278 新支 t10/t11');
ok(Object.keys(A.CONCL_ZH_BRANCHES).some(k => k === 'c9_obey_old')
  && Object.keys(A.CONCL_EN_BRANCHES).some(k => k === 'c8_how_wrong'),
  'CONCL 分支表含 r278 新支 c9/c8');
ok(N.ROLE_NOUNS_CN.split('|').length >= 90, 'ROLE_NOUNS_CN 角色名词扩容（实测 ' + N.ROLE_NOUNS_CN.split('|').length + '，r278 前 43）');
ok(N.ROLE_NOUNS_EN.split('|').length > 100, 'ROLE_NOUNS_EN 角色名词扩容（实测 ' + N.ROLE_NOUNS_EN.split('|').length + '）');
ok(!!N.AUTH_CN_STAN_RE && !!N.AUTH_CN_VETERAN_RE && !!N.AUTH_CN_MAN_RE,
  'AUTH_CN 三个新独腿签名已接线（stan/veteran/man）');
ok(typeof fdMod.checkFalseDilemma === 'function' && fdMod.checkFalseDilemma.length === 2
  && typeof ntsMod.checkNoTrueScotsman === 'function' && ntsMod.checkNoTrueScotsman.length === 2,
  '两个模块均带 inject 钩子（负例通道）');

// ─── 负例：注入-删条 ─────────────────────────────────────────────────
console.log('== 负例注入（删本轮新规则，守卫须转 miss）==');
const NEVER = /(?!x)x/;
const at = (t, inj) => atMod.checkAppealToTradition(t, inj);
const fd = (t, inj) => fdMod.checkFalseDilemma(t, inj);
const nts = (t, inj) => ntsMod.checkNoTrueScotsman(t, inj);

// A：分支表替换（删条目 = 删模式）
const TB_ZH = (kill) => Object.assign({}, A.TRAD_ZH_BRANCHES, { [kill]: NEVER });
const TB_EN = (kill) => Object.assign({}, A.TRAD_EN_BRANCHES, { [kill]: NEVER });
const SB_ZH = (kill) => Object.assign({}, A.SUPP_ZH_BRANCHES, { [kill]: NEVER });
const SB_EN = (kill) => Object.assign({}, A.SUPP_EN_BRANCHES, { [kill]: NEVER });
const CB_ZH = (kill) => Object.assign({}, A.CONCL_ZH_BRANCHES, { [kill]: NEVER });
const CB_EN = (kill) => Object.assign({}, A.CONCL_EN_BRANCHES, { [kill]: NEVER });

// A：e3 旧版（无 go fixing 形，按源码字符串复原）
const E3_OLD = new RegExp(
  A.SUPP_EN_BRANCHES.e3_dont_fix.source.replace('(?:go )?fix(?:ing)?', 'fix'), 'i');

// B：旧版常量（r278 前形态，按本轮补丁前源码复原）
const ROLE_NOUNS_CN_OLD = '人|者|粉丝|专家|朋友|兄弟|男人|女人|父亲|母亲|爸爸|妈妈|父母|孩子|男生|女生|领导|学生|设计师|艺术家|球员|歌手|演员|工程师|程序员|医生|律师|老师|作家|球迷|爱好者|消费者|员工|同事|伙伴|伴侣|爱人|管理者|负责人|专业人士|技术人员|同行|内行|大佬|极客';
const ROLE_NOUNS_EN_OLD = 'fan|fans|expert|experts|friend|friends|partner|partners|leader|leaders|manager|artist|artists|designer|designers|professional|professionals|parent|parents|mother|father|player|players|engineer|developer|colleague|colleagues|christian|muslim|scotsman|scot|patriot|man|woman|boy|girl|musician|believer|member|artist';
const AUTH_CN_ROLE_OLD = new RegExp(
  '(真正|真心|合格|称职|敬业|忠诚|孝顺|靠谱|懂事|有格局|吃得苦|想学好|想改|上进|有良心|有自尊)'
  + '[^，。；！？\\n]{0,10}(' + ROLE_NOUNS_CN_OLD + ')');
const AUTH_EN_ROLE_OLD = new RegExp(
  '\\b(true|truly|real|really|genuine|genuinely|proper|properly|legitimate)\\s+(\\w+\\s+)?('
  + ROLE_NOUNS_EN_OLD + ')\\b', 'i');
const EXCLUSION_EN_OLD = new RegExp(
  "\\b(would never|would not|wouldn['’]?t|never|isn['’]?t a real|couldn['’]?t be a|can['’]?t be a|not a true|no real)\\b", 'i');

// B：false_dilemma 旧版常量（删本轮新 alternative；连带吃掉一个 |，防止空 alternative 恒真）。
// 注意：n1/n2 的逗号容差在源文件中是 (?:，|,)? / 无逗号组，n3 是 [，,]?——按实际源码形态复原。
const STIGMA_ZH_N1 = '(?:不是|算不上|不算|绝非)(?:[^，。？！；\\n]{0,10}?)(?:，|,)?(?:就是|便是|即|等于)(?:[^，。？！；\\n]{0,12}?)(?:敌人|仇人|陌路|对头|叛徒|奸细|间谍|坏人|恶人|人渣|垃圾|废物|走狗|卖国贼)';
const STIGMA_ZH_N2 = '(?:要么|或者|再?不然)(?:[^，。？！；\\n]{0,30}?)(?:要么|或者|就是|便是)(?:[^，。？！；\\n]{0,12}?)(?:作对|对立|对抗|过不去|对着干|唱反调|背叛|反对我|反对我们)';
const STIGMA_ZH_N3 = '(?:不|没)(?:转发|分享|点赞|转评|声援|买|用|看|听)(?:[^，。？！；\\n]{0,12}?)[，,]?(?:就是|便是|等于|意味着)(?:[^，。？！；\\n]{0,15}?)(?:不爱国|不忠|不孝|冷血|没良心|无心|卖国|叛徒|走狗|别有用心|居心不良)';
const DILEMMA_ZH_MID = '(?:中庸|折中|调和|中间|灰色)(?:就是|等于|无非是|不过是)(?:和稀泥|骑墙|墙头草|两头讨好|各打五十大板|逃避|投降)';
const FORCE_ZH_STANCE = '(?:要|必须|应当|就得|需要)(?:立场)?(?:鲜明|坚定|明确|站队|选边站)';
const dropAlt = (re, alt) => {
  let s = re.source;
  if (s.indexOf('|' + alt) !== -1) s = s.replace('|' + alt, '');
  else if (s.indexOf(alt + '|') !== -1) s = s.replace(alt + '|', '');
  else s = s.replace(alt, '');
  return new RegExp(s, re.flags);
};
const STIGMA_EN_OLD = new RegExp(
  "\\b(?:if\\s+you\\s+(?:don'?t|do\\s+not|aren'?t|are\\s+not)\\s+[^.!?;]{2,50}?,\\s*(?:then\\s+)?(?:you'?re|you\\s+are)\\s+(?:not\\s+)?(?:against|opposing|with\\s+them|against\\s+us|the\\s+enemy|part\\s+of\\s+the\\s+problem|no\\s+better|just\\s+as\\s+bad|disloyal|untrustworthy))\\b"
  + "|\\b(?:anyone|anybody|no\\s+one)\\s+who\\s+(?:doesn'?t|does\\s+not|isn'?t|is\\s+not)\\s+[^.!?;]{2,50}?\\s+(?:is|are)\\s+(?:not\\s+)?(?:against|the\\s+enemy|part\\s+of\\s+the\\s+problem|no\\s+better|just\\s+as\\s+bad|disloyal)\\b"
  + "|\\b(?:you'?re|you\\s+are)\\s+(?:either\\s+)?(?:with\\s+us|for\\s+us)\\s+or\\s+(?:you'?re\\s+)?(?:against\\s+us|the\\s+enemy|part\\s+of\\s+the\\s+problem)\\b"
  + "|\\bunconditional\\s+(?:support|compliance|obedience)\\b", 'i');

const INJ = [
  // A appeal_to_tradition
  { label: 't10_time_span 千百年来/多少代人', run: at, text: '千百年来都是这么过来的，还能有错？', inject: { TRAD_ZH_BRANCHES: TB_ZH('t10_time_span') } },
  { label: 't11_brand_age 牌子口碑年资', run: at, text: '这牌子立了上百年，口碑摆在那儿，照老方子来。', inject: { TRAD_ZH_BRANCHES: TB_ZH('t11_brand_age') } },
  { label: 's10_dont_mess 别乱动压制族', run: at, text: '老法子传了这么多代人，别乱动它。', inject: { SUPP_ZH_BRANCHES: SB_ZH('s10_dont_mess') } },
  { label: 's11_cannot_lose 不能丢了传统', run: at, text: '古方治大病，咱们不能丢了传统。', inject: { SUPP_ZH_BRANCHES: SB_ZH('s11_cannot_lose') } },
  { label: 's12_still_keep 老规矩还是得守', run: at, text: '入乡随俗，老规矩还是得守。', inject: { SUPP_ZH_BRANCHES: SB_ZH('s12_still_keep') } },
  { label: 'c8_cannot_be_wrong 还能有错？', run: at, text: '几千年的传统摆在那儿，不可能有问题。', inject: { CONCL_ZH_BRANCHES: CB_ZH('c8_cannot_be_wrong') } },
  { label: 'c9_obey_old 照老方子来', run: at, text: '这牌子立了上百年，口碑摆在那儿，照老方子来。', inject: { CONCL_ZH_BRANCHES: CB_ZH('c9_obey_old') } },
  { label: 'e11_been_around been around for ages', run: at, text: 'The brand has been around for ages, so its methods must be right.', inject: { TRAD_EN_BRANCHES: TB_EN('e11_been_around') } },
  { label: 'e12_reputation reputation spans', run: at, text: 'Its reputation spans generations; keep the recipe as it has always been.', inject: { TRAD_EN_BRANCHES: TB_EN('e12_reputation') } },
  { label: 'e13_no_reason see no reason to stop', run: at, text: 'My family has done it this way for generations, and I see no reason to stop.', inject: { SUPP_EN_BRANCHES: SB_EN('e13_no_reason') } },
  { label: 'e14_who_are_we who are we to change', run: at, text: 'These customs have been around for centuries; who are we to change them?', inject: { SUPP_EN_BRANCHES: SB_EN('e14_who_are_we') } },
  { label: 'e15_keep_as_always keep as always been', run: at, text: 'Its reputation spans generations; keep the recipe as it has always been.', inject: { SUPP_EN_BRANCHES: SB_EN('e15_keep_as_always') } },
  { label: 'e3_dont_fix 扩 do not go fixing', run: at, text: 'The old ways kept us fed; do not go fixing what is not broken.', inject: { SUPP_EN_BRANCHES: Object.assign({}, A.SUPP_EN_BRANCHES, { e3_dont_fix: E3_OLD }) } },
  // B false_dilemma
  { label: 'STIGMA_ZH n1 不是A就是B(贬名)', run: fd, text: '不是朋友，就是敌人，没有第三种关系。', inject: { STIGMA_ZH: dropAlt(F.STIGMA_ZH, STIGMA_ZH_N1) } },
  { label: 'STIGMA_ZH n2 要么A要么跟我作对', run: fd, text: '要么同意我说的每一点，要么就是跟我作对。', inject: { STIGMA_ZH: dropAlt(F.STIGMA_ZH, STIGMA_ZH_N2) } },
  { label: 'STIGMA_ZH n3 不转发就是不爱国', run: fd, text: '不转发这条，就是不爱国。', inject: { STIGMA_ZH: dropAlt(F.STIGMA_ZH, STIGMA_ZH_N3) } },
  { label: 'DILEMMA_ZH 中庸就是和稀泥', run: fd, text: '中庸就是和稀泥，这个时候要立场鲜明。', inject: { DILEMMA_ZH: dropAlt(F.DILEMMA_ZH, DILEMMA_ZH_MID) } },
  { label: 'FORCE_ZH 立场鲜明', run: fd, text: '中庸就是和稀泥，这个时候要立场鲜明。', inject: { FORCE_ZH: dropAlt(F.FORCE_ZH, FORCE_ZH_STANCE) } },
  { label: 'EXMID_ZH 灰色地带', run: fd, text: '这事没有灰色地带，你摆明态度吧。', inject: { EXMID_ZH: dropAlt(F.EXMID_ZH, '灰色') } },
  { label: 'STIGMA_EN you do not care about', run: fd, text: 'If you do not share this, you do not care about the cause.', inject: { STIGMA_EN: STIGMA_EN_OLD } },
  { label: 'STIGMA_EN either a friend or an enemy', run: fd, text: 'You are either a friend or an enemy.', inject: { STIGMA_EN: STIGMA_EN_OLD } },
  { label: 'STIGMA_EN or you are against me', run: fd, text: 'Agree with everything I said or you are against me.', inject: { STIGMA_EN: STIGMA_EN_OLD } },
  { label: 'EXMID_EN gray area', run: fd, text: 'There is no gray area here.', inject: { EXMID_EN: dropAlt(F.EXMID_EN, "(?:gray|grey)\\s+area") } },
  // C no_true_scotsman
  { label: 'AUTH_CN_ROLE_RE 新角色名词（高手）', run: nts, text: '真正的高手，从来不向资本低头。', inject: { AUTH_CN_ROLE_RE: AUTH_CN_ROLE_OLD } },
  { label: 'AUTH_CN_ROLE_RE 新角色名词（甲方）', run: nts, text: '称职的甲方不会随便改需求。', inject: { AUTH_CN_ROLE_RE: AUTH_CN_ROLE_OLD } },
  { label: 'AUTH_CN_ROLE_RE 新标记×新名词（有骨气的作者）', run: nts, text: '有骨气的作者不会迎合流量。', inject: { AUTH_CN_ROLE_RE: AUTH_CN_ROLE_OLD } },
  { label: 'AUTH_CN_STAN_RE 铁粉', run: nts, text: '铁粉从来不会只买一张票。', inject: { AUTH_CN_STAN_RE: NEVER } },
  { label: 'AUTH_CN_VETERAN_RE 老玩家', run: nts, text: '老玩家从来不充一分钱。', inject: { AUTH_CN_VETERAN_RE: NEVER } },
  { label: 'AUTH_CN_MAN_RE 是个爷们', run: nts, text: '是个爷们就不会食言。', inject: { AUTH_CN_MAN_RE: NEVER } },
  { label: 'AUTH_EN_ROLE_RE 新角色名词（gamer/foodie）', run: nts, text: 'A real gamer would never pay for skins.', inject: { AUTH_EN_ROLE_RE: AUTH_EN_ROLE_OLD } },
  { label: 'AUTH_EN_ROLE_RE 新标记 legit', run: nts, text: 'A legit foodie never eats at chain restaurants.', inject: { AUTH_EN_ROLE_RE: AUTH_EN_ROLE_OLD } },
  { label: 'EXCLUSION_EN_RE do not 一般现在时否定', run: nts, text: 'Real programmers do not use IDEs.', inject: { EXCLUSION_EN_RE: EXCLUSION_EN_OLD } },
];
let injRed = 0;
for (const c of INJ) {
  let before = false, after = true;
  try {
    before = c.run(c.text).hit === true;
    after = c.run(c.text, c.inject).hit === true;
  } catch (e) {
    ok(false, '注入删条变红: ' + c.label + '（异常 ' + e.message + '）');
    continue;
  }
  ok(before && !after, '注入删条变红: ' + c.label);
  if (before && !after) injRed++;
}

console.log('\nround-278-wired-family-extensions: ' + passed + ' passed / ' + failed
  + ' failed（注入 ' + INJ.length + ' 个：' + injRed + ' 个变红，' + (INJ.length - injRed) + ' 个未变红）');
console.log('cleanup: none (pure in-memory checks)');
if (failed > 0) process.exit(1);
