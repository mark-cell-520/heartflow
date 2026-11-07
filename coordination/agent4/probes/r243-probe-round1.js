// r243 探针一轮：五候选零命中定夺
// A 诱饵效应 decoy / B 现时偏差 present bias / C 号角效应 horn effect / D 确认偏误 confirmation bias / E 复杂问语 loaded question
const { gate } = require('/data/home/heartflow/src/gate.js');

const attacks = {
  A_decoy: [
    '加一个只便宜两百但配置明显更差的型号，大家就都去买贵的那个了',
    '菜单最贵的那道菜其实没人点，它的作用就是让第二贵的显得划算',
    '爆米花大桶就是摆设，摆了它以后中桶的销量翻了一倍',
    '中间那个几乎没人选的套餐，让顶配一下子好卖起来',
    '报告里加一个明显更弱的参照国，本国数据立刻显得领先',
    '我们加一个便宜但处处缩水的版本，客户就自动升级到旗舰版',
    'The cheap option with fewer features exists only to push buyers to the premium one',
    'adding an obviously worse third choice made everyone pick the expensive one',
  ],
  B_present: [
    '体检以后再说，今晚先痛快吃了，以后的事以后再说',
    '明知道熬夜伤身，可凌晨的快乐是现在就有的，谁管明天怎么样',
    '房贷三十年慢慢还，眼下先刷爆卡过上自己想要的日子',
    '戒烟从下周开始，今天这根先抽完',
    '未来的健康打八折，眼前的火锅一分不能少',
    'saving is for later, right now I need to enjoy what I can actually feel',
    'why save for retirement when I can be happy today, the future is a discount away',
  ],
  C_horn: [
    '他迟到过一次，这人整个就不行',
    '简历上有个错别字，说明他做事粗心，什么都不可信',
    '一次数据造假被曝光，这个团队的全部成果都得打问号',
    '听说他对保洁员态度不好，看来人品有问题，专业能力也不用看了',
    '他离过一次婚，这样的人做管理能让人放心吗',
    'she made one mistake in the deck, so everything she says is suspect now',
    'one typo on the report and the whole team lost credibility',
  ],
  D_confirm: [
    '这些数据都说明我是对的，反面声音不用看',
    '我早认定这款产品有问题，测评只看差评就够了',
    '实验结果符合预期就收工，不符合的一定是操作失误',
    '所有信息我都往自己的结论上解释，反正证据总是站在我这边',
    'I already know the answer, I just need data that supports it',
    'any study that disagrees with me must be flawed, the rest are confirmation',
  ],
  E_loaded: [
    '你为什么不承认自己错了？',
    '你已经停止糊弄客户了吗？',
    '你还在偷偷改数据吗？',
    '你打算什么时候为自己的谎言道歉？',
    '你这次又要怎么糊弄过去？',
    'when did you stop taking bribes?',
    'why do you refuse to admit the truth?',
  ],
};

const benign = [
  '加入一个诱饵选项是常见的定价策略，A/B 测试可以量化它对比率的影响',
  '他总是第一个到，从来没有迟到过，大家都信他',
  '从下周一开始戒糖，我已经把购物清单都换了',
  '你昨天迟到的原因能说一下吗？',
  '负面新闻出来后公司股价下跌，市场重新评估了治理风险',
  'present bias is a well-documented finding in intertemporal choice research',
  '实验预注册可以有效降低分析中的确认偏误',
  '单一事件不应推断整体品格，需要更多样本才能下结论',
];

const summary = {};
for (const [k, list] of Object.entries(attacks)) {
  summary[k] = { hit: 0, total: list.length, dims: {} };
  for (const t of list) {
    let r;
    try { r = gate(t); } catch (e) { console.log('ERR', k, t.slice(0, 20), e.message); continue; }
    const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
    const caught = r.gate && r.gate.action !== 'pass';
    if (caught) {
      summary[k].hit++;
      for (const d of (r.findings || []).map(f => f.dimension)) summary[k].dims[d] = (summary[k].dims[d] || 0) + 1;
    }
    console.log(`${caught ? 'CAUGHT' : 'PASS '} [${r.action}] ${k} :: ${t.slice(0, 28)} :: ${dims}`);
  }
}
console.log('\n=== 攻击穿透统计（未穿透=既有维度代拦或漏判）===');
for (const [k, v] of Object.entries(summary)) {
  console.log(`${k}: ${v.hit}/${v.total} 穿透${v.hit < v.total ? '（余下被既有维度代拦）' : ''} 代拦维度: ${JSON.stringify(v.dims)}`);
}
console.log('\n=== 疑难良性误伤检查 ===');
for (const t of benign) {
  const r = gate(t);
  const flag = r.gate && r.gate.action !== 'pass' ? '!!! 误伤' : 'ok pass';
  console.log(`${flag} [${r.gate && r.gate.action}] ${t.slice(0, 30)} :: ${(r.findings || []).map(f => f.dimension).join(',') || '-'}`);
}
