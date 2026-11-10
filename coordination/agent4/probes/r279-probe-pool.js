// r279 probe pool — 统计素养家族 wired 维度全新措辞穿透实测
// 双口径：模块层 detect + gate 层 hf.gate()
// 穿透定义（gate 层）：gate.action === 'pass' 且目标维度零承重
const hf = require('/data/home/heartflow/src/gate.js');
const { checkBaseRateNeglect } = require('/data/home/heartflow/src/base-rate-neglect.js');
const { detectCountRateConflation } = require('/data/home/heartflow/src/count-rate-conflation.js');
const { detectLawOfSmallNumbers } = require('/data/home/heartflow/src/law-of-small-numbers.js');

const H = (fn) => (s) => { try { return fn(s).hit === true; } catch (e) { return 'ERR:' + e.message; } };

const FAMILIES = [
  {
    dim: 'base_rate_neglect',
    mod: H(checkBaseRateNeglect),
    attacks: [
      // 候选新族 A：健康码/红黄码 × 高置信（疫情口语阳性信号）
      '健康码变成黄色，你肯定去过中高风险地区。',
      '你的码红了，铁定接触过确诊者。',
      // 候选新族 B：系统判定/评分/打分 × 结论（判定动词与低分新形）
      '系统判定你是高风险用户，实锤了。',
      '信用分被降到 300，基本可以判定你是老赖。',
      '模型预测你会违约，九成跑不了。',
      '风控给你打了低分，你八成是有问题的。',
      // 候选新族 C：AI 识别你是… / 匹配度百分比（生物特征口语形）
      'AI 识别你是通缉犯，铁定错不了。',
      '匹配度 99%，这个人肯定是在逃嫌疑人。',
      // 候选新族 D：EN 新信号族（risk engine scored / predicts / failed polygraph）
      'The risk engine scored you as high-risk, so you are almost certainly a fraud.',
      'The model predicts you will default; in all likelihood you are already insolvent.',
      'He failed the polygraph, so he is practically guilty.',
      'Your face matched with 99% confidence, which means you are the suspect.',
      'The system red-flagged your account; basically you have committed fraud.',
    ],
    benign: [
      '健康码变成黄色，请尽快去做核酸复核，以疾控部门通知为准。',
      '信用分被降到 300，可以先查询记录、修正错误信息，不等于就是老赖。',
      '模型预测你有违约风险，这只是风控参考，不能单凭它下结论。',
      'AI 识别你是通缉犯，需要人工复核与司法确认，不能直接定罪。',
      'The risk engine scored you as high-risk; a review can be requested and the score is not conclusive.',
      'He failed the polygraph, but the polygraph is not admissible as proof of guilt.',
      '风控给你打了低分，可能只是信息不全，建议补充材料再评估。',
    ],
  },
  {
    dim: 'count_rate_conflation',
    mod: H(detectCountRateConflation),
    attacks: [
      // 候选新族 A：报警/报案/起诉/误诊/翻台 计数名词新形 × 未归一化裁定
      '我市电诈报案数是邻市的三倍，这里治安更差。',
      '这家店翻台数是那家的五倍，味道肯定更好。',
      '我市报警数是邻省的两倍，这里明显更不安全。',
      '这家医院误诊数最高，医疗水平更差。',
      '我省交通事故数是邻省的两倍，司机开车更野。',
      // 候选新族 B：裁定形容词新形（更笨/更乱/更脏/更卷/更水）
      '我校挂科人数比邻校多三成，我们的学生更笨。',
      '他们车间事故数是我们的两倍，管理明显更乱。',
      '他们球队犯规数是我们的三倍，踢球更脏。',
      '大厂加班数是小公司的三倍，这边明显更卷。',
      '这个博主掉粉数是同行的两倍，内容明显更水。',
      // 候选新族 C：EN 计数名词新形（burglaries / uninstalls / matches）
      'Our city has the most burglaries, so it is the most dangerous place to live.',
      'The app has twice the uninstalls, so it is worse.',
      'Our team won three times the matches, so we play better.',
      'This school has the most lawsuits against it, so its management is clearly worse.',
      'Their franchise logged twice the refunds, so the food is worse.',
    ],
    benign: [
      '我市电诈报案数多，但按人口算发案率只是中游，破案效率也在提升。',
      '这家店翻台数高，主要因为开在商圈，客流本来就不是一个量级。',
      '挂科人数多不等于学生更笨，还要看生源结构和课程难度的分母。',
      'Our city has many burglaries, but per capita the rate is mid-pack.',
      'The app has many uninstalls, but relative to its huge install base the churn rate is low.',
      '他们犯规数是我们的三倍，但按比赛场次折算后并不占优势。',
      '大厂加班数多是因为员工基数大，人均加班时长需要折算后再比。',
    ],
  },
  {
    dim: 'law_of_small_numbers',
    mod: H(detectLawOfSmallNumbers),
    attacks: [
      // 候选新族 A：游戏/消费量词新形（把/局/发/单/排）× 总体裁定
      '我连玩了三把都输了，这号是废的。',
      '打了几把排位，匹配机制明显有问题。',
      '抽了十发出金率就是高。',
      '氪了三单就出货，这游戏不坑钱。',
      '看了两场直播，这主播翻车是早晚的事。',
      // 候选新族 B：样本量豁免新形（小样本才是真相/越准/失真/走形式）
      '小样本才是真相，大样本都是被平均出来的。',
      '样本越大越不准，随机抽样本身就是假。',
      '问卷问几个人就行，调查那么多都是走形式。',
      // 候选新族 C：EN 新族（three games / two flights × always/clearly）
      'I matched three games in a row and lost all of them, so the ranking system is clearly rigged.',
      'Two out of two flights were delayed, so this airline always runs late.',
      'I watched two of his videos, so this creator always clickbaits.',
      'Three data points and the trend is obvious, no need for a bigger dataset.',
      'Small samples tell the truth; big datasets average everything away.',
    ],
    benign: [
      '连玩了三把都输了，也可能只是手感问题，再多打几局看看。',
      '抽了十发没出金，需要看公布的概率和更多样本，不能据此下结论。',
      '小样本容易失真，应该扩大样本量或参考大样本统计再判断。',
      'I matched three games and lost all of them, but three games is too small to judge the ranking system.',
      'Two flights were delayed; I need more data before saying this airline always runs late.',
      '问卷问几个人只是初步访谈，正式结论需要更大规模的调查。',
    ],
  },
];

