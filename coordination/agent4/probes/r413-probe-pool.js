// r413 同池探针：4 候选谬误措辞家族定拨
// 判定：checkOutput action=pass 为漏判（攻击）/ 非 pass 为误伤（良性）
// 归属：模块层直查确认是否本维度承重（pass-through 的真零命中才可落地）
'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const { checkGeneticFallacy } = require('/data/home/heartflow/src/genetic-fallacy.js');
const { checkSpecialPleading } = require('/data/home/heartflow/src/special-pleading.js');
const { checkStrawMan } = require('/data/home/heartflow/src/straw-man.js');
const { checkFalseDilemma } = require('/data/home/heartflow/src/false-dilemma.js');

const FAMILIES = [
  {
    key: 'F1', name: 'genetic_fallacy 考证式古人印证族（本义是X，可见古人早已洞察——用词源为立场增信）', host: 'genetic_fallacy', mod: (t) => checkGeneticFallacy(t),
    atk: [
      '「民主」一词源于希腊语，可见古希腊人早已懂得自由的真谛',
      '「经济」本义是经国济民，古人早就把道理说透了',
      '「江湖」原本指江河湖海，足见古人早已看透人情世故',
      '「革命」本义是变革天命，可见老祖宗早就懂得改朝换代的天理',
      '「气节」一词源于先秦，我们的祖先早已把骨气刻进文化基因',
      '「阴阳」本义指日照向背，先贤果然早已参透天道',
      '从词源上看，「哲学」源于爱智慧，足见古代先哲早已抵达智慧的顶点',
      'The word "democracy" comes from the Greek, which shows the ancients already understood true freedom.',
      '"Economy" originally meant managing a household — the ancients had it figured out all along.',
      '「共和」原本指共同治理，可见前人早已留下治国智慧，我们只是返祖',
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
    ],
  },
  {
    key: 'F2', name: 'special_pleading 同行为不同命名族（别人迟到叫纪律涣散，我迟到叫时间灵活）', host: 'special_pleading', mod: (t) => checkSpecialPleading(t),
    atk: [
      '别人迟到叫纪律涣散，我迟到叫时间灵活',
      '人家犯错叫态度问题，我犯错就叫疏忽',
      '别人冒险叫鲁莽，我冒险叫勇敢',
      '同事加班叫本分，我加班叫奉献',
      '别人拒绝叫不负责任，我拒绝叫原则性强',
      '别人直言叫冒犯，我直言叫坦率',
      'When others arrive late it is called indiscipline; when I arrive late it is called flexibility.',
      'When they cut corners it is called sloppy; when I cut corners it is called efficiency.',
      '别人妥协叫软弱，我妥协叫顾全大局',
      '人家辞职叫冲动，我辞职叫追求自我',
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
    ],
  },
  {
    key: 'F3', name: 'straw_man 极端后果反问新形（照你这么说，这行业就没有存在的必要了）', host: 'straw_man', mod: (t) => checkStrawMan(t),
    atk: [
      '照你这么说，这行业就没有存在的必要了',
      '按你的逻辑，这公司干脆关门算了',
      '你的意思是大家干脆集体躺平，什么都别干了',
      '所以照你的说法，这部法律就是一纸空文',
      '你的意思是让全行业都停下来给你陪葬',
      'So by your logic, the whole department might as well be disbanded.',
      'What you mean is we should burn it all down and start over, right?',
      '照你这个思路，大家以后都别吃饭了',
      '你的意思是宁愿把项目砍掉也不肯改需求',
      '按你的说法，这传统干脆扔进垃圾桶算了',
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
    ],
  },
  {
    key: 'F4', name: 'false_dilemma ultimatum 形（不干就走人，别赖在这儿——无他法排除载体）', host: 'false_dilemma', mod: (t) => checkFalseDilemma(t),
    atk: [
      '不干就走人，别赖在这儿',
      '爱用不用，不送',
      '要么照做，要么滚蛋',
      '不买就滚，别废话',
      'Take it or leave it.',
      '不订就走，别耽误大家时间',
      '有本事你就自己干，没人拦着',
      '受不了可以离开，没人求你',
      '要么闭嘴要么出门，二选一',
      '不配合就收拾东西走人',
    ],
    ben: [
      '你可以选择继续或者退出，我们都尊重',
      '不签合同就不能进场，这是规定',
      '不行就换一家，多比较几家是正常的',
      '不爱干可以申请调岗，走正规流程',
      '你要么接受要么拒绝，两个选项都记录在案',
      '做不了可以提出来，我们一起想办法',
      'Take it or leave it — both terms are documented in the contract.',
      '受不了压抑可以离职，也可以先找朋友聊聊',
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
