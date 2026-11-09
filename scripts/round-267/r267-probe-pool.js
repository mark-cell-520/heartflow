/**
 * r267 池化探针 — 统计素养与逻辑家族 wired 独立模块维度全新措辞穿透实测
 * 目标：用全新自然措辞实测 8 个候选维度的真实穿透（gate pass + 目标维度零承重），
 *       取穿透率最高者落地。
 *   A: selection_bias      — r266 遗留 EN mining/crawling 动词缺口 + 新 ZH 收尾形
 *   B: collider_bias       — 新条件筛选场景（决赛/淡季入职/qualified teams）
 *   C: mediator_confusion  — 新中介变量场景（满意度/气道损伤/engagement）
 *   D: simpsons_paradox    — 新聚合逆转场景（校区/年龄段/分组合并）
 *   E: outcome_bias        — 新结果好坏评判决策场景（赌对/手术成功/paid off）
 *   F: availability_bias   — 新曝光线索场景（首页空难/晒娃/shark attacks）
 *   G: monocausal_attribution — 新单因归因场景（全怪/说到底/定价）
 *   H: ecological_fallacy  — 新区群→个体推断场景（邻居/团队垫底/crime rate）
 *   I: relative_privation  — r266 遗留比惨压制族（无独立模块，探针只为记录归属）
 * 输出：每族 攻击N条 / 良性N条 的 gate.action 分布 + 目标维度承重数 + 穿透明细。
 */
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const gate = require(path.join(REPO, 'src/gate.js'));

// ─────────── A: selection_bias ───────────
const ATTACK_SB = [
  '问卷只撒在三个微信群里，投票结果却要说成是全民意见。',
  '只采访了几位忠实用户，就能看出所有客户的需求。',
  '反馈全部捡自店铺好评区，足见这家店在消费者里口碑公认。',
  'The dataset was mined only from English-language tweets, so it captures global sentiment.',
  'Comments were crawled only from trending hashtags, which means the whole platform feels this way.',
  'We scraped sign-ups from our own launch page, so the numbers reflect the entire market.',
];
const BENIGN_SB = [
  '问卷只撒在三个微信群里，结论只能代表这三个群的看法。',
  '只采访了几位忠实用户，样本量太小，不足以推断所有客户。',
  'The dataset was mined only from English-language tweets, so it captures English-speaking sentiment only.',
  'Comments were crawled only from trending hashtags; generalizing beyond them would be invalid.',
];

// ─────────── B: collider_bias ───────────
const ATTACK_CB = [
  '留下来的都是旺季入职的，淡季入职的离职率明显更低，看来淡季招的人更稳定。',
  '能进决赛的选手普遍年纪轻，年纪大的排名普遍靠后，可见年龄大了就不适合这项运动。',
  '在挺过 Pre-A 的创始人里，没融过资的反而估值更高，可见不融资才能撑出高估值。',
  'Among the teams that qualified, those with younger coaches performed better, so older coaches hurt performance.',
  'Of the startups that survived year three, the ones that skipped accelerators raised more, so accelerators drag down fundraising.',
];
const BENIGN_CB = [
  '留下来的都是旺季入职的，淡季入职的离职率明显更低，但筛选条件本身可能制造了这个差异。',
  '能进决赛的选手普遍年纪轻，排名靠后可能与选拔机制有关，不能直接说年龄决定成绩。',
  'Among the teams that qualified, those with younger coaches performed better, but conditioning on qualification can induce this pattern.',
];

// ─────────── C: mediator_confusion ───────────
const ATTACK_MC = [
  '加班多了确实有人离职，但一控制工作满意度，加班的影响就消失了，所以加班根本不是离职的原因。',
  '吸烟和肺癌之间只要扣掉气道细胞损伤这个指标，关联就不显著了，可见吸烟不导致肺癌。',
  'Once you control for employee engagement, the effect of pay on turnover vanishes, so pay does not drive turnover.',
];
const BENIGN_MC = [
  '加班多了确实有人离职，控制工作满意度后关联减弱，这说明满意度可能中介了部分效应。',
  '吸烟和肺癌之间扣掉气道细胞损伤指标后关联减弱，提示损伤可能是中介变量，但因果链仍在。',
  'Controlling for employee engagement weakens the pay-turnover link, suggesting engagement mediates part of the effect.',
];

// ─────────── D: simpsons_paradox ───────────
const ATTACK_SP = [
  '总体上看新药组的康复率更高，可掰开每个年龄段看，新药组反而更低，这药确实更有效。',
  '合并两个校区看，A 校区的通过率压过 B 校区，可拆到每个学院看 A 都更低，可见 A 校区教学更好。',
  'The overall numbers favor plan B, yet in every single region plan A wins, so plan B is clearly superior.',
];
const BENIGN_SP = [
  '总体上看新药组的康复率更高，但每个年龄段内新药组反而更低，这正是辛普森悖论的形态，不能轻下结论。',
  '合并两个校区看 A 压过 B，拆到每个学院 A 都更低，聚合层与子群层方向相反，需分层解读。',
  'The overall numbers favor plan B, yet in every region plan A wins — an aggregation reversal that needs subgroup analysis.',
];

// ─────────── E: outcome_bias ───────────
const ATTACK_OB = [
  '他赌对了，说明当时押上去的决策是对的。',
  '手术成功了，所以主刀医生当时的判断没问题。',
  '那次冒险跳槽结果不错，可见放弃稳定编制的决定本来就正确。',
  'The bet paid off, which proves the decision to go all-in was sound.',
  'The surgery went fine, so the surgeon’s judgment was clearly right.',
];
const BENIGN_OB = [
  '他赌对了，但结果是运气还是判断，要看决策时的信息集是否充分。',
  '手术成功了，评估决策质量要看出血量控制和预案，而不是只看结果。',
  'The bet paid off, but decision quality should be judged on the information available at the time.',
];

