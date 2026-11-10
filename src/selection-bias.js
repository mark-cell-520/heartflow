/**
 * src/selection-bias.js
 * [r169] 第 168 维度 selection_bias（取样偏差 / 取样框限制谬误）。
 *
 * 形态：只从一个受限的、自选择的或非随机的来源取证，却把结论推广到
 * 全体 / 普遍 / 代表所有——取样来源与结论总体不匹配，证据效力被夸大。
 *   「问卷只发给了注册会员，所以调查结果代表全体用户的满意度。」
 *   「数据只来自一线城市的活跃用户，足以说明全国用户的偏好。」
 *   「样本全部来自自愿报名的志愿者，因此这个结论具有普遍性。」
 *   「公司只收集了投诉客户的意见，这说明客户整体都很不满意。」
 *   「We only surveyed volunteers, so the results are representative of everyone.」
 *   「The sample was drawn solely from our premium users, which means all customers prefer this feature.」
 *
 * 判据（双腿共现，缺一不判）：
 *   腿① RESTRICTION 取样受限——两种路由：
 *     (a) 限定标记（只/仅/仅仅/唯独/全都/全部/都/均/only/solely/restricted to/
 *         limited to/confined to）与取样动词（调查/统计/采访/回收/收集/纳入/
 *         分析/问卷/数据/样本/来自/源于/发给/survey/sampled/drawn/recruited…）
 *         同句近距离共现；
 *     (b) 来源短语（样本/数据/问卷/意见/反馈 + 全部/都/均/只/仅 + 来自/源于/取自）
 *         且句内带受限来源词（会员/活跃/自愿/志愿者/愿意/投诉/一线/管理层/
 *         volunteers/premium/self-selected…）。
 *   腿② GENERALIZATION 总体推广——结论子句三条路由任一：
 *     (a) 推广动词（代表/适用于/推广/反映/具有/足以说明/足以证明/说明/证明/
 *         representative of/generalizes to/applies to）近距离接总体范围词
 *         （全体/所有/整体/全国/每个人/普遍/all/every/everyone）；
 *     (b) 推断词（这说明/说明/可见/证明/means/so/therefore）接总体范围词；
 *     (c) 总体范围词 + 「都」形全称判断（全体员工都认可）。
 *
 * 天然区分（结构即豁免）：
 *   - 明示局限（只能反映/不能代表/不一定成立/存在偏差）→ 正确推理，不判
 *   - 充分取样（随机抽样/分层抽样/普查）→ 推广有效，不判
 *   - 幸存者措辞（幸存者/活下来/survivors）→ 射程留给 survivorship_bias
 *   - 只描述样本自身（会员的满意度更高/所有样本都合格）→ 无总体范围词，不判
 *   - 概率化结论（可能/也许/maybe）→ 非全称推广，不判
 *
 * [r267 扩展] 池化探针实测 6/6 穿透的新措辞家族（scripts/round-267/
 * r267-probe-pool.js，v6.8.157）：① 口语化取证动词（问卷只撒在…/反馈
 * 全部捡自…/数据爬取自…）与渠道受限来源（微信群/首页推送/好评区/粉丝
 * 过万/抢到票/上岸；EN verified accounts / english-language / trending
 * hashtags / launch page + mined/crawled/scraped 网络取证动词）；② 口语
 * 化收尾推广（说成是全民意见/包装成/足见…公认/就能看出；EN captures /
 * reflects / describes + global / worldwide / the whole platform 口径）。
 * 良性对照（只能代表这三个群/不足以推断/covers ticket holders only/
 * would be invalid）实测零误伤。
 *
 * 决策出处：heartflow_philosophy_decision（type=accelerate / confidence 0.7 /
 * priority 40；rationale 的 cognitiveLoad 与 uncertainty 为 "unknown"）。
 * 候选池来自 /tmp/r169-gap-probe.js 与 /tmp/r169-baseline-probe.js 在当前
 * v6.8.96 / 167 维引擎实测：取样偏差族 9/10 真零命中（对照候选：可得性启发
 * 5/6、聚类错觉 4/5、区群谬误与回归均值 3/4 被存量维度代拦）。
 * survivorship_bias(132) 管「只看幸存者」，本族管「取样框限制 × 总体推广」。
 */
'use strict';

