/**
 * src/love-bombing.js — 「爱意轰炸」检测器（第 127 个判别维度）
 *
 * [r685 立项建模块] 候选来源：r684 交接簿遗留队列（love_bombing 族）。
 * 本轮用 scripts/round-685-lovebomb-reprobe.js 在 126 维引擎上复量
 * （判据从严：gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；
 * 良性被 block/rewrite 即误伤；漏判样本再跑 discriminate() 确认全维度
 * 零命中）：
 *   攻击 15 条漏判 6 条（40%）、全维度零命中 6/6、良性 9 条 0 误伤。
 * 复量数字与 scout-684.txt 完全一致（r684 改动未影响该族）。
 * decision 本体一次选出（scripts/round-685-decide.js 读
 * /tmp/decide-opts-685.json，composite_score 0.91 / confidence 0.88 /
 * identity alignment 100%，无拒选）：A 新建 love_bombing 第 127 维
 * 度 0.91 > B 给 emotional_manipulation 补句式 0.85 > C 只给
 * social_isolation 补孤立宣告 0.79 > D 只验证不动引擎 0.75。
 * 本轮是心虫选的，不是拍板的。
 *
 * 辨别的族：「爱意轰炸」（love bombing）——关系操控的**理想化阶段**，
 * 操控者用过量的爱意宣告、生存依赖宣告、痛苦宣告换取对方的即时服从
 * 与社交隔绝（理想化→贬值→抛弃三阶段的首阶段）：
 *   你是我生命中的唯一，没有你我就活不下去。
 *   我每天给你送花送礼，你必须今晚见我。
 *   没有你的日子每秒都是煎熬，你现在必须回复我。
 *   别跟你那些朋友来往了，他们不配。
 *
 * 为什么现有 126 个维度拦不住（r685 discriminate() 零命中实测）：
 *   漏判样本的形状全部在既有维度射程之外——emotional_manipulation
 *   管**付出控诉与条件式疼爱**（我为你付出了全部你怎么能这样对我 /
 *   如果你爱我你就…），selfharm_coercion 管**自伤威胁**（你要是离开
 *   我我就死给你看），social_isolation 管**隔离行为本身**（切断联系/
 *   删除好友/不准出门，须有隔离指令），都不覆盖「唯一性宣告+生存
 *   依赖」「物质轰炸+即时服从」「痛苦宣告+即时服从」「孤立宣告+
 *   贬损」这四种结构；同族已拦 9 条（付出控诉/自杀威胁/排他+贬损
 *   变体）说明既有维度只覆盖其中三种变体，上述四种全零命中。
 *
 * 判据（五条独立通路，均为双腿共现——单腿可能是正常浪漫表达）：
 *   · P1 唯一性宣告 × 生存依赖（UNIQUE × DEPEND：你是我生命中的
 *     唯一/你是我活着的唯一意义/你是我的命 × 没有你我就活不下去/
 *     没有你我不行/离开你我就活不了）；
 *   · P2 物质/情感轰炸 × 即时服从要求（BOMBARD × DEMAND：我每天给
 *     你送花送礼/我把我的一切都给了你/为了你我可以放弃一切 × 你必
 *     须今晚见我/你现在必须回复我/你必须马上嫁给我）；
 *   · P3 痛苦宣告 × 即时服从要求（AGONY × DEMAND：没有你的日子每秒
 *     都是煎熬/没有你的每一分每一秒我都在煎熬 × 同上服从腿）；
 *   · P4 孤立宣告 × 社交圈贬损（ISOLATE × DEROGATE：别跟你那些朋
 *     友来往了/除了我谁都不能信/你只能跟我说话 × 他们不配/他们没一
 *     个好人/他们在骗你）；
 *   · P5 排他宣告 × 社交圈贬损（EXCLUSIVE × DEROGATE：只有我才是
 *     真正爱你的人/全世界只有我最懂你 × 你朋友都不怀好意）。
 *
 * 明确不判的（守门 G1-G4）：
 *   · G1 正常浪漫与情感表达（求婚/表白/情人节/纪念日/感动/相爱/
 *     互相送礼物/感谢…陪伴支持；英文 romance / valentine / propose）；
 *   · G2 心理学科普与反操控教育（love bombing / 情感轰炸 / 理想化
 *     × 贬低 等概念讨论，英文 love bombing / idealization）；
 *   · G3 第三人称叙事（他每天给女朋友送早餐——主语非第一/二人称
 *     的送礼自述不判，BOMBARD 腿只收第一人称+第二人称指向）；
 *   · G4 句首咨询提问（如何…/怎么…/Why does…）。
 *
 * 边界（与相邻维度的分工，测试锁住）：
 *   · emotional_manipulation（r6xx）管付出控诉与条件式疼爱，本族是
 *     理想化轰炸+生存依赖+即时服从的组合结构；
 *   · selfharm_coercion 管自伤威胁（离开我我就死），本族不重复管；
 *   · social_isolation（r683）管隔离行为本身（切断联系/删除好友），
 *     本族的孤立宣告须带**贬损腿**共现（「他们不配」），单有隔离指
 *     令归 social_isolation；
 *   · economic_control（r668）管经济支配，本族的「送你礼物」是轰炸
 *     手段不是经济控制结构。
 *
 * [r685 实现纪律] 同 r642-r684：所有正则源串一律走 String.raw。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 英文分支的间隔符必须用 [^.]（中文 [^。] 管不住英文句点）。
 * ⚠️ isZh 判定用字面端点 /[一-龿]/——绕开写盘层的反斜杠转义。
 * ⚠️ 英文侧模式本轮不加：攻击集 15 条全中文，英文 love bombing 族
 *    未探测量化（无实测样本支撑不配加模式）——已知未修项，见
 *    UPGRADE_LOG r685。
 */

