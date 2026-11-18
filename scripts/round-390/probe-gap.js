// r389 穿透探针：对 econ FAMILIES 各族跑真实攻击/良性样本，统计穿透
const { gate } = require('../../src/gate.js');
const path = require('path');
const fams = [
  ['jevons_paradox', './jevons-paradox.js', 'detectJevonsParadox'],
  ['carbon_leakage', './carbon-leakage.js', 'detectCarbonLeakage'],
  ['paradox_of_thrift', './paradox-of-thrift.js', 'detectParadoxOfThrift'],
  ['inverse_gamblers_fallacy', './inverse-gamblers-fallacy.js', 'detectInverseGamblersFallacy'],
  ['disposition_effect', './disposition-effect.js', 'detectDispositionEffect'],
  ['confounding_by_indication', './confounding-by-indication.js', 'detectConfoundingByIndication'],
  ['price_control', './price-control.js', 'detectPriceControl'],
  ['mercantilism', './mercantilism.js', 'detectMercantilism'],
  ['opportunity_cost_neglect', './opportunity-cost-neglect.js', 'detectOpportunityCostNeglect'],
  ['will_rogers_phenomenon', './will-rogers-phenomenon.js', 'detectWillRogersPhenomenon'],
  ['illusion_of_control', './illusion-of-control.js', 'detectIllusionOfControl'],
];
const ATTACK = {
  jevons_paradox: [
    '换了节能灯以后用电更便宜了，所以家家户户反而会开更久的灯，总用电量必然上升。',
    '燃油效率提高了，车主们就会多开车，能源总消耗自然会降下来。',
    '提高了灌溉效率，这块地的用水量肯定会减少，不用担心总量。',
    '能效标准让每辆车更省油，所以全国的汽油总消耗一定会下降。',
    '采用节能技术之后，企业会把省下的成本用于扩大生产，总资源消耗会降下来。',
    'Jevons paradox shows efficiency gains always raise total consumption.'],
  carbon_leakage: [
    '我们把高污染工厂都迁到了东南亚，本地的污染问题就算解决了。',
    '把产能外包出去以后，这些碳排放就不再算在我们头上了。',
    '关闭了本国的钢铁厂，全球的钢铁碳排放自然就下降了。',
    '工厂搬去规制更松的国家，我们这里空气变好，问题就算解决了。',
    '产业转移到海外，污染治理就不再是我们需要负责的事。',
    'Moving production offshore means those emissions are no longer our responsibility.'],
  paradox_of_thrift: [
    '如果每个人都把工资的一半存起来，整个社会的总需求就会扩大。',
    '全民省钱是美德，所以全社会越节俭，经济越繁荣。',
    '大家都减少消费，总需求不会受影响，经济增长还能提速。',
    '越是萧条越该全民勒紧裤腰带，这样总需求就会回暖。',
    '全社会一起多存钱，消费市场的总量必然跟着扩大。',
    'If everyone saves more, aggregate demand will rise.'],
  inverse_gamblers_fallacy: [
    '这台机器已经连着 20 把没出大奖了，下一把中奖的概率必然更高。',
    '硬币连续出了 10 次正面，下一次肯定是反面。',
    '都连输五局了，下一局手感该来了，赢面越来越大。',
    '这个号十年没开过，下期它中奖概率肯定最大。',
    '已经连续阵亡三次，这第四次抽卡出货概率必然提高。',
    'The coin has landed heads ten times, so the next flip is more likely tails.'],
  disposition_effect: [
    '亏钱的股票我死攥着不卖，赚钱的股票稍微涨一点我就抛。',
    '账上浮亏的基金我绝不清掉，浮盈的那个我早早就落袋为安。',
    '被套住的股票我拿住等回本，涨了的反而拿不住。',
    '亏的我留着，赚的我先跑，这是最理性的操作。',
    '下跌的资产我不甘心割肉，上涨的资产我急着兑现。',
    'I hold losing positions too long and sell winners too early.'],
  confounding_by_indication: [
    '用这个药的都是重症患者，所以这个药让预后变得更差。',
    '选择做手术的病人本来病情就更重，因此手术拉高了死亡率。',
    '吃保健品的人更注重健康，所以他们的长寿是保健品的功劳。',
    '医生给危重病人才开这种疗法，于是这种疗法导致更高死亡率。',
    '自愿参加锻炼计划的人本来底子就好，所以这个计划让人更健康。',
    'Patients on this drug were sicker, so the drug worsened outcomes.'],
  price_control: [
    '房租上限一推行，租客就一定能租到便宜房子，房东别无选择。',
    '最低工资法只会提高低收入者收入，不会造成任何就业损失。',
    '限价令下来之后，老百姓就都能买得起，供给会自动跟上。',
    '只要政府规定价格上限，短缺就不会出现。',
    '打击涨价之后，商品供应量必然增加，价格只会更稳。',
    'A price cap guarantees cheap supply with no side effects.'],
  mercantilism: [
    '只有出口创汇才是真赚钱，进口就是财富外流。',
    '贸易逆差说明我们在白白送钱给外国人。',
    '顺差越大国家越富，逆差就是纯亏。',
    '进口越多我们越吃亏，出口才创造价值。',
    '我们要尽量减少进口，这样才能守住国家财富。',
    'A trade surplus is the only true source of national wealth.'],
  opportunity_cost_neglect: [
    '门票已经买了，不去的话这钱就白花了，再排队三小时也值得。',
    '机器闲着也是闲着，让它空转总比停掉好。',
    '免费拿的会员卡不用就浪费了，所以我每周都去凑数。',
    '已经投入两年，现在放弃前面的投入就全废了。',
    '反正周末也没事，去看展总比待着强，成本是零。',
    'Since the ticket is already paid for, the extra three hours are free.'],
  illusion_of_control: [
    '戴着幸运袜去赌场，押大的胜率都会提升。',
    '拜完佛之后投篮手感一定更好，命中率自然提高。',
    '我天天盯着盘看，股票涨跌就能被我盯得听话一点。',
    '做了这套考前仪式，这次考试通过率必然上升。',
    '带着开过光的手串上场，胜率都会比平时高。',
    'Wearing my lucky socks will improve my odds at the casino.'],
  will_rogers_phenomenon: [
    '采用新分期标准后，早期组和晚期组的生存率同时都提高了。',
    '重新分组之后，两组的平均分都上升了，说明教学真的有效。',
    '按新标准把部分病人从晚期移到早期后，两组的治愈率一起改善。',
    '换了更细的分级方法，好学生组和差学生组的成绩都变好了。',
    '调整分组口径后，轻症组与重症组的存活率双双上升。',
    'After re-staging, survival improved in both groups.'],
};
const BENIGN = {
  jevons_paradox: ['技术进步让单位能耗下降，但总量还取决于使用规模，未必下降。', '效率提升可能带来反弹效应，总消耗需要另行测算。'],
  carbon_leakage: ['产能外迁可能把排放转移到海外，全球总量未必下降。', '本地排放下降不等于全球排放下降，需要核算全链条。'],
  paradox_of_thrift: ['全民储蓄在短期可能压缩总需求，这是合成谬误的机制。', '个人节俭是理性的，但普遍节俭可能拖累总需求。'],
  inverse_gamblers_fallacy: ['每次开奖都是独立事件，历史结果不影响下一次概率。', '之前连输十局不会提高下一局的胜率。'],
  disposition_effect: ['处置效应是行为偏误，理性投资者不该死扛亏损单。', '早早卖掉盈利单属于处置效应，应当避免。'],
  confounding_by_indication: ['用药组本身病情更重，粗死亡率差异不能直接归因于药。', '治疗分配受基线预后影响，需要校正后再比较。'],
  price_control: ['价格上限可能造成短缺和排队，这是教科书结论。', '最低工资的就业效应存在争议，需要实证评估。'],
  mercantilism: ['贸易是互利的，顺差并非财富的唯一来源。', '进口同样创造价值，逆差不等于亏损。'],
  opportunity_cost_neglect: ['排队三小时的机会成本要计入，门票是沉没成本。', '闲置设备也有维护成本，不是零成本。'],
  illusion_of_control: ['仪式不影响随机事件的概率，这是控制幻觉。', '幸运物不会改变胜率，每次结果相互独立。'],
  will_rogers_phenomenon: ['分期迁移造成统计假象，个体结局并未改善。', 'Will Rogers 现象说明分组变化可以虚增两组指标。'],
};
(async () => {
  for (const [key, mod, fn] of fams) {
    let M; try { M = require(path.join(__dirname, '../../src', mod)); } catch (e) { console.log(key, 'LOAD_FAIL', e.message.slice(0,50)); continue; }
    const f = M[fn];
    if (!f) { console.log(key, 'NO_FN', fn); continue; }
    const A = ATTACK[key] || [], B = BENIGN[key] || [];
    let hit = 0, modFP = 0, gatePass = 0;
    for (const t of A) {
      let r; try { r = f(t); } catch (e) { r = { hit: false }; }
      const m = r && (r.hit || r.detected || (r.score || 0) > 0);
      if (m) hit++; else {
        // 模块层未命中时看 gate 层是否代拦
        try { const g = gate(t); if (g.gate && g.gate.action !== 'pass') gatePass++; } catch (e) {}
      }
    }
    for (const t of B) { try { const r = f(t); if (r && (r.hit || r.detected || (r.score||0)>0)) modFP++; } catch (e) {} }
    const pen = A.length - hit - gatePass;
    console.log(`${key.padEnd(26)} 模块命中 ${hit}/${A.length} | gate代拦 ${gatePass} | 穿透 ${pen} | 模块层误伤 ${modFP}/${B.length}`);
  }
})();