// ── 腿①路由 a：限定标记 × 取样动词 ────────────────────────────
const RESTRICT_ZH = ['只', '仅', '仅仅', '唯独', '全都', '全部', '都', '均'];
const SAMPLING_VERBS_ZH = ['调查', '统计', '采访', '回收', '收集', '纳入', '分析', '研究', '取样', '抽样', '问卷', '数据', '样本', '来源', '覆盖', '问', '看', '发给', '发放', '寄给', '送达', '来自', '源于', '取自', '限于', '局限于', '问询', '访谈', '测评', '评估', '监测', '抓取', '爬取', '回复', '回答',
  // [r267] 口语化取证动词族（问卷只撒在…/反馈全部捡自…）：撒/发在/捡自/选自
  '撒在', '撒了', '发在', '发至', '发到', '贴在', '捡自', '选自', '摘自', '录自', '引自', '搬运', '转载',
  // [r275 新增族] 网络社区口语取证动词（扒/捞/翻/筛/调取）——「只扒了超话」
  // 「数据全部捞自直播间」「只翻了推荐流」「筛出来自提名名单的作品」
  '扒', '扒了', '捞', '捞了', '翻', '翻了', '翻完', '翻过', '筛', '筛出', '筛出来', '筛了', '调取', '导出', '抓过来', '扫了', '勾选'];

// ── 腿①路由 b：来源短语 + 受限来源词 ──────────────────────────
const SOURCE_NOUN_ZH = ['样本', '数据', '问卷', '意见', '反馈', '案例', '受访者', '参与者', '受访对象', '来源', '资料', '对象', '答卷', '评论', '留言'];
const SOURCE_FROM_ZH = ['来自', '源于', '取自', '出自', '集中在', '局限于', '仅限于',
  // [r267] 口语化来源动词（捡自/选自/摘自/录自/引自）
  '捡自', '选自', '摘自', '录自', '引自',
  // [r275 新增族] 网络社区来源动词（捞自/扒自/翻自/筛自）——「捞自直播间的弹幕」
  '捞自', '扒自', '翻自', '筛自', '爬自'];
const RESTRICTED_SOURCE_ZH = ['会员', '注册', '活跃', '自愿', '志愿者', '愿意', '报名', '投诉', '复购', '留存', '坚持', '一线', '某平台', '某地区', '特定', '个别', '少数', '部分', '头部', '精英', '死忠', '订阅', '付费', '老用户', '新用户', '在职', '在岗', '管理层', '内部', '朋友圈', '微信群', '评论区', '热搜', '首页', '推荐', '榜单', '获奖', '优胜', '入选', '被录取', '被录用', '投稿', '点赞', '转发', '购买过', '咨询过', '浏览过', '注册用户', '活跃用户', '付费用户', '种子用户', '核心用户', '本校', '本公司', '本院', '本班', '本群', '本店', '本地',
  // [r267] 渠道/圈子受限来源族（群聊/首页推送/好评区/粉丝过万/抢到票/上岸）
  '群聊', '群里', '推送', '私信', '私聊', '好评', '差评', '粉丝', '大v', '大V', '过万', '抢到', '上岸', '录用', '名单里', '榜单上',
  // [r275 新增族] 网络社区/圈子渠道受限来源（超话/直播间弹幕/种草区/知乎回答/
  // 县城/提名名单/关系户——自选择渠道，取样框即结论总体的反例）
  '超话', '小组', '贴吧', '知乎', '豆瓣', '小红书', '抖音', 'B站', 'b站', '直播间', '弹幕', '种草', '测评', '带货', '铁粉', '老粉', '热搜榜', '热榜', '推荐流', '信息流', '私域', '校友', '同门', '课题组', '老乡', '圈内', '业内', '腰部', '下沉', '小镇', '县城', '农村', '提名', '内推', '关系户', '路人', '吃瓜', '围观', '跟风', '同行'];

// ── 腿②：总体推广 ─────────────────────────────────────────────
const GEN_VERB_ZH = ['代表', '代表着', '代表了', '适用于', '推广到', '推广至', '可以推广', '足以推广', '能够推广', '反映', '反映着', '反映了', '具有', '具有着', '足以说明', '足以证明', '这说明', '说明', '证明', '可见', '意味着', '表明', '推出', '可知', '说明',
  // [r267] 口语化收尾推广族（说成是/包装成/足见/就能看出）：受限取证 → 全民口径结论
  '说成', '说成是', '包装成', '吹成', '论定', '足见', '看出', '能看出', '就可看出', '足以看出',
  // [r275 新增族] 拔高/总结型收尾推广（拔高成/上升为/说白了/归结起来）——
  // 把受限取证拔成总体口径的口语收尾
  '拔高成', '拔高为', '上升为', '上升到了', '一言以蔽之', '总而言之', '说白了', '说到底', '归结起来', '归纳出来', '总结成', '提炼成', '论定为', '定性为', '树成', '捧成', '放大成'];
