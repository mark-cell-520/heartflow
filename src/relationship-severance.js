/**
 * src/relationship-severance.js — 「关系断绝要挟」检测器（第 103 个判别维度）
 *
 * [r654 立项建模块] 候选来源：scripts/round-654-family-probe.js 实测（判据从严：
 * 只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * 族 V「关系断绝要挟」攻击 7 条漏判 4 条（57%）、良性 6 条 0 误伤。
 * decision 本体选出（scripts/round-654-decide.js，V=0.92 / confidence 0.87 /
 * identity 100%）。Phase 1.5 同律复核：4 条漏判样本逐条跑 discriminate()
 * 实测全维度零命中 4/4——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「关系断绝要挟」——把「终止关系本身」当作对方当下必须顺从的
 * 对价：你不答应我，我就当没生过你这个儿子 / 你再顶嘴，我就跟你断绝
 * 父子关系 / 除非你现在认错，否则我就当没有你这个女儿 / You will leave
 * this house tonight unless you do exactly as I say.
 * 与 silent_treatment 族的区别是**可判定**的：撤回供给（不说话/不给饭/
 * 扣零花钱/不来接你）撤的是**关系里的供给**，关系存续本身还在；
 * 本族终止的是**关系存续**（断绝关系/不认这个子女/赶出家门/离婚），
 * 要挟的标的从「供给」升级为「关系是否还存在」。
 *
 * 为什么现有维度拦不住（r654 discriminate() 逐条零命中实测 + 归因）：
 *   · emotional_manipulation 管情绪施压本身（愧疚/恐惧/怜悯的直接唤起），
 *     本族攻击句「你不答应我，我就当没生过你这个儿子」实测零命中——
 *     它没有情绪词共现，是纯粹的条件-后果结构。
 *   · double_bind 管矛盾指令，本族不构成矛盾指令（只有一个条件一个后果）。
 *   · commitment_coercion / favor_ledger / investment_as_debt /
 *     suffering_capital 管承诺/人情/资源/苦难折算义务，本族抵押物是
 *     **关系存续本身**，不涉及任何可计量的投入存量。
 *   · selfharm_coercion（r650）抵押物是胁迫者自己的身体，本族抵押物是
 *     **关系**——受害者承受的是被抛弃/被否认，不是物理伤害。
 *   · 其余 100 个维度对本族 4 条漏判样本实测全部零命中。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① COND 不顺从条件：你不答应我/你再顶嘴/你不听话/除非你认错/
 *     今天不按我说的做（第二人称在场的不顺从条件或「除非」型条件），
 *     或英文 if you do not obey / unless you do exactly as I say；
 *   · 支② SEVER 关系终止威胁：当没生过你这个儿子/断绝父子关系/
 *     别再进这个家门/当没有你这个女儿/disown you/leave this house tonight。
 *   · 单有不顺从条件不判：「你不答应我，我就告诉你妈妈」是别的语境；
 *   · 单有关系终止陈述不判：「父母可以表达失望，但不该以断绝关系相要挟」
 *     是规范陈述——那是价值判断，不是筹码。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 法律/规范陈述：断绝关系的法律定性、正当边界讨论、违法认定；
 *   · G2 正当情绪表达：父母可以失望/难过/需要冷静——不含终止关系动词；
 *   · G3 概念分析：关系断绝要挟本身是被分析、被警惕的对象；
 *   · G4 句首咨询提问（收窄纪律同 r648/r649/r650：只认句首咨询词，
 *     不认句中任何问号——本族攻击句可带反问结尾）。
 *
 * [r654 实现纪律] 所有正则源串一律走 String.raw（同 r642-r650 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 */

'use strict';

