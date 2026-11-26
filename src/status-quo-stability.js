/**
 * src/status-quo-stability.js — 「现状稳定论证 / 维持现状规避风险」检测器
 * （provisional 第 296 个判别维度，r482 起草；src/index.js 接线由 1 号主力
 * 登记，dispatch 经插件层 src/plugins/status-quo-stability-check/，
 * 同 r295 norm-of-reciprocity / r294 curse-of-knowledge 先例）
 *
 * [r482 立项] 探针 coordination/agent4/probes/r482-probe-pool2.js
 * （v6.8.240 gate() 口径）：四家族同池定拨——
 *   · A 现状偏见核心（免评估断言）：穿透 9/13；
 *   · B 纯粹暴露（熟悉度当质量）：穿透 2/7；
 *   · C **现状稳定论证**：穿透 **4/4**；
 *   · D 默认即权威：穿透 2/4。
 * 良性基线 12 条：本族零误伤（2 条被存量维度 contradiction /
 * law_of_small_numbers 代拦，与本族无关）。C 以 100% 穿透 + 零误伤 +
 * 语义独立定选。
 *
 * 辨别的族：现状稳定论证（status quo stability argument / omission
 * bias for change）——文本先**陈述现状在场**，再据此**断言更换/改动
 * 的风险**，把「规避变更风险」当作维持现状的充分理由，而不做任何
 * 变更本身的收益-成本比较：
 *   现有方案虽然有毛病，但至少稳定，新方案风险太大。
 *   老系统再慢也是自己人知根知底，换新的谁说得准。
 *   The current system is buggy but stable; switching is too risky.
 *
 * 为什么现有维度拦不住：
 *   · loss_aversion（第239维，r251）立项时曾把「现状偏好」列为候选
 *     E 并以「能跑就不要动」式工程常识同形为由落选留库——本族判据
 *     与那条留库意见的交集正是本维度的设计空间：双腿 AND + 量化
 *     证据在场豁免 + 变更评估在场豁免，把「同形的工程常识」切出去；
 *   · appeal_tradition（第61维）管「以传统/历来如此压制改变」，腿①
 *     是**历史传承名词**（老祖宗/祖传/tradition），本族腿①是**现状
 *     在场**（现有/当前/the current），不含时间跨度，领地不重叠
 *     （「现有方案风险大」被 tradition 的 TRADITION_ZH 实测不收）；
 *   · sunk_cost_coercion 管已投入绑架退出，本族无「已投入」腿；
 *   · endowment_effect 管所有权附着推高估值，本族不涉所有权。
 *
 * 判据（双腿 AND + 邻近窗 + 三组豁免 + 否定守卫，缺一不判）：
 *   ① 腿① STATUS 现状在场——现有/当前/老系统/旧X/默认/the current；
 *   ② 腿② RISK 变更风险断言——风险太大/谁说得准/出乱子/别重构/too risky；
 *   ③ 两腿间距 ≤ 同窗（ZH 60 字 / EN 160 字符），方向不限；不按句切分，
 *     因为本族攻击惯用 `;`/`。` 把双腿分栏（`现有。新方案。风险太大。`）；
 *   ④ 腿①腿②均查紧邻否定前缀；
 *   ⑤ 豁免 A 量化证据在场（数据/实测/压测/故障率/uptime 等）——
 *     用可核查数据支撑「稳定」是正当论证；
 *   ⑥ 豁免 B 变更评估在场（回滚/灰度/试点/迁移成本/对照）——
 *     做了收益-成本比较不是在以风险置换论证；
 *   ⑦ 豁免 C 概念评析（现状偏见/损失厌恶/禀赋效应/行为经济学）。
 */
'use strict';

// ─── 共用名词表（腿①限定「现状在场」的落点，防裸词泛化）──────────
const NOUN = '(?:系统|方案|架构|代码|流程|做法|办法|配置|供应商|设备|工具|版本|模式|机制|规则|标准|模板|格式|链路|服务|框架|平台|环境|策略|报表|代码库|数据库|接口|表单|页面|机器|软件|硬件|产品|项目)';

