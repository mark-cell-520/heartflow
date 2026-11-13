// r308: 在 src/index.js 的 dimMap 中插入 vivid_case_availability 的 prompt 文案
const fs = require('fs');
const path = '/root/hermes1/skills/ai/mark-heartflow-skill/src/index.js';
let s = fs.readFileSync(path, 'utf8');

const marker = "'evidence_claim_mismatch': \"不得";
const i = s.indexOf(marker);
if (i < 0) { console.log('MARKER NOT FOUND'); process.exit(1); }
const rel = s.slice(i).indexOf('",\n');
if (rel < 0) { console.log('END NOT FOUND'); process.exit(1); }
const insertAt = i + rel + 3; // 在 '",\n' 之后插

const prompt = [
  "  'vivid_case_availability': \"不得**拿「单个生动个案」直接给「总体危险性/发生率/领域结论」背书**——生动个案可得性偏差（vivid-case availability / anecdotal vividness）是指文本给出**单个生动、具体、情感冲击力强的个案例证**（亲眼看到/亲眼目睹/有个案例/网上有个案例说/新闻里有个/视频里有个/听说过一件事/朋友的朋友；EN I saw / I witnessed / there was a case / a case where / a story about / on the news I saw / a viral video of / a friend of a friend），据此越过总体统计数据推断**危险性、发生率或领域结论**：「我亲眼看到一个人抽烟活到九十岁，所以吸烟的危害被夸大了。」「网上有个案例说疫苗有害，所以很多人都在反对疫苗。」「邻居买彩票中了大奖，说明买彩票是靠谱的投资方式。」「I saw a plane crash on the news, flying is clearly too dangerous.」「A friend of a friend got struck by lightning twice, so it must be far more common than statistics claim.」（样本形状与负例见 test/round-308-vivid-case-availability.js）。为什么这本身就是问题：个案的**生动性**（画面感、情感冲击、故事性）与**统计代表性**无关——媒体与社交网络按情绪唤醒度而非发生率筛选内容，越生动的个案越被放大传播，把它的可回忆性错当成基础频率（可得性启发式的 vividness 机制）。基于个案推断的危险性、发生率、领域可靠性，结论方向可正（中奖→彩票靠谱）可负（坠机→飞行危险），共同点是用单个高唤醒叙事替代了总体数据。正当做法是**补上基础发生率数据**（发生率/发病率/官方统计）或**把结论降级为「存在该案例，但总体结论需以统计为准」**。判据**两腿共现 + 邻近窗，缺一不判**：腿① VIVID 生动个案线索（亲眼看到/亲眼目睹/当时就在现场/有个案例/网上有个案例/新闻里有个/视频里有个/听说过一件事/疯传的视频/朋友的朋友 × 单个量词一个/一位/一起/一则/一条；EN I saw / I witnessed / there was a case / a case where / a story about / on the news / a viral video / a friend of a friend / got struck by lightning / hit by a car）；腿② SKEW 概率/危险性偏斜推断（危害/风险/危险被夸大或被低估/太危险/很常见/高发/比比皆是/靠谱/可行/所以很多人反对/所以大家都恐慌/概率很高；EN clearly too dangerous / blown out of proportion / must be far more common / way more dangerous than / overblown / so many people are / the odds are high），两腿落在 80 字（EN 200 字符）邻近窗内即视为同一次「个案→总体」叙述。边界：availability_bias（第200维）管**曝光密度**线索（老听说/满屏都是/keep hearing about）驱动的频率误判，本维度腿①是**单个具体个案**（亲眼看到一个人/有个案例说）、不依赖曝光频次表述；anecdotal（第140维）管**说话人身边熟人指称**（我邻居/我亲戚）×领域级否定或行动推进，本维度腿①可以是陌生人/媒体案例/亲眼偶遇对象，腿②落点是危险性/发生率而非领域否定（「所以买彩票是靠谱的」是正面领域结论）；anecdote_as_proof（第84维）管**第一人称/熟人语料**×全称效果断言（都有效/行业标准），本维度主体常是陌生人或媒体案例、结论是风险/发生率高估或低估而非效果证明；survivorship_bias（第132维）管**可见成功个案**×推广，本维度个案结局不限成功（活到九十/中大奖/坠机/被雷击都算）；base_rate_neglect（第169维）管**检测阳性信号×高置信后验**（有个体化检测语境），本维度没有检测/筛查语境、是叙事个案例证；hasty_generalization 管推理形式的以偏概全（要显式概括桥或 all/everyone 量化形），本维度是个案与结论的直接并置、无桥词。明确不判：数据/统计依据在场（统计显示/数据显示/官方通报/研究表明/发生率/发病率/根据统计；EN statistics show / data show / according to the data / incidence rate / base rate——结论有独立证据支持时个案只是引子）、推理否定/反向承认（不代表/不能说明/不等于/不意味着/推不出/孤例不能说明/个案不能证明；EN does not prove / does not show / a single case is not evidence——认知到偏差并主动拆解是正确判别）、概念/教学转述（可得性偏差/可得性启发/个案偏差/孤证/生动性/叙事偏差；EN availability heuristic / cognitive bias / anecdotal evidence / vividness——讨论这个概念本身不是运用它）、对冲（可能/也许/或许/大概/似乎/有待；EN maybe / perhaps / might / seems）、疑问句（含 ?/？）。\",\n",
].join('');

s = s.slice(0, insertAt) + prompt + s.slice(insertAt);
fs.writeFileSync(path, s, 'utf8');
console.log('inserted at', insertAt, '| new length', s.length);