// ─── 支①左腿: 不顺从条件（第二人称在场的不顺从/条件结构）──────────────
// 与 selfharm-coercion 的 COND_ZH 同族同形（r654 复用其形状，不抽共享
// 模块的理由：两个维度的条件是同一语言现象，但正则一旦共享，任一维度
// 收紧条件会连带改变另一维度的命中集——r648/r649 教训是同族清单抄两份
// 必然漂移，而**共享**会让「收紧一个维度」变成「收紧两个维度」，
// 违背各维度独立演进的前提。两处各自维护 + 测试各自锁边界。）
const COND_ZH = new RegExp([
  // 核心形：你不答应我/你不听话/你再顶嘴/你不按我说的做
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:不|别|少)(?:答应|应|同意|准许|肯|愿意|听话|顺从|服从|照做|照办|认错|道歉|服软|低头|理我|跟我说话|来见我|回家|打电话)`,
  // 「你再顶嘴/你还敢顶嘴」类：抗命动作条件
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:再|还|又|居然|竟然)(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|争辩|犟嘴|嘴硬|嘴犟)`,
  // 你要么…否则/不然 型
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:要是|如果|若|假如|倘若)(?:[^。]{0,6})?(?:敢|真的|一定|坚持)?(?:走|离开|离婚|分手|出去|报警|告状|辞职|退学|拒绝|反对|顶撞)`,
  // 「除非」型条件
  String.raw`除非(?:你|您|你们)?(?:[^。]{0,6})?(?:现在|立刻|马上|赶紧|赶快)?(?:[^。]{0,4})?(?:认错|道歉|答应|同意|听话|顺从|服从|按我说的|照我说的|听我的|改|服软|低头|回来)`,
  // 「不按我说的做」类
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:不|没)(?:按|照|依)(?:我|咱们)?(?:说|讲|教|安排|吩咐)(?:的)?(?:[^。]{0,4})?(?:做|办|行事|来|去)`,
  // 时间限定 + 不顺从
  String.raw`(?:今天|今天一天|今晚|这回|这次|这一回|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软)`,
  // 英文：if you do not obey / unless you do exactly what I say
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:do\s+not|don't|refuse\s+to|will\s+not|won't)\s+(?:obey|do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell|asked)|comply|listen|stay|apologize|agree)\b`,
  // 「I will disown you unless you…」：unless/if 在句中（主句在前）
  String.raw`\b(?:i|we)\s+(?:will|'ll|am\s+going\s+to)\s+[^.]{0,40}?\b(?:unless|if)\s+(?:you|u)\s+(?:do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell)|obey|comply|listen|stay|apologize|agree|leave)\b`,
  // 「You will leave this house tonight unless you do as I say」：
  // 主句在前 + unless 从句在后，主语是 you 而非 i/we
  String.raw`\byou\s+(?:will|'ll|shall)\s+[^.]{0,40}?\b(?:unless|until|before)\s+(?:you|u)\s+(?:do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell)|obey|comply|apologize|agree)\b`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:leave|walk\s+(?:out|away)|go|divorce|break\s+up\s+with\s+me)\b`,
  String.raw`\b(?:until|before)\s+(?:you|u)\s+(?:apologize|obey|do\s+as\s+i\s+say|agree|come\s+back)\b`,
  // 隐式条件支（r654）：宣告式时间状语本身即条件标记——
  // 「从今往后你没有我这个妈」「From now on you are not my child」
  // 「We will no longer consider you our son」三句都没有 if/unless 从句，
  // 威胁的全部信息就在宣告本身（从此起关系终止）。不加这一支，这三族
  // 会永远漏判。判据收紧：必须与「关系终止动词」共现（右腿），
  // 单有时间状语 + 否认代词不构成要挟（「今后我没有你也不行」）。
  String.raw`(?:从今往后|从今以后|今后|以后|往后|从此|从今)(?:[^。]{0,8})?(?:没有|没|不|再不)(?:我|咱|你|您)`,
  String.raw`\b(?:from\s+now\s+on|from\s+this\s+day\s+forward|as\s+of\s+(?:now|today))\b[^.]{0,40}?\b(?:you|u)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:no\s+longer|not)\b`,
].join('|'), 'i');

// ─── 支②右腿: 关系终止威胁（把关系存续本身当筹码）────────────────────
const SEVER_ZH = new RegExp([
  // 「当没生过你这个儿子/当没有你这个女儿」：亲子关系否认
  String.raw`当(?:没|没有|作没|当作没)(?:生过|养过|有过|生养过|教育过)(?:你|您|你们)?(?:这个|这么一个)?(?:儿子|女儿|孩子|崽|仔|娃)`,
  // 「当没有你这个女儿/你没有我这个妈」：无动词生过的否认形（r654 补）
  String.raw`当(?:没有|没)(?:你|您|你们)(?:这个|这么一个)?(?:儿子|女儿|孩子|崽|仔|娃|爸|妈|爹|娘)`,
  // 「从今往后你没有我这个妈」：时间状语 + 否认关系形（r654 补）。
  // 与「当没生过你」的区别：本形没有「生过」动词，是纯粹的关系否认。
  String.raw`(?:从今往后|今后|以后|往后|从此|从今|往后)(?:[^。]{0,6})?(?:没有|没)(?:我|咱)(?:这个|这么一个)?(?:儿子|女儿|孩子|爸|妈|爹|娘|亲人|家人)`,
  String.raw`(?:没有|没)(?:我|咱)(?:这个|这么一个)?(?:儿子|女儿|孩子|爸|妈|爹|娘|亲人|家人)`,
  // 中文条件隐式于宣告式：「从今往后你没有我这个妈」——时间状语本身
  // 就是条件标记（从此起关系终止），COND 侧已由「隐式条件支」覆盖，
  // 本形只作 SEVER 侧的关系终止动词（r654）。
  String.raw`(?:从今往后|从今以后|今后|以后|往后|从此|从今)(?:[^。]{0,8})?(?:没有|没|不|再不)(?:我|咱)(?:这个|这么一个)?(?:儿子|女儿|孩子|爸|妈|爹|娘|亲人|家人)`,
  // 「断绝父子关系/断绝母子关系/脱离关系」：关系终止动词
  String.raw`(?:断绝|切断|脱离|结束|终止|废除|撤销|取消)(?:[^。]{0,6})?(?:父子|母子|母女|父母|子女|亲子|亲戚|亲属|家人|家庭|婚姻|夫妻|夫妻关系|关系|往来|联系)`,
  // 「别再进这个家门/滚出这个家/不许回家」：逐出家门。
  // [r654] 语序有两种：「就别再进这个家门」（限定词+动词+对象）与
  // 「从这个家滚出去」（对象+动词+补语），两支都要认。
  String.raw`(?:再也?别|不准|不许|不得|不能|少|就别|也别|少再)(?:[^。]{0,6})?(?:进|回|踏进|踏入|来到|出现)(?:这个|咱|我家|咱们|这个)?(?:家门|家|屋子|房子|门)`,
  // 对象在前的语序：从这个家滚出去/离开这个家门
  String.raw`(?:从|离)(?:这个|咱|我家|咱们|这个|那)(?:[^。]{0,4})?(?:家门|家|屋子|房子|门)(?:[^。]{0,4})?(?:滚|搬|走|出去|离开|滚出去)`,
  String.raw`(?:滚|搬|走|出去|离开)(?:出|离)(?:这个|咱|我家|咱们)?(?:家门|家|屋子|房子|门)`,
  // 「不认你这个儿子/我没你这个爸」：关系否认
  String.raw`(?:不|没|当作没)(?:认|承认)(?:你|您|你们)(?:这个|这么一个)?(?:儿子|女儿|孩子|父亲|母亲|爸|妈|爹|娘|亲人|家人)`,
  // 「我们就当不认识/断绝往来」：关系撤销的宽表述
  String.raw`(?:咱们|我们|我俩|彼此|从此|以后|往后|今后)(?:[^。]{0,6})?(?:就当|当作|算是|互不|再不|断绝|没有|不是)(?:[^。]{0,6})?(?:不认识|不相识|没有|不是|断绝|无关系|一刀两断|恩断义绝)`,
  // 英文：I will disown you / cut you off / kick you out / leave this house
  String.raw`\b(?:i|we)\s+(?:will|'ll|am\s+going\s+to|shall)\s+(?:disown|disinherit|cut\s+(?:you|u)\s+off|kick\s+(?:you|u)\s+out|throw\s+(?:you|u)\s+out|abandon|leave\s+(?:you|u))\b`,
  String.raw`\byou\s+(?:will|'ll|shall|are\s+going\s+to)\s+(?:have\s+to\s+)?(?:leave|get\s+out\s+of|move\s+out\s+of)\s+(?:this|the|my|our)\s+(?:house|home|family|place)\b`,
  // 「We will no longer consider you our son」：英文条件隐式于
  // no longer 结构（主语 we + will + no longer + 关系动词），整句本身
  // 就是「关系终止」的宣告式威胁，无须显式 if/unless 从句（r654 补）。
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:no\s+longer|not)\s+(?:consider|treat|see|acknowledge|accept|recognize)\s+(?:you|u)\s+(?:as\s+)?(?:my|our|your)?\s*(?:son|daughter|child|kid|family|relative|part\s+of\s+this\s+family)\b`,
  // 「From now on you are not my child」：系动词形（you are not my X），
  // 无 will/no longer 结构（r654 补，同族时间状语宣告形）。
  String.raw`\b(?:you|u)\s+(?:are|'re)\s+not\s+(?:my|our)\s+(?:son|daughter|child|kid|family|relative)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:cut|sever|break)\s+(?:all\s+)?(?:ties|contact|relations(?:hip)?)\s+(?:with\s+(?:you|u))?\b`,
].join('|'), 'i');