// ─── 腿①：现状在场（中文）────────────────────────────
const STATUS_ZH = new RegExp([
  `现有(?:的)?(?:这|那)?(?:套|个|台|批)?${NOUN}`,
  `当前(?:的)?(?:这|那)?(?:套|个|台|批)?${NOUN}`,
  `现在(?:的)?(?:这|那)(?:套|个|台)?${NOUN}`,
  `[老旧](?:的)?${NOUN}`,
  `原有(?:的)?${NOUN}`,
  `原来(?:的)?${NOUN}`,
  `一直(?:都)?(?:在)?(?:用|跑|采用|沿用)(?:的)?${NOUN}`,
  `沿用(?:的)?${NOUN}`,
  '默认(?:的)?(?:配置|设置|选项|参数|值|路由|版本|方案|做法|策略|流程|行为)',
  '老一套|老办法|旧办法|老样子|老路子|现如今|眼下|现有|当前',
].join('|'));

// ─── 腿①：现状在场（英文）────────────────────────────
const STATUS_EN = new RegExp([
  '\\bthe (?:current|existing|legacy|old|present|incumbent|established) (?:system|setup|config|configuration|codebase|code|workflow|process|pipeline|vendor|tool|version|template|format|architecture|stack|service|framework|platform|scheme|approach|arrangement|infrastructure|routine|practice|report|schema|database|server|machine|plan|policy|strategy)\\b',
  '\\b(?:our|this|that) (?:current|existing|legacy|old|present) (?:system|setup|config|configuration|code|workflow|process|pipeline|vendor|tool|version|template|format|architecture|stack|approach|plan|routine|practice|arrangement)\\b',
  '\\bthe (?:status quo|existing setup|current setup)\\b',
  '\\b(?:legacy|old) (?:system|code|codebase|server|stack|report|template|format|schema|database|infrastructure|machine)\\b',
  '\\b(?:keep|keeping|maintain|maintaining|staying with|stick with|sticking with|retain|retaining) (?:the |our |it |with )?(?:current|existing|legacy|old|present)\\b',
  '\\b(?:we|you) (?:have|\'?ve) (?:run|used|been using|operated|relied on|been running)\\b',
  '\\bwhat we (?:have|already use|already have) (?:now|today)\\b',
  '\\bthe way (?:it|we|things) (?:is|are|works?|work) (?:now|today)\\b',
  '\\bdefault (?:config|configuration|settings?|option|value|route|behaviou?r)\\b',
].join('|'), 'i');

// ─── 腿②：变更风险断言（中文）────────────────────────
const RISK_ZH = new RegExp([
  '(?:风险|隐患|麻烦|坑)(?:太|很|非常|特别|极|格外)?(?:大|高|多|深|难控|不可控|扛不住|受不了|吃不消|负担不起|承受不起|难以估量|不可估量|没法估量|不好估量|估不透|说不准)',
  '(?:换|改|变动|变更|更换|替换|迁移|切换|重构|调整|改造|升级|动)(?:一|下)?(?:个|了|起来)?(?:的)?(?:风险|隐患|代价|成本|麻烦)(?:太|很|非常)?(?:大|高|多|重)',
  '(?:别|不要|不能|不可|少|勿)(?:瞎|乱|轻易|随便|动不动|动不动就|贸然|擅自)?(?:重构|改动|更换|替换|迁移|切换|调整|改造|升级|变更|变动|推翻|重写|改|动|换)',
  '(?:不|没|未)(?:值得|值)(?:去)?(?:赌|冒险|尝试|试)',
  '(?:谁|哪个|谁能)(?:说|讲|担保|保证|兜底|负责)(?:得准|得清|得准|得住|得好)',
  '说(?:不|得)(?:准|清)|拿不准|没把握|难说',
  '(?:出|会出|要出|容易出|保不准出)(?:了)?(?:乱子|岔子|问题|差错|错漏|状况|事故|故障)',
  '(?:扛|顶|兜)(?:不住|不起|不了)',
  '(?:磨合|过渡|试错)(?:期|成本|代价)(?:太|很|非常)?(?:长|大|高|多)',
  '新(?:的)?(?:方案|系统|办法|做法|工具|模板|格式|供应商|流程|法子)(?:没|尚未|未曾|未经|无)(?:试过|验证|验证过|跑过|用过|考验|检验|踩过|磨合过|数据)',
  '(?:陌生|不熟悉|不熟|没底|摸不透|吃不透)(?:的)?(?:东西|玩意儿|领域|系统|方案|工具|流程|代码|技术)',
  '(?:万一|一旦|要是|如果)(?:出|发生|遇到|碰上|弄)(?:了)?(?:问题|岔子|乱子|故障|事故|状况|差错)',
  '(?:风险|隐患|麻烦)(?:谁|谁来|由谁)(?:来)?(?:兜底|承担|负责|背|扛|买单)',
  '(?:赌|赌不起|输不起)|冒险',
  '未知(?:的)?(?:风险|因素|领域|变数)',
  '(?:引入|带来|招来|惹来|引来)(?:新)?(?:的)?(?:问题|麻烦|风险|坑|变数|不确定性)',
  '(?:反而|就|一)?(?:容易|会|可能|保不准|只怕|恐怕|大概率)(?:一?下)?(?:坏|出问题|出事|崩|挂|出故障|出岔子|出错|翻车|瘫)',
].join('|'));

