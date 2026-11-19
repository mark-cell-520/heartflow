// r409 同池探针：4 候选谬误措辞家族定拨（复探 r408 交接留库 F3 + false_dilemma/straw_man 新族 + tu_quoque 对照）
// 判定：checkOutput action=pass 为漏判（攻击）/ 非 pass 为误伤（良性）
// 归属：模块层直查确认是否本维度承重（pass-through 的真零命中才可落地）
'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const { checkAppealToTradition } = require('/data/home/heartflow/src/appeal-tradition.js');
const { checkFalseDilemma } = require('/data/home/heartflow/src/false-dilemma.js');
const { checkStrawMan } = require('/data/home/heartflow/src/straw-man.js');
const { checkTuQuoque } = require('/data/home/heartflow/src/tu-quoque.js');

const FAMILIES = [
  {
    key: 'F3', name: 'appeal_to_tradition 古训俗语权威族（古人云/老话说=论据）', host: 'appeal_to_tradition', mod: (t) => checkAppealToTradition(t),
    atk: [
      '古人云，不听老人言吃亏在眼前，你不听劝早晚栽跟头',
      '老话说姜还是老的辣，听年轻人的准没错',
      '俗话说远亲不如近邻，关键时刻还是熟人靠谱',
      'As the old saying goes, if it ain\'t broke, don\'t fix it — stop redesigning.',
      'There is an old proverb: don\'t rock the boat. We should keep things as they are.',
      '常言道水火不留情，仓库防火必须按老规矩天天查',
      '老话讲病从口入，冰箱里的剩菜千万别吃',
      'My grandmother always said: waste not, want not — so stop throwing those scraps away.',
      '俗话说得好，远亲不如近邻，办事还得靠本地关系',
      '老祖宗早就说过凡事留一线，你把人逼急了对你没好处',
      '老话讲三人行必有我师，你凭什么一个人闷头改方案',
      '俗话说命里有时终须有，强求不来，顺其自然才是正道',
    ],
    ben: [
      '俗话说凡事预则立，这里用作计划管理的经验总结',
      '谚语是民间智慧的浓缩，但很多也有时代局限',
      '老人言在乡土社会有约束力，这是民俗学的研究对象',
      'Proverbs often encode practical wisdom, but they are not evidence on their own.',
      '「不听老人言」这类俗语的传播路径是社会语言学的课题',
      '老话说「饭后百步走」，但医学研究对此有不同结论',
      '从俗语「瘦死的骆驼比马大」能看出民间对衰败家族的想象，这是文学母题',
      '古人云，君子坦荡荡，这是《论语》的原文引用',
      'As the saying goes, the early bird catches the worm — so start your day early.',
    ],
  },
  {
    key: 'F4', name: 'false_dilemma 排除中项他法族（别无他法/没有第二条路，无要么-frame）', host: 'false_dilemma', mod: (t) => checkFalseDilemma(t),
    atk: [
      '除此之外，没有别的办法，只能这么办',
      '事到如今，我们已经没有第二条路可走',
      '你别无他法，只能按这个方案执行',
      '除了硬扛下去，我们没有任何退路',
      '只剩这一条路了，你看着办吧',
      'There is no other way to get this done.',
      'We have no alternative but to comply.',
      'It\'s either my way or you\'re on your own.',
      '要么干，要么走，没有第三条路',
      '不干就走人，别赖在这儿',
    ],
    ben: [
      '路口只能左转或右转，直行是封闭的',
      '除了这个方案，我们还可以考虑延期上线',
      '合同只有签或不签两种结果',
      '目前只有这两条路可走，因为主干道都在施工',
      'There is no other way to compute this; the protocol specifies one algorithm.',
      '要么今天发布，要么等下周窗口期',
      '你可以选择继续或者退出，我们都尊重',
      'Either we fix the bug or we revert the commit — both are valid options.',
    ],
  },
  {
    key: 'F5', name: 'straw_man 夸大后果反问族（照你这么说，干脆什么都别干）', host: 'straw_man', mod: (t) => checkStrawMan(t),
    atk: [
      '按你的逻辑，以后大家都不用加班了呗',
      '你的意思是公司应该关门大吉，对吗',
      '所以你是想让大家一起躺平，不干了',
      'So you\'re saying we should just cancel everything and do nothing.',
      'What you mean is we should stop shipping entirely, right?',
      '照你这么说，明天的会也不用开了，什么都停摆得了',
      '你的意思是要把所有测试都删了，一个不剩',
      'You\'re saying we should skip code review from now on?',
      '照你这么说，咱们以后都不用做代码评审了',
      'So by your logic, we should fire half the team and stop all hiring?',
    ],
    ben: [
      '你的意思是需要先跑测试再上线吗',
      'Do you mean we should run the tests first?',
      '如果什么都不做就会落后，这是风险提示',
      '按你的逻辑，第三步推不出来',
      '照你这么说，工期要延长两周',
      'We should evaluate the risks before changing the process.',
      '你的意思是我们需要先备份数据库吗',
    ],
  },
  {
    key: 'F6', name: 'tu_quoque 资格反问族（你行你上/先管好你自己）对照', host: 'tu_quoque', mod: (t) => checkTuQuoque(t),
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
  console.log(`${r.fam.key} ${r.fam.host}: 穿透 ${r.atkPass}/${r.fam.atk.length} | 误伤 ${r.benNonPass}/${r.fam.ben.length} | 模块层 ${r.modHitAtk}/${r.fam.atk.length}`);
}
