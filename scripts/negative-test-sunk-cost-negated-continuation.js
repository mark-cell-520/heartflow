/**
 * scripts/negative-test-sunk-cost-negated-continuation.js
 *
 * [r645] 负例脚本：证明本轮给 sunk_cost_coercion 补的两组新分支
 * （完成态投入宾语 / 口语退出动词）是**真守卫**——置空任一组，
 * 该族样本必须从命中翻成不判。
 *
 * 九组变异，逐组打印 before/after：
 *   M1 置空完成态宾语分支（INVESTED_ZH 新分支）→ 族 A 中文回落
 *   M2 置空筹备时段分支                          → 筹备样本回落
 *   M3 置空陪伴过程分支                          → 陪伴样本回落
 *   M4 置空口语退出动词分支（SUNK_ZH 新分支）    → 族 B 中文回落
 *   M5 置空「等于把钱」分支                      → 扔水里样本回落
 *   M6 置空「算什么」分支                        → 陪伴算什么回落
 *   M7 置空英文完成态分支（INVESTED_EN 新分支）  → 英文两条回落
 *   M8 置空英文退出动词扩充（cancelling/gone）   → cancelling 样本回落
 *   M9 置空 goes to waste 分支                   → All that work 样本回落
 * 每组都必须「变异后判定由命中变不判」才算守卫有效。
 */
'use strict';

const REPO = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { checkSunkCostCoercion } = require(REPO + '/src/sunk-cost-coercion.js');

// ─── 旧分支常量（本轮新分支上线前的形态）────────────────────────────
const INV_ZH_OLD = new RegExp([
  String.raw`[已花投付耗耗砸熬攒][^。]{0,6}(?:这么|那么|太多|这么多|大量|无数|多年|这么久|这么长|[0-9一二两三四五六七八九十百万千万]+\s*(?:年|个月|月|天|小时|万|块|元|千))`,
  String.raw`(?:钱|学费|资金|成本|精力|心血|时间|代价|本钱|投入|付出|努力|资源|预算)(?:都|已经|早就|已)?(?:[^。]{0,4})(?:交了|花了|投了|付了|砸了|出了|付出了|砸进去|投进去)`,
  String.raw`[已花投付耗耗砸熬攒](?:了)?(?:这么|那么|太多|这么多|大量|无数|多万|成百上千)(?:钱|资金|学费|成本|钱款|本金)`,
  String.raw`(?:来都来了|钱都交了|都走到(?:了)?这(?:一|那)?步|已经走到(?:了)?(?:这|那)(?:一)?步|都已经开始了|既已开始|开(?:了)?个头|已经开了头|上了这条船|箭已离弦)`,
  String.raw`(?:等|熬|坚持|耗|撑|走|跑|干|做)[^。]{0,6}(?:了)?[^。]{0,4}(?:这么|那么)?(?:久|长时间|这么多年|这么长|[0-9一二两三四五六七八九十]+\s*(?:年|个月|月|天))`,
].join('|'));

// 只保留完成态宾语分支（用于 M2-M3：证明其它新分支也各自有贡献）
const INV_ZH_ONLY_DONE = new RegExp([
  String.raw`(?:机票|车票|门票|船票|电影票|票据|首付|定金|订金|押金|房贷|月供|奖牌|奖项|奖杯|冠军|金牌|名次|排名|论文|稿件|稿子|书稿|剧本|婚宴|婚礼|酒席|请柬|请帖|彩礼|嫁妆|婚戒|婚房|婚|亲事|喜事|设备|产线|展位|展会|发布会|展览|账号|课程|班课|会员|套餐|专栏|合同|协议|契约|订单|标书|摊子|流程|数据|demo|样品|模具|厂房|门店|铺面|牌照|资质|许可|名额|床位|档期|场地|服务器|域名|执照|转会费|积蓄|本金|本钱|聘礼|酒水|场地费|材料|配件|库存|货)(?:都|也|已经|早已|早就|全|均|已)?(?:[^。]{0,3})?(?:买|购|订|付|批|办|签|支|申|缴|投|发|寄|印|排|定|调试|部署|开通|注册|报名|提交|发布|审批|审|筹备|筹措|筹划|布置|搭建|跑通|打通|组织|安排|确认|立项|开建|开工|投产|夺|拿|花|砸|卖|筹|操办|张罗|订好|买好|付好|签好|办好)(?:了|好|完|定|出去|下来|到手|通|妥|定稿|光|起来)`,
].join('|'));

