/**
 * src/appeal-to-legality.js — 「诉诸合法性谬误（appeal to legality /
 * argumentum ad legem / 守法即正当）」检测器（第 199 个判别维度）
 *
 * [r202 立项] philosophy_decision 在当前引擎（v6.8.130，198 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。立项缺口实证：grep -ril
 * 'appeal_to_legality|argumentum ad legem|诉诸合法性|守法即正当|法无禁止' src/
 * 无任何维度覆盖本族；gate() 实测攻击样本 5 条中 4 条 pass（真零命中）、
 * 良性 5 条 pass。外部搜索（arXiv 2405.02318 FOL 译法、GitHub 高星仓库
 * tmakesense/logical-fallacy 21★ 等）全部为 LLM 路线，与心虫「纯规则
 * 引擎、零 LLM 依赖」铁律冲突，按既有维度形态自建纯规则实现。
 *
 * 辨别的族：诉诸合法性谬误——拿**守法宣告**（不违法/没犯法/法无禁止即可为/
 * 法律没有禁止/完全合法/合规；EN it's not illegal / broke no law /
 * perfectly legal）直接推出**道德或批评豁免**（所以没错/不能指责/管不着/
 * 轮不到别人批评/少大惊小怪/凭什么指责；EN nothing wrong with it / no
 * grounds to criticize / who are you to judge），把「合不合法」偷换成
 * 「该不该做、能不能批评」：
 *   法律没有禁止加班，所以你们不能指责我们，公司根本没错。
 *   我又没犯法，你凭什么站在道德高地上说三道四？
 *   法无禁止即可为，既然不违法，你们就管不着我怎么处理这批数据。
 *   这个操作完全合法，因此不存在任何问题，不准你再指责。
 *   It's not illegal, so nobody has any grounds to criticize him.
 *   She broke no law — who are you to judge her personal choices?
 *
 * 与既有维度的边界（r202 归因）：
 *   · legal_status_coercion（第 122 维）管**以法律后果胁迫**（「我会让你
 *     吃官司」「敢举报就告你」——拿司法机器吓阻行为）；本族方向相反：
 *     拿**已守法**证明**道德无瑕**，是豁免而非胁迫。
 *   · opinion_entitlement（第 196 维）管**观点权利豁免**（「我只是主观
 *     看法，不必举证」——免的是举证义务）；本族免的是**道德批评资格**，
 *     依据是法律合规而非主观性。
 *   · appeal_to_tradition / appeal_to_novelty / appeal_to_wealth 等
 *     appeal_* 系列各管一种替代性正当来源（惯例/新意/财富）；本族补的是
 *     「法律/合规」这一支——argumentum ad legem。
 *   · unsupported_claim 管断言无依据；本族有明确的两步推理结构（守法
 *     宣告 → 道德结论），缺任一脚都不判。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   · 腿① LEGAL 守法宣告（中英）：不违法/没犯法/不违反法律/法无禁止即可为/
 *     法律没有禁止/合法/合规/法定权利（合法权利）；EN it's not illegal /
 *     broke no law / perfectly legal / no law against it。
 *   · 腿② EXONERATE 道德/批评豁免（中英）：没错/没问题/无可厚非/无可指责/
 *     不能指责/无权批评/管不着/轮不到/少大惊小怪/凭什么指责/多管闲事/
 *     无权干涉私事；EN nothing wrong with it / no grounds to criticize /
 *     can't criticize / who are you to judge / mind your own business /
 *     stop being judgmental。
 *   · 缺腿不判：只有腿①（「这个合同不违法，可以签」）是把合法性当正确
 *     标准的合规判断；只有腿②（「你不该指责他」）无论及守法依据，归
 *     tone_policing 等族。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人错误论证、法律与道德关系的课堂
 * 讨论、或合规审查中的事实陈述。verify 的含义是「这个道德豁免建立在
 * 守法而非行为本身上，需要回到：行为对他人的实际影响、批评是否成立、
 * 以及法律与道德的评价标准是否被混同」——调用方应要求区分法律评价与
 * 道德评价，而不是接受「不违法即无瑕」。
 *
 * 明确不判的（豁免——这些是正确判别、合规判断或概念讨论）：
 *   · 合规场景（合同/协议/条款/签约/法务/合规/审批/审计/监管/许可/执照/
 *     上市/起诉/仲裁/劳动法/交通法——合法性正是该场景的评判标准）；
 *   · 法律-道德区分陈述（不违法≠没问题/虽然不违法但道德上有争议/不违法
 *     不意味着正当——把两套标准分开的正确判别）；
 *   · 概念/教学转述（诉诸合法性/守法即正当/argumentum ad legem / appeal
 *     to legality——讨论这个概念本身不是运用它）；
 *   · 质疑该推理的窄口径疑问（「不违法就不能指责吗？」——反问的是推理
 *     本身；攻击常用的「你凭什么指责？」反问不在豁免内）。
 */
