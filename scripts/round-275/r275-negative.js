'use strict';
// round-275 负例：注入-删条验证。逐条删掉本轮每个新模式，断言守卫必须
// 从命中转为未命中（注入前须命中，否则样本本身不穿透，判失败）。
// 清理：纯内存 require 缓存操作，无磁盘副作用。
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const rev = require(path.join(ROOT, 'src', 'reverse-causation.js'));
const sel = require(path.join(ROOT, 'src', 'selection-bias.js'));
const cf = require(path.join(ROOT, 'src', 'counterfactual-overclaim.js'));
const uf = require(path.join(ROOT, 'src', 'unfalsifiable-confirmation.js'));
const R = rev.__internals(), S = sel.__internals, U = uf.__internals();

const NEVER = /(?!x)x/;
const withoutNew = (arr, newWords) => arr.filter(x => !newWords.includes(x));

// r275 新词清单（按模块）
const REV_RESP_ZH_NEW = ['助听器', '拄拐', '轮椅', '假肢', '护膝', '护腰', '护腕', '支具', '矫姿器', '背背佳', '[Oo][Kk]镜', '角膜塑形镜', '离焦镜', '近视手术', '激光手术', '正畸', '整牙', '箍牙', '种牙', '根管', '针灸', '推拿', '拔罐', '艾灸', '理疗', '康复训练', '戒毒', '戒毒所', '强制戒毒', '戒断', '戒酒', '美沙酮', '写检查', '记过', '处分', '停课', '请家长', '补考', '重修', '补作业', '查征信', '拉征信', '调流水', '报险', '理赔', '核保', '索赔', '反诈', '防骗教育', '安全教育', '延保', '质保', '召回', '返厂', '风控', '反欺诈'];
const REV_GROUP_NEW = ['车主', '船主', '货主', '买家', '患者家属', '家长群', '业主群'];
const SEL_VERB_ZH_NEW = ['扒', '扒了', '捞', '捞了', '翻', '翻了', '翻完', '翻过', '筛', '筛出', '筛出来', '筛了', '调取', '导出', '抓过来', '扫了', '勾选'];
const SEL_SRC_ZH_NEW = ['捞自', '扒自', '翻自', '筛自', '爬自'];
const SEL_RESTR_ZH_NEW = ['超话', '小组', '贴吧', '知乎', '豆瓣', '小红书', '抖音', 'B站', 'b站', '直播间', '弹幕', '种草', '测评', '带货', '铁粉', '老粉', '热搜榜', '热榜', '推荐流', '信息流', '私域', '校友', '同门', '课题组', '老乡', '圈内', '业内', '腰部', '下沉', '小镇', '县城', '农村', '提名', '内推', '关系户', '路人', '吃瓜', '围观', '跟风', '同行'];
const SEL_GVERB_ZH_NEW = ['拔高成', '拔高为', '上升为', '上升到了', '一言以蔽之', '总而言之', '说白了', '说到底', '归结起来', '归纳出来', '总结成', '提炼成', '论定为', '定性为', '树成', '捧成', '放大成'];
const SEL_GSCOPE_ZH_NEW = ['全行业', '整个行业', '全世界', '全球范围', '人类', '世人', '普罗大众', '众人', '大江南北', '五湖四海', '全球用户', '海外用户', '四方', '业内', '同行', '从业者'];
const SEL_VERB_EN_NEW = ['dug up', 'digging up', 'sifted', 'sift', 'filtered to', 'filtered down to', 'sorted', 'cherry', 'combing'];
const SEL_RESTR_EN_NEW = ['livestream', 'live chat', 'super fans', 'superfans', 'fan subreddit', 'subreddit', 'discord', 'telegram', 'tiktok', 'xiaohongshu', 'zhihu', 'douban', 'bilibili', 'recommended feed', 'recommendation feed', 'trending page', 'private groups', 'fan club', 'stans', 'upvoted', 'top comments', 'nominat', 'rural', 'small towns', 'county-level', 'nominees', 'shilling', 'promoted'];
const SEL_GVERB_EN_NEW = ['boiled down to', 'boils down to', 'amounts to', 'amounted to', 'comes down to', 'elevated to', 'elevates to', 'framed as', 'frames it as', 'pitched as', 'sold as', 'presents it as', 'markets it as', 'described as', 'presented as', 'portrayed as', 'packaged as', 'marketed as', 'sold to'];
const SEL_GSCOPE_EN_NEW = ['the whole industry', 'the entire industry', 'the industry', 'all industries', 'humankind', 'humanity', 'all of humanity', 'everyone on earth', 'the whole world', 'the global user base', 'mainstream users', 'practitioners', 'everyone in the industry'];
const UF_CONFIRM_ZH_NEW_ELEMS = 2; // 末尾 2 个新元素
const UF_CONFIRM_EN_NEW_ELEMS = 2;
const UF_OUTCOMES_EN_NEW_ELEMS = 2;

