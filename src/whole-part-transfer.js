/**
 * src/whole-part-transfer.js — 「整体-部分属性迁移（组合/分解谬误）」检测器
 * （第 170 个判别维度）
 *
 * [r172 立项] decision 本体在当前引擎（v6.8.99，169 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。候选来自三层研究（HN Algolia arXiv 2405.02318
 * 「Translating natural language to first-order logic for logical fallacy
 * detection」258 分；GitHub fallacy-detection 仓库群 119/20/5 星）+ 引擎
 * 差距实测：composition_fallacy / division_fallacy 仅作为 fallacies 维度内
 * 的 sub-family tag 存在（src/index.js:5453-5459，共 6 条**纯英文**窄模式，
 * 要求 so/therefore/thus + whole/part 紧邻词形），中文整族零覆盖、英文裸
 * 名词/倒装/长句也漏。本维度是独立 dimMap 键的更宽家族（同 r171
 * base_rate_neglect 与 fallacies 内 base_rate_fallacy 子标签共存之先例，
 * 不构成重复）。
 *
 * 辨别的族：整体-部分属性迁移（fallacy of composition / fallacy of division）
 * ——把**部分的属性**直接迁移成**整体的属性**，或把**整体的属性**直接迁移成
 * **每个部分的属性**，且该属性是**涌现性/非可加**的（强/优秀/顶级/清廉…，
 * 不是重量/个数/总价这类可加量）：
 *   每个队员个人能力都很强，所以这支球队一定很强。
 *   所有零件都用的顶级材料，因此这台设备的性能一定极其出色。
 *   这个政府里的官员个个清廉，所以这个政府自然是清廉的。
 *   这支球队是世界顶级的，所以每个球员都是世界顶级水平。
 *   这家公司是全球顶尖的，因此这里的每个员工都是顶尖人才。
 *   Every player on the roster is elite, so the team is guaranteed to win.
 *   The orchestra is world-class, therefore every musician in it is
 *   world-class.
 *
 * 与既有维度的边界（r172 归因）：
 *   · fallacies 内的 composition_fallacy/division_fallacy 子标签只有 3+3 条
 *     英文窄模式（so/therefore/thus + 紧邻 whole/part 名词），中文与变体
 *     空白由本维度补（射程互补，先例同 sunk_cost / base_rate 两族）。
 *   · hasty_generalization 管**样本不足的归纳**，本族是**部分↔整体层面的
 *     属性迁移**，可无任何样本统计。
 *   · illicit_conversion 管**全称命题主谓项对调**（A⊆B 推 B⊆A），本族管
 *     **整体与部分两个层级间的属性搬运**，层级不同。
 *   · affirming_the_consequent / denying_the_antecedent 管**条件句前后件
 *     推理**，本族不依赖条件句结构。
 *   · confidence / absolute_claim 管**断言强度**，本族管迁移方向本身错，
 *     强度词可缺席（「所以球队也强」）。
 *
 * 判据（多条件共现，缺一不判）：
 *   · 组合形（部分→整体）：腿① PART_QUANT 部分量词×部分名词
 *     （每个/每一/各个/所有/全部/任何/凡是/个个 + ≤2 字间隔 + 队员/成员/
 *     零件/模块/官员/公民…；EN every/each/all + part/component/member/
 *     player…）× 腿② QUALITY 涌现性质量词（很强/优秀/顶级/一流/清廉/
 *     elite/world-class…）出现在部分名词与推断词之间（≤30 字）× 腿③ INFER
 *     推断词（所以/因此/因而/可见/说明/意味着/证明/显然/毫无疑问/故而/故/
 *     据此；EN therefore/thus/hence/consequently/which means/so）× 腿④
 *     WHOLE 整体名词在文内（这/那/该/本/全/整 + 团队/球队/公司/国家/设备/
 *     系统…；EN the team/the company/the system…，含裸名词形）× 腿⑤ QUALITY
 *     复现于推断词后 30 字内。
 *   · 分解形（整体→部分）：腿① WHOLE 整体名词 × 腿② QUALITY（整体名词与
 *     推断词之间 ≤30 字）× 腿③ INFER × 腿④ PART_QUANT（推断词之后）× 腿⑤
 *     QUALITY 复现于部分名词后 24 字内。
 *   · 缺腿不判：只有部分量词无质量词（「每个人都付出了努力」——努力是
 *     投入不是涌现质量）；只有整体名词无质量迁移（「这个系统很复杂」）；
 *     推断词后无质量词复现（「所以每个人都要签字」）。
 *
 * 为什么取 VERIFY 级：单句可能是显式可加量的正确聚合（重量的合计）、文学
 * 对白转述、或整体-部分关系的概念讨论。verify 的含义是「这个属性迁移需要
 * 先说明该属性在部分与整体间是否可加/可分布」——调用方应要求补上聚合依据
 * （合计运算/分布证明/总体统计），而不是接受默认的属性搬运。
 *
 * 明确不判的（豁免）：
 *   · 显式聚合运算（一共/共计/合计/总计/总共/累计/加起来/总和/总量/总重/
 *     总价；EN in total/altogether/combined/adds up/totals to）：可加量的
 *     显式合计是正确推理；
 *   · 推理否定/翻转（难道/恰恰相反/反过来/不等于/不意味着/不代表/未必/
 *     不一定/取决于/还要看/能不能/是否/推不出/说明不了/证明不了/并不能/
 *     而不是/而非；EN not necessarily/does not mean/depends on/cannot be
 *     inferred）：指出迁移无效本身是正确判别；
 *   · 对冲（可能/也许/或许/大概/恐怕/多半/倾向于；EN maybe/perhaps/might/
 *     probably/tends to）：概率化结论不作谬误判定（同 r161 口径）；
 *   · 概念/教学转述（组合谬误/合成谬误/分解谬误/分割谬误/整体与部分/区群
 *     谬误/生态谬误/逻辑谬误/老师/教材/课堂/教授/课本；EN composition
 *     fallacy/division fallacy/fallacy of composition/ecological fallacy/
 *     logical fallacy/textbook/lecture/professor/teacher/classroom）；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① PART_QUANT 部分量词×部分名词（中文，裸名词形态）────────────
// 枚举腿自查（161 轮教训）：部分名词全部取裸名词（队员/成员/零件/官员…），
// 同族词去后缀仍命中；量词后允许 ≤2 字间隔（「所有的零件」「每个部门的
// 员工」）。
const PART_QUANT_ZH = [
  /(?:每个|每一个|每一名|每一位|每名|各个|所有|全部|任何|凡是|但凡|个个|每位|各位)(?:的)?[^。，！？!?,;；\n]{0,2}(?:队员|成员|球员|选手|乐手|员工|学生|零件|部件|组件|模块|元件|个体|个人|工程师|科学家|官员|公民|士兵|党员|志愿者|客户|用户|演员|船员|乘员|乘务员|医生|护士|警察|创业者|职员|工人|农民|干部|将领|教练|明星|诗人|作家|画家|辩手|队友|同学|同事|室友|部门|小组|班级|支部|分队|机组|教研组|工作人员|受益人|当事人|幸存者|人)/,
];

// ─── 腿① PART_QUANT（英文）────────────────────────────────────────
const PART_QUANT_EN = [
  /\b(?:every|each|all)\s+(?:(?:one|single)\s+)?(?:of\s+(?:the|these|those|its|our|their)\s+)?(?:\w+\s+){0,2}?(?:parts?|components?|members?|players?|employees?|students?|engineers?|scientists?|officials?|citizens?|soldiers?|modules?|elements?|ingredients?|individuals?|musicians?|staff|workers?|people|persons?|singers?|actors?|athletes?|developers?|designers?|managers?|volunteers?|customers?|users?|researchers?|lawyers?|doctors?|teachers?|artists?|writers?|departments?|teams?)\b/i,
];

// ─── 腿④ WHOLE 整体名词（中文，限定词形 + 裸名词形两条）─────────────
const WHOLE_ZH = [
  /(?:这|那|该|本|全|整|某)(?:支|个|家|所|座|届|代|种|方面)?(?:团队|球队|乐队|乐团|公司|企业|国家|民族|政府|军队|部队|社会|学校|院系|系统|设备|机器|整机|群体|班子|队伍|剧组|社团|社区|村庄|城市|地区|行业|圈层|圈子|家庭|家族|单位|组织|机构|整体|全局|产品|作品|项目|工程|方案|品牌|平台|软件|网站|程序|算法|模型|引擎|阵容|联盟|帝国|王朝|文明|舰队|组织)/,
  // 裸整体名词（r161 教训：只收带限定词形会导致裸名词整句漏判）
  /(?:团队|球队|乐队|乐团|公司|企业|国家|民族|政府|军队|部队|社会|学校|院系|系统|设备|机器|整机|群体|班子|队伍|剧组|社团|社区|村庄|城市|行业|圈层|圈子|家庭|家族|单位|组织|机构|整体|全局|产品|作品|项目|品牌|平台|软件|网站|程序|算法|模型|引擎|阵容|联盟|帝国|王朝|文明|舰队)/,
];

// ─── 腿④ WHOLE 整体名词（英文）─────────────────────────────────────
const WHOLE_EN = [
  /\b(?:the|this|that|its|our|their)\s+(?:whole\s+|entire\s+)?(?:team|group|company|corporation|firm|country|nation|government|army|military|orchestra|band|ensemble|society|class|school|department|system|machine|engine|device|product|project|organization|institution|community|city|region|industry|platform|software|application|model|algorithm|family|squad|crew|collective|population|entity|league|empire)\b/i,
  /\b(?:team|group|company|country|nation|orchestra|society|system|product|project|organization|community|family|empire|league)\b/i,
];

// ─── 腿②/⑤ QUALITY 涌现性质量词（中文）────────────────────────────
// 只收**涌现性/非可加**的质量判断（强/优秀/顶级/清廉…），可加量（重量/
// 个数/总价）不进本表——那些有显式合计豁免管。裸「强」用前后排除法避开
// 增强/强制/强行/强权/强化（r161 同族自查）。
const QUALITY_ZH = [
  /(?<![增改])强(?![制推行权])/,
  /优秀|优异|出色|顶级|一流|顶尖|厉害|卓越|领先|高效|清廉|文明|最佳|冠军|成功|竞争力|战斗力|精英|精锐|精兵|出类拔萃|世界级|五百强|500强|高质量|完美|名列前茅|数一数二|首屈一指|牛逼|过硬|超凡|标杆|龙头|领军|闻名|知名|著名|享誉|翘楚|前列|大师|名家|高手|超一流|不在话下|绰绰有余|易如反掌|胜券在握/,
];

// ─── 腿②/⑤ QUALITY（英文）────────────────────────────────────────
const QUALITY_EN = [
  /\bexcellent\b|\boutstanding\b|\belite\b|\bsuperb\b|\bbrilliant\b|\bformidable\b|\bstrong\b|\bstrongest\b|\btop\b|\btop-?tier\b|\bworld-?class\b|\bfirst-?class\b|\bbest\b|\bgreat\b|\bgreatest\b|\bleading\b|\bleader\b|\bwinning\b|\bwins?\b|\bwon\b|\bcompetitive\b|\bsuccessful\b|\bmasterful\b|\bstellar\b|\bchampions?\b|\bfortune\s+500\b|\bmaster\b|\bgenius\b|\bhighly\s+(?:skilled|talented|capable|trained)\b/i,
];

// ─── 腿③ INFER 推断词（中文，结论指向）─────────────────────────────
const INFER_ZH = [
  /所以|因此|因而|故而|故|可见|这说明|意味着|足以证明|毫无疑问|显然|说明|证明|据此/,
];

// ─── 腿③ INFER（英文）─────────────────────────────────────────────
const INFER_EN = [
  /\b(?:therefore|thus|hence|consequently|which\s+means|meaning|so)\b/i,
];

// ─── 结论标记 TAIL = 推断词 ∪ 必然性情态词（中文）──────────────────
// 「整体名词 + 结论标记 + 质量词」是组合形结论句的充分形态：推断词可在
// 整体名词之前（所以这支球队一定很强）或之后（整个团队攻克难关自然不在
// 话下——结论标记是必然性情态「自然」）。缺结论标记不判（「这个项目，
// 每个人都很优秀」只是并陈述）。
const MODAL_ZH = [
  /自然|必然|一定|肯定|势必|无疑|必定|定能|不难|可想而知/,
];
const MODAL_EN = [
  /\b(?:must|certainly|guaranteed|bound\s+to|sure\s+to|inevitably|no\s+doubt|definitely)\b/i,
];

// ─── 豁免一：显式聚合运算（可加量的正确合计）───────────────────────
const EXEMPT_AGG_ZH = [
  /一共|共计|合计|总计|总共|累计|加起来|相加|总和|总[量重价人数时长度]/,
];
const EXEMPT_AGG_EN = [
  /\b(?:in\s+total|altogether|combined|adds?\s+up|sum\s+of|totals?\s+to|totaled)\b/i,
];

// ─── 豁免二：推理否定/翻转（指出迁移无效 = 正确判别）────────────────
const EXEMPT_NEG_ZH = [
  /难道|恰恰相反|反过来|不等于|不意味着|不代表|未必|不一定|取决于|还要看|能不能|是否|推不出|说明不了|证明不了|并不能|而不是|而非|谈不上/,
];
const EXEMPT_NEG_EN = [
  /\b(?:not\s+necessarily|does\s+not\s+mean|doesn'?t\s+mean|not\s+the\s+same|depends\s+on|cannot\s+be\s+inferred|can'?t\s+be\s+inferred|converse|inverse)\b/i,
];

// ─── 豁免三：对冲（概率化结论，同 r161 口径）───────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|多半|倾向于/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+be|possibly|probably|tends?\s+to|not\s+always)\b/i,
];

// ─── 豁免四：概念/教学转述─────────────────────────────────────────
const EXEMPT_CONCEPT_ZH = [
  /组合谬误|合成谬误|分解谬误|分割谬误|整体与部分|部分与整体|区群谬误|生态谬误|逻辑谬误|老师|教材|课堂|教授|课本|课文|讲义/,
];
const EXEMPT_CONCEPT_EN = [
  /composition\s+fallacy|division\s+fallacy|fallacy\s+of\s+(?:composition|division)|ecological\s+fallacy|logical\s+fallacy|textbook|lecture|professor|teacher|classroom/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 在 text 的 from 偏移起找 list 中最早出现的匹配，返回 {idx, len} 或 null */
