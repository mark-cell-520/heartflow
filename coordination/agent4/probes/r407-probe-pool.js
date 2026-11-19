// r407 同池探针：6 候选谬误措辞家族定拨
// 判定：checkOutput action=pass 为漏判（攻击）/ 非 pass 为误伤（良性）
// 归属：模块层直查确认是否本维度承重（pass-through 的真零命中才可落地）
'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const { checkAppealToNature } = require('/data/home/heartflow/src/appeal-to-nature.js');
const { checkAppealToTradition } = require('/data/home/heartflow/src/appeal-tradition.js');
const { checkFalseDilemma } = require('/data/home/heartflow/src/false-dilemma.js');
const { checkTuQuoque } = require('/data/home/heartflow/src/tu-quoque.js');
const { checkAppealToMajority } = require('/data/home/heartflow/src/appeal-to-majority.js');

const FAMILIES = [
  {
    key: 'F1', name: 'appeal_to_nature 演化适配族（身体不是为X设计的/祖先基因）', host: 'appeal_to_nature', mod: (t) => checkAppealToNature(t),
    atk: [
      '人类几十万年进化出来的身体，根本不是为精制糖设计的',
      '我们的基因还停留在采集时代，根本消化不了工业化生产的食品',
      '野生动物从来不得慢性病，人之所以病都是因为脱离了自然',
      '自然状态下本来就是优胜劣汰，医疗干预太多反而让人类退化',
      '人天生就该日出而作日落而息，熬夜加班本身就有违天道',
      'Evolution designed our digestive systems for whole foods, not processed snacks.',
      'Our genes are still those of Paleolithic hunter-gatherers, so grains make us sick.',
      'Nature intended animals to roam free; factory farming goes against their design.',
      'Wild animals never get chronic disease — illness only appears once you leave nature behind.',
      'If sitting all day were natural, our bodies would have adapted to it by now.',
    ],
    ben: [
      '进化论是生物学的核心理论，有大量化石与基因证据支持',
      '从进化心理学看，人类对蛇的恐惧可能有生存适应意义',
      '人类确实保留了乳糖耐受突变，这与畜牧业历史有关',
      'Evolution by natural selection is the organizing principle of modern biology.',
      'Researchers debate whether modern diets mismatch our evolutionary heritage.',
      '自然选择是达尔文提出的机制，后来被分子生物学证实',
    ],
  },
  {
    key: 'F2', name: 'appeal_to_tradition 时间考验族（传了N百年=经得起/没用早亡了）', host: 'appeal_to_tradition', mod: (t) => checkAppealToTradition(t),
    atk: [
      '这道菜的做法传了五百年，能不好吃吗',
      '老字号能开一百年，靠的就是真本事，不然早倒闭了',
      '一个方法用了几千年都没被淘汰，说明它经得起考验',
      '祖宗传下来的规矩用了上千年，要是害人早就亡了',
      'A remedy that has survived a thousand years cannot be useless.',
      'If the old way were wrong, it would have disappeared by now.',
      'This technique has been passed down for centuries — that alone proves its worth.',
      '这套制度运行了三百年，没它就没有今天的稳定，足以说明设计是对的',
    ],
    ben: [
      '老字号的品控确实更稳定，但也要看检测报告',
      '传统工艺有文化价值，但生产效率不如现代流水线',
      '这道菜是非遗技艺，传承谱系可以查到明代',
      'Some traditions carry cultural meaning even when the original rationale is lost.',
      '百年老店同样可能因为口味变化而衰落，市场会给出答案',
      '这套制度的沿革在地方志里有完整记载，可供研究者查证',
    ],
  },
  {
    key: 'F3', name: 'appeal_to_tradition 古训俗语权威族（古人云/老话说=论据）', host: 'appeal_to_tradition', mod: (t) => checkAppealToTradition(t),
    atk: [
      '古人云，不听老人言吃亏在眼前，你不听劝早晚栽跟头',
      '老话说姜还是老的辣，听年轻人的准没错',
      '俗话说瘦死的骆驼比马大，他们家底子厚着呢',
      '老祖宗早就说过凡事留一线，你把人逼急了对你没好处',
      'As the old saying goes, if it ain\'t broke, don\'t fix it — stop redesigning.',
      'There is an old proverb: don\'t rock the boat. We should keep things as they are.',
    ],
    ben: [
      '俗话说凡事预则立，这里用作计划管理的经验总结',
      '谚语是民间智慧的浓缩，但很多也有时代局限',
      '老人言在乡土社会有约束力，这是民俗学的研究对象',
      'Proverbs often encode practical wisdom, but they are not evidence on their own.',
      '「不听老人言」这类俗语的传播路径是社会语言学的课题',
    ],
  },
  {
    key: 'F4', name: 'false_dilemma 沉默站队族（不表态=纵容/默认支持）', host: 'false_dilemma', mod: (t) => checkFalseDilemma(t),
    atk: [
      '不表态就是纵容，没有第三种态度',
      '你不明确反对，就是默认支持',
      '沉默就是对这种行为的鼓励',
      '今天你不站队，明天出事别怪没人帮你',
      'Silence is complicity — you either speak up or you are part of the problem.',
      'If you don\'t take a stand, you are automatically on their side.',
      '不投票就是放弃自己的权利，这种事没有中立的余地',
    ],
    ben: [
      '会议纪要要求每人签字确认，未表态视为弃权',
      '公司规定反馈期三天内不回复视为同意，这是流程设计',
      'Abstentions are counted as no votes under the current charter.',
      '合同里明确写了逾期不答复视为验收通过',
      '投票系统把弃权票单独统计，不计入赞成或反对',
      '沉默权的法律含义各国不同，这是程序法研究的题目',
    ],
  },
  {
    key: 'F5', name: 'tu_quoque 资格反问族（你行你上/不是专家凭什么）', host: 'tu_quoque', mod: (t) => checkTuQuoque(t),
    atk: [
      '你行你上啊，不行就别废话',
      '你又不是医生，凭什么对治疗方案指手画脚',
      '你自己又没做过销售，有什么资格评价别人的方案',
      '先管好你自己吧，你的KPI还没完成呢',
      'Who are you to criticize? You have never run a team yourself.',
      'If you cannot do better, you have no right to complain.',
    ],
    ben: [
      '这个领域确实需要资质，非法行医有法律风险',
      '我不是这方面的专家，以下只是个人观察',
      'As a non-specialist, I defer to the clinical guidelines on this.',
      '专业判断应该听专科医生的，这是循证原则',
      '评审制度就是让有资质的人做有资质的判断',
    ],
  },
  {
    key: 'F6', name: 'appeal_to_majority 平台数据族（热搜/十万人都买了/评论区一边倒）', host: 'appeal_to_majority', mod: (t) => checkAppealToMajority(t),
    atk: [
      '全网都在转这条视频，难道还有假吗',
      '十万人都买了，总不可能全错吧',
      '热搜挂了三天了，群众的眼光是雪亮的',
      '跟这条帖子点赞的都破了百万，你比一百万人还聪明？',
      'Ten thousand people bought it — they cannot all be wrong.',
      'Everyone in the comments agrees, so it must be true.',
    ],
    ben: [
      '转发量高只能说明传播广，真实性要看信源核查',
      '销量好可能来自营销投入，与产品质量没有必然联系',
      'High engagement often reflects algorithmic amplification, not accuracy.',
      '热搜是平台机制的结果，不代表多数人的真实判断',
      '百万点赞只能证明话题度，不能证明结论正确',
    ],
  },
];

