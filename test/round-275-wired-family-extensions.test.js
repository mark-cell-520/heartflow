'use strict';
// round-275  wired 维度全新措辞家族扩展（真升级②：4 维度 12 子族，live 生效）
//
// 覆盖：
//   A. reverse_causation（因果倒置）——医疗辅具/戒断治疗/纪律处分/征信风控/
//      反诈宣传族（RESP_ZH[0]/RESP_EN[0] 并入既有元素 + GROUP_DE_ZH 扩车主族）
//   B. selection_bias（样本选择偏误）——口语取证动词×平台圈子来源×拔高推广
//      收尾（SAMPLING_VERBS_ZH/EN、SOURCE_FROM_ZH、RESTRICTED_SOURCE_ZH/EN、
//      GEN_VERB_ZH/EN、GEN_SCOPE_ZH/EN、_findInfer 被动推广动词族，
//      以及 [r275 新增路由 c] RESTRICTED_SOURCE_ZH×取样动词承重路径）
//   C. counterfactual_overclaim（反事实过度断言）——口语过去锚（那晚/那天/
//      彼时）+ 口语强确定词（铁定/准能/板上钉钉/guaranteed/for sure），
//      同轮补 inject 钩子（存量测试性缺口，与 r272 conjunction 同形态）
//   D. unfalsifiable_confirmation（可证伪性）——口语自证归因（是我眼光准/
//      教主英明/proves my instincts）+ either X or it doesn't / if X; if it
//      fails 腿①族 + 弯引号 U+2019 兼容
//
// 纪律（round-266/267 登记断言）：
//   - RESP_ZH / RESP_EN 长度恒 2（新词并入既有元素，不加数组元素）
//   - 探针口径：gate.action !== 'pass' 且 findings 承重该维度 = 命中
//   - 良性：承重即误伤
//   - 负例：注入-删条，删掉本轮每个新模式守卫必须转 miss
const path = require('path');
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
const revMod = require(path.join(__dirname, '..', 'src', 'reverse-causation.js'));
const selMod = require(path.join(__dirname, '..', 'src', 'selection-bias.js'));
const cfMod = require(path.join(__dirname, '..', 'src', 'counterfactual-overclaim.js'));
const ufMod = require(path.join(__dirname, '..', 'src', 'unfalsifiable-confirmation.js'));

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log('  ✅ ' + label); }
  else { failed++; console.log('  ❌ ' + label); }
}