// ─── G1: 法律/规范陈述（断绝关系的法律定性、正当边界讨论）──────────────
const LEGAL_ZH = new RegExp([
  // 法律定性：违法/违法/侵权/可以起诉/法律上
  String.raw`(?:把|将)(?:[^。]{0,8})?(?:子女|孩子|未成年子女|家人|亲属)(?:[^。]{0,6})?(?:赶出|逐出|轰出)(?:家门|家|家门)`,
  String.raw`(?:断绝|解除)(?:[^。]{0,6})?(?:关系|亲子关系|父子关系)(?:[^。]{0,10})?(?:属于|是|构成)(?:[^。]{0,8})?(?:违法|不合法|无效|侵权|虐待|遗弃)`,
  // 规范讨论：不该/不能/不可以 + 断绝关系相要挟/作筹码
  String.raw`(?:不该|不能|不可以|不应|不得|勿)(?:[^。]{0,8})?(?:以|用|拿|把)(?:[^。]{0,8})?(?:断绝|脱离)(?:[^。]{0,6})?(?:关系|往来)(?:[^。]{0,6})?(?:相要挟|作筹码|当筹码|作威胁|当威胁|逼迫|胁迫)`,
  // 法律程序：收养关系的解除/宣告/诉讼
  String.raw`(?:解除|撤销|宣告)(?:[^。]{0,6})?(?:收养关系|监护权|抚养权|亲属关系)(?:[^。]{0,8})?(?:需要|须|应当|要走|得走|依法)`,
  // 英文：cutting off / disowning is illegal / not acceptable
  String.raw`\b(?:disowning|cutting\s+off|kicking\s+out)\s+(?:a|an|your|one's)\s+(?:child|son|daughter|kid|family\s+member)\s+(?:is|would\s+be)\s+(?:illegal|unlawful|not\s+(?:acceptable|okay|allowed)|a\s+form\s+of)\b`,
  String.raw`\b(?:should|must)\s+(?:be|only\s+be)\s+(?:a\s+)?(?:last\s+resort|used\s+carefully|never\s+used)\s+(?:after|in\s+cases\s+of)\b`,
].join('|'), 'i');

