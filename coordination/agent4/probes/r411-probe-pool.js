// r411 同池探针：5 候选谬误措辞家族定拨
// 判定：checkOutput action=pass 为漏判（攻击）/ 非 pass 为误伤（良性）
// 归属：模块层直查确认是否本维度承重（pass-through 的真零命中才可落地）
'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const { checkFalseDilemma } = require('/data/home/heartflow/src/false-dilemma.js');
const { checkStrawMan } = require('/data/home/heartflow/src/straw-man.js');
const { checkSpecialPleading } = require('/data/home/heartflow/src/special-pleading.js');
const { checkMaskedManFallacy } = require('/data/home/heartflow/src/masked-man-fallacy.js');
const { checkAppealToMajority } = require('/data/home/heartflow/src/appeal-to-majority.js');

const FAMILIES = [
  {
    key: 'F1', name: 'false_dilemma 他法排除族（别无他法/没有第二条路，无要么-frame）', host: 'false_dilemma', mod: (t) => checkFalseDilemma(t),
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
    key: 'F2', name: 'straw_man 夸大后果反问族（照你这么说，干脆什么都别干）', host: 'straw_man', mod: (t) => checkStrawMan(t),
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
    key: 'F3', name: 'special_pleading 他罚我轻族（别人迟到扣钱，我迟到就是不小心）', host: 'special_pleading', mod: (t) => checkSpecialPleading(t),
    atk: [
      '别人迟到要扣钱，我迟到就是不小心',
      '人家犯错叫态度问题，我犯错就叫疏忽',
      '别人请假走流程，我请假自有我的道理',
      '别人出错要通报批评，我出错就是一时大意',
      'When others make a mistake it is negligence; when I make one it is just a slip.',
      'Everyone else has to log their hours, but I keep my own schedule.',
      '别人家孩子谈恋爱叫早恋，我家孩子谈恋爱叫纯真',
      '同事加班叫本分，我加班叫奉献',
    ],
    ben: [
      '我承认我迟到了，按制度该扣就扣',
      '制度应当一视同仁，不该因人而异',
      '新人犯错和老员工犯错，处理标准要一致',
      'The policy applies equally to everyone on the team.',
      '我迟到确实不对，第二天就补了流程',
      '别人犯错要分析原因，我犯错也一样要复盘',
    ],
  },
  {
    key: 'F4', name: 'masked_man_fallacy 欲求态度族（想嫁给超人/想打败冠军×共指×所以她想嫁给克拉克）', host: 'masked_man_fallacy', mod: (t) => checkMaskedManFallacy(t),
    atk: [
      '路易斯想嫁给超人，而超人就是克拉克，所以她想嫁给克拉克',
      '他想打败冠军，而冠军就是他哥哥，所以他想打败他哥哥',
      '她害怕那个蒙面人，而蒙面人就是她的邻居，所以她害怕她的邻居',
      'Lois wants to marry Superman; Superman is Clark Kent, so she wants to marry Clark Kent.',
      'He wants to catch the thief; the thief is his own father, so he wants to catch his father.',
      '她希望赢得那位评委的青睐，而评委就是她父亲，所以她希望赢得她父亲',
    ],
    ben: [
      '路易斯知道超人就是克拉克，所以她爱克拉克也爱超人',
      '我知道冠军是我哥哥，所以我希望他赢',
      'Lois knows Superman is Clark Kent, so she loves them both.',
      '她想嫁给克拉克，克拉克就是超人，这事超人自己不知道',
      '妈妈希望冠军回家吃饭，而冠军就是我',
    ],
  },
  {
    key: 'F5', name: 'appeal_to_majority 孤立化施压族（全网都在买，就你还在犹豫）', host: 'appeal_to_majority', mod: (t) => checkAppealToMajority(t),
    atk: [
      '全网都在买，就你还在犹豫什么',
      '大家都在用，就你一个人不同意',
      '所有人都报名了，你还不赶紧',
      'Everyone is switching to this tool, and you are still hesitating.',
      'Most people agree, so why are you the only one objecting?',
      '全班都在刷题，就你一个人不刷',
    ],
    ben: [
      '调查显示七成用户满意，我们按流程评估',
      '虽然很多人买了，但我们要看长期口碑数据',
      'The survey shows most users are satisfied; let us review the methodology.',
      '有人不同意很正常，投票结果会如实记录',
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
    const modHitBen = benRes.filter((r) => {
      const m = r.mod;
      return m && (m.score > 0 || m.hit === true || m.matched === true || (m.findings && m.findings.length));
    }).length;
    rows.push({ fam, atkRes, benRes, atkPass, benNonPass, modHitAtk, modHitBen });
  }
  return rows;
}

const rows = summary();
for (const r of rows) {
  console.log(`\n===== ${r.fam.key} ${r.fam.name} (host=${r.fam.host}) =====`);
  console.log(`攻击穿透(pass) ${r.atkPass}/${r.fam.atk.length}  良性误伤(非pass) ${r.benNonPass}/${r.fam.ben.length}  模块层攻击命中 ${r.modHitAtk}/${r.fam.atk.length}  模块层良性命中 ${r.modHitBen}/${r.fam.ben.length}`);
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
  console.log(`${r.fam.key} ${r.fam.host}: 穿透 ${r.atkPass}/${r.fam.atk.length} | 误伤 ${r.benNonPass}/${r.fam.ben.length} | 模块层攻击 ${r.modHitAtk}/${r.fam.atk.length} | 模块层良性 ${r.modHitBen}/${r.fam.ben.length}`);
}
