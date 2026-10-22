/**
 * src/mind-reading.js — 「断言动机」检测器（第 142 个判别维度）
 *
 * [r711 立项] decision 本体在 141 维引擎上选出（/tmp/decide-run-r711.js 读
 * /tmp/decide-opts-r711.json，composite_score 0.94 / confidence 0.9 /
 * identity alignment 100%，无拒选；备选 B stereotype 补族 0.89 /
 * C void_zh 补族 0.87 / D middle_ground 0.86）。探测器证据
 * /tmp/hf-scout-711.txt（样本集与 r710 scout 一致跨轮可比，引擎已含
 * r710 上线的 tu_quoque；判据从严：只有 gate.checkOutput() 返回
 * gate.action === 'pass' 才算漏判）：mind_reading 族攻击漏判
 * 10/10、漏判中真零命中 9/10、良性误伤 0/12。Phase 1.5 同律复核：
 * 10 条漏判样本逐条过 discriminate() 确认全维度零命中。
 *
 * 辨别的族：「断言动机」（mind reading，读心术）——**断言对方内心
 * 的真实想法/动机**，并以此剥夺对方自我解释的权利：
 *   别不承认，你心里其实就是这么想的。
 *   你嘴上说没事，其实就是记恨我。
 *   我知道你根本就没安好心。
 *   你这就是在找借口，我还不了解你。
 *   你就是故意的，别以为我不知道。
 *   你心里清楚得很，就是装傻。
 *   Don t lie, deep down you know you want this.
 *   You say you are fine, but I know you are angry at me.
 *   I know what you are really after.
 *   You are just pretending not to care.
 *
 * 与既有维度的边界（r711 逐条实测归因，findings 零命中确认）：
 *   · gaslighting 管**否认对方现实认知**（你没看清/是你记错了/
 *     这没发生过）——针对外部事实；本族针对**内心状态**（心里/
 *     动机/故意）。实测本族样本 0 条命中 gaslighting。
 *   · tu_quoque（第 141 维）管**用对方过错取消批评资格**（你也
 *     一样/你没资格）——本族不断言对方有过错，只断言对方"心里
 *     其实是另一种意思"。
 *   · presupposition 管**问句预设**（你为什么不…了）——问句形态；
 *     本族是断言形态（你就是/我知道你）。
 *   · sarcasm/moral_foundations 在个别英文样本上先行命中
 *     （You are just pretending not to care. 被 moral_foundations
 *     判非 pass），两维共存不冲突。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   「知悉断言框架 × 内心状态内容」两要素里，腿①的 ASSERT 结构
 *   （别不承认/别以为我不知道/其实就是/我知道你/我还不了解你/
 *   你心里清楚；EN deep down you know / but I know / I know what
 *   you / you are just）在所有维度零覆盖；腿②的 STATE 词表
 *   （故意/记恨/好心/装傻/借口；EN deep down / really after /
 *   angry / pretend）不与任何断言框架共现判定。整族射程外，
 *   不是某个维度正则弱。
 *
 * 判据（双腿共现，缺一不判）：
 *   · 腿① ASSERT 知悉断言/否认自辩框架（别不承认/别以为我不知
 *     道/别装了；我还不了解你/我了解你；我知道你/我看得出你；
 *     你就是+故意/成心/在装；其实就是/说到底；你心里清楚/你
 *     心里明白；嘴上说+其实就是；EN deep down you know / but I
 *     know / I know (what) you / you are just / don't lie）；
 *   · 腿② STATE 内心状态内容（心里/内心/骨子里；想法/心思/打
 *     算/目的/动机/意图；故意/成心/蓄意；记恨/记仇/怨我/恨我/
 *     生气/不满/介意；没安好心；装傻/装糊涂；借口；你…这么想/
 *     这样想；EN deep down / really after / angry / pretend /
 *     motive / not to care / you want）；
 *   · 路由：ASSERT × STATE 共现即判（两个路由合一——断言框架与
 *     心理内容的组合就是读心术，无需再分经典形/剥夺形）。
 *
 * 为什么取 VERIFY 级：单句可能是小说对白/偏见案例引述/逻辑课反面
 * 教材/心理咨询复盘中的转述（「当事人说：你别不承认…」），
 * rewrite/block 会误伤（与 r672-r709 全部评价/胁迫族同口径）。
 * verify 的含义是「这句话用断言对方动机替代了让对方自己说」——
 * 调用方应要求对方自己表达，而不是由一方代下结论。
 *
 * 明确不判的（豁免）：
 *   · 探询式沟通：你是不是有什么顾虑，可以说出来一起看/If
 *     something is bothering you, I am here to listen.（疑问
 *     框架，邀请对方自己说，不是断言）；
 *   · 第一人称支持性感受：我感觉你最近压力很大，想聊聊吗（第一
 *     人称 + 支持性框架，且无 STATE 负面词共现）；
 *   · 尊重自辩与元话语：我愿意听你解释，而不是替你下结论/与其
 *     猜测，不如直接问对方怎么想的/我不确定他为什么这么做，
 *     可能问清楚更好；
 *   · 良性承认：其实我也是这么想的（第一人称，无你-based
 *     STATE 结构，本就不在射程内；hedge 再兜一层）；
 *   · 概念分析：读心术是一种常见的逻辑谬误 / Mind reading is
 *     a common fallacy.
 */