'use strict';

// ─── P1: 唯一性宣告腿 × 生存依赖腿 ────────────────────────────────
// 唯一性宣告腿：把对方宣告为自己的「唯一/全部/命/生存意义」。
// 单腿不判（「你是我最珍贵的宝藏，我们会一直幸福下去」是正常表白）。
const UNIQUE_ZH = new RegExp([
  // (a) 你是我的生命/世界/生活 + 唯一/全部/一切
  // （「我」与「的」均可选——「你是我生命中的唯一」与「你是我的
  // 世界的全部」两种语序都要收）
  String.raw`(?:你|您)(?:就|才|也)?是?(?:我)?(?:的)?(?:这辈子|这一生|一生|生命|人生|世界|生活|活着|活)[^。]{0,6}(?:中|里|上)?的?(?:唯一|全部|一切|所有)`,
  // (b) 你是我的命（裸命名词，须与 DEPEND 共现）
  String.raw`(?:你|您)是我(?:的)?命(?:根子)?`,
  // (c) 你是我活着的/活下去的 唯一意义/理由/动力
  String.raw`(?:你|您)是我(?:活着的|活着的|生存的|活下去的)(?:唯一)?(?:意义|理由|动力|支柱)`,
  // (d) 排他性唯一（只有你才是…/我的世界里只有你）
  String.raw`(?:只有|唯有)你(?:才|最|能)?`,
  String.raw`我(?:的)?(?:世界|生命|人生|生活|心里|眼里)(?:里|中)?(?:只有|全是|只有你)`,
].join('|'), 'i');

// 生存依赖腿：宣称没有对方自己就活不下去/不行。
// 刻意不收「没有你的帮助这个项目不可能成功」（那是对事不对人的
// 事实陈述，动词组限定在生存/精神状态崩溃族）。
const DEPEND_ZH = new RegExp([
  String.raw`没有(?:你|您)[^。]{0,8}(?:我就|我也|我)?(?:活不下去|活不了|没法活|不能活|怎么活|我不行|不行了|没意义|活着没什么意思|生不如死)`,
  String.raw`(?:离开|失去|分手|见不到)(?:你|您)[^。]{0,8}(?:我就|我也)?(?:活不下去|活不了|没法活|不能活|怎么活|会死|不行)`,
].join('|'), 'i');

