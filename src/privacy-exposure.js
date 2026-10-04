/**
 * checkPrivacyExposure / sanitizeForPersistence
 *
 * 隐私落盘判据 + 处置器（v6.7.125 · r438 隐私闸门）
 *
 * 背景（真实事故，不是假想）：
 *   2026-10-04 一次心理分析会话中，用户把大量个人成长叙述（家庭关系、
 *   20 年前的社交创伤、经济比较、自我否定）直接交给心虫 think() 分析。
 *   心虫的 Engram 记忆按 DeepSeek V4.1 设计无条件 `input.slice(0,500)` 落盘
 *   data/engram-index.json，judgment-engine 落 `input.slice(0,200)`，
 *   self-play 用 `_extractTopic()` 把原文前 3 个词当 key 写
 *   data/self-play/challenge-patterns.json，signal-absorber 经
 *   worldtree.store() 把原文 500 字连同学到的"教训"一起入库。
 *   —— 4 条独立链路全no隐私闸门。data/ 恰好在 .gitignore 里没被推送，
 *   但只要一处 git add -f、一次备份同步、一次 data/memories 金库导出，
 *   这些第一人称创伤叙述就到了别人机器上。心虫出厂记忆必须空白，
 *   成长与隐私是 LEARNED 层用户私有物，不随分发走。
 *
 * 设计（两条腿，缺一不可）：
 *   ① 判据：`checkPrivacyExposure(text)` — 输入文本是否含高敏自述
 *      （家庭内部/经济比较/自我否定/创伤记忆/健康/身份归属）。
 *      命中 → findings.personalDisclosure 非空，调用方选择 sanitize 或拒绝。
 *   ② 处置：`sanitizeForPersistence(text)` — 把原文转成结构指纹
 *      （taskType + 长度 + 维度命中 + 主题类别），保留判别链需要的
 *      全部效用信息（engram 的 tag/decision/confidence/effort），
 *      换成不携带个人内容的指纹文本。
 *
 * 为什么不是简单 hash：hash 后相同输入仍可关联（rainbow/暴力），
 *   且丢失了 tag/decision 的语境。指纹带类别+长度+命中维度，
 *   够 recall 用、不可还原。
 *
 * 为什么不让它进 PRIVACY_PATTERNS（gate 的 privacy_boundary 维度）：
 *   那个维度问的是"这段文本是否在**索取**他人隐私"（问收入/问婚况），
 *   是外向的；这里问的是"这段文本是否**袒露**说话人自己的隐私"，
 *   是内向的。两个方向共用一个词表会互相污染，且 gate 拦截了用户
 *   就再也没法把自己的困惑交给心虫分析 —— 那是心虫最正当的用途之一。
 */