'use strict';

// ─── 腿① LEGAL 守法宣告（中文）──────────────────────────────────
// 枚举腿自查（161 轮教训）：核心词取裸名词形态（不违法/没犯法/法无禁止
// 即可为/合法/合规去后缀仍命中）；「合法」后接「性」时是政治合法性概念
// （合法性存疑），用否定断言避开；法律与否定词之间允许 ≤4 字插入修饰
// （「法律暂未禁止」「国家也并没有规定」不因紧邻要求漏判）。
const LEGAL_ZH = [
  // 不违法族（裸形态 + 带修饰）
  /不违法|未违法|没有违法|并没违法|并不违法|不算违法|不构成违法/,
  /不违反[^。，！？!?]{0,6}(?:法律|法规|条例|规定|法条|现行法)/,
  /未违反[^。，！？!?]{0,6}(?:法律|法规|条例|规定|法条)/,
  // 没犯法族
  /没[有]?犯法|未犯法|并不犯法/,
  // 法无禁止即可为（格言式裸句）
  /法无禁止即可为|法无禁止则可为|法不禁止即可为|法不禁止则自由/,
  // 法律没有禁止/未规定族（允许插入副词与修饰；「没」后可带「有」——「法律没有禁止」）
  /(?:法律|法规|条例|国家|现行法|法条|立法|规则)[^。，！？!?]{0,4}(?:没|未)(?:有)?[^。，！？!?]{0,2}(?:禁止|规定|限制|不许|不准|不允许|约束|管)/,
  /(?:没有|无|缺乏|找不到|不见)(?:任何)?(?:法律|法规|条文|条款|条例|规定|禁令)(?:禁止|约束|限制|不许|不准)/,
  // 合法/合规裸名词（「合法性」概念形态除外）
  /合法(?!性)|合规/,
  // 法定权利/合法权利宣告
  /(?:法律|法定|合法)(?:赋予|授予|规定)(?:的)?(?:权利|自由)/,
  /法定权利|合法权利|合法权益|法定自由/,
];

