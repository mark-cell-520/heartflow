/**
 * src/uncertainty-weaponization.js — 「证据确定性要挟（uncertainty
 * weaponization / perfect-evidence demand）」检测器（第 207 个判别维度）
 *
 * [r210 立项] philosophy_decision 在当前引擎（v6.8.138，206 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。立项缺口实证：r210 族探针
 * （/tmp/hf-probe-r210b.js）在当前引擎复测——本族攻击 3/3
 * gate.action=pass（真零命中，含中英双语）、良性 2/2 pass（零误伤）。
 * grep 实证：src/ 无任何维度以「不确定性宣告×行动阻挠」两腿结构覆盖
 * 本族（uncertainty 在 src/ 仅作 HEDGE 豁免表与 reasoning 层内部变量
 * 出现；false-balance 的「没有定论」管叙事平衡，nirvana-fallacy 的
 * 「不完美宣告」管方案质量，均不触及本族射程）。
 *
 * 辨别的族：证据确定性要挟——拿**证据的暂不完整**（尚无定论/证据不足/
 * 不是100%确凿/仍无共识/有待证实）直接推出**行动的阻挠**（没必要/不应/
 * 暂缓/观望/为时过早），把「我们还不全知」偷换成「行动尚未获准」：
 *   科学上还没有定论，所以没必要急于行动。
 *   证据不是百分之百确凿，就不能采取任何措施。
 *   因果关系尚未证实，因此无需整改。
 *   科学界仍无共识，这项政策为时过早，应当暂缓。
 *   The science isn't settled, so there's no reason to act.
 *   Until we have conclusive evidence, we shouldn't intervene.
 *   除非百分之百证实，否则不能启动任何干预。
 *
 * 与既有维度的边界（r210 归因）：
 *   · appeal_to_ignorance（第 62 维）管「举证不到→推定不成立/取消质疑
 *     资格」，落点是**断言真伪与发言资格**；本族落点是**行动的存废与
 *     时点**，不断言真伪、不剥夺资格——「没定论所以先不动」与「证明不了
 *     所以是假的」是两种不同的推理事故。
 *   · nirvana_fallacy（第 198 维）管「方案不完美（不能根治/有漏洞）→
 *     废止方案」，前提是**对象的质量缺陷**；本族前提是**证据的不完整**，
 *     方案本身可以无可指摘——「证据不足所以不动」与「方案不完美所以废止」
 *     不可互相归约。
 *   · false_balance 管「把争议双方呈现为等衡」，本族不管呈现方式、管
 *     「以不确定性为由冻结应对」的决策结构。
 *   · base_rate_neglect / hasty_generalization 等统计族管推理保真，
 *     本族管**决策门槛的偷换**（把可行动的置信度偷换成全知门槛）。
 *
 * 判据（两条路由，任一成立即 verify 级）：
 *   · R1 主判据：腿① UNCERTAIN 不确定性宣告 × 腿② BLOCK 行动阻挠
 *     （两腿落在同一叙述内，邻近窗中文 60 字 / 英文 160 字符，缺一不判）；
 *   · R2 完美证据分支：腿① × 完美证据要求（必须100%证实/板上钉钉/铁证
 *     才可行动——单式自带攻击性，两段中文正则 + 三段英文正则）。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人错误论证、风险沟通中的谨慎表述、
 * 或「先缓后论证」的草稿。verify 的含义是「这个不行动的决定建立在完美
 * 证据门槛而非现有证据的成本收益之上，需要回到：现有证据支持什么行动、
 * 不行动的代价、以及等待新证据期间应保持的防护」——调用方应要求补上
 * 成本收益依据或并行防护安排，而不是接受「不确定即冻结」。
 *
 * 明确不判的（豁免——这些是计及风险的正确处置、程序性暂缓或概念讨论）：
 *   · 预防原则/并行行动（虽无定论，但预防原则要求先防范 / 边研究边防护 /
 *     继续开展研究——不确定性当前坚持防护或研究，正是本族要保护的行为）；
 *   · 宣示型暂缓（证据确凿之前暂不公布/定性/表彰/起诉/定罪——等定论再
 *     作**宣示性动作**是正确的程序；本族只管冻结**防护/监管/应对**类动作）；
 *   · 概念/教学转述（不确定性武器化/证据要挟/举证责任/诉诸无知——讨论
 *     这个概念本身不是运用它）；
 *   · 疑问句（含 ?/？——「没定论就不管了吗？」是质疑该谬误本身）。
 */