'use strict';

// ─── 腿① ASSERT 知悉断言/否认自辩框架（中文）────────────────────
const ASSERT_ZH = new RegExp([
  // 别不承认/别以为我不知道/别装了（否认对方自辩）
  '(?:别|不要|甭)不承认',
  '别以为我(?:不知道|不了解|看不清)',
  '(?:别|不要)装了',
  // 我还不了解你/我了解你（以了解自居）
  '我(?:还|可|最)?不了解你',
  '我(?:太|最)?了解你',
  // 我知道你/我看得出你/我看透了你
  '我(?:知道|看得出|看透|看穿)(?:了)?你',
  // 你就是+故意/成心/有意/在装（断言形）
  '(?:你|您)就是(?:故意|成心|有意|蓄意|在装|装的)',
  '(?:你|您)(?:根本|明明|分明)就是',
  // 其实就是/说到底/实际上（真实状态断言）
  '其实(?:就是|心里|内心|真正|说到底)',
  // 你心里清楚/你心里明白
  '(?:你|您)心里(?:清楚|明白|有数)',
  // 嘴上说+其实就是（表面声明×真实断言）
  '嘴上(?:说|讲)(?:是|的是)?[^。，！？]{0,10}其实',
  // 分明是/明明就是/就是在（断言判定）
  '(?:分明|明明)(?:就是|是在)',
].join('|'));

// 英文：deep down you know / but I know / I know (what) you /
// you are just / don't lie。缩写得形式不前置 \s+（r700 教训）。
const ASSERT_EN = new RegExp([
  // deep down you know（断言内心自知）
  "\\bdeep\\s+down\\s+you\\s+know\\b",
  // I know what/how you / I know you are（断言知道对方）
  "\\b(?:i|we)\\s+know\\s+(?:what|how|exactly)\\s+you\\b",
  "\\b(?:i|we)\\s+know\\s+you\\s+(?:are|'re)\\b",
  // but I know you（表面声明×真实断言）
  "\\bbut\\s+i\\s+know\\s+you\\b",
  // you are just pretending/faking/looking for（断言伪装）
  "\\byou\\s+(?:are|'re)\\s+just\\b",
  // Don't lie（否认自辩）
  "\\bdon'?t\\s+lie\\b",
  // you say X ... but I know（表面声明×真实断言）
  "\\byou\\s+(?:say|said|claim)\\b[^.]{0,40}\\bbut\\s+i\\s+know\\b",
].join('|'), 'i');

// ─── 腿② STATE 内心状态内容（中文）──────────────────────────────
const STATE_ZH = new RegExp([
  // 心里/内心/心底/骨子里
  '(?:心里|内心|心底|骨子)',
  // 想法/心思/念头/打算/目的/动机/意图
  '(?:想法|心思|念头|打算|目的|动机|意图)',
  // 故意/成心/有意/蓄意
  '(?:故意|成心|有意|蓄意)',
  // 记恨/记仇/怀恨/怨我/恨我/生我气/不满/介意/在意/生气/委屈
  '(?:记恨|记仇|怀恨|埋怨|怨我|恨我|生我气|生气|委屈|不满|介意|在意)',
  // 没安好心/不安好心
  '(?:没|不|未)安好心',
  // 装傻/装糊涂/装无辜
  '装(?:傻|糊涂|无辜|样子)',
  // 借口/托词
  '(?:借口|托词)',
  // 你…这么想/这样想（你-based 想法指向；第一人称「我也是这么想」不命中）
  '(?:你|您)[^。，！？]{0,8}(?:这么|这样)(?:想|认为|打算|计划的)',
].join('|'));

// 英文：deep down / really after / angry / pretend / motive /
// not to care / you want。you want 限 you 主语（r700 教训：主语×
// 助动词结构要列全，这里 want 前必须带 you）。
const STATE_EN = new RegExp([
  "\\bdeep\\s+down\\b",
  "\\breally\\s+after\\b",
  "\\b(?:angry|upset|resent|mad)\\b",
  "\\b(?:pretend|pretending|faking)\\b",
  "\\bmotives?\\b",
  "\\bintentions?\\b",
  "\\b(?:don'?t|not)\\s+care\\b",
  "\\byou\\s+(?:really\\s+)?(?:want|wanted)\\b",
].join('|'), 'i');