// ─── 腿① LEGAL 守法宣告（英文）──────────────────────────────────
const LEGAL_EN = [
  /not\s+illegal|isn'?t\s+illegal|it\s+is\s+not\s+illegal|not\s+against\s+the\s+law|nothing\s+illegal|no\s+law\s+against/i,
  /(?:broke|broken|breaks?|violated?|violates?)\s+no\s+(?:law|laws|rule|rules|regulation|regulations)/i,
  /(?:doesn'?t|don'?t|didn'?t)\s+(?:break|violate)\s+(?:the\s+|any\s+)?(?:law|laws|rule|rules|regulation|regulations)/i,
  /(?:it'?s|that'?s|this\s+is|it\s+is)\s+(?:perfectly\s+|completely\s+|totally\s+|entirely\s+|fully\s+|strictly\s+)?(?:legal|lawful)/i,
  /(?:perfectly|completely|totally|entirely|fully)\s+(?:legal|lawful)/i,
  /within\s+(?:his|her|their|my|the)\s+(?:legal\s+)?rights/i,
  /(?:has|have)\s+every\s+(?:legal\s+)?right\s+to/i,
  // 合规即守法宣告（「fully complied with every regulation」——用合规记录
  // 证明行为无瑕，本族攻击的英文主力形态之一）
  /(?:complied|complies|complying)\s+with\s+(?:every|all|each|the\s+applicable)\s+(?:law|laws|rule|rules|regulation|regulations|requirement|requirements)/i,
  /no\s+(?:law|laws|rule|rules|regulation|regulations)\s+(?:against|prohibit|prohibits|prevent|prevents|forbid|forbids)/i,
  /(?:permitted|allowed)\s+by\s+(?:the\s+)?law/i,
];

// ─── 腿② EXONERATE 道德/批评豁免（中文）─────────────────────────
// 否定前缀保护：等于/意味着/代表着 紧邻时是对「守法→无瑕」推理的拆解
// （「不等于没问题」是正确判别），lookbehind Node 18 支持。
const NEG_GUARD = '(?<![等于意味着代表着])';
const EXONERATE_ZH = [
  // 没问题/没错族（否定前缀保护；覆盖 没问题/没有任何问题/不存在任何法律问题）
  new RegExp(NEG_GUARD + '(?:没|不)(?:存在|有)?(?:任何)?[^。，！？!?]{0,6}(?:问题|毛病)'),
  new RegExp(NEG_GUARD + '(?:没|不)(?:存在|有)?(?:任何)?[^。，！？!?]{0,4}(?:错|过错|错处)'),
  /毫无(?:问题|过错|瑕疵)|并无(?:不妥|过错|问题)|不可厚非|无可厚非|无可指责|无可指摘|无可挑剔|无懈可击/,
  // 不能/无权/少/凭什么 + 批评类动词
  /(?:不能|无法|无权|不许|不准|休想|少|不要|别|何必|凭什么|有什么资格|有什么权利)[^。，！？!?]{0,12}(?:指责|批评|谴责|质疑|评判|苛责|苛求|挑剔|非议|责难|诟病|说三道四|指指点点|指手画脚|干涉|干预|过问|说教)/,
  // 管不着/轮不到/多管闲事族
  /管不着|管不了|轮不到|与你无关|跟你无关|与外人无关|多管闲事|狗拿耗子|手伸得太长/,
  // 少大惊小怪/别上纲上线族
  /(?:少|别|不要|不必|无需)[^。，！？!?]{0,8}(?:大惊小怪|小题大做|上纲上线|扣帽子|贴标签|道德绑架|说闲话|说三道四|指手画脚|说教|苛责|苛求|非议|责难)/,
  // 道德高地族（须带占据类动词，裸「道德高地」名词不收）
  /(?:站在|站在了|占据|抢占|占领|制高点)[^。，]{0,4}(?:道德高地|道德制高点)/,
  // 私事/个人选择 + 无权干涉（正反两序）
  /(?:私事|私生活|个人选择|个人自由|私人事务|家务事)[^。，！？!?]{0,10}(?:无权|不能|不该|不得|管不着|轮不到|用不着|无须)[^。，！？!?]{0,8}(?:干涉|干预|指责|评判|过问|指手画脚|管|说三道四|说闲话)/,
  /(?:无权|不能|不该|不得|管不着|轮不到|用不着|无须)[^。，！？!?]{0,8}(?:干涉|干预|指责|评判|过问|指手画脚|管)[^。，！？!?]{0,8}(?:私事|私生活|个人选择|个人自由|私人事务|合法权利|个人隐私)/,
  // 混合句兜底
  /no\s+grounds?\s+to\s+criticize/i,
];

// ─── 腿② EXONERATE 道德/批评豁免（英文）─────────────────────────
const EXONERATE_EN = [
  /(?:nothing|no(?:thing)?\s+)?(?:is\s+)?wrong\s+(?:with|about)\s+(?:it|that|this|what\s+they|what\s+he|what\s+she)/i,
  /no\s+(?:grounds?|basis|reason|right|justification|room)\s+(?:to|for)\s+(?:criticize|criticise|judge|object|complain|condemn|blame|shame|attack)/i,
  /(?:any\s+)?grounds?\s+to\s+(?:criticize|criticise|judge|object|complain|condemn|blame)/i,
  /(?:nobody|no\s+one)\s+(?:has|have)\s+any\s+(?:right|grounds?|business|standing)/i,
  /(?:can'?t|cannot|shouldn'?t|mustn'?t|must\s+not|no\s+reason\s+to|no\s+business)\s+(?:criticize|criticise|judge|blame|shame|condemn|object|complain)/i,
  /(?:nobody|no\s+one|who)\s+(?:has|have|are|is)\s+(?:the\s+)?(?:right|grounds|standing|business)\s+to\s+(?:judge|criticize|criticise|say|tell|object|comment|lecture)/i,
  /who\s+are\s+you\s+to\s+(?:judge|criticize|criticise|tell|say|lecture)/i,
  /what\s+gives\s+you\s+the\s+right/i,
  /(?:stop|quit)\s+(?:being\s+so\s+|being\s+)?(?:judgmental|judgemental|moralizing|moralising|sanctimonious|preachy|outraged|self-righteous)/i,
  /mind\s+your\s+own\s+business|none\s+of\s+your\s+business|not\s+your\s+(?:place|business)\s+to\s+(?:judge|criticize|criticise|say|comment|object)/i,
  /(?:it'?s|that'?s|this\s+is)\s+(?:perfectly\s+|completely\s+|totally\s+|entirely\s+)?(?:fine|okay|ok|acceptable|justified|justifiable|legitimate|defensible|reasonable)\s+(?:to|for|of\s+(?:them|him|her|you))/i,
  /(?:so|therefore|thus)\s+(?:there'?s|there\s+is)\s+(?:nothing|no\s+problem|nothing\s+wrong)/i,
];

// ─── 豁免一：合规场景（合法性正是该场景的评判标准）────────────────
const EXEMPT_COMPLIANCE_ZH = [
  /合同|协议|条款|签约|用印|盖章|法务|法律顾问|律师函|律师|合规|审批|报备|备案|审计|监管|批文|许可|执照|资质|招标|投标|上市|上架|准入|风控|稽查|工商|税务|海关|环评|过审|送审|起诉|应诉|仲裁|违约|侵权|章程|广告法|劳动法|合同法|公司法|个税法|交通法|交规|宪法|立法法|诉讼法|民法典|消法|税法|安监|质检|食药监|征信|牌照|持证|执业资格/,
];
const EXEMPT_COMPLIANCE_EN = [
  /\b(?:contract|agreement|clause|terms\s+of\s+service|compliance|compliant|regulatory|regulator|audit|auditor|permit|licen[cs]e|certification|certified|approved?|filing|disclosure|statutory|due\s+diligence|counsel|law\s+firm|inspection|zoning|permitted\s+use)\b/i,
];

// ─── 豁免二：法律-道德区分陈述（把两套标准分开是正确判别）──────────
const EXEMPT_DISCRIMINATION_ZH = [
  /(?:不违法|合法|合规|守法)[^。]{0,14}(?:不等于|不代表|不意味着|并非|并不是|算不上|不能说明|推不出|说明不了)[^。]{0,14}(?:没问题|没错|正当|合理|道德|可以指责|能指责|应受批评|接受批评|接受质疑|接受审视|免检|免责|无瑕)/,
  /(?:不等于|不代表|不意味着|并非|并不是)[^。]{0,12}(?:不存在|没有|无)[^。]{0,6}(?:问题|错)/,
  /(?:虽然|尽管|固然|纵然)[^。]{0,18}(?:不违法|合法|合规|没犯法)[^。]{0,24}(?:但|但是|然而|不过|可是|只是|却)[^。]{0,24}(?:道德|伦理|争议|不妥|问题|质疑|批评|审视|责任|后果|伤害|风险|人心|公序良俗|道义)/,
];
const EXEMPT_DISCRIMINATION_EN = [
  /(?:legal|lawful|not\s+illegal|broke\s+no\s+law)[^.]{0,80}?(?:but|yet|however|though|although)[^.]{0,80}?(?:wrong|immoral|unethical|questionable|problematic|harmful|dishonest|deceitful|still\s+(?:matters|wrong|bad|a\s+problem)|doesn'?t\s+make\s+it\s+(?:right|okay|fine|moral)|isn'?t\s+the\s+(?:measure|standard|test|bar)|not\s+the\s+(?:same|measure|standard))/i,
  /just\s+because\s+(?:it'?s|something\s+is)\s+(?:legal|lawful|not\s+illegal)[^.]{0,60}?(?:doesn'?t|does\s+not)\s+(?:make|mean)/i,
];

// ─── 豁免三：概念/教学转述（讨论这个概念本身不是运用它）────────────
const EXEMPT_META_ZH = [
  /诉诸合法性|守法即正当|合法即正当|合法性谬误|诉诸法律|以法绑德|用守法偷换道德/,
];
const EXEMPT_META_EN = [
  /appeal\s+to\s+legality|argumentum\s+ad\s+legem|ad\s+legem|legality\s+fallacy|legalistic\s+fallacy/i,
];

// ─── 豁免四：质疑该推理的窄口径疑问（「不违法就不能指责吗？」）──────
// 只收直接质疑「不能指责/该不该批评」这一推理的句式；攻击常用的
// 「你凭什么指责？」反问（无 不能指责 组合、无 难道）不收。
const EXEMPT_CHALLENGE_ZH = [
  /(?:不能|不可|就该|就要|可以|能)[^。？]{0,6}(?:指责|批评|评判|苛责)[^。？]{0,8}[吗么][？?]/,
  /(?:难道|是不是|是否|能否)[^。？]{0,18}(?:不能|不可|就该|就要|可以|能)[^。？]{0,6}(?:指责|批评|评判|苛责)/,
];
const EXEMPT_CHALLENGE_EN = [
  /(?:does|is)\s+(?:not\s+)?(?:being\s+)?(?:legal|lawful)[^?]{0,40}(?:enough|sufficient|the\s+standard)[^?]{0,20}\?/i,
];

const WIN_ZH = 60;    // 中文邻近窗（字）
const WIN_EN = 160;   // 英文邻近窗（字符）

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function firstHit(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAppealToLegality(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const L_Z = R.LEGAL_ZH || LEGAL_ZH;
  const L_E = R.LEGAL_EN || LEGAL_EN;
  const X_Z = R.EXONERATE_ZH || EXONERATE_ZH;
  const X_E = R.EXONERATE_EN || EXONERATE_EN;

  // 四组豁免在场 → 不是运用它
  const C_Z = R.EXEMPT_COMPLIANCE_ZH || EXEMPT_COMPLIANCE_ZH;
  const C_E = R.EXEMPT_COMPLIANCE_EN || EXEMPT_COMPLIANCE_EN;
  const D_Z = R.EXEMPT_DISCRIMINATION_ZH || EXEMPT_DISCRIMINATION_ZH;
  const D_E = R.EXEMPT_DISCRIMINATION_EN || EXEMPT_DISCRIMINATION_EN;
  const M_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const M_E = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const Q_Z = R.EXEMPT_CHALLENGE_ZH || EXEMPT_CHALLENGE_ZH;
  const Q_E = R.EXEMPT_CHALLENGE_EN || EXEMPT_CHALLENGE_EN;
  if (anyHit(M_Z, text) || anyHit(M_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(C_Z, text) || anyHit(C_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(D_Z, text) || anyHit(D_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(Q_Z, text) || anyHit(Q_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿① 守法宣告
  const lZhIdx = firstHit(L_Z, text);
  const lEnIdx = firstHit(L_E, text);
  const lIdx = lZhIdx >= 0 ? lZhIdx : lEnIdx;
  if (lIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② 道德/批评豁免
  const xZhIdx = firstHit(X_Z, text);
  const xEnIdx = firstHit(X_E, text);
  const xIdx = xZhIdx >= 0 ? xZhIdx : xEnIdx;
  if (xIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 邻近窗：两腿须落在同一次「守法→无瑕」叙述内
  const win = isZh ? WIN_ZH : WIN_EN;
  if (Math.abs(lIdx - xIdx) > win) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.58,
    count: 1,
    detail: isZh
      ? '诉诸合法性×守法宣告推道德豁免(zh)'
      : 'appeal to legality×legal-status-to-moral-exoneration(en)',
  };
}

module.exports = {
  checkAppealToLegality,
  __internals: () => ({
    LEGAL_ZH, LEGAL_EN, EXONERATE_ZH, EXONERATE_EN,
    EXEMPT_COMPLIANCE_ZH, EXEMPT_COMPLIANCE_EN,
    EXEMPT_DISCRIMINATION_ZH, EXEMPT_DISCRIMINATION_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_CHALLENGE_ZH, EXEMPT_CHALLENGE_EN,
  }),
};