// ─── 腿②：变更风险断言（英文）────────────────────────
const RISK_EN = new RegExp([
  '\\b(?:too|way too|far too|very|extremely|needlessly) (?:risky|dangerous|hazardous|uncertain)\\b',
  '\\b(?:risk|risks|uncertainty|downside|exposure) (?:is|are) (?:too|very|far too|needlessly) (?:high|great|big|large|severe|unacceptable)\\b',
  '\\b(?:switch|switching|change|changing|migrat\\w+|replac\\w+|refactor\\w+|upgrad\\w+|transition\\w+|moving to) (?:it |now |today |that )?(?:is|are|would be|will be) (?:too|very|far too|needlessly) (?:risky|dangerous|costly|uncertain|disruptive)\\b',
  '\\bcarries? (?:too much|significant|unacceptable|unnecessary) (?:risk|uncertainty|exposure)\\b',
  '\\bopens? up (?:too many )?(?:new )?(?:risks|unknowns|problems)\\b',
  '\\b(?:unknown|unfamiliar|uncharted|untested|unproven) (?:risks?|territory|waters|ground|factors?|variables?)\\b',
  '\\bwho (?:knows|can say|can tell) what (?:could|would|might) (?:go wrong|happen|break)\\b',
  '\\bif (?:it|anything) (?:goes wrong|breaks|fails)\\b',
  '\\bnot worth (?:the )?(?:risk|gamble|chance)\\b',
  '\\bno need to (?:re-?evaluate|reassess|revisit|review|question|change|fix|touch)\\b',
  '\\bwhy (?:bother|risk|waste time) (?:changing|fixing|touching|migrating|reviewing|re-?evaluating|revisiting|questioning|replacing)\\b',
  '\\bleave (?:it|things|well enough) alone\\b',
  '\\bdon\'?t (?:go )?(?:fix|touch|change|mess with) (?:it|what)\\b',
  '\\btoo many (?:unknowns|moving parts|new variables)\\b',
  '\\bwe (?:cannot|can\'?t|could not|couldn\'?t) (?:control|predict|foresee) (?:the )?(?:risks?|outcome|consequences|impact)\\b',
  '\\b(?:introduce|introduces|introducing) (?:new )?(?:bugs?|problems|risks|failure modes|issues)\\b',
  '\\b(?:will|would|going to) (?:definitely |surely |certainly |probably |likely )?(?:cause|create|bring|introduce|lead to) (?:chaos|problems?|issues?|bugs?|disruption|risk|risks|failure)\\b',
  '\\b(?:might|may|could|would) (?:fail|break|crash|misbehave)\\b',
  '\\b(?:could|might|can|would) break\\b',
  '\\b(?:is|are) (?:too |very |far too )?(?:riskier|more risky|less safe|less stable)\\b',
].join('|'), 'i');

