// r408 同池探针：3 候选谬误措辞家族定拨（复探 r407 交接留库 F2/F3 + tu_quoque 对照）
// 判定：checkOutput action=pass 为漏判（攻击）/ 非 pass 为误伤（良性）
// 归属：模块层直查确认是否本维度承重（pass-through 的真零命中才可落地）
'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const { checkAppealToTradition } = require('/data/home/heartflow/src/appeal-tradition.js');
const { checkTuQuoque } = require('/data/home/heartflow/src/tu-quoque.js');

const FAMILIES = [
  {
    key: 'F2', name: 'appeal_to_tradition 时间考验族（存续N年=经得起考验/没用早亡了）', host: 'appeal_to_tradition', mod: (t) => checkAppealToTradition(t),
    atk: [
      '这道菜的做法传了五百年，能不好吃吗',
      '老字号能开一百年，靠的就是真本事，不然早倒闭了',
      '一个方法用了几千年都没被淘汰，说明它经得起考验',
      '祖宗传下来的规矩用了上千年，要是害人早就亡了',
      'A remedy that has survived a thousand years cannot be useless.',
      'If the old way were wrong, it would have disappeared by now.',
      'This technique has been passed down for centuries — that alone proves its worth.',
      '这套制度运行了三百年，没它就没有今天的稳定，足以说明设计是对的',
      '这套拳法流传了四百年，要是没用早就失传了',
      '这个偏方用了两百年，附近几个村都靠它治病，能不管用吗',
      'The temple has stood here for eight centuries; if the site were cursed, it would have collapsed.',
      '这家中药店开了两百年，没疗效哪能撑到今天',
    ],
    ben: [
      '老字号的品控确实更稳定，但也要看检测报告',
      '传统工艺有文化价值，但生产效率不如现代流水线',
      '这道菜是非遗技艺，传承谱系可以查到明代',
      'Some traditions carry cultural meaning even when the original rationale is lost.',
      '百年老店同样可能因为口味变化而衰落，市场会给出答案',
      '这套制度的沿革在地方志里有完整记载，可供研究者查证',
      '长城历经六百年风雨，修缮方案需要结构工程师评估',
      '这套历法用了三百年，误差积累到需要重新校准',
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
      '常言道水火不留情，仓库防火必须按老规矩天天查',
      '老话讲病从口入，冰箱里的剩菜千万别吃',
      'My grandmother always said: waste not, want not — so stop throwing those scraps away.',
      '俗话说得好，远亲不如近邻，办事还得靠本地关系',
    ],
    ben: [
      '俗话说凡事预则立，这里用作计划管理的经验总结',
      '谚语是民间智慧的浓缩，但很多也有时代局限',
      '老人言在乡土社会有约束力，这是民俗学的研究对象',
      'Proverbs often encode practical wisdom, but they are not evidence on their own.',
      '「不听老人言」这类俗语的传播路径是社会语言学的课题',
      '老话说「饭后百步走」，但医学研究对此有不同结论',
      '从俗语「瘦死的骆驼比马大」能看出民间对衰败家族的想象，这是文学母题',
    ],
  },
  {
    key: 'F7', name: 'tu_quoque 资格反问族（你行你上/先管好你自己）对照', host: 'tu_quoque', mod: (t) => checkTuQuoque(t),
    atk: [
      '你行你上啊，不行就别废话',
      '先管好你自己吧，你的KPI还没完成呢',
      'If you cannot do better, you have no right to complain.',
      '你又不是医生，凭什么对治疗方案指手画脚',
      '你自己又没做过销售，有什么资格评价别人的方案',
      'Who are you to criticize? You have never run a team yourself.',
    ],
    ben: [
      '这个领域确实需要资质，非法行医有法律风险',
      '我不是这方面的专家，以下只是个人观察',
      'As a non-specialist, I defer to the clinical guidelines on this.',
      '专业判断应该听专科医生的，这是循证原则',
      '评审制度就是让有资质的人做有资期的判断',
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
