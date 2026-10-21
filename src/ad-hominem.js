/**
 * src/ad-hominem.js — 「人身攻击」检测器（第 150 个判别维度）
 *
 * [r719 立项] decision 本体首轮直接选出（scripts/decide-r719.js，
 * composite_score 0.85 / confidence 0.8 / identity alignment 0.8，
 * 无弃权）。候选池来自 r719 探测器 scripts/round-719-family-probe.js；
 * 本轮在当前引擎（v6.8.64，149 维）复测：攻击漏判 7/9（78%）、
 * 真零命中 6/7、误伤 0/9。Phase 1.5 同律复核：漏判样本逐条
 * discriminate() 全维度零命中 6/7——不是被聚合压掉，是射程外。
 *
 * 辨别的族：ad hominem（人身攻击谬误）——**以对人的贬损代替对
 * 论证的评价**：不回应观点本身的内容，而是攻击提出观点的人的
 * 人品、资历、处境或行为，据此宣告其言论不成立：
 *   他的人品有问题，所以他的观点全部不成立。
 *   他连大学都没上过，说的话能有什么道理。
 *   她不过是个外行，她的分析根本不用看。
 *   一个离婚的人谈什么家庭教育，自己家都搞不好。
 *   他自己都迟到，还有脸要求别人准时。
 *   你这种人懂什么，闭嘴吧。
 *   He is a terrible person, so everything he says is wrong.
 *   She never went to college, so her opinion does not matter.
 *   You are just an amateur; your analysis is worthless.
 *
 * 与既有维度的边界（r719 归因）：
 *   · poisoning_the_well（毒井）管**预先铺垫贬损**（「我事先声明
 *     我对他有偏见」「提醒你一句，他名声不太好」——在听取论证
 *     之前先污染信源），本族管**以人的属性直接否定其论证**的
 *     当下动作（人品/资历贬损 × 言论否定的共现）。
 *   · stereotype_origin（第 146 维，出身歧视）管**按出身标签
 *     贬低人**（地域/学校/性别出身 × 属性否定），本族贬损
 *     对象是**论证中的对手本人**及其言论资格。
 *   · tu_quoque（第 141 维，诉诸伪善）管**用对方过错取消批评
 *     资格**（「你自己也这样，没资格说我」——焦点在资格剥夺
 *     的一致性结构），本族焦点在**言论随人废**（人品/资历差
 *     所以言论错）。
 *   · appeal_to_ridicule（第 137 维）管**嘲笑/蔑视表达**，本族
 *     管**属性贬损 × 言论否定的推论结构**。
 *   · 其余 149 个维度对本族漏判样本实测零命中 6/7。
 *
 * 判据（双腿共现，缺一不判）：
 *   · 腿① PERSON 人的属性贬损——直接指向对方（他/她/你）人品、
 *     资历、处境、行为一致性的贬损：
 *       p1 人品人格定性（人品有问题/差/素质低/人渣）；
 *       p2 资历贬损（连大学都没上过/外行/门外汉/业余/半路出家）；
 *       p3 处境贬损（一个离婚的人/自己家都搞不好）；
 *       p4 行为不一致指摘（自己都迟到/自己都做不到）；
 *       p5 指称贬损（你这种人/你也配）；
 *       EN: terrible person / never went to college / amateur /
 *           fraud / hypocrite / loser。
 *   · 腿② DISMISS 言论否定——对对方观点/发言/资格的直接否定
 *     或剥夺：
 *       d1 观点否定（观点不成立/无效/全部不对）；
 *       d2 言论价值否定（说的话能有什么道理/不足为信/一派胡言）；
 *       d3 资格剥夺（没资格谈/不配说/懂什么/闭嘴）；
 *       d4 反问式否资格（谈什么家庭教育/还有脸要求）；
 *       EN: everything he says is wrong / opinion does not
 *           matter / can be ignored / no right / worthless /
 *           shut up。
 *   · 缺腿不判：只有腿①（「他人品是差」）是单纯评价；只有腿②
 *     （「这个观点不成立」）是正常批评——必须**贬损人 × 否定
 *     言论**的推论结构共现才算人身攻击。
 *
 * 为什么取 VERIFY 级：单句可能是正常的冲突复盘（「吵架时他人
 * 品攻击我，事后看双方都有问题」）、逻辑课反面教材（「人身攻
 * 击谬误的典型例子是……」）、心理咨询中的关系模式分析、小说
 * 对白引述。verify 的含义是「这段话术在用人的属性代替论证，
 * 需要回到观点本身的证据」——调用方应要求双方就论点论据讨论，
 * 不按人的属性定结论。
 *
 * 明确不判的（豁免）：
 *   · 元话语概念分析（人身攻击/ad hominem 是指/是一种/谬误/
 *     逻辑课/案例分析）：分析这套谬误不是运用它；
 *   · 对事不对人的元话语批评（不要针对个人/针对内容本身/对事
 *     不对人/就事论事）：这类句子恰恰在**反对**人身攻击；
 *   · 第三人称专业复盘（心理咨询/咨询师/复盘/调解/case
 *     analysis）：专业角色复盘沟通模式；
 *   · 带承认结构的良性与批评（「经验有限，但观点有出处值得
 *     查证」「过往记录有争议，但这个论点请用证据评判」）——
 *     腿②的否定词不命中，自然不判（不依赖豁免）。
 */
