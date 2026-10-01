/**
 * src/premature-termination.js — 过早终止检测器（第47维）
 *
 * 来源：deepseek-ai/DeepSeek-V3#1554 讨论（2026-08-13）
 * "model may terminate prematurely in agent tool-call loops"
 * 模型输出一句状态陈述（"Let me look into this"/"我看看"）即 stop，
 * 无工具调用、无具体结果 → orchestrator 被迫重提示，形成低效循环。
 *
 * 核心洞见（icophy）："evaluator and the evaluated are the same process"——
 * 让模型自己判断"是否完成"不可靠，完成判定必须在生成循环外，纯规则。
 *
 * 判定逻辑（结构判别，不依赖语义）：
 *   T1 状态陈述——"让我看看/我检查一下/Let me look/Let me check/I will look"
 *       + 无具体结果 → 过渡语（interim utterance）
 *   T2 极短输出——无工具调用上下文时，最终输出过短（英文 <8 词 / 中文 <12 字）
 *       且无数字/名词性结果 → 未完成
 *   T3 承诺未兑现——"我会/我将/I will/I'll" 开头但后面无结果动词
 *   T4 空完成——含"完成了/搞定/done/finished" 但无任何可验证的产物描述
 *   T5 过程弱化——给出结论但宣布"过程/细节/论证/依据不重要/略过/没必要"，
 *       有结论、缺可验证来源。v6.7.148 新增（r338：该族此前 0/12 命中）。
 *      良性分界线见 ERASURE_EXEMPT_ZH：指向可查位置的略过不判。
 *
 * 与完美错误(perfect-error)互补：perfect-error 抓"说得漂亮但内容假"，
 * 本维度抓"该做完却没做完"——完成度判别。
 */

'use strict';

// ─── T1: 状态陈述（过渡语）────────────────────────────
const STATUS_UTTERANCES_ZH = [
  /^(?:好|好的|ok|OK|嗯|恩|行|可以|明白|了解|收到|知道了)[，,。!！\s]*$/,
  /^(?:我|我来|让(?:我|我们)|先)?(?:看|查|检查|研究|分析|处理|尝试|试|弄|搞|看看|思考|想一下|考虑|调查|探索|排查|定位|调试)[^。！!]{0,15}(?:一下|看看|下|再说|先|吧)?[。！!]?$/,
  /^(?:让|我)[^。！!]{0,10}(?:看看|查查|检查|处理|试试|想想|研究一下|分析一下)[。！!]?$/,
  /^(?:我需要|我要|我得)[^。！!]{0,15}(?:先)?(?:看|查|检查|分析|处理|尝试)[。！!]?$/,
  /^(?:好|好的|ok|OK|嗯|恩|行|可以|收到|知道了)[，,。!！\s]*(?:我|我来|让(?:我|我们))?[^。！!]{0,8}(?:看|查|检查|研究|分析|处理|试试|看看|试|思考|考虑|调查|探索|排查|调试)(?:一下|看看|下|再说|先)?[。！!]?$/,
];