const SUNK_ZH_OLD = new RegExp([
  String.raw`(?:退出|放弃|停止|收手|停下|终止|不干|回头|撤出|现在走|这时候走|不做)(?:[^。]{0,8})?(?:不就|那不就|不就等于|等于|就是|意味着)?[^。]{0,8}(?:白花|白费|白干|白交|白给|全废|作废|归零|打水漂|扔进水里|白搭|徒劳|泡汤|白跑|白忙|浪费)`,
  String.raw`(?:太|很|真|挺)?(?:可惜|惋惜|遗憾|浪费)[^。]{0,6}(?:了|啊|呀)?`,
  String.raw`(?:不然|否则|要不|要不然)[^。]{0,10}(?:这趟|这次|这就|全都|就)[^。]{0,6}(?:白跑|白来|白费|浪费|白搭|白忙)`,
  String.raw`(?:再|接着|继续)(?:[^。]{0,4})?(?:加把劲|坚持|撑|熬|等)[^。]{0,6}(?:一下|会儿|就好|就行了)?`,
  String.raw`(?:前面|之前|以前|此前|前期)(?:的)?(?:全部|全都|一切|所有|努力|付出|投入)[^。]{0,4}(?:全废|白费|作废|归零|泡汤|打水漂|付之东流|前功尽弃)`,
  String.raw`(?:收手|放弃|停止|退出|停下|终止|撤出|止损|不干了|回头)(?:[^。]{0,10})?(?:就是|等于|意味着|无异于|算是)(?:[^。]{0,8})(?:承认|认下|认)(?:[^。]{0,10})(?:错|误|失败|看走眼|输了|打脸)`,
  String.raw`(?:就|干脆|索性)[^。]{0,6}(?:买了|定下|办了吧|签了吧|来吧|上吧|搞了吧|继续吧|做完吧|走完吧)`,
].join('|'));

const SUNK_ZH_ONLY_COLLOQ = new RegExp([
  String.raw`(?:撂挑子|撂下|撒手|说走就走|半路(?:撤退|撂下|退出)|停更|撤稿|取消|撤掉|换帅|推倒重来|不去|不买|不练|不干|反悔|不参加|不履约|不交付|退出|放弃|停止|收手|停下|终止|撤出|回头|不做)(?:[^。]{0,12})(?:白花|白费|白干|白交|白给|全废|作废|归零|打水漂|扔[^。]{0,3}(?:水里|水漂)|白搭|徒劳|泡汤|白跑|白忙|浪费|白扔|白供|白坐|白熬)`,
].join('|'));

const INV_EN_OLD = new RegExp([
  String.raw`\b(?:already|have|has|had)\s+(?:invested|spent|paid|put|poured|committed|allocated)\b[^.]{0,30}?\b(?:into|in|on)\b`,
  String.raw`\b(?:we|you|i)\s+(?:have|has|had)\s+(?:already\s+)?(?:invested|spent|paid|put|poured|committed|waited|waited for)\b`,
  String.raw`\b(?:have|has|had)\s+(?:waited|been|stuck|worked|put in)\s+(?:for\s+)?[0-9a-z]+\s+(?:years?|months?|days?|hours?)\b`,
  String.raw`\b(?:since|after)\s+(?:you|we)\s+(?:already\s+)?(?:started|began|paid|invested|committed)\b`,
  String.raw`\b(?:come|having come)\s+this\s+far\b`,
  String.raw`\b(?:already|have|has)\s+(?:put|poured)\s+(?:so\s+much|years|time|money|effort)\s+in\b`,
].join('|'), 'i');

const SUNK_EN_OLD = new RegExp([
  String.raw`\b(?:quitting|stopping|giving up|leaving|walking away|backing out)\b[^.]{0,25}?\b(?:waste|all for nothing|for naught|pointless|throw it away|go to waste)\b`,
  String.raw`\bmight\s+as\s+well\b`,
  String.raw`\b(?:too|such a|what a)\s+(?:waste|shame|pity)\b`,
  String.raw`\b(?:otherwise|or else)\b[^.]{0,25}?\b(?:wasted|all for nothing|a waste)\b`,
  String.raw`\ball\s+(?:that|this)\s+(?:effort|work|time|money)\s+(?:will\s+be\s+)?(?:wasted|for nothing)\b`,
  String.raw`\b(?:already|have)\s+(?:come|gone)\s+this\s+far\b[^.]{0,20}?\b(?:might as well|finish|stick with it|see it through)\b`,
  String.raw`\b(?:a\s+few|few|several|couple\s+of|some)\s+more\s+(?:years?|months?|days?|weeks?|hours?)\b[^.]{0,30}?\b(?:will|would|can|could)\s+not\s+(?:hurt|matter|make a difference|change anything)\b`,
  String.raw`\b(?:will|would|can|could)\s+not\s+(?:hurt|matter|make a difference|change anything)\b`,
].join('|'), 'i');