const CASES = [
  // ── reverse_causation ──
  { label: 'RESP_ZH[0] 医疗辅具族（OK镜/助听器/反诈）', mod: 'rev', text: '戴OK镜的孩子视力问题更严重，可见OK镜加剧了视力问题。', inject: { RESP_ZH: [NEVER, R.RESP_ZH[1]] } },
  { label: 'RESP_EN[0] 辅具/反诈族（hearing aids/anti-fraud）', mod: 'rev', text: 'People with hearing aids report worse hearing outcomes, so hearing aids contribute to hearing problems.', inject: { RESP_EN: [NEVER, R.RESP_EN[1]] } },
  { label: 'GROUP_DE_ZH 车主族', mod: 'rev', text: '理赔过的车主出险更频繁，可见理赔诱发了更多事故。', inject: { GROUP_DE_ZH: [NEVER] } },
  // ── selection_bias ──
  { label: 'SAMPLING_VERBS_ZH 口语取证（扒/捞/翻/筛）', mod: 'sel', text: '样本只扒了圈内人的发言，结论却说成是全民意见。', inject: { SAMPLING_VERBS_ZH: withoutNew(S.SAMPLING_VERBS_ZH, SEL_VERB_ZH_NEW) } },
  { label: 'SOURCE_FROM_ZH 网络来源（扒自/捞自）', mod: 'sel', text: '评论扒自种草视频的评论区，却说成是全民意见。', inject: { SOURCE_FROM_ZH: withoutNew(S.SOURCE_FROM_ZH, SEL_SRC_ZH_NEW) } },
  { label: 'RESTRICTED_SOURCE_ZH 社区渠道（圈内/业内）', mod: 'sel', text: '圈内人的反馈收集了一大堆，结论却说成是全民意见。', inject: { RESTRICTED_SOURCE_ZH: withoutNew(S.RESTRICTED_SOURCE_ZH, SEL_RESTR_ZH_NEW) } },
  { label: 'GEN_VERB_ZH 拔高推广（拔高成/说白了）', mod: 'sel', text: '只筛出来自提名名单的作品，评审结论就被拔高成了全行业的标杆。', inject: { GEN_VERB_ZH: withoutNew(S.GEN_VERB_ZH, SEL_GVERB_ZH_NEW) } },
  { label: 'GEN_SCOPE_ZH 行业总体（全行业/普罗大众）', mod: 'sel', text: '只筛出来自提名名单的作品，评审结论就被拔高成了全行业的标杆。', inject: { GEN_SCOPE_ZH: withoutNew(S.GEN_SCOPE_ZH, SEL_GSCOPE_ZH_NEW) } },
  { label: 'SAMPLING_VERBS_EN 挖掘取证（dug up/sifted）', mod: 'sel', text: 'They dug up only chatter from coworkers, so the pattern is boiled down to the whole industry.', inject: { SAMPLING_VERBS_EN: withoutNew(S.SAMPLING_VERBS_EN, SEL_VERB_EN_NEW) } },
  { label: 'RESTRICTED_SOURCE_EN 社区渠道（livestream/subreddit）', mod: 'sel', text: 'Feedback from the livestream chat was gathered, so the pattern is boiled down to the whole industry.', inject: { RESTRICTED_SOURCE_EN: withoutNew(S.RESTRICTED_SOURCE_EN, SEL_RESTR_EN_NEW) } },
  { label: 'GEN_VERB_EN 被动推广（described as/boiled down to）', mod: 'sel', text: 'Feedback from the livestream chat was gathered, so the pattern is boiled down to the whole industry.', inject: { GEN_VERB_EN: withoutNew(S.GEN_VERB_EN, SEL_GVERB_EN_NEW) } },
  { label: 'GEN_SCOPE_EN 行业总体（practitioners/humankind）', mod: 'sel', text: 'Feedback from the livestream chat was gathered, so the pattern is boiled down to the taste of practitioners.', inject: { GEN_SCOPE_EN: withoutNew(S.GEN_SCOPE_EN, SEL_GSCOPE_EN_NEW) } },
  // ── counterfactual_overclaim ──
  { label: 'CF_CN_A_RE 口语过去锚（早年间/那晚）', mod: 'cf', text: '要是早年间多存点钱，现在铁定财富自由了。', inject: { CF_CN_A_RE: NEVER } },
  { label: 'CERT_ZH_RE 口语强确定（铁定/准能/板上钉钉）', mod: 'cf', text: '那晚要是听了劝，现在铁定不至于这么惨。', inject: { CERT_ZH_RE: NEVER } },
  { label: 'CERT_EN_RE 口语强确定（guaranteed/for sure）', mod: 'cf', text: 'Had we taken the deal back then, success was guaranteed.', inject: { CERT_EN_RE: NEVER } },
  // ── unfalsifiable_confirmation ──
  { label: 'CONFIRM_ZH 眼光准族', mod: 'uf', text: '涨了是我眼光准，跌了是市场还没睡醒。', inject: { CONFIRM_ZH: U.CONFIRM_ZH.slice(0, -UF_CONFIRM_ZH_NEW_ELEMS) } },
  { label: 'CONFIRM_ZH 教主英明族', mod: 'uf', text: '成了是教主英明，败了是信徒心不诚。', inject: { CONFIRM_ZH: U.CONFIRM_ZH.slice(0, -1) } },
  { label: 'CONFIRM_EN instincts/judgment 族', mod: 'uf', text: 'If the plan works, it proves my instincts; if it fails, the market just wasn\u2019t ready.', inject: { CONFIRM_EN: U.CONFIRM_EN.slice(0, -UF_CONFIRM_EN_NEW_ELEMS) } },
  { label: 'OUTCOMES_EN either/if-fails 腿①族', mod: 'uf', text: 'Either the model fits or it doesn\u2019t \u2014 both outcomes confirm my theory.', inject: { OUTCOMES_EN: U.OUTCOMES_EN.slice(0, -UF_OUTCOMES_EN_NEW_ELEMS) } },
];