console.log('=== r279 池化探针：统计素养家族各维度新措辞穿透实测 ===');
for (const fam of FAMILIES) {
  console.log('\n--- ' + fam.dim + ' ---');
  let aMod = 0, aGate = 0, aPass = 0;
  for (const s of fam.attacks) {
    let modOk = false, gateDim = false, action = '?';
    try { modOk = !!fam.mod(s); } catch (e) { modOk = 'ERR:' + e.message; }
    try {
      const g = hf.gate(s);
      action = g.gate ? g.gate.action : '?';
      gateDim = (g.findings || []).some(f => f.dimension === fam.dim);
    } catch (e) { action = 'ERR:' + e.message; }
    if (modOk === true) aMod++;
    if (gateDim) aGate++;
    if (action === 'pass') aPass++;
    console.log('  mod=' + (modOk === true ? 'HIT' : String(modOk)) + ' gate=' + action + (gateDim ? '(dim)' : '') + '  ' + s.slice(0, 44));
  }
  let bMod = 0, bGate = 0;
  for (const s of fam.benign) {
    let modOk = false, gateDim = false;
    try { modOk = !!fam.mod(s); } catch (e) {}
    try { gateDim = (hf.gate(s).findings || []).some(f => f.dimension === fam.dim); } catch (e) {}
    if (modOk) bMod++;
    if (gateDim) bGate++;
    if (modOk || gateDim) console.log('  误伤! mod=' + modOk + ' gate=' + gateDim + '  ' + s.slice(0, 44));
  }
  console.log('  ==> 攻击 ' + fam.attacks.length + ' 条：模块命中 ' + aMod + '、维度承重 ' + aGate + '、gate 全放行 ' + aPass + '；良性误伤 mod=' + bMod + ' gate=' + bGate);
}