'use strict';

// ─── 腿① UNCERTAIN 不确定性宣告（中文）────────────────────────────
// 枚举腿自查（161 轮教训）：核心词取裸名词形态（没有定论/证据不足/存疑/
// 莫衷一是），同族词去前后缀仍命中；否定守卫防「不是没有定论」这类
// 对不确定性的否定（意思恰为「已有定论」）。
const NEG_GUARD = '(?<![不并未绝])';
const UNCERTAIN_ZH = [
  // 定论/共识缺位（裸名词 + 否定前缀两形态都收）
  new RegExp(NEG_GUARD + '(?:尚[未无]|没有|未有|仍无|全无|毫无|缺乏)(?:定论|结论|定见|共识|一致意见|统一意见)'),
  /(?:定论|结论|共识|一致意见)[^。，！？!?]{0,4}(?:尚[未无]|没有|仍无)/,
  /众说纷纭|莫衷一是|各执一词|争执不下|悬而未决|疑云重重|迷雾重重/,
  // 证实/证明缺位
  /尚[未无]证实|未被证实|未获证实|未能证实|尚待证实|有待证实|有待确认|仍待确认|尚需验证|有待验证/,
  /(?:无法|不能|难以|无从)(?:证实|证明|确认|查实|断定|定论)/,
  // 证据/依据不足
  /(?:证据|依据|数据|材料)[^。，！？!?]{0,6}(?:不足|不够|不充分|不完整|缺失|有限|薄弱|匮乏)/,
  /(?:证据|依据)[^。，！？!?]{0,4}(?:尚[未无]|还没有|仍未有)/,
  // 确凿性缺位
  /(?:不|未|欠|缺)[^。，！？!?]{0,2}确凿|并不确凿|未算确凿/,
  // 百分比确定性缺位（「不是百分之百确凿」）
  /(?:不是|并非|算不上|谈不上|远非)[^。，！？!?]{0,4}(?:100|百分百|百分之百)/,
  /(?:不能|无法|难以)[^。，！？!?]{0,4}(?:100|百分百|百分之百)(?:排除|排除嫌疑|证实|确认)/,
  // 争议/分歧在场
  /(?:存在|尚有|仍有|不乏|引发|导致)[^。，！？!?]{0,4}(?:争议|分歧|争论|异议|质疑|疑问)/,
  /(?:争议|分歧|争论)[^。，！？!?]{0,4}(?:很大|不断|未休|不休|纷纷|颇多|甚多)/,
  // 机构/学界无共识
  /(?:科学界|学界|医学界|学术界|专家们|专家们|舆论)[^。，！？!?]{0,6}(?:尚[未无]|没有|仍无)(?:共识|定论|一致)/,
  // 结论/真相未明
  /(?:结果|结论|真相|事实|因果|关系)[^。，！？!?]{0,6}(?:不确定|尚不清楚|不得而知|无从得知|扑朔迷离|不明)/,
  /(?:谁也|大家都|无人)[^。，！？!?]{0,2}(?:说不准|说不好|拿不准|说不清|没有把握)/,
  // 混合句兜底：中文句里夹带的 100% 否定
  /(?:isn'?t|is\s+not)\s+100/i,
  // 「在证据确凿之前」——把完全确知设为行动前提（不确定性宣告的时点形）
  /(?:在|待)[^。，！？!?]{0,8}(?:确凿|证实|证明|查实|定论|水落石出|板上钉钉)[^。，！？!?]{0,4}(?:之前|以前)/,
];

// ─── 腿① UNCERTAIN 不确定性宣告（英文）────────────────────────────
const UNCERTAIN_EN = [
  /not\s+(?:yet\s+)?settled/i,
  /(?:no|any)\s+(?:scientific\s+|clear\s+|general\s+)?consensus/i,
  /(?:hasn'?t|has\s+not|haven'?t|have\s+not)\s+(?:yet\s+)?(?:reached?|achieved)\s+(?:a\s+)?consensus/i,
  /(?:no|any)\s+conclusive\s+(?:evidence|data|proof|research)/i,
  /(?:isn'?t|aren'?t|is\s+not|are\s+not)\s+(?:yet\s+)?(?:conclusive|proven|proved|confirmed|established|settled|definitive)/i,
  /inconclusive/i,
  /(?:not|isn'?t)\s+(?:yet\s+)?(?:fully\s+)?(?:proven|proved|confirmed|established|verified|demonstrated)/i,
  /\bunproven\b|\bunconfirmed\b|\bunverified\b/i,
  /(?:evidence|data|proof|research)\s+(?:is\s+|are\s+)?(?:insufficient|inadequate|incomplete|lacking|limited|thin|mixed)/i,
  /not\s+(?:enough|sufficient|conclusive)\s+(?:evidence|data|proof|research)/i,
  /not\s+100\s*(?:%|percent)\s+(?:certain|sure|clear|proven|confirmed|conclusive)/i,
  /(?:remains?|still)\s+(?:uncertain|unclear|unresolved|unproven|debated|disputed|contested|speculative)/i,
  /(?:still|hotly|widely|fiercely)\s+debated/i,
  /(?:more|further|additional)\s+(?:research|studies|study|evidence|data)\s+(?:is\s+)?(?:needed|required|necessary)/i,
  /(?:we|they|scientists?|experts?)\s+(?:don'?t|do\s+not)\s+(?:yet\s+)?know/i,
  /(?:can'?t|cannot)\s+(?:be\s+)?(?:sure|certain|ruled\s+out|confirmed)/i,
  /open\s+question/i,
  /(?:until|before|till)\s+(?:we|they|science)\s+(?:have|has|get|gets|reach|reaches?)\s+(?:conclusive|definitive|absolute|more|better|sufficient|complete)\s*(?:evidence|proof|data|consensus|certainty|studies)/i,
  /(?:doubt|doubts|questions)\s+(?:remain|persist|lingering)/i,
  /(?:scientific|reasonable)\s+doubt/i,
];

// ─── 腿② BLOCK 行动阻挠（中文）────────────────────────────────────
// 射程限定：只收**防护/监管/应对/补救**类行动的阻挠（防范/整改/干预/
// 监管/召回/措施/行动…）；宣示性动作（公布/定性/表彰/起诉）的等定论
// 暂缓属正确程序，走 EXEMPT_DECLARATIVE 豁免。否定守卫防双重否定
// （「不能不采取」「并非没必要」是对该谬误的否定）。
const BLOCK_ZH = [
  // 没必要/不必/无须 + 行动（含「没必要」直连形——没+必要中间无插入）
  new RegExp(NEG_GUARD + '(?:没什么|没啥|不大)?(?:没|不)(?:必要|需要)[^。，！？!?]{0,8}(?:采取|实施|推行|干预|监管|防范|预防|应对|处置|整改|治理|管控|限制|收紧|召回|下架|停产|补救|介入|处理|行动|措施)'),
  /(?:无须|无需|不必|大可不必|犯不着|不值当)[^。，！？!?]{0,6}(?:采取|实施|推行|干预|监管|防范|预防|应对|处置|整改|治理|管控|限制|收紧|召回|下架|停产|补救|介入|处理|行动|措施)/,
  /(?:何必|何须|何需)[^。，！？!?]{0,6}(?:采取|实施|推行|干预|监管|防范|预防|应对|处置|整改|治理|管控|限制|收紧|召回|下架|停产|补救|介入|处理|行动|措施)/,
  // 不能/不应/不该 + 行动
  new RegExp(NEG_GUARD + '(?:不能|不应|不该|不可以|不宜|无从)[^。，！？!?]{0,6}(?:采取|实施|推行|干预|监管|防范|预防|应对|处置|整改|治理|管控|限制|收紧|召回|下架|停产|补救|介入|处理|行动|措施)'),
  // 行动名词/动词 + 为时过早/操之过急/草率/贸然（含「这项政策为时过早」名词形）
  /(?:采取|实施|推行|干预|监管|防范|预防|应对|处置|整改|治理|管控|限制|收紧|召回|下架|停产|补救|介入|处理|行动|措施|政策|方案|禁令|调控|排查|整治)[^。，！？!?]{0,6}(?:为时过早|为时尚早|操之过急|过于草率|草率|贸然|言之过早|下结论太早|还太早|尚嫌过早)/,
  // 暂缓/推迟/观望 + 行动（动词后置形）
  /(?:暂缓|推迟|延缓|延后|暂搁|搁置|暂不|先不|放缓|观望|静观其变|按兵不动|且慢|再说|等待|等到)[^。，！？!?]{0,6}(?:采取|实施|推行|干预|监管|防范|预防|应对|处置|整改|治理|管控|限制|收紧|召回|下架|停产|补救|介入|处理|行动|措施)/,
  // 模态词 + 暂缓/推迟/观望（无后置动词形：「应当暂缓」「需要观望」）
  /(?:应当|应该|应|必须|需要|宜|亟须|急需|不妨|宁可|不如)[^。，！？!?]{0,4}(?:暂缓|推迟|延缓|延后|放缓|观望|静观其变|按兵不动|从长计议|再说)/,
  // 等待/等到…之后/再说
  /(?:等待|等到|待到|俟|待)[^。，！？!?]{0,12}(?:之后|以后|再说|方可|才能)/,
  // 在…之前 + 模态 + 防护/监管类行动（完美证据要求的行动面；宣示性动作
  // 「不能公布」不含防护词，不落入本腿，交由宣示型豁免处理）
  /(?:在|待)[^。，！？!?]{0,10}(?:之前|以前)[^。，！？!?]{0,6}(?:不宜|不应|不能|不必|无须|不该|不可)[^。，！？!?]{0,6}(?:采取|实施|推行|干预|监管|防范|预防|应对|处置|整改|治理|管控|限制|收紧|召回|下架|停产|补救|介入|处理|行动|措施)/,
];

// ─── 腿② BLOCK 行动阻挠（英文）────────────────────────────────────
const BLOCK_EN = [
  /(?:so|therefore|thus|hence)\s+(?:there'?s\s+)?(?:no\s+(?:need|reason|point|justification|basis|urgency|rush)\s+(?:to|for|in)\s+(?:act|acting|intervene|intervention|regulate|regulation|respond|responding|measures|action|mitigation|remediation|precaution))/i,
  /(?:no|not\s+much)\s+(?:need|reason|point|rush|hurry|urgency)\s+to\s+(?:act|intervene|regulate|respond|do\s+anything|take\s+measures|roll\s+out)/i,
  /(?:no\s+)?(?:action|intervention|regulation|measures?|response|steps?)\s+(?:is|are)\s+(?:needed|required|necessary|justified|warranted)/i,
  /(?:no|not\s+enough)\s+(?:action|intervention|regulation|response)\s+(?:should|must|needs?\s+to)\s+be\s+taken/i,
  /(?:shouldn'?t|should\s+not|mustn'?t|must\s+not|ought\s+not\s+to|can'?t|cannot|can\s+not|may\s+not|couldn'?t)\s+(?:act|intervene|regulate|respond|do\s+anything|take\s+(?:any\s+)?(?:measures|action))\s+(?:yet|now|until|before)/i,
  /too\s+(?:early|soon|premature)\s+to\s+(?:act|intervene|regulate|respond|do\s+anything|take\s+measures|roll\s+out|conclude)/i,
  /(?:premature|unjustified|unwarranted|precipitous)\s+to\s+(?:act|intervene|regulate|respond|take\s+measures)/i,
  /(?:wait|hold\s+off|refrain|abstain|delay|defer|postpone)\s+(?:until|before|till|any\s+action|acting|regulating|intervening|measures)/i,
  /(?:before|until)\s+we\s+(?:take|adopt|implement|deploy|roll\s+out|introduce)\s+(?:any\s+)?(?:measures|action|intervention|regulation|steps)/i,
  /(?:is|are)\s+needed\s+(?:before|until)\s+we\s+(?:take|act|intervene|regulate|deploy|roll\s+out|implement|adopt)/i,
  /wait\s+and\s+see/i,
  /(?:until|before)\s+we\s+(?:have|get|reach)\s+(?:100|absolute|conclusive|definitive|complete|more)\s*(?:%|percent)?\s*(?:proof|certainty|evidence|consensus|data|studies)/i,
  /(?:not|no)\s+(?:yet\s+)?(?:justified|justification|basis|grounds|warranted)\s+(?:to|for)\s+(?:act|acting|intervene|intervention|regulate|regulation|action|measures|respond)/i,
  /(?:act|intervene|regulate|respond)\s+only\s+(?:once|when|after)\s+(?:we|science|the\s+evidence)\s+(?:is|are|has|have)\s+(?:certain|conclusive|settled|definitive|complete)/i,
  /(?:action|intervention|regulation|measures)\s+(?:is|are)\s+(?:premature|not\s+yet\s+justified|unwarranted)/i,
];

// ─── R2 完美证据分支：腿① × 完美证据要求（中文，单式自带攻击性）──────
const PERFECT_ZH = [
  /(?:只有|唯有|除非|必须|须|应当|应该)[^。，！？!?]{0,12}(?:100|百分百|百分之百|完全|彻底|板上钉钉|铁证|确凿无疑|毫无疑点|水落石出)[^。，！？!?]{0,10}(?:证实|证明|确认|查实)[^。，！？!?]{0,10}(?:才|方|再)/,
  /(?:100|百分百|百分之百|完全|彻底|板上钉钉|铁证|确凿无疑|毫无疑点)[^。，！？!?]{0,6}(?:证实|证明|确认|查实)[^。，！？!?]{0,12}(?:才|方|再)[^。，！？!?]{0,8}(?:能|可以|采取|行动|启动|干预|上|做)/,
  // 「除非百分之百证实，否则不能启动任何干预」——否则分支形
  /(?:只有|唯有|除非|必须|须)[^。，！？!?]{0,14}(?:100|百分百|百分之百|完全|彻底|板上钉钉|铁证|确凿无疑|毫无疑点)[^。，！？!?]{0,10}(?:证实|证明|确认|查实)[^。]{0,14}(?:否则|不然)[^。]{0,12}(?:不能|不应|不该|不必|不得|不可|不)/,
];

// ─── R2 完美证据分支：腿① × 完美证据要求（英文，单式自带攻击性）──────
const PERFECT_EN = [
  /(?:only|not)\s+(?:once|until|when)\s+(?:we\s+have\s+)?(?:100|absolute|complete|conclusive|definitive)\s*(?:%|percent)?\s*(?:proof|certainty|evidence|consensus)/i,
  /(?:proven|established|confirmed)\s+(?:beyond\s+(?:any\s+)?doubt|conclusively|definitively)\s+(?:before|prior\s+to)/i,
  /(?:must|should|needs?\s+to)\s+be\s+(?:proven|established|confirmed)\s+(?:with\s+)?(?:100|absolute|complete|total)\s*(?:%|percent)?\s*(?:certainty)?\s+(?:before|prior)/i,
];

// ─── 豁免一：让步-防护形（先于主判据检查）──────────────────────────
// 「虽无定论，但…仍要防范」「不应贸然干预，但要做好现有防护」——不确定
// 性当前同时给出防护安排的句子是正确表述，不是冻结行动。注意与攻击形的
// 分野：攻击形是「不确定 + 冻结 + （至多）承诺研究」；让步-防护形必须有
// 转折词之后的**防护/处置**词在场。
const EXEMPT_CONCESSION_ZH = [
  /(?:虽[然然]?|尽管|固然)[^。]{0,24}(?:定论|共识|结论|证实|确凿|证据)[^。]{0,24}(?:但|然而|不过|却|仍|依然|还是)[^。]{0,24}(?:应当|应该|仍|依然|必须|需要|要|先|宜|以防|未雨|防范|预防|采取|应对|处置|整改)/,
  /(?:但|但是|然而|不过|却|同时|一面|一边)[^。]{0,18}(?:仍|依然|还是|要|应先|需要|必须|做好|保持|维持)[^。]{0,14}(?:防护|防范|预防|应对|处置|整改|采取|实施|准备|预案|戒备|监测|评估)/,
];
const EXEMPT_CONCESSION_EN = [
  /\b(?:but|however|though|although|yet|still|nonetheless|nevertheless)\b[^.]{0,80}?(?:protect|safeguard|precaution|mitigat|maintain|keep|prepare|respond|address|intervene|continue)/i,
  /(?:even\s+though|although|though)\s+[^.]{0,60}?(?:unsettled|uncertain|inconclusive|unproven|no\s+consensus|not\s+settled)[^.]{0,80}?(?:still|nonetheless|nevertheless)\s+(?:act|protect|prepare|respond|intervene|maintain|mitigate)/i,
];

// ─── 豁免二：预防原则/并行行动（正确响应不确定性）──────────────────
// 「虽无定论，但预防原则要求先防范」「边研究边防护」「继续开展研究」——
// 不确定性当前坚持防护或推进研究，正是本维度要保护的行为。
const EXEMPT_PRECAUTION_ZH = [
  /预防原则|审慎原则|风险预防|未雨绸缪|防患于未然|防微杜渐|有备无患|宁缺毋滥/,
  /宁可[^。]{0,16}(?:也[不要不能]|也不|也不要|也不能|不可不)/,
  /边[^。]{0,8}(?:研究|验证|观察|观测|监测|评估)[^。]{0,8}(?:边|同时|一面)[^。]{0,8}(?:采取|实施|防范|预防|应对|处置|准备|防护|整改)/,
  /(?:继续|加大|深入|推进|开展|启动)[^。]{0,6}(?:研究|调研|观测|监测|验证|试验|试验性|循证|评估|取证)/,
  /(?:在|待)[^。，]{0,10}(?:之前|以前)[^。，]{0,8}(?:做好|保持|维持|不放松|不松懈|先行|先)[^。，]{0,6}(?:防护|准备|戒备|防范|应对|预案|值守|监测)/,
];
const EXEMPT_PRECAUTION_EN = [
  /\b(?:precautionary|prudent)\s+(?:principle|approach)/i,
  /(?:better|safer)\s+(?:safe\s+)?than\s+sorry/i,
  /\b(?:err|erring)\s+on\s+the\s+side\s+of\s+caution/i,
  /(?:continue|keep|maintain|step\s+up|strengthen)\s+(?:the\s+)?(?:research|monitoring|surveillance|study|studies|precaution|protection|safeguards?)/i,
  /\b(?:while|as|meanwhile)\s+(?:we|they|science)\s+(?:wait|waits|continue|keeps|gathers?|collects?|studies?)\b[^.]{0,60}?(?:protect|safeguard|maintain|keep|monitor|prepare)/i,
  /(?:act|proceed|protect)\s+(?:now\s+)?(?:on|with)\s+(?:the\s+)?(?:best\s+available|current|existing)\s+(?:evidence|data|science)/i,
];

// ─── 豁免二：宣示型暂缓（等定论再作宣示性动作是正确的程序）─────────
// 本族只管冻结防护/监管/应对；「证据确凿之前暂不公布结论」「未定性前
// 不表彰」是正确的程序性谨慎。
const EXEMPT_DECLARATIVE_ZH = [
  /(?:暂缓|暂不|先不|推迟|延后|不便|不宜|先暂|姑且|暂时|不能|不得|不应|不可|无法|没法)[^。，！？!?]{0,6}(?:公布|宣布|发布|定性|定论|定案|下结论|宣传|表彰|嘉奖|起诉|定罪|处罚|追责|评功|报功|通报|点名|指控|定责)/,
  /(?:在|待)[^。]{0,12}(?:之前|以前)[^。]{0,10}(?:不(?:予|作|下|做|加)?(?:定论|结论|公布|定性|宣传|表彰|评论|置评|认定)|不宜(?:宣传|表彰|定性|评论))/
];
const EXEMPT_DECLARATIVE_EN = [
  /(?:wait|hold|defer|delay|refrain)\s+(?:until|before|till)[^.]{0,40}?(?:announce|announcement|publish|publicize|declare|conclusion|award|credit|praise|charge|prosecute|convict|name|blame)/i,
  /(?:can'?t|cannot|shouldn'?t|must\s+not|won'?t|will\s+not)\s+(?:announce|publish|publicize|declare|conclude|comment|draw\s+conclusions)/i,
  /(?:not|no)\s+(?:comment|announcement|confirmation|public\s+statement)\s+(?:until|before|pending)/i,
];

// ─── 豁免三：概念/教学转述（讨论这个概念本身不是运用它）─────────────
const EXEMPT_META_ZH = [
  /不确定性武器化|证据要挟|证据敲诈|证据主义|万能证据|完美证据/,
  /诉诸无知|举证倒置|举证责任|疑罪从无|无罪推定/,
  /burden\s+of\s+proof|perfect\s+evidence|uncertainty\s+weaponiz/i,
];
const EXEMPT_META_EN = [
  /uncertainty\s+weaponiz/i,
  /perfect\s+evidence/i,
  /burden\s+of\s+proof/i,
  /(?:argument|appeal)\s+from\s+ignorance/i,
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
function checkUncertaintyWeaponization(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  // [r210 修绿] 智能引号归一：U+2018/U+2019/U+02BC/U+2032 → 直引号。
  // 引擎 _normText 只做全角 ASCII→半角，不归一弯引号；EN 正则的 '? 只认
  // 直引号，真实文本（网页/Word 复制）的 isn’t / there’s 整条漏判——变体
  // 矩阵实测发现，属补强（只可能增匹配、不删，零误伤）。
  if (typeof text === 'string') text = text.replace(/[\u2018\u2019\u02bc\u2032]/g, "'");
  const R = inject || {};
  const UNC_Z = R.UNCERTAIN_ZH || UNCERTAIN_ZH;
  const UNC_E = R.UNCERTAIN_EN || UNCERTAIN_EN;
  const BLK_Z = R.BLOCK_ZH || BLOCK_ZH;
  const BLK_E = R.BLOCK_EN || BLOCK_EN;
  const PRF_Z = R.PERFECT_ZH || PERFECT_ZH;
  const PRF_E = R.PERFECT_EN || PERFECT_EN;
  const EP_Z = R.EXEMPT_PRECAUTION_ZH || EXEMPT_PRECAUTION_ZH;
  const EP_E = R.EXEMPT_PRECAUTION_EN || EXEMPT_PRECAUTION_EN;
  const EC_Z = R.EXEMPT_CONCESSION_ZH || EXEMPT_CONCESSION_ZH;
  const EC_E = R.EXEMPT_CONCESSION_EN || EXEMPT_CONCESSION_EN;
  const ED_Z = R.EXEMPT_DECLARATIVE_ZH || EXEMPT_DECLARATIVE_ZH;
  const ED_E = R.EXEMPT_DECLARATIVE_EN || EXEMPT_DECLARATIVE_EN;
  const EM_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const EM_E = R.EXEMPT_META_EN || EXEMPT_META_EN;

  // 疑问句整句豁免：「没定论就不管了吗？」是质疑该谬误本身
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 概念/教学转述豁免优先
  if (anyHit(EM_Z, text) || anyHit(EM_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 让步-防护形豁免先于主判据：「不应贸然干预，但要做好现有防护」是
  // 正确表述（转折词后必须有防护/处置词在场，攻击形「至多承诺研究」
  // 不落入本豁免）
  if (anyHit(EC_Z, text) || anyHit(EC_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  // [r210 修绿] 预防原则与宣示型暂缓豁免上移至主判据之前：原置于 R1
  // 之后，导致含腿②词的宣示/预防句（如「在证据确凿之前，暂不发布处理
  // 结果」——「处理」落入腿②射程）被 R1 抢命中而误伤。上移后两类正确
  // 响应先行豁免，只可能减少命中、不增误伤（攻击句不含预防/宣示短语）。
  if (anyHit(EP_Z, text) || anyHit(EP_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(ED_Z, text) || anyHit(ED_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const win = isZh ? WIN_ZH : WIN_EN;

  // 腿①：不确定性宣告
  const uncZhIdx = firstHit(UNC_Z, text);
  const uncEnIdx = firstHit(UNC_E, text);
  const uncIdx = uncZhIdx >= 0 ? uncZhIdx : uncEnIdx;

  // R1 主判据：腿① × 腿② BLOCK 行动阻挠 × 邻近窗（腿①缺席则跳过）
  if (uncIdx >= 0) {
    const blkZhIdx = firstHit(BLK_Z, text);
    const blkEnIdx = firstHit(BLK_E, text);
    const blkIdx = blkZhIdx >= 0 ? blkZhIdx : blkEnIdx;
    if (blkIdx >= 0 && Math.abs(uncIdx - blkIdx) <= win) {
      return {
        hit: true,
        score: 0.58,
        count: 1,
        detail: isZh
          ? '证据确定性要挟×不确定宣告推阻挠行动(zh)'
          : 'uncertainty weaponization×uncertainty-claim-to-inaction(en)',
      };
    }
  }

  // [r210 修绿] 预防原则与宣示型暂缓豁免已上移至主判据之前（见上）。

  // R2 完美证据分支：腿①在场 + 完美证据要求（单式自足）
  if (anyHit(PRF_Z, text) || anyHit(PRF_E, text)) {
    return {
      hit: true,
      score: 0.58,
      count: 1,
      detail: isZh
        ? '证据确定性要挟×完美证据要求分支(zh)'
        : 'uncertainty weaponization×perfect-evidence-demand(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkUncertaintyWeaponization,
  __internals: () => ({
    UNCERTAIN_ZH, UNCERTAIN_EN, BLOCK_ZH, BLOCK_EN,
    PERFECT_ZH, PERFECT_EN,
    EXEMPT_CONCESSION_ZH, EXEMPT_CONCESSION_EN,
    EXEMPT_PRECAUTION_ZH, EXEMPT_PRECAUTION_EN,
    EXEMPT_DECLARATIVE_ZH, EXEMPT_DECLARATIVE_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
  }),
};