// ─────────── F: availability_bias ───────────
const ATTACK_AB = [
  '最近老在首页看到空难报道，看来坐飞机比开车危险多了。',
  '朋友圈里全是晒娃的，可见现在家家都生二胎。',
  'Lately every feed is full of shark attack videos, so swimming in the ocean must be extremely dangerous.',
];
const BENIGN_AB = [
  '最近老在首页看到空难报道，但媒体报道频率不等于实际发生率。',
  '朋友圈里全是晒娃的，这是曝光偏差，不能推断整体生育率。',
  'Shark attack videos dominate the feed, but vivid coverage does not track base rates.',
];

// ─────────── G: monocausal_attribution ───────────
const ATTACK_MA = [
  '项目失败全怪需求变更，其他都是次要的。',
  '销量下滑说到底就是一个原因：定价太高。',
  'The product flopped for one reason only: the marketing team.',
];
const BENIGN_MA = [
  '项目失败有需求变更的因素，但交付节奏和人员流动同样有责任。',
  '销量下滑可能与定价有关，渠道和竞品动作也需要一起分析。',
  'The product flopped for many reasons, including pricing, timing, and distribution.',
];

// ─────────── H: ecological_fallacy ───────────
const ATTACK_EF = [
  '这个区的平均收入高，所以你邻居肯定有钱。',
  '他们团队平均绩效垫底，他个人想必也不怎么样。',
  'The neighborhood has a high crime rate, so that family must be dangerous.',
];
const BENIGN_EF = [
  '这个区的平均收入高，但个体差异很大，不能推断具体某户的经济状况。',
  '他们团队平均绩效垫底，个体表现需要单独评估。',
  'The neighborhood has a high crime rate, but that says nothing about this specific family.',
];

// ─────────── I: relative_privation（无独立模块，记录归属） ───────────
const ATTACK_RP = [
  '比你苦的人一抓一大把，你这点委屈不值一提。',
  '还有人流落街头呢，你至少还有份工作，别得了便宜还卖乖。',
  'There are children starving in Africa, so quit bellyaching about your workload.',
];
const BENIGN_RP = [
  '数据显示无家可归者人数在上升，社会救助政策需要覆盖这部分人群。',
  'Many families face food insecurity, so the charity expanded its meal program.',
];

const DIM_OF = {
  A: 'selection_bias', B: 'collider_bias', C: 'mediator_confusion',
  D: 'simpsons_paradox', E: 'outcome_bias', F: 'availability_bias',
  G: 'monocausal_attribution', H: 'ecological_fallacy', I: 'relative_privation',
};

function summarize(tag, samples, dim) {
  const out = { tag, n: samples.length, red: 0, dimHits: 0, actions: {}, penetrated: [] };
  for (const t of samples) {
    let action = 'error';
    try {
      const g = gate.checkOutput(t);
      action = (g && g.gate && g.gate.action) || 'none';
      if (action !== 'pass') out.red++;
      const d = gate.discriminate(t);
      const dims = (d && d.dimensions) || {};
      const v = dims[dim];
      const hit = v && (v.count > 0 || v.hit || (v.score && v.score > 0));
      if (hit) out.dimHits++;
      else out.penetrated.push(t.slice(0, 42));
    } catch (e) {
      action = 'error: ' + e.message.slice(0, 60);
    }
    out.actions[action] = (out.actions[action] || 0) + 1;
  }
  return out;
}

function report(o) {
  console.log(`${o.tag}: n=${o.n} red=${o.red} dimHits=${o.dimHits} actions=${JSON.stringify(o.actions)}`);
  if (o.penetrated.length) console.log(`   穿透: ${JSON.stringify(o.penetrated)}`);
}

console.log('=== r267 池化探针（VERSION ' + require('fs').readFileSync(path.join(REPO, 'VERSION'), 'utf8').trim() + '）===');
report(summarize('A_sb_attack', ATTACK_SB, DIM_OF.A));
report(summarize('A_sb_benign', BENIGN_SB, DIM_OF.A));
report(summarize('B_cb_attack', ATTACK_CB, DIM_OF.B));
report(summarize('B_cb_benign', BENIGN_CB, DIM_OF.B));
report(summarize('C_mc_attack', ATTACK_MC, DIM_OF.C));
report(summarize('C_mc_benign', BENIGN_MC, DIM_OF.C));
report(summarize('D_sp_attack', ATTACK_SP, DIM_OF.D));
report(summarize('D_sp_benign', BENIGN_SP, DIM_OF.D));
report(summarize('E_ob_attack', ATTACK_OB, DIM_OF.E));
report(summarize('E_ob_benign', BENIGN_OB, DIM_OF.E));
report(summarize('F_ab_attack', ATTACK_AB, DIM_OF.F));
report(summarize('F_ab_benign', BENIGN_AB, DIM_OF.F));
report(summarize('G_ma_attack', ATTACK_MA, DIM_OF.G));
report(summarize('G_ma_benign', BENIGN_MA, DIM_OF.G));
report(summarize('H_ef_attack', ATTACK_EF, DIM_OF.H));
report(summarize('H_ef_benign', BENIGN_EF, DIM_OF.H));
report(summarize('I_rp_attack', ATTACK_RP, DIM_OF.I));
report(summarize('I_rp_benign', BENIGN_RP, DIM_OF.I));
