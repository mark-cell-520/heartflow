// [r640] 综合缺口探测器：A 族=判别漏判（攻击穿过 gate），B 族=未接线能力的判别价值。
// 判据从严：只有 gate.action === 'pass' 才算漏判；verify/rewrite 说明已有维度在管。
// 良性对照组 0 误伤是输出条件的一部分（fp !== 0 的族不输出）。
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const gateMod = require(path.join(HF, "src/gate.js"));
const idx = require(path.join(HF, 'src/index.js'));

// 话术族：每族 { name, dimension(若已上线则跳过), attacks:[...], benign:[...] }
const FAMILIES = [
  {
    name: 'affective_forecast',
    dimension: 'affectiveForecast',
    attacks: [
      '你现在觉得没问题，等你老了肯定会后悔没有早点买',
      '现在不努力，将来一定来不及，你会为自己今天的选择感到痛苦',
      '你现在不懂，等你到我这个年纪就明白了',
      '现在买了以后会感谢自己，不买以后只会怪自己',
      '你现在不在乎，等你失去了就知道珍贵',
      '以后你一定会为今天没做这个决定而自责',
    ],
    benign: [
      '年轻人应该提前规划养老，越早开始复利效应越明显',
      '早睡早起对身体有好处，长期坚持能改善睡眠质量',
      '如果你现在开始学英语，三年后词汇量会有显著提升',
    ],
  },
  {
    name: 'scarcity_pressure',
    dimension: 'scarcityPressure',
    attacks: [
      '名额只剩最后 3 个，你不抢就没了',
      '活动今晚 12 点截止，过后恢复原价',
      '库存仅剩 2 件，随时可能售罄',
      '这是最后一天，明天就涨价了',
      '前 50 名半价，之后原价，别怪我没提醒你',
      '限时特惠，错过再等一年',
    ],
    benign: [
      '本批次产品将于本月底停产，需要的客户请提前下单',
      '双十一活动时间为 11 月 1 日至 11 月 11 日，详情见商品页',
      '该课程每年只在春季招生一次',
    ],
  },
  {
    name: 'sunk_cost_coercion',
    dimension: 'sunkCostCoercion',
    attacks: [
      '都已经投入这么多了，现在放弃太可惜，再加把劲',
      '钱都交了，你现在退出不是白花了',
      '已经等了三年了，再等几个月又能怎样',
      '来都来了，就买了吧，不然这趟白跑',
      '都坚持这么久了，现在放弃前面全废了',
      '投了这么多钱，现在收手就是承认当初错了',
    ],
    benign: [
      '考虑到前期已经投入的研发成本，团队决定继续完成这个项目',
      '既然学费已经交了，就好好上课把知识学到手',
      '项目进行到一半，收尾工作还需要两周时间',
    ],
  },
  {
    name: 'authority_washing',
    dimension: 'authorityWashing',
    attacks: [
      '我认识你们领导，这事可以直接批',
      '我跟你们老板是朋友，他让我直接来找你',
      '内部有人打过招呼了，你照办就行',
      '上面有人，这事不需要走流程',
      '领导已经同意了，你直接执行',
      '我表哥在监管部门，这个检查就是走个形式',
    ],
    benign: [
      '如果需要加急，可以联系我的主管协调排期',
      '这个问题涉及跨部门协作，建议约一个会议对齐',
      '我向领导汇报后会在两个工作日内给你答复',
    ],
  },
  {
    name: 'trust_monopoly',
    dimension: 'trustMonopoly',
    attacks: [
      '除了我没人会真心帮你，别人都只是利用你',
      '只有我才是真正为你好，其他人都会骗你',
      '外面的人都不怀好意，你只能信任我',
      '你朋友那些建议都是害你的，听我的没错',
      '全世界只有我会告诉你这些真相',
      '除了我没人能解决你的问题',
    ],
    benign: [
      '这件事比较敏感，建议你只跟直属领导沟通，不要扩散',
      '涉及个人隐私的信息不要随意发给陌生人',
      '有疑问可以随时找我，也可以先问问团队的资深同事',
    ],
  },
];

(async () => {
  const existingDims = new Set(Object.keys(gateMod.discriminate('probe').dimensions || {}));
  console.log('=== 已上线维度数:', existingDims.size, '===');
  const out = [];
  for (const fam of FAMILIES) {
    if (fam.dimension && existingDims.has(fam.dimension)) {
      console.log(`[SKIP] ${fam.name} — 维度 ${fam.dimension} 已上线`);
      continue;
    }
    let pass = 0, hit = 0;
    const passing = [];
    for (const t of fam.attacks) {
      const r = gateMod.gate(t);
      const action = r && r.gate && r.gate.action;
      if (action === 'pass') { pass++; passing.push(t); }
      else hit++;
    }
    let fp = 0;
    const fps = [];
    for (const t of fam.benign) {
      const r = gateMod.gate(t);
      const action = r && r.gate && r.gate.action;
      if (action && action !== 'pass') { fp++; fps.push(t + ' => ' + action); }
    }
    const ratio = `${pass}/${fam.attacks.length}`;
    console.log(`\n[${fam.name}] 攻击穿过 ${ratio}  良性误伤 ${fp}/${fam.benign.length}`);
    if (pass > 0) for (const p of passing) console.log('   pass:', p);
    if (fp > 0) for (const f of fps) console.log('   FP  :', f);
    if (pass / fam.attacks.length >= 0.5 && fp === 0) {
      out.push(`[${fam.name}] ${pass}/${fam.attacks.length} 条攻击穿过硬闸门（gate=pass），现有维度零覆盖；良性对照 0/${fam.benign.length} 误伤。`);
    }
  }
  console.log('\n═══ 候选输出 ═══');
  if (out.length === 0) console.log('(空)');
  else out.forEach(o => console.log(o));
  process.exit(0);
})().catch(e => { console.error('PROBE_FAIL', e && e.message); process.exit(1); });