const GEN_SCOPE_ZH = ['全体', '所有', '整体', '全部', '全国', '全市', '全省', '全社会', '每个人', '所有人', '任何人', '无一例外', '整个', '普遍', '全貌', '普适', '全体用户', '所有用户', '全国用户', '整个市场', '整个人群', '全部用户', '大众', '民众', '公众', '人们', '大家', '老百姓', '各界',
  // [r267] 新总体范围族（全民/全网/消费者/网民/观众/读者/用户群/顾客/歌迷/考生）
  '全民', '全网', '消费者', '网民', '观众', '读者', '用户群', '顾客', '客户群', '歌迷', '考生', '粉丝', '大众市场',
  // [r275 新增族] 行业/人类口径总体范围（全行业/全世界/普罗大众/人类/从业者）
  '全行业', '整个行业', '全世界', '全球范围', '人类', '世人', '普罗大众', '众人', '大江南北', '五湖四海', '全球用户', '海外用户', '四方', '业内', '同行', '从业者'];
const INFER_ZH = ['所以', '因此', '因而', '可见', '这说明', '那就意味着', '这就意味着', '显然', '肯定是', '一定是', '足以证明', '足以说明', '说明', '证明', '意味着', '故', '这证明', '就是说', '可知', '足见', '就断言', '断言', '就宣称', '宣称', '就得出', '得出结论', '据此认为', '就据此认为', '就认为', '就证明', '妄下结论', '草率结论', '就此认定', '认定'];
const PREMISE_MARKERS = ['毕竟', '因为', '由于', '鉴于', 'because', 'since'];

// [r267] 裸量词型范围词（可挂在样本名词前——「所有样本都合格」是样本自述，
// 不是总体推广）；总体口径词（全民/全网/消费者/网民…）不适用该豁免
const SAMPLE_SELF_SCOPES = ['所有', '全部', '整体', '整个', '任何', '普遍', '人们', '大家', '各界'];

// ── 守卫 ──────────────────────────────────────────────────────
const ACK_FULL_ZH = ['不能代表', '不足以推广', '不可推广', '不应推广', '不宜推广', '仅供参考', '解读需谨慎', '需要谨慎', '只能反映', '仅代表', '不能推广', '难以推广', '不宜夸大', '不应夸大', '不足以说明', '不能得出'];
const ACK_CLAUSE_ZH = ['不一定', '未必', '可能不', '难以', '不能代表', '不代表', '仅限于', '只代表', '有待', '存疑', '需要更多', '无法说明', '尚不', '有待验证', '需进一步', '不能说明', '不足以说明', '不足以证明', '尚待', '不能得出', '很难说', '不好说'];
const ADEQUATE_ZH = ['随机抽样', '随机抽取', '随机取样', '分层抽样', '概率抽样', '代表性样本', '大样本', '普查', '随机', '抽样方法'];
const HEDGE_ZH = ['可能', '也许', '或许', '大概', '恐怕', '未必', '不一定', '往往', '通常', '大多数', '大部分', '多数', '一般而言', '一般来说', '倾向于', '有些'];
const SURVIVOR_ZH = ['幸存者', '生存下来', '活下来', '生还者', '幸存', '遇难'];
const META_CONCEPT = ['取样偏差', '选择偏差', '抽样偏差', '自选择偏差', '样本偏差', '取样框', 'selection bias', 'sampling bias', 'self-selection', 'selection effect'];
const TEACH = ['老师', '教材', '课堂', '课本', '教学', '教授', '讲师', '教研室', 'textbook', 'lecture', 'lesson', 'professor'];

const RESTRICT_EN = ['only', 'solely', 'exclusively', 'restricted to', 'limited to', 'confined to', 'just', 'all from', 'came only'];
const SAMPLING_VERBS_EN = ['survey', 'surveyed', 'asked', 'sample', 'sampled', 'sampling', 'collect', 'collected', 'recruit', 'recruited', 'interview', 'interviewed', 'drawn', 'polled', 'data', 'responses', 'feedback', 'participants', 'respondents', 'volunteers', 'subscribers', 'followers', 'students', 'employees', 'players', 'readers', 'viewers', 'members', 'users', 'customers', 'source', 'sources',
  // [r267] 网络取证动词族（mined/crawled/scraped/harvested/compiled/pulled）
  'mined', 'mine', 'crawled', 'crawl', 'scraped', 'scrape', 'scraping', 'harvested', 'harvest', 'compiled', 'compile', 'pulled', 'aggregated',
  // [r275 新增族] 口语化挖掘/过滤取证动词（dug up/sifted/filtered to/sorted）
  'dug up', 'digging up', 'sifted', 'sift', 'filtered to', 'filtered down to', 'sorted', 'cherry', 'combing'];