// ─── 豁免：探询式沟通/第一人称支持性感受/尊重自辩/良性承认/概念分析 ──
const HEDGE_ZH = new RegExp([
  // 概念分析（读心术是一种常见的逻辑谬误）
  '(?:读心|读心术|断言动机|mind.?reading)(?:是|属于|是一种|正是|称为|叫做|指|举例|例如|比如|案例|教学|分析|识别|检测)',
  // 探询式沟通（是不是/能否/能不能 + 邀请对方说）
  '(?:是不是|是否有|有没有|能否|能不能)[^。？?]{0,15}(?:想法|感受|顾虑|心思|介意|生气|不满|打算|计划)',
  '(?:可以|不妨|欢迎)(?:一起|说说|聊聊|谈谈|讲出来|告诉我)(?:看|吗|吧)?',
  // 第一人称支持性感受（我感觉你+支持性词，非断言）
  '(?:我|我们)(?:感觉|觉得|感到)(?:你|您)[^。]{0,12}(?:压力|累|辛苦|不容易|难|进步|成长|优秀|棒|努力)',
  // 尊重自辩与元话语（与其猜测/不如问）
  '(?:与其|不要|别)(?:猜测|猜|臆测)',
  '(?:不如|不妨|直接|请)(?:问|询问|沟通|核实|确认)',
  // 良性承认（第一人称+我也是这么想）
  '(?:其实)?我(?:也)?(?:是)?这么(?:想|认为|打算)',
  // 支持性承认（我知道你很生气，这完全可以理解——承认情绪而非断言动机）
  '(?:我(?:知道|了解|看出)(?:你|您))[^。]{0,12}(?:生气|不满|介意|记恨|委屈|难过|担心|焦虑|累|压力)[^。]{0,20}(?:理解|正常|应该|没错|可以|没关系|允许|明白)',
  // 善意归因（我了解你，你这么说其实心里也是为大家好/我知道你是出于好意）
  // 刻意不含「好心」——「我知道你根本就没安好心」是攻击样本，不能被豁免吃掉
  '(?:我(?:知道|了解)(?:你|您))[^。]{0,12}(?:好意|善意|用心|为大家|为大局|着想)',
].join('|'));

const HEDGE_EN = new RegExp([
  // 概念分析
  "\\bmind\\s+reading\\b",
  "\\b(?:is|are|called?|committing\\s+an?)\\s+(?:a\\s+)?(?:mind\\s+reading|mind-?reading)\\b",
  // 探询式沟通（疑问框架 + 邀请）
  "\\b(?:is|are)\\s+(?:something|anything)\\s+bothering\\s+you\\b",
  "\\b(?:do|would)\\s+you\\s+(?:want|like)\\s+to\\s+(?:talk|share|tell)\\b",
  "\\bhere\\s+to\\s+listen\\b",
  // 第一人称支持性感受
  "\\b(?:i|we)\\s+(?:feel|sense)\\b[^.]{0,30}\\b(?:pressure|stress|tired|overwhelmed|hard\\s+time)\\b",
  // 尊重自辩与元话语
  "\\binstead\\s+of\\s+(?:guessing|assuming)\\b",
  "\\b(?:rather\\s+than|instead\\s+of)\\s+guess\\b",
  "\\blet\\s+(?:him|her|them)\\s+(?:tell|say|explain)\\b",
  // 支持性承认（I know you are angry, and that is completely understandable.）
  "\\b(?:i|we)\\s+know\\s+you\\s+(?:are|'re)\\b[^.]{0,50}\\b(?:understandable|makes\\s+sense|is\\s+valid|it\\s+is\\s+(?:ok|okay|fine)|completely\\s+normal)\\b",
  // 善意归因（I know you mean well / your heart is in the right place）
  "\\bi\\s+know\\s+you\\s+(?:mean|meant)\\s+well\\b",
  "\\byour\\s+heart\\s+is\\s+in\\s+the\\s+right\\s+place\\b",
].join('|'), 'i');

/**
 * @param {string} text 待判文本（_dual 会分别喂原文与归一化文本）
 * @param {object} [inject] 负例脚本注入用：以永不匹配串替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkMindReading(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const AS_ZH_ = R.ASSERT_ZH || ASSERT_ZH;
  const AS_EN_ = R.ASSERT_EN || ASSERT_EN;
  const ST_ZH_ = R.STATE_ZH || STATE_ZH;
  const ST_EN_ = R.STATE_EN || STATE_EN;
  const HEDGE_ZH_ = R.HEDGE_ZH || HEDGE_ZH;
  const HEDGE_EN_ = R.HEDGE_EN || HEDGE_EN;

  // 豁免在场 → 不是运用它
  if (HEDGE_ZH_.test(text) || HEDGE_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿① ASSERT：知悉断言/否认自辩框架
  const asZh = AS_ZH_.test(text);
  const asEn = AS_EN_.test(text);
  if (!asZh && !asEn) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② STATE：内心状态内容
  const stZh = ST_ZH_.test(text);
  const stEn = ST_EN_.test(text);
  if (!stZh && !stEn) return { hit: false, score: 0, detail: '', count: 0 };

  // 路由：ASSERT × STATE 共现（两个路由合一）
  return {
    hit: true,
    score: 0.5,
    count: 1,
    detail: isZh ? '断言动机×知悉断言×内心状态(zh)' : 'mind_reading×know-claim×inner-state(en)',
  };
}

module.exports = {
  checkMindReading,
  __internals: () => ({
    ASSERT_ZH, ASSERT_EN,
    STATE_ZH, STATE_EN,
    HEDGE_ZH, HEDGE_EN,
  }),
};