const CHK = {
  rev: (t, inj) => rev.checkReverseCausation(t, inj),
  sel: (t, inj) => sel.checkSelectionBias(t, inj),
  cf: (t, inj) => cf.checkCounterfactualOverclaim(t, inj),
  uf: (t, inj) => uf.checkUnfalsifiableConfirmation(t, inj),
};
const HIT = {
  rev: r => r.score > 0,
  sel: r => r.score > 0,
  cf: r => r.hit === true,
  uf: r => r.hit === true,
};

let red = 0, notRed = 0;
for (const c of CASES) {
  const before = CHK[c.mod](c.text);
  const after = CHK[c.mod](c.text, c.inject);
  const okIn = HIT[c.mod](before);
  const okOut = !HIT[c.mod](after);
  if (okIn && okOut) { red++; console.log('  ✓ 变红: ' + c.label); }
  else {
    notRed++;
    console.log('  ✗ 未变红: ' + c.label
      + ' | before=' + JSON.stringify(before.score !== undefined ? before.score : before.hit)
      + ' after=' + JSON.stringify(after.score !== undefined ? after.score : after.hit));
  }
}
console.log('注入 ' + CASES.length + ' 个：' + red + ' 个变红，' + notRed + ' 个未变红');
console.log('cleanup: none (pure in-memory checks)');
if (notRed > 0) process.exit(1);