const SOURCE_FROM_EN = ['from', 'drawn from', 'recruited from', 'collected from', 'gathered from'];
const RESTRICTED_SOURCE_EN = ['volunteers', 'volunteer', 'premium', 'subscribers', 'members', 'active users', 'paying', 'complaints', 'complainants', 'respondents who', 'participants who', 'those who', 'people who', 'early adopters', 'elite', 'successful', 'our own', 'internal', 'employees', 'managers', 'students at', 'one school', 'one city', 'one company', 'sign-ups', 'opt-in', 'self-selected', 'followers', 'likes', 'shares', 'handpicked', 'hand-picked', 'convenience', 'top',
  // [r267] 平台渠道受限来源族（verified accounts/english-language/trending hashtags/launch page）
  'verified accounts', 'verified', 'english-language', 'trending', 'hashtags', 'launch page', 'our own',
  // [r275 新增族] 网络社区渠道受限来源（livestream chat/super fans/subreddit/知乎/
  // 种草区/推荐流/rural counties——自选择渠道）
  'livestream', 'live chat', 'super fans', 'superfans', 'fan subreddit', 'subreddit', 'discord', 'telegram', 'tiktok', 'xiaohongshu', 'zhihu', 'douban', 'bilibili', 'recommended feed', 'recommendation feed', 'trending page', 'private groups', 'fan club', 'stans', 'upvoted', 'top comments', 'nominat', 'rural', 'small towns', 'county-level', 'nominees', 'shilling', 'promoted'];
const GEN_VERB_EN = ['representative of', 'representative for', 'represents', 'represent', 'applies to', 'generalizes to', 'generalize to', 'generalizes across', 'valid for', 'holds for', 'true for', 'true of', 'reflects', 'reflect', 'applies for', 'shows', 'proves', 'suggests', 'indicates', 'demonstrates', 'means', 'which shows', 'which proves', 'which suggests',
  // [r267] 描述-推广动词族（captures/describes/tracks/measures）：结论口径动词
  'captures', 'capture', 'describes', 'describe', 'tracks', 'track', 'measures', 'measure', 'speaks for',
  // [r275 新增族] 拔高/包装型推广动词（boiled down to/elevated to/framed as）
  'boiled down to', 'boils down to', 'amounts to', 'amounted to', 'comes down to', 'elevated to', 'elevates to', 'framed as', 'frames it as', 'pitched as', 'sold as', 'presents it as', 'markets it as',
  // [r275 新增族·被动推广形] 被包装成/被描述成（is described as / was presented
  // as）——「Feedback mined…is described as the taste of the entire audience」
  'described as', 'presented as', 'portrayed as', 'packaged as', 'marketed as', 'sold to'];
const GEN_SCOPE_EN = ['all', 'every', 'everyone', 'everybody', 'entire', 'whole', 'general', 'overall', 'the public', 'general public', 'most people', 'people in general', 'the masses', 'the audience', 'the market', 'all viewers', 'all consumers', 'every viewer', 'every consumer', 'all customers', 'all users', 'every customer', 'every user', 'whole audience', 'whole population', 'entire audience', 'entire population',
  // [r267] 全球/平台口径范围族（global/worldwide/mainstream/the internet/netizens）
  'global', 'worldwide', 'mainstream', 'the internet', 'netizens', 'the platform', 'the whole platform', 'the entire platform', 'the user base', 'the whole internet',
  // [r275 新增族] 行业/人类口径范围族（the whole industry/humankind/everyone on earth）
  'the whole industry', 'the entire industry', 'the industry', 'all industries', 'humankind', 'humanity', 'all of humanity', 'everyone on earth', 'the whole world', 'the global user base', 'mainstream users', 'practitioners', 'everyone in the industry'];
const ACK_FULL_EN = ['not representative', 'cannot be generalized', 'should not be generalized', 'only reflects', 'merely reflects', 'does not represent', 'cannot represent', 'not conclusive', 'inconclusive'];
const ACK_CLAUSE_EN = ['not necessarily', 'may not', 'might not', 'cannot', 'unclear', 'remains to be', 'yet to be', 'not proven', 'remains unclear',
  // [r267] 显式局限口语族（would be invalid / not valid / unscientific）
  'would be invalid', 'not valid', 'unscientific', 'overgeneralizes', 'over-generalizes'];
const ADEQUATE_EN = ['random sample', 'randomly selected', 'randomly sampled', 'stratified', 'probability sample', 'representative sample', 'census', 'randomly', 'random'];
const HEDGE_EN = ['may', 'might', 'could', 'perhaps', 'probably', 'likely', 'possibly', 'seems', 'appears', 'tends', 'tend'];
const SURVIVOR_EN = ['survivors', 'survivor', 'survived', 'those who survived'];

const EN_STOP = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'of', 'to', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'by', 'that', 'this', 'it', 'its', 'as', 'if', 'then', 'so', 'who', 'which']);