function firstMatch(list, text, from) {
  const start = from || 0;
  const sub = text.slice(start);
  let best = null;
  for (const re of list) {
    const m = sub.match(re);
    if (m && m.index >= 0 && (!best || m.index < best.idx)) {
      best = { idx: start + m.index, len: m[0].length };
    }
  }
  return best;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkWholePartTransfer(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const PQ_Z = R.PART_QUANT_ZH || PART_QUANT_ZH;
  const PQ_E = R.PART_QUANT_EN || PART_QUANT_EN;
  const WH_Z = R.WHOLE_ZH || WHOLE_ZH;
  const WH_E = R.WHOLE_EN || WHOLE_EN;
  const Q_Z = R.QUALITY_ZH || QUALITY_ZH;
  const Q_E = R.QUALITY_EN || QUALITY_EN;
  const I_Z = R.INFER_ZH || INFER_ZH;
  const I_E = R.INFER_EN || INFER_EN;
  const EA_Z = R.EXEMPT_AGG_ZH || EXEMPT_AGG_ZH;
  const EA_E = R.EXEMPT_AGG_EN || EXEMPT_AGG_EN;
  const EN_Z = R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH;
  const EN_E = R.EXEMPT_NEG_EN || EXEMPT_NEG_EN;
  const EH_Z = R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH;
  const EH_E = R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN;
  const EC_Z = R.EXEMPT_CONCEPT_ZH || EXEMPT_CONCEPT_ZH;
  const EC_E = R.EXEMPT_CONCEPT_EN || EXEMPT_CONCEPT_EN;

  // 全局豁免：显式聚合 / 推理否定 / 对冲 / 概念教学 / 疑问句
  if (anyHit(EA_Z, text) || anyHit(EA_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EN_Z, text) || anyHit(EN_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EH_Z, text) || anyHit(EH_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EC_Z, text) || anyHit(EC_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const PQ = PQ_Z.concat(PQ_E);
  const WH = WH_Z.concat(WH_E);
  const QU = Q_Z.concat(Q_E);
  const INF = I_Z.concat(I_E);
  const TAIL = I_Z.concat(I_E).concat(R.MODAL_ZH || MODAL_ZH, R.MODAL_EN || MODAL_EN);
  const isZh = /[\u4e00-\u9fff]/.test(text);

  // ── 组合形（部分→整体）───────────────────────────────────────────
  // 主路由：部分量词×部分名词 … 涌现质量词 … 整体名词 … 结论标记（推断词|
  // 必然性情态）… 涌现质量词复现。整体名词在部分侧之后时走主路由；整体
  // 名词只在部分侧之前出现时（结论先行变体「这支球队，每个队员都很强，
  // 所以一定很强」）走退回路由（推断词在部分侧之后 + 推断词后 30 字内
  // 质量词复现）。
  const pq = firstMatch(PQ, text, 0);
  if (pq) {
    const wholeAfter = firstMatch(WH, text, pq.idx + pq.len);
    if (wholeAfter) {
      const gap = wholeAfter.idx - (pq.idx + pq.len);
      const qBefore = gap <= 40 && anyHit(QU, text.slice(pq.idx + pq.len, wholeAfter.idx));
      const tail = anyHit(TAIL, text.slice(pq.idx + pq.len, wholeAfter.idx + 20));
      const qAfter = anyHit(QU, text.slice(wholeAfter.idx, wholeAfter.idx + 40));
      if (qBefore && tail && qAfter) {
        return {
          hit: true, score: 0.58, count: 1,
          detail: isZh
            ? '整体-部分属性迁移×部分属性推整体属性(zh)'
            : 'whole-part transfer×part-quality-to-whole(en)',
        };
      }
    } else {
      const inf = firstMatch(INF, text, pq.idx + pq.len);
      if (inf) {
        const gap = inf.idx - (pq.idx + pq.len);
        const qBefore = gap <= 30 && anyHit(QU, text.slice(pq.idx + pq.len, inf.idx));
        const wholeAny = firstMatch(WH, text, 0);
        const qAfter = anyHit(QU, text.slice(inf.idx, inf.idx + 30));
        if (qBefore && wholeAny && qAfter) {
          return {
            hit: true, score: 0.58, count: 1,
            detail: isZh
              ? '整体-部分属性迁移×部分属性推整体属性(zh)'
              : 'whole-part transfer×part-quality-to-whole(en)',
          };
        }
      }
    }
  }

  // ── 分解形（整体→部分）：整体名词×质量词…推断词…部分量词…质量词复现 ──
  const wh = firstMatch(WH, text, 0);
  if (wh) {
    const inf = firstMatch(INF, text, wh.idx + wh.len);
    if (inf) {
      const gap = inf.idx - (wh.idx + wh.len);
      const qBefore = gap <= 30 && anyHit(QU, text.slice(wh.idx + wh.len, inf.idx));
      if (qBefore) {
        const pq2 = firstMatch(PQ, text, inf.idx + inf.len);
        if (pq2) {
          const qAfter = anyHit(QU, text.slice(pq2.idx + pq2.len, pq2.idx + pq2.len + 24));
          if (qAfter) {
            return {
              hit: true, score: 0.58, count: 1,
              detail: isZh
                ? '整体-部分属性迁移×整体属性推每个部分属性(zh)'
                : 'whole-part transfer×whole-quality-to-every-part(en)',
            };
          }
        }
      }
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkWholePartTransfer,
  __internals: () => ({
    PART_QUANT_ZH, PART_QUANT_EN, WHOLE_ZH, WHOLE_EN,
    QUALITY_ZH, QUALITY_EN, INFER_ZH, INFER_EN, MODAL_ZH, MODAL_EN,
    EXEMPT_AGG_ZH, EXEMPT_AGG_EN, EXEMPT_NEG_ZH, EXEMPT_NEG_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN, EXEMPT_CONCEPT_ZH, EXEMPT_CONCEPT_EN,
  }),
};