// ─── 豁免 A：量化证据在场（可核查数据支撑「稳定」是正当论证）────
const QUANT_ZH = /数据(?:显示|表明|说明|支撑|佐证|证实|确认)|实测(?:数据|结果|表明|显示)|压测(?:结果|数据|表明)|故障率|可用性|可用率|正常运行时间|(?:过去|去年|上个月|过去一年|过去半年|过去十二个)(?:个月|年|周)(?:故障|宕机|中断|事故)(?:三|两|一|四|五|六|七|八|九|十|\d)*次?|平均恢复|恢复时间|MTBF|MTTR|SLA|(?:百分之|%\s*)(?:\d+(?:\.\d+)?)|错误率|成功率|吞吐|延迟|P99|P95|容量|负载(?:测试|数据)|统计(?:显示|表明|显著|数据)|样本量|置信区间|基准测试|benchmark/i;
const QUANT_EN = /\b(?:the )?data (?:shows?|showed|indicates?|suggests?|confirms?|supports?)\b|\b(?:measured|observed|logged|recorded) (?:uptime|failure|error|latency|throughput) (?:rate|rates|figures?|numbers?|data)\b|\b\d+(?:\.\d+)?\s?% (?:uptime|availability|error rate|success rate|failure rate)\b|\b(?:uptime|availability|error rate|success rate|failure rate|latency|throughput) (?:of|is|was|at) \d|\bover (?:the )?(?:past|last) (?:\d+|twelve|six|three) months?\b|\b\d+ (?:incidents?|outages?|failures?|downtimes?) (?:in|over|per)\b|\bMTBF\b|\bMTTR\b|\bSLA\b|\bstatistically (?:significant|meaningful)\b|\bconfidence interval\b|\bbenchmark (?:results?|data|numbers?|suite)\b|\bload[- ]test(?:ed|ing)? (?:results?|data)\b|\bP\d{2}\b/i;

// ─── 豁免 B：变更评估在场（做过收益-成本比较不是在以风险置换论证）──
const ASSESS_ZH = /回滚|灰度|金丝雀|并行(?:运行|部署|一段时间|三个月|一个月|两个月)|试点|试运行|影子(?:流量|模式)|AB ?测试|A\/B ?测试|对照(?:组|实验|测试)|迁移(?:成本|计划|方案|评估|风险)|切换(?:窗口|计划|方案|评估|演练)|技术债|重构(?:计划|清单|步骤|方案|收益|评估)|(?:量化|定量|成本|收益|风险|影响|迁移|切换)(?:评估|分析|测算|核算)|评估(?:报告|结果|结论|过|了)|评审(?:过|报告|结论)|比较(?:过|了|结果)|对比(?:过|了|结果)|风险(?:评估|分析|清单|登记|敞口)|收益(?:评估|分析|测算)|成本(?:测算|分析|核算)|双跑|蓝绿|平滑(?:迁移|切换)|里程碑|验收(?:标准|条件|指标)|值班预案|应急(?:预案|方案)|演练|预案|复盘/;
const ASSESS_EN = /\broll[- ]?back\b|\bcanary\b|\bblue[- ]green\b|\bgradual (?:rollout|migration|cutover)\b|\bpilot (?:program|phase|deployment|period|run)\b|\btrial (?:period|run|phase)\b|\bparallel (?:run|operation|deployment)\b|\bshadow (?:traffic|mode)\b|\bA\/B (?:test|testing)\b|\bcontrol (?:group|trial|experiment)\b|\bmigration (?:plan|cost|risk|assessment|strategy)\b|\bcutover (?:plan|window|rehearsal)\b|\brisk (?:assessment|register|analysis|matrix)\b|\bcost[- ]benefit\b|\btech(nical)? debt\b|\brefactor(?:ing)? (?:plan|checklist|roadmap|strategy)\b|\bmilestones?\b|\bacceptance (?:criteria|test|gate)\b|\bfallback (?:plan|option|path)\b|\bcontingency (?:plan|option)\b|\brehears(?:al|ed)\b|\bpost[- ]mortem\b|\bmeasured (?:results?|outcomes?|impact)\b|\bsix[- ]week pilot\b/i;

// ─── 豁免 C：概念评析（在分析这个偏差本身，不是在运用它）────────
const META_ZH = /现状(?:偏见|偏差|偏好|稳定)|损失厌恶|禀赋效应|沉没成本|行为经济学|卡尼曼|前景理论|参考点|维持现状(?:偏差|偏好)|变更(?:厌恶|规避)/;
const META_EN = /\bstatus quo (?:bias|preference|fallacy|effect)\b|\bloss aversion\b|\bendowment effect\b|\bsunk cost\b|\bbehaviou?ral economics\b|\bKahneman\b|\bprospect theory\b|\breference[- ]dependence\b|\bomission bias\b/i;