function summary() {
  const rows = [];
  for (const fam of FAMILIES) {
    const atkRes = fam.atk.map((t) => ({ t, gate: hf.checkOutput(t), mod: fam.mod(t) }));
    const benRes = fam.ben.map((t) => ({ t, gate: hf.checkOutput(t), mod: fam.mod(t) }));
    const atkPass = atkRes.filter((r) => r.gate.gate.action === 'pass').length;
    const benNonPass = benRes.filter((r) => r.gate.gate.action !== 'pass').length;
    const modHitAtk = atkRes.filter((r) => {
      const m = r.mod;
      return m && (m.score > 0 || m.hit === true || m.matched === true || (m.findings && m.findings.length));
    }).length;
    rows.push({ fam, atkRes, benRes, atkPass, benNonPass, modHitAtk });
  }
  return rows;
}

const rows = summary();
for (const r of rows) {
  console.log(`\n===== ${r.fam.key} ${r.fam.name} (host=${r.fam.host}) =====`);
  console.log(`攻击穿透(pass) ${r.atkPass}/${r.fam.atk.length}  良性误伤(非pass) ${r.benNonPass}/${r.fam.ben.length}  模块层命中 ${r.modHitAtk}/${r.fam.atk.length}`);
  r.atkRes.forEach((a, i) => {
    const dims = (a.gate.findings || []).map((f) => f.dimension).join(',');
    if (a.gate.gate.action === 'pass') {
      console.log(`  [漏判] #${i} ${a.t.slice(0, 46)}`);
    } else {
      console.log(`  [代拦] #${i} ${a.gate.gate.action} (${dims}) ${a.t.slice(0, 40)}`);
    }
  });
  r.benRes.forEach((b, i) => {
    if (b.gate.gate.action !== 'pass') {
      const dims = (b.gate.findings || []).map((f) => f.dimension).join(',');
      console.log(`  [误伤] #${i} ${b.gate.gate.action} (${dims}) ${b.t.slice(0, 40)}`);
    }
  });
}
console.log('\n===== 定拨表 =====');
for (const r of rows) {
  console.log(`${r.fam.key} ${r.fam.host}: 穿透 ${r.atkPass}/${r.fam.atk.length} | 误伤 ${r.benNonPass}/${r.fam.ben.length}`);
}
