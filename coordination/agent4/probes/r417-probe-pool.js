// r417 同池探针：4 候选谬误措辞家族定拨
// 判定：checkOutput action=pass 为漏判（攻击）/ 非 pass 为误伤（良性）
// 归属：模块层直查确认是否本维度承重（pass-through 的真零命中才可落地）
'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const { checkGeneticFallacy } = require('/data/home/heartflow/src/genetic-fallacy.js');
const { checkSpecialPleading } = require('/data/home/heartflow/src/special-pleading.js');
const { checkStrawMan } = require('/data/home/heartflow/src/straw-man.js');
const { checkTuQuoque } = require('/data/home/heartflow/src/tu-quoque.js');

const FAMILIES = [
  {
    key: 'F1', name: 'genetic_fallacy 考证式增信族（词源于X，可见古人早已洞察——用词源为立场增信）', host: 'genetic_fallacy', mod: (t) => checkGeneticFallacy(t),
    atk: [
      '「民主」一词源于希腊语，可见古希腊人早已懂得自由的真谛',
      '「经济」本义是经国济民，古人早就把道理说透了',
      '「江湖」原本指江河湖海，足见古人早已看透人情世故',
      '「气节」一词源于先秦，我们的祖先早已把骨气刻进文化基因',
      '「阴阳」本义指日照向背，先贤果然早已参透天道',
      '从词源上看，「哲学」源于爱智慧，足见古代先哲早已抵达智慧的顶点',
      '「教育」源于陶俑揭模，可见先民早就懂得育人如玉的道理',
      '「风水」本义是负山而居，可见古人早洞察人居环境之理',
      'The word "democracy" comes from the Greek, which shows the ancients already understood true freedom.',
      '"Economy" originally meant managing a household — the ancients had it figured out all along.',
      '"Sympathy" derives from shared feeling, proving the Greeks already understood compassion.',
    ],
    ben: [
      '「经济」本义是经国济民，但今天的用法早已泛化，不能以本义苛求现在',
      '「仁义」一词源于先秦，今天的语义已经发生了变化',
      '从词源上看，「共和」确实指共同治理，这是语言学事实',
      '古人是否早有此意，需要文献考证，不能只凭词源推断',
      'The word comes from Latin, but its meaning has shifted over time.',
      '词源学课上我们分析了「民主」一词的希腊语来源',
      '词源谬误是指用词的起源裁定当下用法，这是一种逻辑谬误',
      '「哲学」源于爱智慧，这是希腊语 philos 与 sophia 的构词',
      '「民主」一词源于希腊语，这是构词法常识，与制度优劣无关',
      '所谓古人早已想通的说法缺乏文献依据，词源不能证明思想史',
      'The ancients were curious about nature, and the word reflects that curiosity.',
    ],
  },
  {
    key: 'F5', name: 'special_pleading EN 代词回指形（when I do it 代替行为词回填）', host: 'special_pleading', mod: (t) => checkSpecialPleading(t),
    atk: [
      'When others arrive late it is called indiscipline; when I do it, it is called flexibility.',
      'When they cut corners it is called sloppy; when I do the same, it is called efficiency.',
      'Others\' overtime is called dedication; when I do it, it is called exploitation.',
      'When they refuse it is called irresponsible; when I do it, it is called having principles.',
      'Everyone else quitting is called impulsive; my doing it is called self-actualization.',
      'When they speak up it is called insubordination; when I do it, it is called leadership.',
      'People who take leave are called unreliable; my doing it is called work-life balance.',
      'When they negotiate it is called disloyalty; when I do it, it is called advocating for myself.',
      'Their mistakes are called incompetence; mine are called learning curves.',
      'When others complain it is called whining; when I do it, it is called raising concerns.',
    ],
    ben: [
      '我承认我迟到了，按制度该扣就扣',
      '制度应当一视同仁，不该因人而异',
      '别人加班叫奉献，我加班也叫奉献，标准一致',
      '这两种叫法其实是一回事，换个名字不改变性质',
      'The policy applies equally to everyone on the team.',
      '同一个行为就该用同一个名字，不能搞双标',
      '新人犯错和老员工犯错，处理标准要一致',
      '我拒绝是因为原则，别人拒绝也一样看待',
      'When others cut corners it is called sloppy; when I cut corners it is also called sloppy.',
      '别人犯错叫疏忽，我犯错也叫疏忽，都按制度复盘',
      'When others arrive late it is called indiscipline; that is the standard for all of us.',
    ],
  },
  {
    key: 'F6', name: 'straw_man 存在必要性否定形（照你这么说，这行业就没有存在的必要了）', host: 'straw_man', mod: (t) => checkStrawMan(t),
    atk: [
      '照你这么说，这行业就没有存在的必要了',
      '按你的逻辑，这个部门也没有必要保留',
      '你的意思是整个团队都没有存在的价值',
      'So by your logic, this whole department has no reason to exist.',
      '你的意思是这所学校不如关掉',
      '按你的说法，这部法律也没有存在的意义',
      '照你这么说，大家以后都不用吃饭了',
      '你的意思是这样下去谁也活不了',
      'What you mean is nobody would bother to work anymore.',
      '按你的逻辑，这套制度干脆推倒重来算了',
      '按你的意思，这个岗位不设也罢',
      '你的意思是把公司解散算了',
    ],
    ben: [
      '你的意思是需要先跑测试再上线吗',
      'Do you mean we should run the tests first?',
      '如果什么都不做就会落后，这是风险提示',
      '按你的逻辑，第三步推不出来',
      '照你这么说，工期要延长两周',
      'We should evaluate the risks before changing the process.',
      '你的意思是我们需要先备份数据库吗',
      '这个行业确实面临转型压力，这是行业报告的结论',
      '你的方案会影响到下游团队，需要评估',
      'Do you mean the migration can wait until next quarter?',
      '按你的说法，成本还能再降两成',
    ],
  },
  {
    key: 'F7', name: 'tu_quoque 诉诸共惯比烂族（大家都作弊，我作弊算什么——用普遍违规正当化自身行为）', host: 'tu_quoque', mod: (t) => checkTuQuoque(t),
    atk: [
      '大家都作弊，我作弊算什么',
      '满大街都是插队的，我插一次队怎么了',
      '别人都躺平，我凭什么不能躺',
      '谁都迟到，光抓我什么意思',
      '全世界都在污染，我一个人减排有什么用',
      '人人都在摸鱼，我摸一会儿怎么了',
      'Everyone cheats on taxes, so why can\'t I?',
      'All my friends speed; why should I follow the limit?',
      '贪污的那么多，我这点算什么',
      '整个行业都在数据造假，我们不做就吃亏',
      'Most people fudge their timesheets, so I might as well join in.',
    ],
    ben: [
      '我承认我迟到了，按制度该扣就扣',
      '制度应当一视同仁，不该因人而异',
      '这种现象很普遍，但普遍不等于正确',
      '大家都在努力，我也不能落后',
      '别人加班叫奉献，我加班也叫奉献，标准一致',
      '这条路上大多数人都守规矩，我也一样',
      'Many people break this rule, which is why enforcement is being tightened.',
      '舞弊现象确实存在，公司正在加强审计',
      '虽然很多人这样做，并不代表这样做是对的',
      'Everyone makes mistakes; we learn from them and move on.',
      '守住自己的节奏，不用管别人怎么做',
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