'use strict';

// ─── 腿①：人的属性贬损（中文五类）──────────────────────────────
const PERSON_ZH = /(?:人品(?:有问题|很差?|不行|败坏|低劣|不好)|素质(?:太|很|非常|真|挺|过)?(?:低|差|低下)|没素质|德行(?:有问题|差)|人渣|渣男|绿茶)|(?:连[^，。]{0,8}(?:大学|高中|初中|书|学)都没(?:上过|读过|念过|毕业)|没(?:上过|读过|念过)(?:大学|高中|书|学)|外行|门外汉|业余(?:选手|水平|爱好者)?|半路出家|非专业|不懂装懂)|(?:一?个?(?:离婚|离异|单身|失败|失业)[^，。]{0,6}(?:的)?人|自己(?:家|日子)都(?:搞不好|过不好|管不好))|(?:自己都(?:做不到|没做到|迟到|没做好|做不好)|你自己都[^，。]{0,10})|(?:你这种人|你们这种人|你也配|你也敢|就你[^，。]{0,6}(?:也|还)(?:敢|配)?)/;

// ─── 腿①：人的属性贬损（英文）────────────────────────────────
const PERSON_EN = /\b(?:(?:he|she|they|you)\s+(?:is|are|'re)\s+(?:all\s+|just\s+|a\s+|an\s+|such\s+an?\s+)?(?:terrible|awful|horrible|pathetic|incompetent|stupid|idiotic|lousy|dishonest)\s+(?:person|people|human|individual|idiot|moron)|never\s+(?:went|finished|completed)\s+(?:to\s+)?(?:college|university|school|training)|(?:he|she|they|you)\s+(?:is|are|'re)\s+just\s+an?\s+(?:amateur|nobody|loser|failure)|(?:has|have)\s+no\s+idea\s+what|(?:is|are)\s+a\s+(?:fraud|liar|hypocrite|joke|charlatan))\b/i;

// ─── 腿②：言论否定（中文四类）────────────────────────────────
const DISMISS_ZH = /(?:观点(?:全部|全都|根本|完全|自然)?(?:不成立|无效|不成立|是错的|不对|站不住)|(?:说|讲|写)的话(?:能|还)有(?:什么|啥)(?:道理|价值|说服力|可信度|意义)|(?:根本|完全|压根)?不(?:用|必)(?:看|听|理会|理|信)|不足(?:为信|挂齿|为凭)|一派胡言|胡说八道|纯属(?:放屁|扯淡|胡说|瞎扯))|(?:(?:没资格|不配|有什么资格|有什么脸|哪有资格|哪配)(?:说|谈|讲|评论|发言|要求|评价|谈什么|说三道四)|懂什么|闭嘴|少(?:在|跟我)这(?:里|儿)(?:说|讲|扯)|也配(?:谈|说|讲|评价)|好意思(?:谈|说|要求)|还有脸(?:要求|说|谈|批评|提))|(?:谈什么[^，。]{0,12}|也(?:就|只)是(?:个|名)?(?:小人物|无名之辈))/;

