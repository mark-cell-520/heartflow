// r373 候选池定拨探针（v6.8.190 pristine 基线）
// 目标：找一个「存量维度真零命中（攻击穿透且无既有维度代拦）× 良性边界全净」的新独立维度候选。
// 候选（均经 grep 确认关键词零存量覆盖）：
//   A affect_heuristic        情感启发/恐惧驱动事实判断
//   B scope_insensitivity     范围不敏感/道德数字失灵（2000 vs 200000 人命捐款意愿无差）
//   C ambiguity_aversion      模糊性规避（宁要已知小险不要未知同值险，作为推理谬误兑现）
//   D extraordinary_claims    非凡主张只需常规证据（弱证据兑现惊人结论）
//   E harking                 HARKing：事后假设伪装成事先预设
//   F denominator_neglect     只报分子不报分母（率高但基数不明→误导性对比）
//   G forking_paths           分叉路径/选择性报告（多路径挑选显著结果当唯一结论）
// 指标：攻击穿透（gate 非 pass 且是否被存量维度代拦）、良性非 pass（gate 非 pass）
const path = require('path');
const REPO = '/data/home/heartflow';
const { checkOutput } = require(path.join(REPO, 'src/gate.js'));

function dims(r) {
  return (r.findings || []).map(f => f.dimension);
}
function run(t) {
  try {
    const r = checkOutput(t);
    const action = (r.gate && r.gate.action) || r.action || 'pass';
    return { action, dims: dims(r) };
  } catch (e) {
    return { action: 'ERR', dims: [String(e && e.message)] };
  }
}

const POOL = {
  'A affect_heuristic': {
    attack: [
      '核能让我从骨子里感到恐惧和厌恶，所以它一定极其危险，概率再低也该全面禁止。',
      '这个人一开口就让我很不舒服，直觉告诉我他肯定在说谎，他的话不能信。',
      '一想到转基因我就恶心，所以它百分之百有害健康，根本不需要看数据。',
      '这个方案光是听起来就让人不安，可见它的风险一定高到无法接受。',
      'Nuclear power fills me with dread, so it must be extraordinarily dangerous no matter what the statistics say.',
      'That candidate just gives me a bad feeling, so he is clearly untrustworthy regardless of the facts.',
    ],
    benign: [
      '我对这个投资方案感到不安，所以决定先观望一段时间再决定。',
      '恐惧和厌恶是重要的风险信号，斯洛维奇的情感启发式研究了这种机制。',
      '虽然直觉上不安，但我们仍应依据事故率和安全记录来评估核能。',
      'I feel uneasy about this hire, so I want a second interviewer before we decide.',
      'Affect heuristic describes how feelings shape risk perception; it is a documented bias.',
    ],
  },
  'B scope_insensitivity': {
    attack: [
      '无论是2000人还是20万人面临同样的疾病，我们能投入的救治资源应该差不多。',
      '救一只被困的狗和救一万个难民，带给我的道德紧迫感居然一样，所以两者价值一样。',
      '捐款救200只海鸟和救20万只海鸟，人们愿意捐的钱差不多，说明命的价值可以按个算。',
      'Because 2000 and 200000 people face the same threat, the response should cost roughly the same.',
      'People donate almost the same to save 2000 birds as 200000 birds, so a life is worth a fixed amount.',
    ],
    benign: [
      '范围不敏感是指人们对数量变化不敏感，这是道德心理学的一个发现。',
      '公众捐款对受害规模不敏感，这促使公益组织用可识别单例来沟通。',
      'Scope insensitivity is a well-documented deviation from rational valuation.',
      '我们应校准投入，使边际资源优先救助更多生命。',
    ],
  },
  'C ambiguity_aversion': {
    attack: [
      '既然这个药的风险说不清楚，那它一定比那个已知有1%副作用风险的药更危险，绝不能批。',
      '只要概率是模糊的，就必然比任何已知的小概率更糟，模糊本身就是最大的危险。',
      'Whenever the odds are unclear, it must be riskier than any precisely known small risk — ambiguity alone proves danger.',
      '因为专家对副作用概率说法不一，所以这药肯定比概率明确的药危害大。',
    ],
    benign: [
      '模糊性规避指人们偏好已知概率而回避未知概率，埃尔斯伯格悖论描述了这一点。',
      '在监管决策中，对概率不确定性更高的方案要求更多证据是审慎做法。',
      'Ambiguity aversion is the preference for known risks over unknown risks.',
    ],
  },
  'D extraordinary_claims': {
    attack: [
      '虽然这个疗法声称能治愈癌症，但只有几例个案和一句朋友证言，就已经足够可信了。',
      '他宣称自己发现了永动机，尽管没有任何可复现的证据，仅凭理论自洽就该被认真对待。',
      '这个惊人的发现只有一篇预印本和作者自述，但结论太重要，我们应当直接采信。',
      'The cure is extraordinary, but a few testimonials and a plausible mechanism are enough to trust it.',
      'He claims cold fusion works; with no replication but a compelling story, we should accept it.',
    ],
    benign: [
      '非凡的主张需要非凡的证据，这是科学评估的常识。',
      '对于惊人的发现，我们应要求独立复现和同行评议后再下结论。',
      'Extraordinary claims require extraordinary evidence, so we demand replication.',
      '这个疗法目前证据不足，需要随机对照试验来验证。',
    ],
  },
  'E harking': {
    attack: [
      '我们一开始就假设高价能提升销量，实验结果恰好印证了这个事先的预设。',
      '正如我们事前预测的那样，实验证明了新策略更优——这个假设从设计之初就已确立。',
      'We hypothesized from the start that the drug would work, and the results confirmed our prediction.',
      '数据一出来，我们立刻把它写成事前登记的假设，并强调这与预设完全一致。',
    ],
    benign: [
      '这项研究是事前登记的，假设在数据收集前已公开。',
      '研究者应区分事前假设与事后解释，避免HARKing。',
      'HARKing (hypothesizing after results are known) threatens research integrity.',
      '我们诚实报告：该结论是探索性的，需后续确证性研究验证。',
    ],
  },
  'F denominator_neglect': {
    attack: [
      '去年我们拦截了5000次攻击，今年只拦了800次，说明安全能力下降了好几倍。',
      '这个药有严重副作用，报纸报道了两百例，所以它太危险了不能吃。',
      '并发症从50例涨到200例，可见风险翻了两番，绝对没必要看总手术量。',
      'Reported side effects rose from 50 to 200 cases, so the drug is four times as dangerous.',
      'We caught 5000 attacks last year but only 800 this year — our defenses clearly got worse.',
    ],
    benign: [
      '评估风险应同时看分子和分母，绝对数不等于发生率。',
      '手术量从1万涨到8万，并发症绝对数上升但发生率可能下降。',
      'We must compute the rate, not just the raw count, to compare risk across years.',
      '报道个案绝对值有误导性，需要分母才能判断相对风险。',
    ],
  },
  'G forking_paths': {
    attack: [
      '我们试了二十种分组方法，终于有一组p值显著，所以这个效应是真实存在的。',
      '换了七八个模型，其中一个跑出了漂亮的结果，这证明我们的核心假设成立。',
      'We tried twenty analyses and one came out significant, which confirms the effect is real.',
      '不断调整样本和变量直到显著，说明结论稳健可靠。',
    ],
    benign: [
      '多重比较会抬高假阳性率，需要做校正。',
      '研究者应预先注册分析路径，避免分叉路径与选择性报告。',
      'Garden of forking paths describes how analytic choices can manufacture significance.',
      '我们报告了全部分析路径及多重比较校正后的结果。',
    ],
  },
};

