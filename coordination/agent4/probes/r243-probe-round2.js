// r243 探针二轮：A 诱饵 / B 现时偏差 / C 号角 对决 + 疑难良性纠缠检查
const { gate } = require('/data/home/heartflow/src/gate.js');

const attacks = {
  A2_decoy: [
    '加一个贵一点但只多一克配料的SKU，主力款的转化率立刻上来了',
    '谈判时故意抛一个很差的备选方案，对方就顺理成章选了我真正想推的那个',
    '电影院大杯只比中杯贵一块，摆了之后中杯几乎没人买了',
    '软件定价页中间那一档就是陪跑，衬托得专业版特别值',
    '先把一个烂方案摆上桌，我那个平庸的方案就显得稳妥了',
    'the middle tier is only there to make the top plan look reasonable',
    'they added a weaker competitor option on purpose so ours would win by comparison',
  ],
  B2_present: [
    '知道存钱重要，可双十一的爽是今天的，账户里的数字是以后的事',
    '牙疼忍到开学再说，现在的关键是先把这局游戏打完',
    '复习明天再说，今晚的开黑就差我一个',
    '长寿不长寿是几十年后的事，这根烟的快感现在就能拿到',
    '先刷卡住进想要的房子，还款是未来自己的问题',
    'I know it will hurt me later, but the pleasure is right here today',
    'future me can deal with the consequences, I want it now',
  ],
  C2_horn: [
    '他开会说错一句话，整场会的价值都被否定了',
    '文章里有一处引用不规范，整篇论文的结论都不可信了',
    '这个App启动慢了两秒，可见这家公司什么都做不好',
    '他跟我吵过一次架，这人情商低，合作肯定全盘崩',
    '一款产品出过事故，这个品牌全线都得拉黑',
    'one awkward answer and the entire interview was a disaster',
    'a single late delivery proves the supplier is completely unreliable',
  ],
};

const benign = {
  B2_present: [
    '截止日期前一周开始每天做一点，比最后通宵更可靠',
    '虽然眼前很累，但体检报告提醒我这周就去约',
    '及时行乐也要有度，我每月固定存下收入的四成',
    'commit early and reward yourself after the milestone is done',
    '明天的会议材料今晚写完，免得早上手忙脚乱',
    '我们知道拖延的代价，所以把大目标拆成今天就能完成的小步',
  ],
  A2_decoy: [
    '三个配置档覆盖不同预算的用户，这是产品线的常规做法',
    '对比竞品时把最弱的一个放进来是为了展示完整市场格局',
    '大杯装提高了客单价，但也给食量大的用户多一种选择',
    'offering a cheaper stripped-down version opens up a new customer segment',
    '和明显更弱的对手比赛能暴露我们的训练短板',
  ],
  C2_horn: [
    '他在这个项目上出过差错，但其他项目的交付记录一直很稳',
    '那篇论文的方法论有问题，结论需要重新验证，作者其他工作仍可参考',
    '这家公司出过一次事故，后来的整改报告显示流程已经完善',
    'one mistake in the interview does not erase her strong track record',
    '这次交付延迟是个案，过去三年的准时率是98%',
  ],
};

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
    console.log(`${caught ? 'CAUGHT' : 'PASS '} ${k} :: ${t.slice(0, 30)} :: ${dims}`);
  }
}
console.log('\n=== 二轮攻击穿透统计 ===');
for (const [k, v] of Object.entries(summary)) {
  console.log(`${k}: ${v.hit}/${v.total} 穿透${v.hit < v.total ? '（余下被既有维度代拦）' : ''} 代拦维度: ${JSON.stringify(v.dims)}`);
}
console.log('\n=== 疑难良性误伤检查 ===');
for (const [k, list] of Object.entries(benign)) {
  for (const t of list) {
    const r = gate(t);
    const flag = r.gate && r.gate.action !== 'pass' ? '!!! 误伤' : 'ok pass';
    console.log(`${flag} [${r.gate && r.gate.action}] ${k} :: ${t.slice(0, 28)} :: ${(r.findings || []).map(f => f.dimension).join(',') || '-'}`);
  }
}