// ─── 变异组定义 ────────────────────────────────────────────────────
const MUTANTS = [
  {
    id: 'M1', desc: '置空完成态宾语分支（INVESTED_ZH 新分支整条）',
    inject: { INVESTED_ZH: INV_ZH_OLD },
    samples: [
      '机票都买了，酒店也订了，现在不去就等于把钱扔水里。',
      '婚宴订好了，请柬也发了，现在取消，之前忙的这些全都白忙了。',
    ],
    minFlip: 2,
  },
  {
    id: 'M2', desc: '只留完成态宾语分支 → 筹备时段样本回落',
    inject: { INVESTED_ZH: INV_ZH_ONLY_DONE },
    samples: ['筹备了八个月的展会，临开展撤掉，前期投入全部归零。'],
    minFlip: 1,
  },
  {
    id: 'M3', desc: '只留完成态宾语分支 → 陪伴过程样本回落',
    inject: { INVESTED_ZH: INV_ZH_ONLY_DONE },
    samples: ['我都陪你走了这么远，你现在说走就走，这些年的陪伴算什么？'],
    minFlip: 1,
  },
  {
    id: 'M4', desc: '置空口语退出动词分支（SUNK_ZH 新分支整条）',
    inject: { SUNK_ZH: SUNK_ZH_OLD },
    samples: [
      '咱们都熬了两年了，你现在撂挑子，前面的活不全白干了？',
      '做了三个月的内测，你半路撂下，之前收集的数据全废了。',
    ],
    minFlip: 2,
  },
  {
    id: 'M5', desc: '只留口语退出分支 → 「等于把钱扔进水里」样本回落',
    // 该样本的 SUNK 侧只由「等于/就是 + 把钱 + 销毁」支贡献（无退出动词、
    // 无紧邻白费词），置空口语支不影响它，只留口语支时它必须回落。
    inject: { SUNK_ZH: SUNK_ZH_ONLY_COLLOQ },
    samples: ['设备都调试好了，现在推翻重做就等于把钱扔进水里。'],
    minFlip: 1,
  },
  {
    id: 'M6', desc: '只留口语退出分支 → 「陪伴算什么」样本回落',
    inject: { SUNK_ZH: SUNK_ZH_ONLY_COLLOQ },
    samples: ['我都陪你走了这么远，你现在说走就走，这些年的陪伴算什么？'],
    minFlip: 1,
  },
  {
    id: 'M7', desc: '置空英文完成态分支（INVESTED_EN 新分支）',
    // 两条样本都只靠新完成态分支贡献 INVESTED（旧 INV_EN 无 prepared /
    // registered 类动词；'You have paid' 那条旧第 2 支也能命中，故换样本）。
    inject: { INVESTED_EN: INV_EN_OLD },
    samples: [
      'The team has already prepared the venue and arranged the schedule; pulling out now would waste all of it.',
      'We have submitted the proposal and registered the booth; withdrawing now would waste everything.',
    ],
    minFlip: 2,
  },
  {
    id: 'M8', desc: '置空英文退出动词扩充（cancelling / gone / lost）',
    inject: { SUNK_EN: SUNK_EN_OLD },
    samples: [
      'We have already booked the venue and printed the invitations; cancelling now would waste everything.',
    ],
    minFlip: 1,
  },
  {
    id: 'M9', desc: '置空英文 goes to waste 分支',
    inject: { SUNK_EN: SUNK_EN_OLD },
    samples: [
      'We have been at this for two years and now you want to walk away? All that work goes to waste.',
    ],
    minFlip: 1,
  },
];

let allOk = true;
console.log('═══ r645 负例脚本：sunk_cost_coercion 新分支守卫有效性 ═══\n');

for (const m of MUTANTS) {
  console.log(`【${m.id}】${m.desc}`);
  let flips = 0;
  for (const s of m.samples) {
    const before = checkSunkCostCoercion(s).count > 0;
    const after = checkSunkCostCoercion(s, m.inject).count > 0;
    const flipped = before && !after;
    if (flipped) flips++;
    console.log(`  ${flipped ? '✅' : '❌'} before=${before ? '命中' : '不判'} after=${after ? '命中' : '不判'} | ${s.slice(0, 46)}`);
  }
  const ok = flips >= m.minFlip;
  if (!ok) allOk = false;
  console.log(`  → 翻转 ${flips}/${m.samples.length}（要求 ≥${m.minFlip}）${ok ? ' ✅ 守卫有效' : ' ❌ 守卫失效'}\n`);
}

// 反向证明：不注入时全部样本仍命中（排除「判据本来就坏」造成的假翻转）
console.log('【反向对照】不注入时全部样本必须命中');
const allSamples = [];
for (const m of MUTANTS) for (const s of m.samples) if (!allSamples.includes(s)) allSamples.push(s);
let stillHit = 0;
for (const s of allSamples) if (checkSunkCostCoercion(s).count > 0) stillHit++;
const ctrlOk = stillHit === allSamples.length;
if (!ctrlOk) allOk = false;
console.log(`  ${ctrlOk ? '✅' : '❌'} ${stillHit}/${allSamples.length} 命中\n`);

console.log('═══ 总结 ═══');
console.log(allOk ? '✅ 全部变异组证明守卫有效（删判据必变红）' : '❌ 存在失效变异组——判据不是守卫');
process.exitCode = allOk ? 0 : 1;