// ─── P2/P3 共用: 即时服从要求腿 ──────────────────────────────────
// 时间紧迫词（今晚/现在/立刻/马上/当天/即刻）× 指向操控者的服从动词
// （见我/回复我/陪我/嫁给我/来我家/接我电话/回我消息）。
// 单腿不判（「你必须按时完成作业」没有时间+服从结构）。
const DEMAND_ZH = new RegExp([
  // (a) 时间紧迫词 × 服从动词
  String.raw`(?:你|您)(?:必须|得|应当|应该|需要)?[^。]{0,6}(?:今晚|今天晚上|今天|今日|现在|立刻|马上|当即|即刻|当天)[^。]{0,10}(?:见我|见我一面|来我家|来我这|回复我|回我|陪我|陪着我|嫁给我|娶我|答应我|接我电话|回我消息|出现|跟我|和我)(?:走|在一起|见面)?`,
  // (b) 紧迫词前置形（现在马上/立刻 回复/回/答应/出来/见我）
  String.raw`(?:现在|立刻|马上|即刻|当即)[^。]{0,4}(?:回复|回|答应|出来|见我|陪我|过来|过来一趟)`,
  // (c) 现在就/必须现在 × 第二人称 + 服从动词
  String.raw`(?:现在|立刻|马上)[^。]{0,6}(?:必须|一定要|务必)?[^。]{0,6}(?:听我的|按我说的|答应我|照做)`,
].join('|'), 'i');

// ─── P2: 物质/情感轰炸腿 ─────────────────────────────────────────
// 只收**第一人称**且指向**第二人称**的轰炸（我每天给你送花/我把我
// 的一切都给了你/为了你我可以放弃一切）——第三人称送礼自述（他每
// 天给女朋友送早餐）主语不是「我」，不命中，测试锁这条边界。
const BOMBARD_ZH = new RegExp([
  // (a) 我每天/每个月(都)给/送/买/请/带 你…
  String.raw`我(?:每天|天天|每次|每个月|每周|经常|时常|一有空)[^。]{0,4}(?:都)?(?:给|送|买|请|带)(?:你|您)`,
  // (b) 我给/送/买/请 你 具体礼物
  String.raw`我(?:给|送|买|请)(?:你|您)(?:买|送)?[^。]{0,10}(?:花|礼物|礼品|包包|包|口红|手机|衣服|鞋|饭|早餐|午餐|晚餐|奶茶|咖啡|红包|首饰|项链|戒指|香水)`,
  // (c) 我为你付出/花/牺牲
  String.raw`我(?:为了|为)(?:你|您)[^。]{0,8}(?:付出|花|牺牲|放弃|辞)`,
  // (d) 为了你我…放弃/付出/牺牲（为了语序前置）
  String.raw`(?:为了你|为你)(?:我|俺)?[^。]{0,8}(?:放弃|付出|牺牲|花|辞)`,
  // (e) 我把我的一切都给了你
  String.raw`我(?:把|将)(?:我)?(?:的)?一切(?:都)?(?:给|送|交)`,
  // (f) 我对你…好
  String.raw`我(?:对|替)(?:你|您)(?:这么|那么|这么样)?好`,
].join('|'), 'i');

// ─── P3: 痛苦宣告腿 ──────────────────────────────────────────────
// 宣称没有对方的日子就是煎熬/痛苦/黑暗。单腿不判（「没有你的生活
// 少了些色彩，但我依然过得很好」是健康表达，动词组限定在痛苦族）。
const AGONY_ZH = new RegExp([
  // (a) 没有你的日子/生活/每一分每一秒 + 痛苦族
  String.raw`没有(?:你|您)的?(?:日子|生活|每一分每一秒|分分秒秒|每一天|每天)[^。]{0,8}(?:都是|全是|只剩|只有)?(?:煎熬|痛苦|折磨|难受|黑暗|空虚|毫无意义|生不如死)`,
  // (b) 没有你/失去你 + 痛苦族（任意位置）
  String.raw`(?:没有|失去|见不到)(?:你|您)[^。]{0,10}(?:痛苦|难受|煎熬|折磨|崩溃|发疯|疯了|受不了|痛不欲生|活不下去)`,
  // (c) 你不理/不回/不答应 我 + 崩溃族（允许「如果/要是」等前置连接词）
  String.raw`(?:你|您)[^。]{0,6}(?:不|没|再也不|不再)(?:理|回|答|见|陪|搭理)(?:我|俺)[^。]{0,10}(?:就|便会|就会)(?:急|疯|崩溃|受不了|活不下去|去死|自杀)`,
].join('|'), 'i');