// ─── 腿②：言论否定（英文）────────────────────────────────────
const DISMISS_EN = /\b(?:(?:everything|anything|all)\s+(?:he|she|they|you)\s+says?\s+is\s+(?:wrong|false|garbage|nonsense|rubbish|bullshit|crap)|(?:opinion|view|analysis|argument|take|claim|evidence|word)s?\s+(?:does\s+not|doesn't|do\s+not|don't)\s+(?:matter|count|deserve)|(?:can|could|should)\s+be\s+(?:ignored|dismissed|disregarded)|(?:has|have)\s+no\s+(?:right|credibility|standing)\s+(?:to|whatsoever)|deserve\s+no\s+(?:right|credibility|standing|consideration)|talking\s+nonsense|(?:(?:is|are)\s+(?:worthless|garbage|rubbish|meaningless|irrelevant|nonsense|bullshit))|shut\s+up|who\s+cares\s+what)\b/i;

// ─── 豁免一：元话语概念分析这套谬误本身 / 概念名词裸引述 ────────
const META_EXEMPT = /(?:人身攻击|ad\s*hominem)(?:是|属于|是一种|正是|称为|叫做|指|谬误|错误|逻辑课|案例|是常见|手法|策略|is|are|refers\s+to|means|describes|fallacy)/i;
const META_NOUN = /(?:人身攻击谬误|人身攻击的?逻辑课|ad\s*hominem\s+(?:fallacy|argument|attack))/i;

// ─── 豁免二：对事不对人的元话语批评（句子在反对人身攻击）──────
const ANTI_ADHOMINEM_ZH = /(?:不要针对个人|针对内容(?:本身)?|对事不对人|就事论事|针对观点不针对|不应该攻击|不(?:要|应)(?:搞|做)人身攻击)/;
const ANTI_ADHOMINEM_EN = /\b(?:attack\s+the\s+argument(?:,)?\s+not\s+the\s+person|address\s+the\s+(?:point|claim|evidence)\s+(?:itself)?(?:,)?\s+not\s+the\s+person|no\s+personal\s+(?:attacks|insults))\b/i;

// ─── 豁免三：第三人称专业复盘（专业角色复盘沟通模式）───────────
const THIRD_PERSON_EXEMPT = /(?:心理咨询师|心理咨询|心理医生|调解员|咨询师|治疗师|沟通复盘|冲突复盘|关系复盘|counselor|therapist|mediator|case\s+(?:analysis|review)|retrospective)/i;

/**
 * 中文路由：腿①×腿②共现。
 * @param {string} text
 * @param {object} R 负例注入用：以空白正则替换指定常量
 */
function checkZh(text, R) {
  const person = R.PERSON_ZH || PERSON_ZH;
  const dismiss = R.DISMISS_ZH || DISMISS_ZH;
  if (!person.test(text)) return null;
  if (!dismiss.test(text)) return null;
  return { route: 'zh:person×dismiss' };
}

/**
 * 英文路由：腿①×腿②共现。
 */
function checkEn(text, R) {
  const person = R.PERSON_EN || PERSON_EN;
  const dismiss = R.DISMISS_EN || DISMISS_EN;
  if (!person.test(text)) return null;
  if (!dismiss.test(text)) return null;
  return { route: 'en:person×dismiss' };
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAdHominem(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const META_EXEMPT_ = R.META_EXEMPT || META_EXEMPT;
  const META_NOUN_ = R.META_NOUN || META_NOUN;
  const ANTI_ADHOMINEM_ZH_ = R.ANTI_ADHOMINEM_ZH || ANTI_ADHOMINEM_ZH;
  const ANTI_ADHOMINEM_EN_ = R.ANTI_ADHOMINEM_EN || ANTI_ADHOMINEM_EN;
  const THIRD_PERSON_EXEMPT_ = R.THIRD_PERSON_EXEMPT || THIRD_PERSON_EXEMPT;

  // 元话语评析 / 概念名词裸引述 → 不是运用它
  if (META_EXEMPT_.test(text) || META_NOUN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 对事不对人的元话语批评：句子在反对人身攻击
  if (ANTI_ADHOMINEM_ZH_.test(text) || ANTI_ADHOMINEM_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 第三人称专业复盘：专业角色复盘沟通模式
  if (THIRD_PERSON_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const r = isZh ? checkZh(text, R) : checkEn(text, R);
  if (r) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh
        ? `ad hominem×人身攻击(${r.route})`
        : `ad hominem×personal attack(${r.route})`,
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkAdHominem,
  __internals: () => ({
    PERSON_ZH, PERSON_EN, DISMISS_ZH, DISMISS_EN,
    META_EXEMPT, META_NOUN, ANTI_ADHOMINEM_ZH, ANTI_ADHOMINEM_EN,
    THIRD_PERSON_EXEMPT,
  }),
};