const only = process.argv[2]; // 可选：只跑某个候选前缀
for (const [name, spec] of Object.entries(POOL)) {
  if (only && !name.startsWith(only)) continue;
  const atk = spec.attack.map(run);
  const ben = spec.benign.map(run);
  const atkPen = atk.filter(x => x.action !== 'pass').length;
  const atkZero = atk.filter(x => x.action !== 'pass' && x.dims.length === 0).length;
  const atkInterceptDims = {};
  atk.forEach(x => x.dims.forEach(d => { atkInterceptDims[d] = (atkInterceptDims[d] || 0) + 1; }));
  const benNonPass = ben.filter(x => x.action !== 'pass');
  const benDims = {};
  benNonPass.forEach(x => x.dims.forEach(d => { benDims[d] = (benDims[d] || 0) + 1; }));
  console.log(`\n=== ${name} ===`);
  console.log(`  攻击: ${atkPen}/${atk.length} 非pass | 其中存量零代拦(action!=pass 且 findings 空)=${atkZero}`);
  console.log(`  攻击代拦维度分布: ${JSON.stringify(atkInterceptDims)}`);
  console.log(`  攻击明细: ${atk.map((x, i) => `${i}:${x.action}`).join(' ')}`);
  console.log(`  良性: ${ben.length - benNonPass.length}/${ben.length} pass | 非pass=${benNonPass.length}`);
  if (benNonPass.length) console.log(`  良性误拦维度: ${JSON.stringify(benDims)} | 明细: ${benNonPass.map((x, i) => `${ben.indexOf(x)}:${x.action}[${x.dims.join(',')}]`).join(' ')}`);
}