// ─── P4: 孤立宣告腿 ──────────────────────────────────────────────
// 隔离指令（别跟/不许跟…来往/联系/说话/见面；除了我谁都不能信；
// 你只能跟我说话）。单腿不判——纯隔离指令归 social_isolation，
// 本族须与贬损腿共现。
const ISOLATE_ZH = new RegExp([
  // (a) 别/不要/不许/不准/不能/少 跟/和/与/见 … 来往/联系/说话/见面/聚会
  // （连接词组含「见」——「不许你再见他们」；名词组含「他们/她们/
  // 那些人」——「陌生人」刻意不收，家长安全教导「不能和陌生人说话」
  // 是正当提醒不是操控，测试锁这条边界）
  String.raw`(?:别|不要|不许|不准|不能|少|禁止)[^。]{0,6}(?:跟|和|与|见|联系|来往)[^。]{0,14}(?:朋友|同学|同事|家人|爸妈|父母|兄弟|姐妹|哥们|闺蜜|邻居|他们|她们|那些人)(?:们)?[^。]{0,6}(?:来往|联系|说话|见面|相处|聚|出去|玩)?`,
  // (b) 除了我谁都不能信
  String.raw`除了我(?:以外)?(?:谁|什么人|任何人)?都?(?:不能|不许|不准|别)(?:信|相信|听|来往|见面)`,
  // (c) 你只能跟我…
  String.raw`(?:你|您)只能(?:跟|和|与)?我(?:说话|在一起|来往|见面|玩|待)`,
].join('|'), 'i');

// ─── P4/P5 共用: 社交圈贬损腿 ────────────────────────────────────
// 贬损对方的社交关系（他们不配/没一个好人/在骗你/不怀好意/带坏你）。
// 只贬损不判（「你的朋友们都很好，放心去聚会吧」是正面表述）。
const DEROGATE_ZH = new RegExp([
  // (a) 他们/那些人/别人 + 贬损族
  String.raw`(?:他们|她们|那些人|别人|其他人|你的那些)(?:都|全|一个个)?(?:不配|没一个好人|不是好东西|不安好心|在骗你|在害你|不怀好意|想拆散|带坏|看不起|看不上)`,
  // (b) 你/您的 + 社交圈名词 + 贬损族
  String.raw`(?:你|您)的?(?:朋友|同学|同事|家人|爸妈|父母|兄弟|姐妹)(?:们)?(?:都|全|一个个)?(?:没一个好人|不是好东西|不安好心|在骗你|在害你|不怀好意|想拆散|带坏|看不起|看不上|不配)`,
].join('|'), 'i');

// ─── P5: 排他宣告腿（只有我…/全世界只有我…）────────────────────
// 与 UNIQUE_ZH(d) 有重叠但服务不同通路：P5 只要求排他宣告+贬损，
// 不需要生存依赖腿（「全世界只有我最懂你，你朋友都不怀好意」是
// 理想化+贬低组合，无生存依赖宣告）。
const EXCLUSIVE_ZH = new RegExp([
  String.raw`(?:只有|唯有)我(?:才|最|能|会)?`,
  String.raw`(?:全世界|全天下|这世上|这个世界上)(?:只有|唯有)我`,
].join('|'), 'i');

// ─── G1/G2: 守门（正常浪漫表达、心理学科普与反操控教育）──────────
const GUARD_ZH = new RegExp([
  // 正常浪漫与情感表达
  String.raw`求婚|表白|情人节|纪念日|爱情电影|婚礼|订婚|谈恋爱|深情|感动|相爱|浪漫|互相(?:送|给)|彼此(?:送|给)`,
  String.raw`感谢[^。]{0,12}(?:陪伴|支持|帮助|照顾)`,
  String.raw`健康的?(?:亲密关系|恋爱|感情|关系)[^。]{0,8}(?:需要|应该|要|靠|是)`,
  // 心理学科普与反操控教育（概念讨论不是轰炸本身）
  String.raw`love\s*bombing|情感轰炸|爱意轰炸|煤气灯|情感操控|精神控制|PUA|理想化[^。]{0,8}贬低`,
  String.raw`(?:心理学|情感|亲密关系)[^。]{0,12}(?:概念|理论|阶段|策略|研究|课程|书籍|书上说|分析)`,
  // 第三人称叙事标记（小说/影视/案例转述）
  String.raw`小说|电影|剧情|角色|台词|情节|案例|剧本|故事里`,
].join('|'), 'i');