// ─── 高敏自述族（ZH）──────────────────────────────────────────────
// 每条 = [正则, 类别, 权重]；权重表示泄露后的敏感度（0-1）
const PRIVACY_EXPOSURE_ZH = [
  // 家庭内部关系与冲突（事故主族：我姐/姐夫/亲戚的评判）
  // 需与"自述/被评判"共现才算袒露：单说「我弟弟」是中性提及，
  // 「我弟说我」「被我姐指责」才是隐私。否则「我弟让我帮改简历」被误判。
  [/(?:我|自己)(?:的)?(?:姐|妹|弟|哥|爸妈|爸|妈|父亲|母亲|父母|爷|奶奶|外公|外婆|岳父|岳母|公公|婆婆|前妻|前夫|配偶|老婆|老公|孩子|儿子|女儿)[^。]{0,12}(?:说[我自]|讲[我自]|认[定为]|觉得[我自]|批[评指][我自]?|责[怪备骂][我自]?|看不起|贬低|嘲笑|像话|过分|告状|埋怨|不理解|不为[^。]{0,6}(?:考虑|着想))/i, 'family_relation', 0.9],
  [/(?:被|让|叫)(?:我)?(?:的)?(?:家人|父母|姐|妹|弟|哥|亲戚|长辈|姐夫|嫂子)[^。]{0,10}(?:说|讲|指责|批评|教育|数落|责怪|埋怨|看不起)/, 'family_conflict', 1.0],
  [/(?:我(?:的)?)?(?:老婆|老公|妻子|丈夫|配偶|对象|男朋友|女朋友)[^。]{0,8}(?:埋怨|责怪|指责|批评|不满|抱怨|看不起|嫌弃|说我)[^。]{0,10}(?:挣|赚|收入|工资|没用|无能|失败|不如|差)/, 'family_conflict', 0.9],
  [/(?:跟|和)(?:我|自己)?(?:的)?(?:家人|父母|姐|妹|弟|哥|亲戚|长辈)(?:吵架|闹翻|决裂|断绝|不理解|不和|矛盾|冲突|指责|埋怨|批评|责骂|看不起|贬低)/, 'family_conflict', 1.0],
  [/(?:他们|别人|大家)(?:说|讲|认为|觉得)(?:我|自己)?(?:不|没)[^。]{0,10}(?:礼貌|出息|本事|能力|胆量|骨气|良心|孝心|懂事|诚信|可靠)/, 'social_verdict', 0.85],
  [/(?:背后|当面)(?:说|讲|议论|嘲笑|指责)(?:我|自己)/, 'social_verdict', 0.85],
  // 经济比较与财务细节
  [/(?:捐|随|给|送|出)(?:款|礼|份子|钱)[^。]{0,8}(?:\d+|几|多少|百|千|万)/, 'financial_compare', 0.8],
  [/(?:收入|工资|薪水|月薪|年薪|存款|房贷|车贷|欠|奖金)[^。]{0,8}(?:\d+|几|多少|不够|紧|困难)/, 'financial_compare', 0.9],
  [/(?:比|跟)[^。]{0,6}(?:多|少|差|低|不如|不及)[^。]{0,6}(?:捐|给|出|花)/, 'financial_compare', 0.8],
  // 社交创伤与羞辱记忆（事故主族：20 年前小店事件）
  [/(?:\d+|几)?十年前[^。]{0,30}(?:不敢|不会|没能|没有|怯场|僵住)[^。]{0,10}(?:说|讲|打招呼|开口|问|拒绝|反驳|道谢|应声)/, 'trauma_memory', 0.95],
  [/(?:一直|到现在|至今|记[了一]?(?:辈子|多年|很久)|总(?:是|感)觉|反复|又)(?:觉得|感到|认为|纠结|犹豫|放不下|过不去|委屈|愧疚|自责|埋怨|后悔|难受|不舒服)/, 'trauma_memory', 0.9],
  // 内省困难自述：想通了又反复、同类场景反复卡住（无第一人称也要认——
  // keywords 切片本身就没人称，靠语义族兜住）
  [/(?:想通|想清楚|明知)[^。]{0,12}(?:又|却|还是|依然|反复)?(?:纠结|犹豫|做不到|失效|没用)/, 'self_reflection', 0.8],
  [/(?:为什么|怎么回事)[^。]{0,6}(?:总是|老是|反复|一直|每次)?(?:犹豫|纠结|退缩|逃避|不敢)/, 'self_reflection', 0.8],
  [/(?:改|变)不了[^。]{0,4}(?:自己|这)?(?:性格|脾气|习惯|毛病)/, 'self_negation', 0.9],
  [/(?:告状|告发|检举)(?:给|向|到)?(?:我(?:的)?)?(?:姐|妹|弟|哥|家人|父母|亲戚|长辈|领导|老师)?/i, 'social_verdict', 0.8],
  // 被第三人转述评判（告状→传话→家人一起指责的完整链条）
  [/(?:就)?(?:来|跑|去)(?:说|讲|指责|批评|教育|数落)(?:我|自己)/, 'social_verdict', 0.85],
  [/(?:都)?(?:说|讲)[^。]{0,8}(?:我|自己)(?:不|没)[^。]{0,10}(?:礼貌|出息|本事|能力|胆量|骨气|良心|孝心|懂事|诚信|可靠|规矩)/, 'social_verdict', 0.85],
  // 自我否定与身份定性（内省扭曲族，gate 拦不住的那批）
  [/(?:我|自己)(?:就是|简直是|真是|根本)(?:这|那)?(?:类|种|样)?[^。]{0,6}(?:人|性格|命|货|废物|没用|差劲|懦弱|胆小|怕事|窝囊|没出息)/, 'self_negation', 0.85],
  [/(?:天生|这辈子|从小)[^。]{0,8}(?:就)?(?:不如|比不过|不行|不能|不敢|不会|没[有天]分)/, 'self_negation', 0.85],
  [/(?:改不了|改不掉|变不了|没救了|没治了|一辈子就这样|注定)/, 'self_negation', 0.9],
  [/(?:唯唯诺诺|胆小怕事|怂|窝囊|抬不起头|丢人现眼)/, 'self_negation', 0.7],
  // 健康心理诊断级
  [/(?:抑郁|焦虑|躁郁|失眠|自残|自杀|不想活|活不下去|看心理|精神科|吃药治疗)/, 'health_mental', 1.0],
  // 可定位身份线索（足以反查到人）
  [/(?:我(?:们)?(?:公司|单位|学校|班级|部门)[^。]{0,12}(?:的)?(?:总|主任|经理|校长|老师|领导))/, 'identifiable', 0.8],
];