// ─── G2: 正当情绪表达（失望/难过/需要冷静，不含终止关系动词）──────────
// 说明：本族右腿要求**明确的关系终止动词**（断绝/不认/滚出/当没生过）。
// 「我很失望」「我需要冷静几天」「暂时不想说话」等正当情绪陈述没有
// 这些动词，天然不判——G2 只作为第二道防线存在（防右腿被未来放宽时误伤）。
const EMOTION_ZH = new RegExp([
  String.raw`(?:可以|应该|有权|需要)(?:[^。]{0,6})?(?:表达|有)(?:[^。]{0,6})?(?:失望|难过|生气|愤怒|不满|担心|焦虑|委屈)`,
  String.raw`(?:父母|家长|家人|我们)(?:[^。]{0,8})?(?:可以|可以)(?:[^。]{0,4})?(?:失望|难过|担心)(?:[^。]{0,6})?(?:但不|而不|但不该|但不能|而非)`,
  String.raw`(?:暂时|先|需要)(?:[^。]{0,4})?(?:冷静|平静|静一静|分开|各自|退一步)(?:[^。]{0,6})?(?:一下|几天|一段时间)?`,
].join('|'), 'i');

// ─── G3: 概念分析（关系断绝要挟本身是被分析、被警惕的对象）────────────
const ANALYSIS_ZH = new RegExp([
  String.raw`(?:把|将)(?:[^。]{0,8})?(?:断绝|脱离)(?:[^。]{0,6})?(?:关系|往来|亲子关系)(?:[^。]{0,6})?(?:当成|当作|看作|变成|沦为|包装成|用作)(?:[^。]{0,6})?(?:筹码|工具|手段|要挟|胁迫|威胁|谈判|压力|控制)`,
  // [r654] 「警惕的做法/是不可取的/是一种胁迫」：警惕动词 + 概念名词 +
  // 定性补语形。首版只认「警惕 + 以断绝关系/关系要挟」显式并列，
  // 「把断绝关系当成筹码是要警惕的做法」整句漏判（B 节唯一误伤）。
  String.raw`(?:把|将)(?:[^。]{0,10})?(?:当成|当作|看作|变成|沦为)(?:[^。]{0,8})?(?:是|属于)?(?:[^。]{0,6})?(?:要警惕|不可取|不该|不能|错误的?|有害的?)(?:的)?(?:做法|行为|方式|手段|形式)`,
  String.raw`(?:断绝|脱离)(?:[^。]{0,6})?(?:关系|往来)(?:[^。]{0,10})?(?:是|属于)(?:[^。]{0,8})?(?:要警惕|不可取|不该|不能|错误|有害)(?:的)?(?:做法|行为|方式|手段|形式|胁迫|绑架)`,
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,10})(?:关系要挟|断绝关系要挟|情感绑架|情绪绑架|胁迫|精神控制|PUA|煤气灯)`,
  String.raw`(?:应该|应当|必须|要|别|不要|勿|需要)(?:[^。]{0,8})(?:警惕|识别|拒绝|摆脱|跳出|反思|反制)(?:[^。]{0,10})(?:以断绝关系|断绝关系|关系要挟|情感绑架|情绪绑架|精神控制|威胁)`,
  String.raw`\b(?:threatening|using)\s+(?:to\s+)?(?:disown|cut\s+off|sever\s+ties|abandon)\s+(?:someone|a\s+child|family|as\s+(?:a\s+)?(?:leverage|weapon|tactic))\b`,
  String.raw`\b(?:disownment|disowning|severance)\s+(?:as|into)\s+(?:a\s+)?(?:weapon|tool|lever|leverage|tactic|form\s+of\s+(?:coercion|control|blackmail))\b`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首咨询词，句中反问不豁免）────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该|有没有、该如何|该如何)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkRelationshipSeverance(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const COND_ZH_ = R.COND_ZH || COND_ZH;
  const SEVER_ZH_ = R.SEVER_ZH || SEVER_ZH;
  const LEGAL_ZH_ = R.LEGAL_ZH || LEGAL_ZH;
  const EMOTION_ZH_ = R.EMOTION_ZH || EMOTION_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.7,
    count: 1,
    detail: isZh
      ? '关系断绝要挟×不顺从条件×关系终止威胁(zh)'
      : 'relationship-severance×disobedience-condition×severance-threat(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：法律规范 / 正当情绪 / 概念分析 / 句首咨询
  if (LEGAL_ZH_.test(text)) return miss();
  if (EMOTION_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① × 支② 双腿共现
  if (!COND_ZH_.test(text)) return miss();
  if (SEVER_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkRelationshipSeverance,
  __internals: () => ({
    COND_ZH, SEVER_ZH,
    LEGAL_ZH, EMOTION_ZH, ANALYSIS_ZH, QUESTION_ZH,
  }),
};
