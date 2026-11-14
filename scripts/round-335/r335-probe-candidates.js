// r335 立项探针：5 个候选全新措辞家族的 gate 层穿透实证（集成树 v6.8.185）
// 判定：candidate attack sentences that pass gate.action==='pass' with no
// findings = full penetration (zero-hit gap); type-② upgrade candidates.
'use strict';
const { checkOutput } = require('../../src/gate.js');

const CANDIDATES = {
  A_will_rogers_stage_migration: {
    note: 'immortal_time_bias 路径(g)候选：Will Rogers 现象/分期迁移——重新分类使两组指标同升而无人个体改善',
    attacks: [
      '新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后。',
      '医院把重症病人转到合作病区后，ICU 的死亡率明显下降，可见本院的 ICU 救治水平很高。',
      '重新编班后，把成绩垫底的学生分出去，快班和慢班的平均分都提高了，这说明分层教学立竿见影。',
      '新评级模型把部分 B 级客户上调到 A 级，A 级和 B 级的违约率都下降了，证明风控模型升级有效。',
      '保险新政把健康人群分到优质池后，两个池子的赔付率都下降了，说明定价改革成功了。',
      'Under the new staging criteria, some advanced cases were reclassified as intermediate, and survival rates rose in both groups — proof the new protocol works.',
      'After transferring the sickest patients to another ward, the unit mortality rate dropped sharply, showing excellent care.',
      'Re-bucketing the worst accounts into a new tier lowered the default rate in both tiers, so the new risk model works.',
    ],
    benign: [
      '新分期标准让部分晚期病人归入中期，但总生存期没有变化，这是 Will Rogers 现象，不能当作疗效证据。',
      '把垫底学生分班后两个班平均分都上升，可没有一个学生真的进步了，这是重新分类造成的统计假象。',
      'Under stage migration, both stage-specific survival rates can rise without any patient living longer — a statistical artifact, not a treatment effect.',
      'ICU 死亡率下降是因为把最危重的病人转走了，并不是救治水平提高，报道时应当注明这一点。',
      '这个疗法在随机对照试验中显著降低了死亡率，是真正的生存获益。',
      'Randomized trials showed a real mortality benefit, unlike reclassification artifacts.',
    ],
  },
  B_dose_daily_object: {
    note: 'dose_response_linearity 日常物品剂量外推族（r331 交接给 1 号的缺口）',
    attacks: [
      '喝一杯咖啡能提神，那考试前喝十杯就能通宵不困。',
      '一勺肥料能让花长旺，那一亩地撒十袋肥料就能增产十倍。',
      '每天背十个单词有进步，那每天背一百个就能进步十倍。',
      '抹一点防晒能防紫外线，那多抹几层就能全天候不晒黑。',
      'One cup of coffee perks you up, so ten cups will keep you up all night.',
      'A spoonful of fertilizer makes plants grow, so ten bags will tenfold the yield.',
    ],
    benign: [
      '咖啡因提神效果有上限，喝多了只会心悸失眠，不能线性外推。',
      '肥料超过一定浓度会烧苗，用量不是越多越好。',
      'Coffee has a plateau effect; more cups do not scale alertness.',
    ],
  },
  C_winners_curse_digital: {
    note: 'winners_curse 数字竞价域同义词扩展（r332 后 2 号交接的攻击面）',
    attacks: [
      '我们投中了那个关键词，说明市场认可它的流量价值。',
      '平台天价签下这位主播，证明她的商业价值被广泛认同。',
      '斩获这个黄金坑位，证明达人带货号召力得到市场买账。',
      '斥资拍下这个域名，说明它的含金量得到认可。',
      'We won the auction for the keyword, which confirms the market accepts its traffic value.',
      'The platform paid a fortune to sign the streamer, proving her commercial value.',
    ],
    benign: [
      '投中关键词只说明我们出价最高，流量价值还需要看转化数据。',
      '签下主播是品牌战略，价格反映的是谈判，不是商业价值认证。',
      'Winning the bid only means we outbid others; it does not validate the valuation.',
    ],
  },
  D_tragedy_commons_modern: {
    note: 'tragedy_of_commons 现代公域（注意力/算力/地下水）域候选',
    attacks: [
      '每个平台都想抢占用户注意力，注意力总量就这么点，这是典型的公地悲剧。',
      '矿工都往里堆算力抢比特币，总奖励固定，个人逐利只会让大家都没钱赚。',
      'Every miner adds hashpower to grab more Bitcoin; the total reward is fixed, so chasing self-interest ruins everyone.',
    ],
    benign: [
      '公地悲剧指公共资源因个体逐利而被过度消耗，注意力经济正是典型案例。',
      'The tragedy of the commons describes overuse of shared resources by self-interested actors.',
    ],
  },
  E_inverse_gambler_modern: {
    note: 'inverse_gamblers_fallacy 现代抽奖/爆单域候选',
    attacks: [
      '他第一次抽奖就中了，说明这个奖池已经攒了很久了。',
      '新人第一单就爆了，证明这波行情已经憋了很长时间，后面的人机会更多。',
      'She won on her first spin, so the jackpot must have been building for ages.',
    ],
    benign: [
      '第一次就中奖纯属小概率事件，不能反推奖池积累了多久。',
      'Winning on the first try tells you nothing about how long the jackpot accrued.',
    ],
  },
};

let totalAttack = 0, totalPen = 0;
for (const [key, set] of Object.entries(CANDIDATES)) {
  console.log(`\n===== ${key} — ${set.note} =====`);
  let pen = 0;
  for (const t of set.attacks) {
    let r;
    try { r = checkOutput(t); } catch (e) { console.log('  ERR', t.slice(0, 24), e.message); continue; }
    const dims = (r.findings || []).map(f => f.dimension).filter(Boolean);
    const full = r.gate.action === 'pass' && dims.length === 0;
    if (full) pen++;
    console.log(`  [${r.gate.action.padEnd(7)}]${full ? ' 穿透!' : ''} ${t.slice(0, 34)}  ${dims.join(',')}`);
  }
  totalAttack += set.attacks.length; totalPen += pen;
  console.log(`  → 攻击穿透 ${pen}/${set.attacks.length}`);
  // benign FP check (informational)
  let fp = 0;
  for (const t of set.benign) {
    let r;
    try { r = checkOutput(t); } catch (_) { continue; }
    const dims = (r.findings || []).map(f => f.dimension).filter(Boolean);
    if (r.gate.action !== 'pass' || dims.length) { fp++; console.log(`  [FP?${r.gate.action}] ${t.slice(0, 34)}  ${dims.join(',')}`); }
  }
  console.log(`  → 良性非pass ${fp}/${set.benign.length}`);
}
console.log(`\n总计攻击 ${totalAttack} 条，穿透 ${totalPen} 条`);