// ─── 高敏自述族（EN）──────────────────────────────────────────────
const PRIVACY_EXPOSURE_EN = [
  [/\bmy (?:sister|brother|mother|father|parents|wife|husband|ex-wife|ex-husband|son|daughter|in-laws)\b[^.]{0,40}(?:said|told|blamed|shamed|judged|accused)/i, 'family_conflict', 1.0],
  [/\bi (?:donated|gave|tipped|contributed) \d+ (?:but|while|when)\b/i, 'financial_compare', 0.8],
  [/\b\d+ years ago[^.]{0,40}(?:didn'?t dare|couldn'?t|was too (?:shy|scared|afraid))/i, 'trauma_memory', 0.95],
  [/\bi(?:'m| am) (?:just )?(?:a )?(?:coward|pushover|weak|pathetic|loser|worthless|useless)\b/i, 'self_negation', 0.85],
  [/\b(?:depress(?:ed|ion)|anxie(?:ty|ous)|insomnia|suicidal|self-harm|therapy|psychiatrist)\b/i, 'health_mental', 1.0],
  [/\bi(?:'ve| have) (?:been|felt) (?:ashamed|guilty|humiliated)[^.]{0,30}(?:ever since|since then|for years)/i, 'trauma_memory', 0.9],
];

const SENSITIVITY_ORDER = { trauma_memory: 4, health_mental: 4, family_conflict: 4, family_relation: 3, self_negation: 3, financial_compare: 2, social_verdict: 2, identifiable: 3 };

/**
 * 判据：输入是否袒露高敏个人信息
 * @param {string} text
 * @returns {{exposed:boolean, score:number, findings:Array<{type:string,weight:number,match:string}>, maxSeverity:number}}
 */
function checkPrivacyExposure(text) {
  if (!text || typeof text !== 'string') {
    return { exposed: false, score: 0, findings: [], maxSeverity: 0 };
  }
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? PRIVACY_EXPOSURE_ZH : PRIVACY_EXPOSURE_EN;

  const findings = [];
  let maxWeight = 0;
  for (const [pat, type, weight] of patterns) {
    const m = text.match(pat);
    if (m) {
      findings.push({ type, weight, match: m[0].slice(0, 30) });
      maxWeight = Math.max(maxWeight, weight);
    }
  }
  if (!findings.length) {
    return { exposed: false, score: 0, findings: [], maxSeverity: 0 };
  }
  // score = 最高权重 + 轻微加成（多族并发时更敏感），封顶 1
  const score = Math.min(1, maxWeight + (findings.length > 1 ? 0.05 : 0));
  const tokens = [...new Set(findings.map(f => f.type))];
  return {
    exposed: true,
    score,
    findings,
    maxSeverity: Math.max(...tokens.map(t => SENSITIVITY_ORDER[t] || 2)),
  };
}

/**
 * 处置：原文 → 结构指纹（保留判别效用，剥离个人内容）
 *
 * 保留什么：类别集合 + 长度档 + 是否含疑问/第一人称强度
 *    —— 这些是"这条记忆属于哪类任务"的判据，engram recall 只需要这些。
 * 丢掉什么：所有具体实体、数字、关系词、时间锚点。
 * @param {string} text
 * @returns {string} 形如 "[redacted:3-family_conflict,trauma_memory|len-M|q]"
 */
function sanitizeForPersistence(text) {
  const r = checkPrivacyExposure(text);
  if (!r.exposed) {
    // 不含敏感内容，原样返回（≤500 字），零效用损失
    return String(text).slice(0, 500);
  }
  const len = String(text).length;
  const lenBucket = len < 60 ? 'S' : len < 200 ? 'M' : len < 500 ? 'L' : 'XL';
  const isQ = /[?？]|为什么|怎么办|如何|怎么/.test(text);
  const tokens = [...new Set(r.findings.map(f => f.type))];
  return `[redacted:${tokens.length}-${tokens.join(',')}|len-${lenBucket}|q${isQ ? '1' : '0'}|sev${r.maxSeverity}]`;
}

/**
 * 处置：keyword 列表 → 不含原文的替代列表。
 *
 * 实测踩坑（r439 第一版）：先按逐个元素判定，结果漏了。
 *   keywords 是用户原文被标点切开后的碎片，「我姐根本没想过我的感受」
 *   这一条自身不命中（缺谓语），「只说我就是那种人」命中 ——
 *   逐条判就把没命中的那条原样留下了，拼回去仍是完整原句。
 *
 * 正确做法：**先对整体 join 判定**。整体命中 = 这条记录属于高敏自述，
 * 则整组 keyword 全部换成指纹（保留条数这个低敏结构，丢掉全部文本）；
 * 整体未命中才逐条保留。
 * @param {string[]} list
 * @returns {string[]}
 */
function sanitizeKeywordList(list) {
  if (!Array.isArray(list)) return list;
  const strs = list.filter(s => typeof s === 'string');
  const whole = checkPrivacyExposure(strs.join(''));
  if (!whole.exposed) return list;
  const types = [...new Set(whole.findings.map(f => f.type))];
  return list.map((kw) => {
    if (typeof kw !== 'string') return kw;
    const r = checkPrivacyExposure(kw);
    const t = [...new Set(r.findings.map(f => f.type))];
    return `[redacted:${(t.length ? t : types).join(',')}]`;
  });
}

/**
 * 给调用方的一句话总结（写日志 / 回给用户看）
 */
function describeExposure(r) {
  if (!r || !r.exposed) return null;
  return `检测到 ${r.findings.length} 处高敏自述（${[...new Set(r.findings.map(f => f.type))].join('、')}），已转为结构指纹落盘`;
}

module.exports = {
  checkPrivacyExposure,
  sanitizeForPersistence,
  sanitizeKeywordList,
  describeExposure,
  PRIVACY_EXPOSURE_ZH,
  PRIVACY_EXPOSURE_EN,
};
