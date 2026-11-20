// r426 同池探针：4 候选谬误措辞家族定拨（基线态，HEAD 6.8.211）
// 判定：checkOutput action=pass 为漏判（攻击）/ 非 pass 为误伤（良性，含存量他维代拦）
// 归属：模块层直查确认是否本维度承重（pass-through 的真零命中才可落地）+ 本族误伤看模块层良性命中
// Q1/Q2 样本与 r424-probe-pool.js 的 P3/P2 逐字一致（r421/r424 两轮留库实测：P3 11/12、P2 11/14），
// 本轮在新 HEAD 复测后与同池新族 Q3/Q4 公平定拨。
'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const { checkPostHoc } = require('/data/home/heartflow/src/post-hoc.js');
const { checkStrawMan } = require('/data/home/heartflow/src/straw-man.js');

const FAMILIES = [
  {
    key: 'Q1', name: 'post_hoc 先后事件×玄学归因形（我昨天穿了红衣服，结果中了彩票，这衣服真旺——事件先后×晦气/旺运归因，存量 CONNECT 表不收「结果/后来」形，r424 留库 11/12）', host: 'post_hoc', mod: (t) => checkPostHoc(t),
    atk: [
      '我昨天穿了红衣服，结果中了彩票，这衣服真旺',
      '那天出门摔了一跤，果然当天就下雨了',
      '他上次说了句晦气话，后来项目就黄了',
      '我出门前忘了拜一拜，结果客户就没签成',
      '上次开会前打印机坏了，果然那天谈得不太顺',
      '我生日那天买了这只猫，之后财运一直不错',
      '他临走前把杯子摔了，后来团队就散了',
      '早上喜鹊叫了两声，果然下午就来了好消息',
      'I wore my lucky tie and got the deal, so the tie works.',
      'The printer jammed before the meeting, and sure enough the talks went badly.',
      'He forgot to say the blessing, and the client walked away.',
      'We skipped the ritual, and the whole launch fell apart.',
    ],
    ben: [
      '昨天穿了红衣服，今天下雨了，这两件事没有关系',
      '他摔了一跤之后我扶他起来，这只是先后发生',
      '项目黄了需要复盘原因，不能只归因于一句话',
      'I wore a new tie and the deal closed, but that is coincidence.',
      '打印机坏了是偶发故障，和谈判结果没有因果关系',
      '客户没签成要分析报价和需求匹配度',
      '生日买猫和财运是同时发生的事，没有因果证据',
      '团队解散涉及组织调整，要看成因链',
      '喜鹊叫和好消息只是时间上的巧合',
      'The printer jam is a hardware issue, unrelated to how the talks went.',
      '忘拜一拜和丢单没有关系，要看销售过程',
      '跳过仪式和发布失败之间需要对照数据',
    ],
  },
  {
    key: 'Q2', name: 'post_hoc 无「就」突变族（换了新系统之后，投诉明显少了一圈——时序连接×无「就」变化形，存量 CHANGE 表全部带「就」，r421 留库 11/14）', host: 'post_hoc', mod: (t) => checkPostHoc(t),
    atk: [
      '换了新系统之后，投诉明显少了一圈',
      '调整配方以后，废品率降了三成',
      '自从戴了这个护身符，他再也没磕过碰过',
      '用了新机油以后，发动机声音小了很多',
      '更新了值班表之后，迟到现象少多了',
      '自从供了这尊财神，店里的营业额明显上去了',
      '换了这个头像以后，账号流量起来了',
      '开始晨跑以后，感冒明显少了',
      '装了新软件之后，死机彻底消失了',
      '喝了这壶茶之后，喉咙舒服多了',
      'After we switched systems, complaints dropped sharply.',
      'Once he started wearing the charm, his luck improved dramatically.',
      'Since the new schedule, lateness has fallen by a third.',
      'Ever since the update, crashes have all but disappeared.',
    ],
    ben: [
      '产量波动可能和很多因素有关，还需要继续排查',
      '配方调整和废品率下降可能只是相关，不等于因果',
      '自从调整了作息，我感觉精神好了一些，不过也可能是心理作用',
      'After the update, error rates fell, but we need more data to confirm causation.',
      '投诉量变化还要看季节性因素，不能只归因于系统更换',
      '营业额上升可能和旺季有关，需要对照组验证',
      '流量起来了是事实，但归因需要更多数据',
      '晨跑和感冒减少只是时间上的先后，未必有因果',
      '销售额变化受促销影响很大，不能只归因于换包装',
      '数据要跑够样本量才能下结论，现在还为时过早',
      '死机消失可能和温度下降也有关，需要进一步观察',
      'After the new schedule, lateness dropped, but we are still collecting baseline data.',
      '现象发生了变化，原因还在排查中',
    ],
  },
  {
    key: 'Q3', name: 'post_hoc 每次共现归因族（新设计：每逢他一在场就准出岔子——每次/每逢×灾殃共现把规律巧合当因果，存量四路由均不收 every-time 形）', host: 'post_hoc', mod: (t) => checkPostHoc(t),
    atk: [
      '每次他一带我打排位，我就连输',
      '每逢月底，系统必崩',
      '每当我在场，准得吵起来',
      '每次开完这个会，项目准出事',
      '每回他一碰代码，构建就失败',
      '每次我一带队，业绩就下滑',
      'Every time she reviews my code, the build breaks.',
      'Whenever I present, the demo always crashes.',
      'Every time we deploy on Friday, something goes wrong.',
      '每次一到月底，财务就对不上账',
      '每逢他值班，设备就故障',
      'Every time he joins the call, the connection drops.',
    ],
    ben: [
      '每次发布前都要跑一遍回归测试',
      '每逢月底，财务部都会出报表，这是固定流程',
      '每次开完评审会，我们都会记录问题清单',
      '每当我看到这只股票的名字，就想起那次教训',
      'Every time we run the benchmark, the results are recorded in the dashboard.',
      '每到季度末，客服工单量都会上升，需要提前排班',
      '每次发布会前，团队都会做三轮彩排',
      '每逢下雨，这条隧道就会积水，市政正在排查原因',
      'Whenever the temperature drops below zero, the pipes freeze.',
      '每次重启后，服务要十分钟才稳定',
      'Every time the dataset grows, training time increases proportionally.',
      '每到月底，报销单就会堆成山，大家都习惯了',
    ],
  },
  {
    key: 'Q4', name: 'straw_man 存在必要性否定形·新措辞（按你的逻辑，这东西不要也罢——r424 交接给 2 号的加压候选，NEEDLESS c2 支只收「直接/彻底/完全+推倒重来」）', host: 'straw_man', mod: (t) => checkStrawMan(t),
    atk: [
      '按你的逻辑，这东西不要也罢',
      '照你这么说，干脆连锅端算了',
      '你的意思是这门手艺不传也罢',
      '按你的说法，这个传统环节干脆全省了',
      '照你的逻辑，这些老规矩全都不要也罢',
      'So by your logic, we might as well scrap the whole thing.',
      '你的意思是把这个部门连窝端掉才好',
      '按你说的话，这项检查不搞也罢',
      '照你这么说，干脆一把火烧了重写',
      '你的意思是非得推倒重来不可',
      '按你的逻辑，这传统保持不保持都一样',
      '照你这么说，这岗位设了也是白设',
    ],
    ben: [
      '按你的逻辑，第三步推不出来',
      '你的意思是需要先跑测试再上线吗',
      '照你这么说，工期要延长两周',
      'Do you mean we should run the tests first?',
      '按你的说法，成本还能再降两成',
      '你的方案会影响到下游团队，需要评估',
      '照你的逻辑，这个结论还需要更多数据支撑',
      '按你的意思，我们把发布安排在下周',
      '你的意思是这个模块要重写一遍吗',
      'We should evaluate the risks before changing the process.',
      '按你的逻辑，这条路暂时走不通，需要绕行',
      '你的意思是先把旧数据归档再迁移吗',
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
    const modHitAtk = atkRes.filter((r) => r.mod && (r.mod.score > 0 || r.mod.hit === true || (r.mod.matches && r.mod.matches.length))).length;
    const modHitBen = benRes.filter((r) => r.mod && (r.mod.score > 0 || r.mod.hit === true || (r.mod.matches && r.mod.matches.length))).length;
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
    const modHit = a.mod && (a.mod.score > 0 || a.mod.hit === true);
    if (a.gate.gate.action === 'pass') {
      console.log(`  [漏判] #${i} mod=${modHit ? 'HIT' : 'miss'} ${a.t.slice(0, 46)}`);
    } else {
      console.log(`  [代拦] #${i} ${a.gate.gate.action} (${dims}) mod=${modHit ? 'HIT' : 'miss'} ${a.t.slice(0, 40)}`);
    }
  });
  r.benRes.forEach((b, i) => {
    const dims = (b.gate.findings || []).map((f) => f.dimension).join(',');
    const modHit = b.mod && (b.mod.score > 0 || b.mod.hit === true);
    if (b.gate.gate.action !== 'pass') {
      console.log(`  [误伤] #${i} ${b.gate.gate.action} (${dims}) mod=${modHit ? 'HIT' : 'miss'} ${b.t.slice(0, 40)}`);
    }
  });
}
console.log('\n===== 定拨汇总 =====');
for (const r of rows) {
  console.log(`${r.fam.key} ${r.fam.host}: 穿透 ${r.atkPass}/${r.fam.atk.length} | 良性误伤 ${r.benNonPass}/${r.fam.ben.length} | 模块层攻击 ${r.modHitAtk}/${r.fam.atk.length} | 模块层良性 ${r.modHitBen}/${r.fam.ben.length}`);
}