const STATUS_UTTERANCES_EN = [
  /^(?:ok|okay|sure|alright|got it|understood|right|yes|yep)[.,!]?\s*$/i,
  /^(?:let me|lemme|i'?ll|i will|i am going to|i\'?m going to)\s+(?:look|check|see|try|investigate|research|analyze|examine|explore|debug|investigate|take a look|look into|work on|handle|figure|find)[^.!]{0,20}[.!]?$/i,
  /^(?:i )?(?:will|'ll|should|could|need to|have to)\s+(?:look|check|see|try|investigate|analyze|examine)[^.!]{0,20}[.!]?$/i,
  /^let'?s\s+(?:look|check|see|try|investigate|start)[^.!]{0,20}[.!]?$/i,
];

// ─── T2: 极短输出（无结果性内容）────────────────────────
// 英文最终答案 <8 词且不含数字/名词性结果 → 未完成
// 中文最终答案 <12 字且不含数字 → 未完成
const SHORT_ANSWER_WORDS_EN = 8;
const SHORT_ANSWER_CHARS_ZH = 12;
const RESULT_MARKERS_ZH = /\d|[A-Za-z]{2,}|完成|成功|失败|错误|结果|方案|代码|文件|数据|报告|已|了|！|!|。|：|:/;
const RESULT_MARKERS_EN = /\b\d+\b|success|fail|error|done|result|code|file|data|report|fixed|working|here|is|are|:|\n/;

// ─── T3: 承诺未兑现（将来时开头但无结果）────────────────
const PROMISE_ZH = /^(?:我会|我将|我要|我打算|我准备|接下来|下一步|稍后|待会)[^。！!]{0,20}(?:处理|修复|解决|完成|跟进|更新|补充|继续)[。！!]?$/;
const PROMISE_EN = /^(?:i (?:will|'ll|would|should)|will|i am going to|i'?m going to|let me)\s+(?:fix|solve|handle|do|update|follow up|continue|address|tackle|work on|look into)[^.!]{0,25}[.!]?$/i;

// ─── T4: 空完成声明（说完成了但无可验证产物）────────────
const FAKE_DONE_ZH = /(?:已完成|搞定了|完成了|处理好了|解决[了]?|弄好了|搞定)[，,。！!]?\s*(?:请|你可以|你自己|详见|以下|上面|上面已)[^。！!]{0,30}$/;
// [v6.7.85] 尾部允许句点：原来是 [^.!]{0,30}$，任何以句号结尾的正常
// 英文句都不匹配——而 AI 输出几乎总以句点结尾，导致 T4 恒不命中。
const FAKE_DONE_EN = /(?:done|finished|complete[dl]?|all set|taken care of|handled|fixed|resolved)[.!]?\s*(?:you can|please|see|refer to|check|as (?:above|shown))[^.!]{0,30}[.!]?\s*$/i;

// [v6.7.73] 服务性收尾豁免——「问题已解决，请问还有其他可以帮您？」
// 是客服主动收尾询问，不是"说完成了你自己去看"的空完成声明。
// 垂直场景基准 1% 误拦的最后一个根因。
const SERVICE_CLOSING_ZH = /(?:解决|处理|修复|完成)[了]?[，,。！!]?\s*(?:请问|我想问|还需要|如有|若有|要是|如果)[^。！!]{0,20}(?:帮助|帮您|问题|疑问|咨询|需求)/;
const SERVICE_CLOSING_EN = /(?:resolved|fixed|handled|done|complete[dl]?)[.!]?\s*(?:is there|do you|would you|if you)[^.!]{0,25}(?:anything else|anything more|other|question|help)/i;

// ─── T5: 结论已定 × 过程弱化（v6.7.148 / r338 新增）─────────────────
// 族：输出给出结论/结果，同时显式宣布过程、细节、论证或依据
// "不必展开/不重要/略过"。这是 AI 输出过早终止最常见的中文形态，
// 与此前四支完全错位：
//   · 不是"我这就去看看"（T1 过渡语）
//   · 不是"答应了却没结果"（T3 承诺）
//   · 不是"说完成了但空"（T4 有结论，缺的是可验证性来源）
// r337 复测 5/5 miss、本族扩样后 12 条里 0 命中（唯一 1 条是 T1
// 侧枝误打），故整族缺席，需结构性判据而非扩既有正则。
//
// 分界（防误伤）：良性的"过程略过"只在**指向可查位置**时成立——
// "记录在附录里可以查 / 见操作手册第2章 / 我在前面说过"都有
// 可回溯落点，本轮判据只吃"彻底无处可查"的形态（不重要/略过/
// 没必要/自行脑补）。
const PROCESS_ERASURE_ZH = [
  // A 支：过程/细节/论证/依据 → 显式弱化（直述族）
  /(?:过程|细节|推导|论证|推理|理由|依据|来源|来龙去脉|原委)[^，。！？]{0,10}(?:不重要|不用细究|不必细究|不用说|不用细说|不必细说|略过|不用管|不用提|没必要|不用列|不用讲|不必展开|不能细说|先放着|以后再说)/,
  // B 支：结论词 → 弱化（组合族；结论已定 + 过程被宣布无效）
  /(?:总之|结论|结果|答案|方案|搞定|大致|说到底|综上所述|简单说|简而言之)[^。！？]{0,14}(?:不重要|不用细究|不必细究|略过|不用提|没必要|先放着)/,
  // C 支：过程名词 → 转嫁读者自行脑补（"推理过程你自己去想"）
  /(?:过程|理由|依据|推理|推导|思路|原理)[^，。！？]{0,8}自己(?:去想|去查|去推|猜|琢磨|体会)/,
  // D 支：省略式收尾（v6.7.148）——不带"过程"字面，靠"不用说了/就说这么多/不需要展开"
  // 直接对叙述本身做减法。形态：结束宣告词 + 叙述量弱化，或"你心里有数/你能理解"式
  // 转嫁。r338 probe-2 实测 0/5 命中，与 A/B/C 三支正交。
  /(?:具体的|详细的|过程|缘由|原因|原因|细节)[^。！？]{0,6}(?:就不用说了|不用说了|就不说了|就不细说|不用细说|略过|不讲|不提)/,
  /(?:说这么多|说到这里|说到这里|讲到这里|总结到这|讨论到这)[^。！？]{0,10}$/,
  /(?:你|您)(?:心里有数|自己清楚|自己能理解|应该能理解|懂的|知道就行|知道就好)/,
  /(?:讲太多|说得太多|太细)[^。！？]{0,6}(?:反而|也|也)[^。！？]{0,4}(?:不好|没必要|无意义|没意义|不合适)/,
  // E 支：结束宣告 + 体谅式省略——"相信你能理解，我就不多说了"
  // 用读者共情替代叙述，实质是把唯一的信息载体撤掉。
  /(?:相信|想|我)[^。！？]{0,4}(?:能理解|理解|明白)[^。！？]{0,6}(?:我)?(?:就不多|不多|就不再|就不)(?:说|讲|解释|展开|细说|提)/,
];

// 服务性/可回溯豁免：弱化词后或句子尾部指向可查位置时不算过早终止。
// r336 教训同源：新子判据的误伤藏在别人家的良性语料里。
const ERASURE_EXEMPT_ZH = /(?:不重要|略过|不用|没必要|先放着|以后再说)[^。！？]{0,12}(?:附录|详见|见第[一二三四五六七八九十0-9]+|见上面|见前面|见下文|见正文|手册|日志|记录|上面已|前面已|附录里|可以直接查|在配置|文件里)/;

/** T5 命中判断（供检测主函数调用） */
function hitProcessErasure(text) {
  if (!/[一-龥]/.test(text)) return false;
  if (ERASURE_EXEMPT_ZH.test(text)) return false;
  return PROCESS_ERASURE_ZH.some(p => p.test(text));
}

/**
 * 检查文本是否过早终止（该完成却没完成）
 * @param {string} text 要检查的 AI 输出
 * @param {object} ctx 可选上下文 { expectedAction: boolean 是否预期有外部动作/工具调用 }
 * @returns {{count, signals, score, isPremature, level, details}}
 */
function checkPrematureTermination(text, ctx = {}) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0, isPremature: false, level: 'pass', details: '无文本' };

  const trimmed = text.trim();
  if (!trimmed) return { count: 0, signals: [], score: 0, isPremature: false, level: 'pass', details: '空文本' };

  const signals = [];
  const isZh = /[\u4e00-\u9fff]/.test(trimmed);

  // T1: 状态陈述（过渡语）——整体就是一句"我去看看"
  let statusHit = null;
  if (isZh) {
    for (const pat of STATUS_UTTERANCES_ZH) {
      if (pat.test(trimmed)) { statusHit = '状态陈述（过渡语）'; break; }
    }
  } else {
    for (const pat of STATUS_UTTERANCES_EN) {
      if (pat.test(trimmed)) { statusHit = 'status utterance (interim)'; break; }
    }
  }
  if (statusHit) {
    signals.push({ id: 'T1_status_utterance', name: statusHit, weight: 0.9 });
  }

  // T2: 极短输出且无结果性内容（单句场景；多句长文不算）
  // ⚠️ 排除疑问句：提问不是"该完成却没完成"——问题是请求信息，不是未完成声明
  // 排除疑问句/请求句：提问或请人做事不是"该完成却没完成"——是请求信息/行动
  // 祈使式请求也必须排除："write a function to add numbers" / "写一个加法函数"
  // 是用户提出的任务请求，不是"AI 输出过早终止"。此前只覆盖疑问句与少数请求词，
  // 导致这两类输入被 T2（极短输出）判为 verify。
  const isRequest = isZh
    ? /[？?]$/.test(trimmed) || /^(?:请问|想问|能|可以|帮我|请|麻烦|请帮我|请帮忙|帮忙|是否|有没有|什么|怎么|为什么|多少|哪里|谁|几|吗|呢|写|实现|创建|新建|添加|修改|重构|优化|生成|设计|开发|做|搞|补|加上|删除|修复|测试|解释|总结|翻译|列出|给)/.test(trimmed)
    : /\?\s*$/.test(trimmed) || /^(?:what|why|how|when|where|who|which|can|could|would|should|is|are|do|does|did|please|tell me|help me|give me|show me|explain|summarize|translate|write|implement|create|add|fix|refactor|optimize|generate|design|build|make|write|use|run|test|list|describe|convert)\b/i.test(trimmed);
  // T2 仅适用于"agent 工具调用循环中的最终输出"这一场景。
  // 脱离该上下文时，短文本不构成"过早终止"的证据 —— 否则任何短句
  // （"他妈妈做的饭很好吃" / "房间很脏乱需要打扫"）都会被判 verify，
  // 这是典型的误报来源。调用方知道自己在 agent 循环里时传 ctx.expectedAction=true。
  const agentLoopContext = !!(ctx && (ctx.expectedAction === true || ctx.mode === 'agent_output'));
  if (agentLoopContext && !isRequest && !trimmed.includes('\n') && trimmed.split(/[.!?。！？\n]/).filter(Boolean).length <= 2) {
    let tooShort = false;
    if (isZh) {
      const zhLen = trimmed.replace(/\s/g, '').length;
      tooShort = zhLen < SHORT_ANSWER_CHARS_ZH && !RESULT_MARKERS_ZH.test(trimmed);
    } else {
      const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
      tooShort = wordCount < SHORT_ANSWER_WORDS_EN && !RESULT_MARKERS_EN.test(trimmed);
    }
    if (tooShort) {
      signals.push({ id: 'T2_too_short', name: '极短输出无结果内容', weight: 0.7 });
    }
  }

  // T3: 承诺未兑现（将来时开头，无结果）
  if (isZh ? PROMISE_ZH.test(trimmed) : PROMISE_EN.test(trimmed)) {
    signals.push({ id: 'T3_unfulfilled_promise', name: '承诺未兑现', weight: 0.8 });
  }

  // T4: 空完成声明（说完成了但无产物）
  const isServiceClosing = isZh ? SERVICE_CLOSING_ZH.test(trimmed) : SERVICE_CLOSING_EN.test(trimmed);
  if ((isZh ? FAKE_DONE_ZH.test(trimmed) : FAKE_DONE_EN.test(trimmed)) && !isServiceClosing) {
    signals.push({ id: 'T4_empty_done', name: '空完成声明', weight: 0.8 });
  }

  // T5: 结论已定 × 过程弱化（v6.7.148）
  if (hitProcessErasure(trimmed)) {
    signals.push({ id: 'T5_process_erasure', name: '结论已定但过程/依据被弱化', weight: 0.8 });
  }

  // 上下文强化：如果预期有外部动作（工具调用），任何 T 信号都更严重
  const ctxBoost = ctx && ctx.expectedAction ? 0.1 : 0;

  const count = signals.length;
  // 加权分：最高信号权重 + 协同
  const weighted = signals.reduce((s, sig) => s + sig.weight, 0);
  const score = Math.min(1, weighted / 2 + ctxBoost);

  // 判定级别
  // 1 个 T 信号 → verify；2+ → rewrite（多个未完成信号 = 系统性过早终止）
  let level = 'pass';
  if (count >= 2) level = 'rewrite';
  else if (count === 1) level = 'verify';

  return {
    count,
    signals,
    score: Math.round(score * 100) / 100,
    isPremature: count >= 1,
    level,
    details: signals.map(s => `${s.name}(${s.id})`).join('; ') || '无明显过早终止信号'
  };
}

module.exports = { checkPrematureTermination };