// ─── 攻击矩阵 ────────────────────────────────────────────────────────
const ATTACKS = [
  // A reverse_causation（ZH）
  ['reverse_causation', '戴OK镜的孩子视力问题更严重，可见OK镜加剧了视力问题。'],
  ['reverse_causation', '拄拐的老人更容易摔倒受伤，所以拄拐让老人更容易受伤。'],
  ['reverse_causation', '理赔过的车主出险更频繁，可见理赔诱发了更多事故。'],
  ['reverse_causation', '戴助听器的老人听力问题更严重，这说明戴助听器引发了听力问题。'],
  ['reverse_causation', '被反诈宣传的居民被骗更多，这说明反诈宣传招来了更多被骗。'],
  ['reverse_causation', '强制戒毒的人复发率更高，这说明戒毒治疗助长了复发。'],
  // A reverse_causation（EN）
  ['reverse_causation', 'People with hearing aids report worse hearing outcomes, so hearing aids contribute to hearing problems.'],
  ['reverse_causation', 'Users who installed anti-fraud apps get defrauded more often, meaning the apps attract more fraud.'],
  ['reverse_causation', 'Patients in drug rehab show higher relapse rates, which shows rehab drives more relapse.'],
  // B selection_bias（ZH）
  ['selection_bias', '样本只扒了超话里的铁粉发言，结论却说成是全民意见。'],
  ['selection_bias', '数据全部捞自直播间的弹幕，由此得出的结论适用于全网用户。'],
  ['selection_bias', '只翻了推荐流的评论，就据此断言所有观众都喜欢这个产品。'],
  ['selection_bias', '反馈全都摘自知乎的回答，于是作者宣称结论具有普适性。'],
  ['selection_bias', '只筛出来自提名名单的作品，评审结论就被拔高成了全行业的标杆。'],
  ['selection_bias', '问卷只回收了县城小学生的答卷，却要推广到全国所有学生。'],
  // B selection_bias（r275 新路由 c：渠道词 × 取样动词，动词在渠道词后）
  ['selection_bias', '圈内人的反馈收集了一大堆，结论却说成是全民意见。'],
  ['selection_bias', '评论扒自种草视频的评论区，却说成是全民意见。'],
  // B selection_bias（EN）
  ['selection_bias', 'The comments were scraped only from the fan subreddit, yet the author claims they represent all viewers.'],
  ['selection_bias', 'Feedback mined exclusively from the livestream chat is described as the taste of the entire audience.'],
  ['selection_bias', 'Feedback from the livestream chat was gathered, so the pattern is boiled down to the taste of practitioners.'],
  // C counterfactual_overclaim
  ['counterfactual_overclaim', '早年间若是换了赛道，今天铁定是另一番局面。'],
  ['counterfactual_overclaim', '那晚要是听了劝，现在铁定不至于这么惨。'],
  ['counterfactual_overclaim', '如果那天多留一手，今天准能全身而退。'],
  ['counterfactual_overclaim', '当初若是没接这个项目，现在公司铁定还在。'],
  ['counterfactual_overclaim', 'Had we taken the deal back then, success was guaranteed.'],
  ['counterfactual_overclaim', 'If we had switched tracks at the start, we would certainly be a different company today.'],
  ['counterfactual_overclaim', 'Had we stayed in the market, failure was certain to come anyway.'],
  // D unfalsifiable_confirmation
  ['unfalsifiable_confirmation', '涨了是我眼光准，跌了是市场还没睡醒。'],
  ['unfalsifiable_confirmation', '成了是教主英明，败了是信徒心不诚。'],
  ['unfalsifiable_confirmation', '这个预言应验了说明我功力深，没应验说明你诚意不足。'],
  ['unfalsifiable_confirmation', 'If the plan works, it proves my instincts; if it fails, the market just wasn\u2019t ready.'],
  ['unfalsifiable_confirmation', 'Either the model fits or it doesn\u2019t \u2014 both outcomes confirm my theory.'],
  ['unfalsifiable_confirmation', 'Whether the treatment helps or not, it validates my judgment call.'],
];

console.log('== 新攻击矩阵（' + ATTACKS.length + ' 条）==');
for (const [dim, s] of ATTACKS) {
  const r = gate(s);
  const carries = (r.findings || []).some(f => f.dimension === dim);
  ok(carries && r.gate.action !== 'pass', dim + ' | ' + s.slice(0, 34));
}

// ─── 良性矩阵（承重即误伤）───────────────────────────────────────────
const DIMS = ['reverse_causation', 'selection_bias', 'counterfactual_overclaim', 'unfalsifiable_confirmation'];
const BENIGN_SENTENCES = [
  '爷爷戴上助听器之后，终于能听清我们聊天了。',
  '医生建议先做康复训练，再慢慢恢复运动。',
  '社区开展了反诈宣传，居民防骗意识明显提高。',
  '公司上了风控系统，坏账率下降了不少。',
  '配了OK镜之后，孩子白天不用戴框架眼镜了。',
  '补考通过之后，他顺利拿到了毕业证。',
  'The extended warranty covers the screen for two years.',
  'She started wearing hearing aids and can follow conversations again.',
  'Anti-fraud education has reduced complaints in our community.',
  '我在知乎回答里看到这个说法，后来查了原始论文。',
  '扒了一圈贴吧，终于找到了这个老游戏的安装包。',
  '圈内人的经验固然重要，但还是要看公开数据。',
  '从小红书的测评看，这款面霜口碑不错，但我还是要自己试试。',
  'The fan subreddit has detailed guides for new players.',
  'We interviewed twenty users in rural counties for the pilot study.',
  'Feedback from the livestream chat was gathered for the product team.',
  '如果那天多留一手，现在也不会后悔成这样。',
  'If we had taken the deal, we would be in a very different position today.',
  '不管项目成不成，团队都要复盘一次。',
  'If the plan fails, we will hold a full retrospective.',
];
console.log('== 良性矩阵（' + BENIGN_SENTENCES.length + ' 条）==');
let fp = 0;
for (const s of BENIGN_SENTENCES) {
  const r = gate(s);
  const carried = DIMS.filter(d => (r.findings || []).some(f => f.dimension === d));
  if (carried.length) { fp++; console.log('  ❌ 误伤 ' + carried.join(',') + ' | ' + s.slice(0, 40)); }
}
ok(fp === 0, '良性零误伤（' + fp + ' 误伤）');

