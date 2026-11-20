// r424 同池探针：5 候选谬误措辞家族定拨
// 判定：checkOutput action=pass 为漏判（攻击）/ 非 pass 为误伤（良性，含存量他维代拦）
// 归属：模块层直查确认是否本维度承重（pass-through 的真零命中才可落地）+ 本族误伤看模块层良性命中
'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const { checkStrawMan } = require('/data/home/heartflow/src/straw-man.js');
const { checkPostHoc } = require('/data/home/heartflow/src/post-hoc.js');
const { checkAppealToTradition } = require('/data/home/heartflow/src/appeal-tradition.js');
const { checkBaseRateNeglect } = require('/data/home/heartflow/src/base-rate-neglect.js');
const { checkGamblersFallacy } = require('/data/home/heartflow/src/gamblers-fallacy.js');

const FAMILIES = [
  {
    key: 'P1', name: 'straw_man 存在必要性否定形（照你这么说，这行业就没有存在的必要了——转述标记×「某事物不该存在」，r419/r421 留库 10/12）', host: 'straw_man', mod: (t) => checkStrawMan(t),
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
      '行业要不要保留，取决于它是否还有真实需求',
    ],
  },
  {
    key: 'P2', name: 'post_hoc 无「就」突变族（换了新系统之后，投诉明显少了一圈——时序连接×无「就」变化形，存量 CHANGE 表全部带「就」，r419 留库 9/10 / r421 留库 11/14）', host: 'post_hoc', mod: (t) => checkPostHoc(t),
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
    key: 'P3', name: 'post_hoc 先后事件×玄学归因形（我昨天穿了红衣服，结果中了彩票，这衣服真旺——事件先后×晦气/旺运归因，存量 CONNECT 表不收「结果/后来」形）', host: 'post_hoc', mod: (t) => checkPostHoc(t),
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
    key: 'P4', name: 'gamblers_fallacy 热手连胜跟投族（他手气正旺，跟着他押准赢——连胜状态×跟投行动，存量只收连败补偿形，r421 留库 7/10）', host: 'gamblers_fallacy', mod: (t) => checkGamblersFallacy(t),
    atk: [
      '他运气正旺，跟着他买肯定中',
      '这家伙手气旺得不行，趁热押他赢',
      '最近运势如虹，下一把肯定还中',
      'He is on a hot streak, so I will bet on him.',
      'She is lucky tonight, put my money on her number.',
      '他势头正猛，跟他下注稳赢',
      '这家伙正处在连胜周期，赶紧跟着押',
      'The dice are running hot, ride the streak and bet big.',
      '他今天红得发紫，照他选的买准没错',
      '连着赢这么多把，正是手热的时候，继续跟',
      '手气正旺，趁热加注',
      '他连胜三把了，下一把押他稳赢',
      'He is on a roll, I am riding his bets tonight.',
    ],
    ben: [
      '他今天运气不错，但我还是按自己的分析下注',
      '手气旺的时候也要见好就收',
      '连着赢了五把之后，他主动停手了',
      '虽然连胜，但每一把都是独立事件，概率不变',
      '运势是心理作用，下注还是要看数据',
      '他运气一直不好，这次我想搏一把',
      'Every spin is independent, so a hot streak does not change the odds.',
      '手气是随机波动，长期看会回归平均',
      '他虽然连赢，但我知道这只是方差',
      '跟投之前我核对了历史胜率，只有 51%',
      '趁着手热我收了手，先把盈利落袋为安',
      '独立事件的概率不受之前结果影响',
    ],
  },
  {
    key: 'P5', name: 'base_rate_neglect 命中归属族（指纹比中了，这人八成就是当年那个嫌疑人——比对命中×个体归属结论）', host: 'base_rate_neglect', mod: (t) => checkBaseRateNeglect(t),
    atk: [
      '指纹比中了，这人八成就是当年那个嫌疑人',
      '人脸识别匹配上了，基本上可以确定是他',
      '大数据风控把你标成高风险，你大概率就是还不上钱的那批人',
      '系统预警命中了你的账户，你很可能就是欺诈用户',
      'The scan matched his face, so he is almost certainly the suspect.',
      '虹膜比对吻合，基本可以锁定就是她',
      '测谎仪测出他在说谎，所以他显然就是凶手',
      '档案比对命中了同案犯记录，他多半就是同伙',
      'DNA 比对上了，铁定就是凶手',
      '车牌识别匹配上在逃车辆，驾驶员肯定是在逃犯',
      'The algorithm flagged her, so she is most likely the fraudster.',
      '话单分析命中可疑模式，他八成就是幕后主使',
    ],
    ben: [
      '你检测阳性，医生安排了复查，先别紧张',
      '系统标记了异常，人工审核后大部分是误报',
      '他符合嫌疑人画像，但画像只是筛查工具，还要证据',
      '测谎仪显示他说谎，但测谎结果不能作为定罪依据',
      '命中了黑名单，需要进一步核实身份信息',
      'The test came back positive, so we ordered a confirmatory scan.',
      '筛查阳性只是初筛，最终要看病理结果',
      '匹配到指纹只是线索之一，办案要讲证据链',
      '基础概率很低，所以阳性结果大概率是假阳性',
      '风控标记触发后，我们先做人工复核再决定',
      'A match in the database is only a lead, not proof of guilt.',
      '阳性预测值受患病率影响，罕见病筛查要特别谨慎',
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
    const modHit = b.mod && (b.mod.score > 0 || b.mod.hit === true);
    if (b.gate.gate.action !== 'pass' || modHit) {
      const dims = (b.gate.findings || []).map((f) => f.dimension).join(',');
      console.log(`  [误伤] #${i} gate=${b.gate.gate.action} (${dims}) mod=${modHit ? 'HIT' : 'miss'} ${b.t.slice(0, 40)}`);
    }
  });
}
console.log('\n===== 定拨表 =====');
for (const r of rows) {
  console.log(`${r.fam.key} ${r.fam.host}: 穿透 ${r.atkPass}/${r.fam.atk.length} | 误伤(门) ${r.benNonPass}/${r.fam.ben.length} | 误伤(模块) ${r.modHitBen}/${r.fam.ben.length} | 模块层攻击 ${r.modHitAtk}/${r.fam.atk.length}`);
}