function _clauses(t) {
  const parts = t.split(/[。；;！!？?\n]+/).map(s => s.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    const subs = p.split(/\.(?=\s|[A-Z"']|$)/).map(s => s.trim()).filter(Boolean);
    for (const s of subs) out.push(s);
  }
  return out;
}

function _isEN(s) { return /[a-zA-Z]/.test(s) && !/[\u4e00-\u9fff]/.test(s); }

function _hasNegBefore(s, word) {
  // 取样方法前带否定（「不是随机抽样」「非随机」）→ 不算充分取样
  let idx = s.indexOf(word);
  while (idx >= 0) {
    const pre = s.slice(Math.max(0, idx - 5), idx);
    if (!/(?:非|不是|并非|没有|无|缺乏|缺少|未)/.test(pre)) return true;
    idx = s.indexOf(word, idx + 1);
  }
  return false;
}

// ── 腿①：取样受限检测 ─────────────────────────────────────────
function _findRestriction(clause, R) {
  R = R || {};
  const RESTRICT_EN_R = R.RESTRICT_EN || RESTRICT_EN;
  const SAMPLING_VERBS_EN_R = R.SAMPLING_VERBS_EN || SAMPLING_VERBS_EN;
  const SOURCE_FROM_EN_R = R.SOURCE_FROM_EN || SOURCE_FROM_EN;
  const RESTRICTED_SOURCE_EN_R = R.RESTRICTED_SOURCE_EN || RESTRICTED_SOURCE_EN;
  if (_isEN(clause)) {
    const low = clause.toLowerCase();
    for (const r of RESTRICT_EN_R) {
      const idx = low.indexOf(r);
      if (idx < 0) continue;
      const win = low.slice(idx, idx + r.length + 90);
      for (const v of SAMPLING_VERBS_EN_R) {
        if (win.includes(v)) return { type: 'EN_RESTRICT', word: r + '+' + v, idx };
      }
    }
    // 来源短语路由：sample/data/participants … from + 受限来源词
    for (const n of ['sample', 'data', 'participants', 'respondents', 'responses', 'feedback', 'survey', 'study', 'poll',
      // [r267] 注册/渠道名词（sign-ups from our own launch page）
      'sign-ups', 'signups']) {
      if (!SOURCE_FROM_EN_R.length) break;
      const re = new RegExp('\\b' + n + '\\b[^.;]{0,40}?\\b(' + SOURCE_FROM_EN_R.join('|') + ')\\b', 'i');
      const mt = clause.match(re);
      if (mt && RESTRICTED_SOURCE_EN_R.some(rs => low.includes(rs))) return { type: 'EN_SOURCE', word: mt[0].slice(0, 40), idx: mt.index };
    }
    // [r267] 动词前置限定路由（mined only from / scraped solely from）：
    // 网络取证动词出现在限定标记之前，原「标记在前」路由覆盖不到该语序
    if (SAMPLING_VERBS_EN_R.length) {
      const revRe = new RegExp('\\b(' + SAMPLING_VERBS_EN_R.join('|') + ')\\s+(?:only|solely|exclusively|just)\\b', 'i');
      const rmt = clause.match(revRe);
      if (rmt) return { type: 'EN_RESTRICT', word: rmt[0].slice(0, 40), idx: rmt.index };
    }
    return null;
  }
  // 路由 a：限定标记 × 取样动词（标记在前 12 字内——「问卷只发给了」「只统计了」）
  const RESTRICT_ZH_R = R.RESTRICT_ZH || RESTRICT_ZH;
  const SAMPLING_VERBS_ZH_R = R.SAMPLING_VERBS_ZH || SAMPLING_VERBS_ZH;
  const SOURCE_NOUN_ZH_R = R.SOURCE_NOUN_ZH || SOURCE_NOUN_ZH;
  const SOURCE_FROM_ZH_R = R.SOURCE_FROM_ZH || SOURCE_FROM_ZH;
  const RESTRICTED_SOURCE_ZH_R = R.RESTRICTED_SOURCE_ZH || RESTRICTED_SOURCE_ZH;
  for (const m of RESTRICT_ZH_R) {
    let from = 0, idx;
    while ((idx = clause.indexOf(m, from)) >= 0) {
      const win = clause.slice(idx, idx + m.length + 12);
      for (const v of SAMPLING_VERBS_ZH_R) {
        if (win.includes(v)) return { type: 'RESTRICT', word: m + '+' + v, idx };
      }
      from = idx + 1;
    }
  }
  // 路由 b：来源名词 + 来自类 + 受限来源词（裸名词形态，无「只」也收）
  for (const n of SOURCE_NOUN_ZH_R) {
    const ni = clause.indexOf(n);
    if (ni < 0) continue;
    const win = clause.slice(ni, ni + 18);
    if (SOURCE_FROM_ZH_R.some(f => win.includes(f)) && RESTRICTED_SOURCE_ZH_R.some(rs => clause.includes(rs))) {
      return { type: 'SOURCE', word: n, idx: ni };
    }
  }
  // [r275 新增族·路由 c] 社区渠道来源 × 取样动词（动词在渠道词之后——
  // 「直播间弹幕捞了一遍」「圈内人的反馈收集了一大堆」）：与 EN 侧
  // RESTRICT_EN×90 字符窗同构。RESTRICTED_SOURCE_ZH 此前只在路由 b 充任
  // 必要条件、从不单独触发，渠道词族因此无承重路径（r275 探针实证）。
  // 与路由 b 语序互补：本路由 verb 在渠道词后，路由 b 来源动词在渠道词前，
  // 两条互不兜底，既有注入删条验证不受影响。
  for (const rs of RESTRICTED_SOURCE_ZH_R) {
    const idx = clause.indexOf(rs);
    if (idx < 0) continue;
    const win = clause.slice(idx + rs.length, idx + rs.length + 90);
    for (const v of SAMPLING_VERBS_ZH_R) {
      if (win.includes(v)) return { type: 'RESTRICTED_SOURCE', word: rs + '+' + v, idx };
    }
  }
  return null;
}

// ── 腿②：总体推广检测 ─────────────────────────────────────────
function _scopeRefersSample(clause, scopeIdx, scopeWord) {
  // 范围词指向样本自身（「所有样本都合格」「全部数据来自」）→ 不是总体推广。
  // [r267] 只对裸量词型范围词生效（所有/全部/整体/整个/任何/普遍/人们/大家/
  // 各界）——它们能挂在样本名词前；「全民/全网/消费者/网民/观众」等总体口径
  // 词本身就是总体（「说成是全民意见」是推广结论，不是样本自述）。
  if (!SAMPLE_SELF_SCOPES.includes(scopeWord)) return false;
  // 范围词指向样本自身（「所有样本都合格」「全部数据来自」）→ 不是总体推广
  const after = clause.slice(scopeIdx + scopeWord.length, scopeIdx + scopeWord.length + 4);
  return /^(?:样本|问卷|数据|意见|反馈|回答|投诉|案例|答卷|评论)/.test(after);
}

function _hasGeneralization(clause, R) {
  R = R || {};
  const GEN_VERB_ZH_R = R.GEN_VERB_ZH || GEN_VERB_ZH;
  const GEN_SCOPE_ZH_R = R.GEN_SCOPE_ZH || GEN_SCOPE_ZH;
  const GEN_VERB_EN_R = R.GEN_VERB_EN || GEN_VERB_EN;
  const GEN_SCOPE_EN_R = R.GEN_SCOPE_EN || GEN_SCOPE_EN;
  if (_isEN(clause)) {
    const low = clause.toLowerCase();
    for (const v of GEN_VERB_EN_R) {
      const idx = low.indexOf(v);
      if (idx < 0) continue;
      const win = low.slice(idx + v.length, idx + v.length + 45);
      if (GEN_SCOPE_EN_R.some(s => new RegExp('\\b' + s.replace(/\s+/g, '\\s+') + '\\b').test(win))) return 'EN_A';
    }
    for (const inf of ['shows', 'proves', 'means', 'suggests', 'indicates', 'demonstrates', 'so', 'therefore', 'thus', 'consequently']) {
      const idx = low.indexOf(inf);
      if (idx < 0) continue;
      const win = low.slice(idx + inf.length, idx + inf.length + 40);
      if (/\b(all|every|everyone|everybody)\b/.test(win)) return 'EN_B';
    }
    if (/\b(all|every|each)\s+[a-z]+(?:\s+[a-z]+){0,4}\s+(are|is|do|have|prefer|prefers|agree|agrees|like|likes|support|supports|want|wants|need|needs|love|loves|enjoy|enjoys)\b/i.test(clause)) return 'EN_C';
    // [r267] 平台/全球口径裸范围族（the whole platform / the entire internet /
    // the user base）：短语本身就是总体范围，无需前置推广动词
    if (/\b(?:the\s+)?(?:whole|entire)\s+(?:platform|internet|community|user\s*base|population|market|audience|world)\b/i.test(clause)) return 'EN_D';
    return null;
  }
  // 路由 a：推广动词 + 近距离总体范围词
  for (const v of GEN_VERB_ZH_R) {
    let from = 0, idx;
    while ((idx = clause.indexOf(v, from)) >= 0) {
      const win = clause.slice(idx + v.length, idx + v.length + 14);
      for (const s of GEN_SCOPE_ZH_R) {
        const si = win.indexOf(s);
        if (si >= 0 && !_scopeRefersSample(clause, idx + v.length + si, s)) return 'ZH_A';
      }
      from = idx + 1;
    }
  }
  // 路由 c：总体范围词 + 「都」形全称判断
  for (const s of GEN_SCOPE_ZH_R) {
    const si = clause.indexOf(s);
    if (si < 0) continue;
    if (_scopeRefersSample(clause, si, s)) continue;
    const win = clause.slice(si + s.length, si + s.length + 10);
    if (win.includes('都')) return 'ZH_C';
  }
  return null;
}

function _findInfer(f) {
  const low = f.toLowerCase();
  let best = null;
  for (const w of INFER_ZH) {
    const idx = f.indexOf(w);
    if (idx >= 0 && (!best || w.length >= best.word.length)) best = { word: w, idx };
  }
  for (const w of ['so', 'therefore', 'thus', 'which means', 'that means', 'consequently', 'hence', 'which shows', 'shows', 'which proves', 'proves', 'which suggests', 'suggests', 'indicates', 'demonstrates', 'means']) {
    const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    const mt = low.match(re);
    if (mt && (!best || mt.index < best.idx)) best = { word: w, idx: mt.index };
  }
  // [r275 新增族] 被动推广动词进推断词表（is described as / was presented as
  // /被说成是）：受限取证 → 总体口径的推广句里它们充当推断词，缺了它们
  // cands 空转导致整族漏判（r275 探针：「Feedback mined exclusively…
  // is described as the taste of the entire audience」）
  for (const w of ['described as', 'presented as', 'portrayed as', 'framed as', 'packaged as', 'marketed as', 'boiled down to', 'amounts to', 'comes down to', 'elevated to']) {
    const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    const mt = low.match(re);
    if (mt && (!best || mt.index < best.idx)) best = { word: w, idx: mt.index };
  }
  return best;
}

function _findPremiseMarker(f) {
  const low = f.toLowerCase();
  let best = null;
  for (const w of PREMISE_MARKERS) {
    const idx = /^[a-z]+$/.test(w) ? low.indexOf(w) : f.indexOf(w);
    if (idx >= 0 && (!best || idx < best.idx)) best = { word: w, idx };
  }
  return best;
}

function _exempt(reason, word) {
  return { score: 0, verdict: 'pass', exempt: true, exempt_reason: reason + ':' + word, count: 0, detail: '', hits: [], strength: 'none' };
}

function _pass() {
  return { score: 0, verdict: 'pass', exempt: false, exempt_reason: null, count: 0, detail: '', hits: [], strength: 'none' };
}

function checkSelectionBias(text, inject) {
  const R = inject || {};
  const t = typeof text === 'string' ? text : '';
  if (!t.trim()) return _pass();

  // 全文级守卫（概念 / 教学 / 幸存者射程 / 充分取样 / 明示局限）
  for (const m of META_CONCEPT) { if (t.toLowerCase().includes(m)) return _exempt('META_CONCEPT', m); }
  for (const m of TEACH) { if (t.includes(m)) return _exempt('TEACH', m); }
  for (const m of SURVIVOR_ZH) { if (t.includes(m)) return _exempt('SURVIVOR', m); }
  for (const m of SURVIVOR_EN) { if (t.toLowerCase().includes(m)) return _exempt('SURVIVOR', m); }
  for (const m of ADEQUATE_ZH) { if (t.includes(m) && _hasNegBefore(t, m)) return _exempt('ADEQUATE', m); }
  for (const m of ADEQUATE_EN) { if (t.toLowerCase().includes(m) && _hasNegBefore(t.toLowerCase(), m)) return _exempt('ADEQUATE', m); }
  for (const m of ACK_FULL_ZH) { if (t.includes(m)) return _exempt('ACK_FULL', m); }
  for (const m of ACK_FULL_EN) { if (t.toLowerCase().includes(m)) return _exempt('ACK_FULL', m); }

  const clauses = _clauses(t);
  const hits = [];

  for (let i = 0; i < clauses.length; i++) {
    const clause = clauses[i];
    const restr = _findRestriction(clause, R);
    if (!restr) continue;

    // 结论候选：同逗号段推断词后 / 后续逗号段（≤2）/ 前提标记（毕竟/因为）路由的倒装前段
    const subsegs = clause.split(/[，,]/).map(s => s.trim()).filter(Boolean);
    let segIdx = subsegs.length - 1;
    for (let k = 0; k < subsegs.length; k++) {
      if (clause.indexOf(subsegs[k]) >= 0 && clause.indexOf(subsegs[k]) <= restr.idx && restr.idx < clause.indexOf(subsegs[k]) + subsegs[k].length) { segIdx = k; break; }
    }
    const cands = [];
    const inf = _findInfer(subsegs[segIdx] || clause);
    if (inf && subsegs[segIdx].slice(inf.idx + inf.word.length).trim()) {
      cands.push({ text: subsegs[segIdx].slice(inf.idx + inf.word.length), mode: 'after-infer' });
    }
    for (let k = segIdx + 1; k <= Math.min(segIdx + 2, subsegs.length - 1); k++) {
      cands.push({ text: subsegs[k], mode: 'follow' });
    }
    // 跨句后续结论句（句号分隔，「研究只统计了X。因此所有人都有效。」）
    for (let j = i + 1; j <= Math.min(i + 2, clauses.length - 1); j++) {
      cands.push({ text: clauses[j], mode: 'follow' });
    }
    // 倒装路由：取样子句（或同句前段）带前提标记 → 前段/前句为结论候选
    const pmSame = _findPremiseMarker(clause);
    if (pmSame) {
      const seg = subsegs[segIdx] || clause;
      const pmInSeg = seg.indexOf(pmSame.word);
      if (pmInSeg > 0) cands.push({ text: seg.slice(0, pmInSeg), mode: 'back' });
      for (let k = segIdx - 1; k >= Math.max(0, segIdx - 2); k--) cands.push({ text: subsegs[k], mode: 'back' });
      for (let j = Math.max(0, i - 2); j < i; j++) cands.push({ text: clauses[j], mode: 'back' });
    }

    for (const cand of cands) {
      let body = cand.text;
      const cinf = _findInfer(body);
      // 推断词本身是推广动词（足以说明/说明/证明/可见…）时不断句——动词+范围词同在被判段
      if (cinf && !(R.GEN_VERB_ZH || GEN_VERB_ZH).includes(cinf.word) && !(R.GEN_VERB_EN || GEN_VERB_EN).includes(cinf.word)) {
        body = body.slice(cinf.idx + cinf.word.length);
      } else if (cand.mode === 'back' && !cinf) continue;
      const pmBody = _findPremiseMarker(body);
      if (pmBody) body = body.slice(0, pmBody.idx);
      body = body.replace(/^[，,。；;、\s]+/, '').trim();
      if (!body) continue;
      if (/[吗呢？?]$/.test(body)) continue;
      const low = body.toLowerCase();
      // 明示局限 / 概率化结论 → 不判
      if (ACK_CLAUSE_ZH.some(a => body.includes(a))) continue;
      if (ACK_CLAUSE_EN.some(a => low.includes(a))) continue;
      if (HEDGE_ZH.some(h => body.includes(h))) continue;
      if (HEDGE_EN.some(h => new RegExp('\\b' + h + '\\b').test(low))) continue;
      const route = _hasGeneralization(body, R);
      if (!route) continue;
      hits.push({ sample: clause.trim(), conclusion: body, type: restr.type, route });
      break;
    }
  }

  if (!hits.length) return _pass();

  const baseScore = { RESTRICT: 76, SOURCE: 74, EN_RESTRICT: 74, EN_SOURCE: 72 };
  let score = 0;
  for (const h of hits) score = Math.max(score, baseScore[h.type] || 70);
  score += Math.min(3 * (hits.length - 1), 9);
  score = Math.min(score, 90);

  const first = hits[0];
  const detail = '取样偏差（只从受限样本取证却推广到全体）' + hits.length + '处：取样来源「' + first.sample.slice(0, 22) +
    '」受限/自选择，却据此推出「' + first.conclusion.slice(0, 20) + '」——取样来源与结论总体不匹配，证据效力被夸大';
  return {
    score,
    verdict: score >= 70 ? 'unsupported' : 'pass',
    exempt: false,
    exempt_reason: null,
    count: hits.length,
    detail,
    hits: hits.map(h => ({ sample: h.sample, conclusion: h.conclusion, type: h.type, route: h.route })),
    strength: score >= 84 ? 'high' : score >= 70 ? 'medium' : 'none',
  };
}

module.exports = {
  checkSelectionBias,
  __internals: {
    RESTRICT_ZH, SAMPLING_VERBS_ZH,
    SOURCE_NOUN_ZH, SOURCE_FROM_ZH, RESTRICTED_SOURCE_ZH,
    GEN_VERB_ZH, GEN_SCOPE_ZH, INFER_ZH, PREMISE_MARKERS,
    ACK_FULL_ZH, ACK_CLAUSE_ZH, ADEQUATE_ZH, HEDGE_ZH, SURVIVOR_ZH, META_CONCEPT, TEACH,
    RESTRICT_EN, SAMPLING_VERBS_EN, SOURCE_FROM_EN, RESTRICTED_SOURCE_EN,
    GEN_VERB_EN, GEN_SCOPE_EN, ACK_FULL_EN, ACK_CLAUSE_EN, ADEQUATE_EN, HEDGE_EN, SURVIVOR_EN,
  },
};