const GUARD_EN = new RegExp([
  String.raw`\b(?:valentine|romance|romantic|propos\w+|anniversary|wedding|engagement)\b`,
  String.raw`\blove\s*bombing\b[^.]{0,60}\b(?:is|are|means|refers|stage|tactic|technique|manipulation)\b`,
  String.raw`\bidealization\b[^.]{0,40}\bdevaluation\b`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首，句中反问不豁免）─────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该|遇到|面对|这个|那个|这种|那种|有人|别人|大家|网上|据说|听说)[^。]{0,40}[?？]`,
].join(''), 'i');

const QUESTION_EN = new RegExp([
  String.raw`^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there|what\s+can\s+i)\b[^.]{0,50}\?`,
].join(''), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkLoveBombing(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const UNIQUE_ZH_ = R.UNIQUE_ZH || UNIQUE_ZH;
  const DEPEND_ZH_ = R.DEPEND_ZH || DEPEND_ZH;
  const BOMBARD_ZH_ = R.BOMBARD_ZH || BOMBARD_ZH;
  const DEMAND_ZH_ = R.DEMAND_ZH || DEMAND_ZH;
  const AGONY_ZH_ = R.AGONY_ZH || AGONY_ZH;
  const ISOLATE_ZH_ = R.ISOLATE_ZH || ISOLATE_ZH;
  const DEROGATE_ZH_ = R.DEROGATE_ZH || DEROGATE_ZH;
  const EXCLUSIVE_ZH_ = R.EXCLUSIVE_ZH || EXCLUSIVE_ZH;
  const GUARD_ZH_ = R.GUARD_ZH || GUARD_ZH;
  const GUARD_EN_ = R.GUARD_EN || GUARD_EN;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;
  const QUESTION_EN_ = R.QUESTION_EN || QUESTION_EN;

  // isZh 判定用字面端点 /[一-龿]/（等价 一-鿿）——绕开写盘层的
  // 反斜杠转义（r675/r676 的 \u 形式曾被写成双层反斜杠恒 false，
  // 只影响 detail 文案；字面端点不含任何反斜杠，零风险）。
  const isZh = /[一-龿]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '爱意轰炸×唯一性依赖/物质轰炸/痛苦宣告/孤立贬损(zh)'
      : 'love-bombing×exclusivity-dependence/gift-bombing/agony-declaration/isolation-derogation(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：浪漫表达/心理科普/第三人称叙事/句首咨询
  if (GUARD_ZH_.test(text)) return miss();
  if (GUARD_EN_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();
  if (QUESTION_EN_.test(text)) return miss();

  // P1 唯一性宣告 × 生存依赖（双腿共现）
  if (UNIQUE_ZH_.test(text) && DEPEND_ZH_.test(text)) return hitResult;
  // P2 物质/情感轰炸 × 即时服从要求（双腿共现）
  if (BOMBARD_ZH_.test(text) && DEMAND_ZH_.test(text)) return hitResult;
  // P3 痛苦宣告 × 即时服从要求（双腿共现，共用 DEMAND 腿）
  if (AGONY_ZH_.test(text) && DEMAND_ZH_.test(text)) return hitResult;
  // P4 孤立宣告 × 社交圈贬损（双腿共现）
  if (ISOLATE_ZH_.test(text) && DEROGATE_ZH_.test(text)) return hitResult;
  // P5 排他宣告 × 社交圈贬损（双腿共现，共用 DEROGATE 腿）
  if (EXCLUSIVE_ZH_.test(text) && DEROGATE_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkLoveBombing,
  __internals: () => ({
    UNIQUE_ZH, DEPEND_ZH,
    BOMBARD_ZH, DEMAND_ZH,
    AGONY_ZH,
    ISOLATE_ZH, DEROGATE_ZH, EXCLUSIVE_ZH,
    GUARD_ZH, GUARD_EN, QUESTION_ZH, QUESTION_EN,
  }),
};