// ─── 登记纪律（round-266 长度登记不翻车）──────────────────────────
console.log('== 登记纪律 ==');
const I = revMod.__internals();
ok(I.RESP_ZH.length === 2, 'RESP_ZH.length === 2（实测 ' + I.RESP_ZH.length + '）');
ok(I.RESP_EN.length === 2, 'RESP_EN.length === 2（实测 ' + I.RESP_EN.length + '）');

// ─── 负例：注入-删条 ─────────────────────────────────────────────────
console.log('== 负例注入（删本轮新规则，守卫须转 miss）==');
const R = revMod.__internals(), S = selMod.__internals, U = ufMod.__internals();
const NEVER = /(?!x)x/;
const withoutNew = (arr, newWords) => arr.filter(x => !newWords.includes(x));
const REV_RESP_ZH_NEW = ['助听器', '拄拐', '轮椅', '假肢', '护膝', '护腰', '护腕', '支具', '矫姿器', '背背佳', '[Oo][Kk]镜', '角膜塑形镜', '离焦镜', '近视手术', '激光手术', '正畸', '整牙', '箍牙', '种牙', '根管', '针灸', '推拿', '拔罐', '艾灸', '理疗', '康复训练', '戒毒', '戒毒所', '强制戒毒', '戒断', '戒酒', '美沙酮', '写检查', '记过', '处分', '停课', '请家长', '补考', '重修', '补作业', '查征信', '拉征信', '调流水', '报险', '理赔', '核保', '索赔', '反诈', '防骗教育', '安全教育', '延保', '质保', '召回', '返厂', '风控', '反欺诈'];
const SEL_VERB_ZH_NEW = ['扒', '扒了', '捞', '捞了', '翻', '翻了', '翻完', '翻过', '筛', '筛出', '筛出来', '筛了', '调取', '导出', '抓过来', '扫了', '勾选'];
const SEL_SRC_ZH_NEW = ['捞自', '扒自', '翻自', '筛自', '爬自'];
const SEL_RESTR_ZH_NEW = ['超话', '小组', '贴吧', '知乎', '豆瓣', '小红书', '抖音', 'B站', 'b站', '直播间', '弹幕', '种草', '测评', '带货', '铁粉', '老粉', '热搜榜', '热榜', '推荐流', '信息流', '私域', '校友', '同门', '课题组', '老乡', '圈内', '业内', '腰部', '下沉', '小镇', '县城', '农村', '提名', '内推', '关系户', '路人', '吃瓜', '围观', '跟风', '同行'];
const SEL_GVERB_ZH_NEW = ['拔高成', '拔高为', '上升为', '上升到了', '一言以蔽之', '总而言之', '说白了', '说到底', '归结起来', '归纳出来', '总结成', '提炼成', '论定为', '定性为', '树成', '捧成', '放大成'];
const SEL_GSCOPE_ZH_NEW = ['全行业', '整个行业', '全世界', '全球范围', '人类', '世人', '普罗大众', '众人', '大江南北', '五湖四海', '全球用户', '海外用户', '四方', '业内', '同行', '从业者'];
const SEL_VERB_EN_NEW = ['dug up', 'digging up', 'sifted', 'sift', 'filtered to', 'filtered down to', 'sorted', 'cherry', 'combing'];
const SEL_RESTR_EN_NEW = ['livestream', 'live chat', 'super fans', 'superfans', 'fan subreddit', 'subreddit', 'discord', 'telegram', 'tiktok', 'xiaohongshu', 'zhihu', 'douban', 'bilibili', 'recommended feed', 'recommendation feed', 'trending page', 'private groups', 'fan club', 'stans', 'upvoted', 'top comments', 'nominat', 'rural', 'small towns', 'county-level', 'nominees', 'shilling', 'promoted'];
const SEL_GVERB_EN_NEW = ['boiled down to', 'boils down to', 'amounts to', 'amounted to', 'comes down to', 'elevated to', 'elevates to', 'framed as', 'frames it as', 'pitched as', 'sold as', 'presents it as', 'markets it as', 'described as', 'presented as', 'portrayed as', 'packaged as', 'marketed as', 'sold to'];
const SEL_GSCOPE_EN_NEW = ['the whole industry', 'the entire industry', 'the industry', 'all industries', 'humankind', 'humanity', 'all of humanity', 'everyone on earth', 'the whole world', 'the global user base', 'mainstream users', 'practitioners', 'everyone in the industry'];

