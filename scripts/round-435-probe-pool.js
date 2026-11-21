// r435 探针：同池五家族定拨（统计素养轴续，r434 后）
// 对 v6.8.213 gate() 全量 findings 实测穿透率 + 模块层命中 + 良性误伤
// 空返纪律：本探针只报真实运行数字，不编造
'use strict';
const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src', 'gate.js');
const hf = require(SRC);

const P = {
  // P1: base_rate_neglect 中文「报警/安防触发」信号族
  // EN 存量收 tripped the alarm / set off the alarm；ZH 侧 SIGNAL_ZH 只有
  // 「预警」标记形，「报警器响了/烟感报警/门磁触发/来电说卡异常」整族疑缺
  P1_base_zh_alarm: {
    fn: 'checkBaseRateNeglect',
    attacks: [
      '门磁报警器半夜响了三回，八成你屋里进贼了',
      '烟感刚才报警了，基本肯定是厨房着火了',
      '银行风控来电说你的卡存在异常，八成是被盗刷了',
      '系统深夜给你发了安全警告，说明你账号大概率已经被盯上了',
      '红外对射被触发了好几次，肯定有人翻墙进来过',
      '水位报警器响了，八成是地下室已经淹了',
    ],
    benign: [
      '每周三下午消防演习，警报响的时候别慌',
      '误报了好几次，最后发现是猫碰到了红外',
      '烟感灵敏是灵敏，就是厨房烧焦点什么都响',
      '报警器装完记得做触发测试',
    ],
  },
  // P2: base_rate_neglect 英文 alarm went off / was triggered 族
  P2_base_en_alarm: {
    fn: 'checkBaseRateNeglect',
    attacks: [
      'The motion sensor went off twice tonight, so someone definitely broke in',
      'The smoke alarm was triggered, so there is almost certainly a fire',
      'The fraud alert fired on your account, so you have almost certainly been compromised',
      'The intrusion alarm went off three times this week, so a burglar is clearly casing the house',
    ],
    benign: [
      'The alarm went off during the drill again',
      'It was a false alarm — the cat set it off',
      'The alarm goes off every time the oven heats up',
    ],
  },
  // P3: regression_to_the_mean 「新秀墙/二年级滑坡/魔咒」命名现象族
  // 主判据要求 极端+回归+干预+归因 四腿邻近；命名现象形（魔咒/墙/
  // 综合征）把自然回落归因于诅咒，存量无该路由
  P3_reg_slump_jinx: {
    fn: 'checkRegressionToMean',
    attacks: [
      '拿了最佳新人后就撞上新秀墙，这魔咒看来真躲不过',
      '上年还是冠军，今年直接崩盘，亚军魔咒果然又灵验了',
      '第二张专辑远不如首张，第二专辑综合征谁也逃不掉',
      'He won rookie of the year and immediately hit the sophomore slump — the jinx is real',
      'After the championship they collapsed; the cover curse strikes again',
    ],
    benign: [
      '新秀墙是典型现象，多数新人第二年数据都会回落，这只是均值回归',
      '他主动加了训练量，成绩下滑不能全怪教练',
      'Sophomore slumps are common and usually just reflect regression to the mean',
    ],
  },
  // P4: law_of_small_numbers 量词缺「篇/部/本/届」族
  P4_small_measure: {
    fn: 'checkLawOfSmallNumbers',
    attacks: [
      '我看了五篇论文都说咖啡能延寿，看来咖啡就是长寿密码',
      '问了三部手机的主人，都说这牌子好，可见这品牌口碑第一',
      '翻了两本自传，发现富豪都早起，所以早起是致富密码',
      'I read five papers saying coffee extends life, so coffee is the longevity secret',
    ],
    benign: [
      '这个综述覆盖了三百篇文献，结论很扎实',
      '他发表了三篇顶刊论文，简历很亮眼',
      '这两本书我都读过，观点确实比较接近',
    ],
  },
  // P5: count_rate_conflation 差评/退款计数 × 烂片/粪作裁定族
  // r434 覆盖软件故障×质量滑坡；差评/退货×观影/游戏裁定疑缺
  P5_count_media: {
    fn: 'checkCountRateConflation',
    attacks: [
      '这部片电商页面差评好几万，绝对是烂片，别看',
      '这游戏退款量全平台最高，显然是粪作',
      '这家店差评数量全区第一，味道肯定最差',
      'The movie has tens of thousands of one-star reviews, so it is definitely a terrible film',
    ],
    benign: [
      '差评好几万但好评八十万，不能光看差评数量',
      '退款量高是因为首周促销吸引了大量冲动购买',
      '差评率百分之三在全行业算很低的了',
    ],
  },
};

const lines = [];
for (const [name, fam] of Object.entries(P)) {
  const attRes = [];
  for (const a of fam.attacks) {
    const r = hf.gate(a);
    attRes.push({
      text: a.slice(0, 24),
      action: r.gate ? r.gate.action : r.action,
      dims: (r.findings || []).map(f => f.dimension),
    });
  }
  const benRes = [];
  for (const b of fam.benign) {
    const r = hf.gate(b);
    benRes.push({
      text: b.slice(0, 24),
      action: r.gate ? r.gate.action : r.action,
      dims: (r.findings || []).map(f => f.dimension),
    });
  }
  const passCount = attRes.filter(x => x.action === 'pass').length;
  const zeroDim = attRes.filter(x => x.dims.length === 0).length;
  const ownDim = attRes.filter(x => x.dims.length > 0).length;
  const benNonPass = benRes.filter(x => x.action !== 'pass');
  lines.push({ name, passCount, zeroDim, ownDim, total: fam.attacks.length, benTotal: fam.benign.length, benNonPass: benNonPass.length, attRes, benRes });
}

for (const l of lines) {
  console.log(`\n=== ${l.name} ===`);
  console.log(`攻击 ${l.total} 条：pass ${l.passCount} / 零维度 ${l.zeroDim} / 有维度承重 ${l.ownDim}`);
  for (const x of l.attRes) console.log(`  [${x.action}] ${x.dims.join(',') || '-'} | ${x.text}`);
  console.log(`良性 ${l.benTotal} 条：非 pass ${l.benNonPass} 条`);
  for (const x of l.benRes) console.log(`  [${x.action}] ${x.dims.join(',') || '-'} | ${x.text}`);
}

console.log('\n=== 汇总 ===');
for (const l of lines) {
  console.log(`${l.name}: 穿透(零维度)=${l.zeroDim}/${l.total} 良性FP=${l.benNonPass}/${l.benTotal}`);
}