// ─── 否定守卫：腿匹配起点前紧邻的显式否定 ─────────────
// 只查腿前的窄窗（6 字符），不收远距离否定——那会造出「句尾加不」
// 的通用 bypass。「别说/再说」并入，因为「别再说现有方案风险太大」
// 是把腿明确否掉的真实句型。
const NEG_ZH = /(?:并不是|绝不是|并非|不是|绝非|谈不上|算不上|称不上|不能说是|不可谓|别说|再说|未必|不见得)(?:所谓的)?[^。，！？；]{0,4}$/;
const NEG_EN = /\b(?:it is|it's|that is|that's|this is|there is|there's) not (?:that |the case that )?(?:the |a |an )?\w[\w\s]{0,24}$|\bnot (?:that|the case that) (?:the |a )?\w[\w\s]{0,24}$|\bcontrary to\b/i;

// ─── 同窗（腿①与腿②的最大间距）──────────────────────
const WINDOW_ZH = 60;
const WINDOW_EN = 160;

/** 收集正则全部匹配及其起止位置（供零重叠配对判定） */
function _collect(re, text) {
  const out = [];
  if (!re || typeof re.source !== 'string') return out;
  let g;
  try {
    g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
  } catch (_) { return out; }
  let m;
  let guard = 0;
  while ((m = g.exec(text)) !== null && guard++ < 500) {
    if (m[0].length === 0) {
      if (g.lastIndex <= m.index) g.lastIndex = m.index + 1;
      continue;
    }
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return out;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以自定义正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkStatusQuoStability(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const STATUS_ZH_ = R.STATUS_ZH || STATUS_ZH;
  const STATUS_EN_ = R.STATUS_EN || STATUS_EN;
  const RISK_ZH_ = R.RISK_ZH || RISK_ZH;
  const RISK_EN_ = R.RISK_EN || RISK_EN;
  const QUANT_ZH_ = R.QUANT_ZH || QUANT_ZH;
  const QUANT_EN_ = R.QUANT_EN || QUANT_EN;
  const ASSESS_ZH_ = R.ASSESS_ZH || ASSESS_ZH;
  const ASSESS_EN_ = R.ASSESS_EN || ASSESS_EN;
  const META_ZH_ = R.META_ZH || META_ZH;
  const META_EN_ = R.META_EN || META_EN;
  const NEG_ZH_ = R.NEG_ZH || NEG_ZH;
  const NEG_EN_ = R.NEG_EN || NEG_EN;

  // 全文级豁免 C：在分析这个偏差本身，不是在运用它
  if (META_ZH_.test(text) || META_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZH = /[\u4e00-\u9fff]/.test(text);
  const statusSpans = [].concat(_collect(STATUS_ZH_, text), _collect(STATUS_EN_, text));
  const riskSpans = [].concat(_collect(RISK_ZH_, text), _collect(RISK_EN_, text));
  if (statusSpans.length === 0 || riskSpans.length === 0) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  const window = isZH ? WINDOW_ZH : WINDOW_EN;

  // 豁免窗：双腿所在的局部段落（腿前 20 / 腿后 40 字符）
  const negatedAt = (spans, re) => spans.some(s => {
    const pre = text.slice(Math.max(0, s.start - 6), s.start);
    return re.test(pre);
  });

  for (const s of statusSpans) {
    if (negatedAt([s], isZH ? NEG_ZH_ : NEG_EN_)) continue;
    for (const r of riskSpans) {
      if (negatedAt([r], isZH ? NEG_ZH_ : NEG_EN_)) continue;
      // 零重叠：两腿不得互为子串（防自证）
      if (!(r.end <= s.start || r.start >= s.end)) continue;
      // 同窗
      const gap = (r.start >= s.end) ? (r.start - s.end) : (s.start - r.end);
      if (gap > window) continue;

      const lo = Math.max(0, Math.min(s.start, r.start) - 20);
      const hi = Math.min(text.length, Math.max(s.end, r.end) + 40);
      const local = text.slice(lo, hi);
      // 豁免 A 量化证据在场 / 豁免 B 变更评估在场
      if (QUANT_ZH_.test(local) || QUANT_EN_.test(local)) continue;
      if (ASSESS_ZH_.test(local) || ASSESS_EN_.test(local)) continue;

      return {
        hit: true, score: 0.4, count: 1,
        detail: isZH
          ? '现状稳定论证(现状在场×变更风险断言)(zh)'
          : 'status quo stability argument(en)',
      };
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkStatusQuoStability,
  __internals: () => ({
    STATUS_ZH, STATUS_EN, RISK_ZH, RISK_EN,
    QUANT_ZH, QUANT_EN, ASSESS_ZH, ASSESS_EN,
    META_ZH, META_EN, NEG_ZH, NEG_EN, WINDOW_ZH, WINDOW_EN,
  }),
};