const INJ = [
  { label: 'RESP_ZH[0] 医疗辅具族（OK镜/助听器/反诈）', mod: 'rev', text: '戴OK镜的孩子视力问题更严重，可见OK镜加剧了视力问题。', inject: { RESP_ZH: [NEVER, R.RESP_ZH[1]] } },
  { label: 'RESP_EN[0] 辅具/反诈族（hearing aids/anti-fraud）', mod: 'rev', text: 'People with hearing aids report worse hearing outcomes, so hearing aids contribute to hearing problems.', inject: { RESP_EN: [NEVER, R.RESP_EN[1]] } },
  { label: 'GROUP_DE_ZH 车主族', mod: 'rev', text: '理赔过的车主出险更频繁，可见理赔诱发了更多事故。', inject: { GROUP_DE_ZH: [NEVER] } },
  { label: 'SAMPLING_VERBS_ZH 口语取证（扒/捞/翻/筛）', mod: 'sel', text: '样本只扒了圈内人的发言，结论却说成是全民意见。', inject: { SAMPLING_VERBS_ZH: withoutNew(S.SAMPLING_VERBS_ZH, SEL_VERB_ZH_NEW) } },
  { label: 'SOURCE_FROM_ZH 网络来源（扒自/捞自）', mod: 'sel', text: '评论扒自种草视频的评论区，却说成是全民意见。', inject: { SOURCE_FROM_ZH: withoutNew(S.SOURCE_FROM_ZH, SEL_SRC_ZH_NEW) } },
  { label: 'RESTRICTED_SOURCE_ZH 社区渠道（圈内/业内，路由 c 承重）', mod: 'sel', text: '圈内人的反馈收集了一大堆，结论却说成是全民意见。', inject: { RESTRICTED_SOURCE_ZH: withoutNew(S.RESTRICTED_SOURCE_ZH, SEL_RESTR_ZH_NEW) } },
  { label: 'GEN_VERB_ZH 拔高推广（拔高成/说白了）', mod: 'sel', text: '只筛出来自提名名单的作品，评审结论就被拔高成了全行业的标杆。', inject: { GEN_VERB_ZH: withoutNew(S.GEN_VERB_ZH, SEL_GVERB_ZH_NEW) } },
  { label: 'GEN_SCOPE_ZH 行业总体（全行业/普罗大众）', mod: 'sel', text: '只筛出来自提名名单的作品，评审结论就被拔高成了全行业的标杆。', inject: { GEN_SCOPE_ZH: withoutNew(S.GEN_SCOPE_ZH, SEL_GSCOPE_ZH_NEW) } },
  { label: 'SAMPLING_VERBS_EN 挖掘取证（dug up/sifted）', mod: 'sel', text: 'They dug up only chatter from coworkers, so the pattern is boiled down to the whole industry.', inject: { SAMPLING_VERBS_EN: withoutNew(S.SAMPLING_VERBS_EN, SEL_VERB_EN_NEW) } },
  { label: 'RESTRICTED_SOURCE_EN 社区渠道（livestream/subreddit）', mod: 'sel', text: 'Feedback from the livestream chat was gathered, so the pattern is boiled down to the whole industry.', inject: { RESTRICTED_SOURCE_EN: withoutNew(S.RESTRICTED_SOURCE_EN, SEL_RESTR_EN_NEW) } },
  { label: 'GEN_VERB_EN 被动推广（described as/boiled down to）', mod: 'sel', text: 'Feedback from the livestream chat was gathered, so the pattern is boiled down to the whole industry.', inject: { GEN_VERB_EN: withoutNew(S.GEN_VERB_EN, SEL_GVERB_EN_NEW) } },
  { label: 'GEN_SCOPE_EN 行业总体（practitioners/humankind）', mod: 'sel', text: 'Feedback from the livestream chat was gathered, so the pattern is boiled down to the taste of practitioners.', inject: { GEN_SCOPE_EN: withoutNew(S.GEN_SCOPE_EN, SEL_GSCOPE_EN_NEW) } },
  { label: 'CF_CN_A_RE 口语过去锚（早年间/那晚）', mod: 'cf', text: '要是早年间多存点钱，现在铁定财富自由了。', inject: { CF_CN_A_RE: NEVER } },
  { label: 'CERT_ZH_RE 口语强确定（铁定/准能/板上钉钉）', mod: 'cf', text: '那晚要是听了劝，现在铁定不至于这么惨。', inject: { CERT_ZH_RE: NEVER } },
  { label: 'CERT_EN_RE 口语强确定（guaranteed/for sure）', mod: 'cf', text: 'Had we taken the deal back then, success was guaranteed.', inject: { CERT_EN_RE: NEVER } },
  { label: 'CONFIRM_ZH 眼光准族', mod: 'uf', text: '涨了是我眼光准，跌了是市场还没睡醒。', inject: { CONFIRM_ZH: U.CONFIRM_ZH.slice(0, -2) } },
  { label: 'CONFIRM_ZH 教主英明族', mod: 'uf', text: '成了是教主英明，败了是信徒心不诚。', inject: { CONFIRM_ZH: U.CONFIRM_ZH.slice(0, -1) } },
  { label: 'CONFIRM_EN instincts/judgment 族', mod: 'uf', text: 'If the plan works, it proves my instincts; if it fails, the market just wasn\u2019t ready.', inject: { CONFIRM_EN: U.CONFIRM_EN.slice(0, -2) } },
  { label: 'OUTCOMES_EN either/if-fails 腿①族', mod: 'uf', text: 'Either the model fits or it doesn\u2019t \u2014 both outcomes confirm my theory.', inject: { OUTCOMES_EN: U.OUTCOMES_EN.slice(0, -2) } },
];
const CHK = {
  rev: (t, inj) => revMod.checkReverseCausation(t, inj),
  sel: (t, inj) => selMod.checkSelectionBias(t, inj),
  cf: (t, inj) => cfMod.checkCounterfactualOverclaim(t, inj),
  uf: (t, inj) => ufMod.checkUnfalsifiableConfirmation(t, inj),
};
const HIT = { rev: r => r.score > 0, sel: r => r.score > 0, cf: r => r.hit === true, uf: r => r.hit === true };
let injRed = 0;
for (const c of INJ) {
  const before = CHK[c.mod](c.text);
  const after = CHK[c.mod](c.text, c.inject);
  ok(HIT[c.mod](before) && !HIT[c.mod](after), '注入删条变红: ' + c.label);
  if (HIT[c.mod](before) && !HIT[c.mod](after)) injRed++;
}

console.log('\nround-275-wired-family-extensions: ' + passed + ' passed / ' + failed + ' failed（注入 ' + INJ.length + ' 个：' + injRed + ' 个变红）');
console.log('cleanup: none (pure in-memory checks)');
if (failed > 0) process.exit(1);
