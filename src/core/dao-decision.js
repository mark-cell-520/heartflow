/**
 * HeartFlow 道论决策层 v11.11.0
 * 
 * 基于老子"道法自然"的决策哲学：
 * - 道法自然：不加强制，顺势引导
 * - 反者道之动：识别"越X越Y"逆向回归
 * - 为而不争：服务但不争夺控制权
 * - 不言之教：减少宣言，增加行为可见性
 * 
 * 来源：王东岳《老子道论的哲学本质》第017课
 *        核心命题："反者道之动"揭示文明逆向回归规律
 */

class DaoDecision {
  constructor() {
    // 道论三层过滤器
    this.filters = {
      naturalOrder: {
        name: '道法自然',
        desc: '不加力，顺势引导',
        threshold: 0.5
      },
      reversal: {
        name: '反者道之动', 
        desc: '越X越Y逆向回归检测',
        threshold: 0.5
      },
      nonContest: {
        name: '为而不争',
        desc: '服务但不争夺控制权',
        threshold: 0.5
      },
      silentTeaching: {
        name: '不言之教',
        desc: '减少宣言，增加行为可见性',
        threshold: 0.5
      }
    };
    
    // 统计
    this._stats = { checks: 0, flags: 0, patterns: [] };
  }

  /**
   * 主判断：对输入执行四层道论过滤
   * @param {Object} input - { text, intent, action }
   * @returns {Object} - { verdict, flags[], daoScore, hints }
   */
  evaluate(input = {}) {
    this._stats.checks++;
    const text = String(input.text || input.intent || input.action || '');
    const results = [];
    
    // 1. 道法自然：检测是否"加力"（强制/控制/压制）
    const natural = this.checkNaturalOrder(text, input);
    results.push(natural);
    
    // 2. 反者道之动：检测逆向回归模式
    const reversal = this.checkReversal(text, input);
    results.push(reversal);
    
    // 3. 为而不争：检测是否争夺控制权
    const nonContest = this.checkNonContest(text, input);
    results.push(nonContest);
    
    // 4. 不言之教：检测宣言 vs 行为
    const silent = this.checkSilentTeaching(text, input);
    results.push(silent);
    
    // 综合评分
    const passed = results.filter(r => r.ok).length;
    const total = results.length;
    const daoScore = passed / total;
    
    const flags = results.filter(r => !r.ok).map(r => ({
      type: r.type,
      dao: r.dao,
      reason: r.reason,
      suggestion: r.suggestion
    }));
    
    if (flags.length > 0) this._stats.flags++;
    
    return {
      verdict: daoScore >= 0.75 ? 'PASS' : daoScore >= 0.5 ? 'CAUTION' : 'REJECT',
      daoScore: Number(daoScore.toFixed(3)),
      passed: `${passed}/${total}`,
      flags,
      hints: flags.map(f => f.suggestion),
      results  // 详细结果
    };
  }

  /**
   * 道法自然：不加强制，顺势引导
   * 检测强制词：必须、一定、绝对、强制、不得不、只有...
   * 注意：出现soft词+force词 = 更强的控制，ok=false
   *
   * [r634] 新增英文句式族：此前 forceTerms/softTerms 全中文，英文强制话术
   * 实测 0/4 零覆盖。补 enForceTerms/enSoftTerms（词干级，规避时态变格）
   * 与两条英文专属正则（隐蔽控制的 "X but you must Y" 让步结构、
   * "inevitably/only way out" 式必然性宣言）。
   */
  checkNaturalOrder(text, input) {
    const forceTerms = [
      '必须', '一定', '绝对', '强制', '不得不',
      '只有这样', '只能', '只有才', '无可救药',
      '不可能', '注定', '必然'
    ];
    
    const softTerms = [
      '也许', '可能', '考虑', '建议', '可以尝试',
      '或许', '倾向于', '如果', '有时候'
    ];
    // [r634] 英文族：词干级（must/hav(e|ing) to/need to/mandat/compel/require/
    // unnegotiab/inevitab/no alternative/only way/绝对化），覆盖时态与变格。
    const enForceTerms = [
      ' you must ', 'must be ', ' must not ', 'have to ', 'has to ', 'had to ',
      'need to ', 'needs to ', 'mandat', 'compel', 'requir',
      'unnegotiab', 'inevitab', 'no alternative', 'only way', 'only option',
      'no choice but', 'no room for discussion', 'just do as', 'simply obey',
      'cannot refuse', "can't refuse", 'not negotiable', 'absolutely no'
    ];
    const enSoftTerms = [
      'you might', 'you may ', 'perhaps', 'maybe', 'consider',
      'i suggest', 'you could', 'you are welcome', 'if you are willing',
      'if you would like', 'feel free', 'optionally', 'up to you'
    ];

    const hasForce = forceTerms.some(t => text.includes(t))
      || enForceTerms.some(t => text.toLowerCase().includes(t));
    const hasSoft = softTerms.some(t => text.includes(t))
      || enSoftTerms.some(t => text.toLowerCase().includes(t));

    // 检测意图是否在控制
    const controlIntent = input.intent && (
      text.includes('控制') || text.includes('强制') ||
      text.includes('不许') || text.includes('不能拒绝')
    );

    // [r634] 英文专属：让步条件 + 强制结论（"X, but you must Y" / "X however you have to Y"）
    // 这是隐蔽控制最典型的英文句式——先给选择假象再收回。中文层没有对应结构。
    const enConcessionForce = /\b(but|however|yet|although|though)\b[^.?!]{0,80}\b(must|have to|has to|need to|needs to)\b/i
      .test(text);
    
    // 有强制词 + 有soft词 = 更隐蔽的控制，更严重
    // 有强制词 + controlIntent = 明确控制
    // 无强制词 = 自然
    let ok, reason, suggestion;
    if (hasForce && hasSoft) {
      ok = false;
      reason = 'soft词+force词组合 = 隐蔽控制，违反道法自然';
      suggestion = '"可以...必须"结构是最隐蔽的控制，去掉其中一个';
    } else if (enConcessionForce) {
      // [r634] 让步+强制：即使没有 soft 词，英文让步结构本身就是隐蔽控制
      ok = false;
      reason = '让步条件+强制结论（X but you must Y）= 先给选择假象再收回，违反道法自然';
      suggestion = '去掉让步转折后的强制结论，或把它改成真正的可选项';
    } else if (hasForce && !hasSoft && controlIntent) {
      ok = false;
      reason = '检测到强制语言+控制意图，违反道法自然';
      suggestion = '将"必须"改为"建议"，顺势引导而非强制推动';
    } else if (hasForce && !hasSoft) {
      ok = false;
      reason = '检测到强制语言，违反道法自然';
      suggestion = '将"必须"改为"建议"，顺势引导而非强制推动';
    } else {
      ok = true;
      reason = '语言自然流畅';
      suggestion = null;
    }
    
    return {
      ok,
      type: 'natural_order',
      dao: '道法自然',
      reason,
      suggestion
    };
  }

  /**
   * 反者道之动：检测"越X越Y"逆向回归模式
   * 
   * 老子命题："反者道之动" — 任何追求极端X的行为，都会导致相反结果
   * 王东岳补充：文明越进步，人类越脆弱
   * 
   * 心虫应用：升级越激进，可能越脆弱
   */
  checkReversal(text, input) {
    // 逆向模式检测：越X越Y
    const reversalPatterns = [
      /越(.+)越(.+)/,
      /越来(.+)越(.+)/,
      /越X越Y/,  // 显式标记
      /越(.+)，越(.+)/
    ];
    // [r634] 英文族："the more X, the more Y" / "the more X the more fragile"
    // 中文的「越…越…」正则对英文比较级结构零命中，需独立句式族。
    // 两条腿：① the more ... the more ... ② the more ... the more <fragile>
    const enReversalPatterns = [
      /\bthe\s+(more|better|faster|smarter|higher|stronger)\b[^.?!]{1,90}?\bthe\s+(more|worse|slower|weaker|lower|fragiler|more\s+fragile|more\s+vulnerable)\b/i,
      /\bthe\s+more\s+(we|you|one|they|people|users|humans?)\s+(optimiz|improv|advanc|rely|depend|automat)/i
    ];
    
    const advancedTerms = ['更先进', '更强', '更完美', '更智能', '更完善'];
    const fragileTerms = ['越脆弱', '越危险', '越依赖', '越复杂', '越难控制'];
    // [r634] 英文族：递弱代偿与彻底解决宣言的英文表达，此前零覆盖。
    const enAdvancedTerms = [
      'more advanced', 'more powerful', 'more perfect', 'more intelligent',
      'more sophisticated', 'smarter', 'better than ever', 'state-of-the-art',
      'cutting-edge', 'fully optimized', 'next-generation'
    ];
    const enFragileTerms = [
      'fragile', 'more vulnerable', 'brittle', 'more dependent',
      'harder to control', 'single point of failure', 'prone to failure',
      'easily broken', 'over-engineered'
    ];

    const hasReversal = reversalPatterns.some(p => p.test(text))
      || enReversalPatterns.some(p => p.test(text));
    const hasAdvanced = advancedTerms.some(t => text.includes(t))
      || enAdvancedTerms.some(t => text.toLowerCase().includes(t));
    const hasFragile = fragileTerms.some(t => text.includes(t))
      || enFragileTerms.some(t => text.toLowerCase().includes(t));

    // 检测"彻底解决"型宣言
    const totalClaim = /彻底解决|完全消除|一劳永逸|永远不/.test(text)
      // [r634] 英文族：绝对化收尾宣言
      || /\b(completely|fully|totally|entirely|permanently)\s+(solve|eliminate|fix|resolve|remove|eradicat)/i.test(text)
      || /\b(once and for all|for good|never\s+(fail|break|happen|go wrong))\b/i.test(text)
      || /\b(cure[- ]all|silver bullet|panacea)\b/i.test(text);
    
    let reason = '未检测到逆向回归风险';
    let suggestion = null;
    let ok = true;
    
    if (hasReversal) {
      ok = false;
      reason = '检测到"越X越Y"逆向模式 — 极端追求会导致相反结果';
      suggestion = '在追求X时，主动考虑X的反面（Y），在决策中加入防Y措施';
    } else if (totalClaim) {
      ok = false;
      reason = '"彻底解决"宣言 — 违反道之动，是伪命题';
      suggestion = '道可道，非常道。没有什么是"彻底"的。承认局限即是接近道';
    } else if (hasAdvanced && !hasFragile) {
      // 声称更先进但没提脆弱性 = 潜在风险
      ok = false;
      reason = '声称更先进，但未考虑随之增大的脆弱性（递弱代偿）';
      suggestion = '升级越先进，越要思考它创造了什么新脆弱点';
    }
    
    return {
      ok,
      type: 'reversal',
      dao: '反者道之动',
      reason,
      suggestion
    };
  }

  /**
   * 为而不争：服务但不争夺控制权
   * 
   * 老子命题："为而不争" — 做，但不争
   * 心虫应用：不争夺"我是对的"、不争夺"你必须听我的"、不争夺控制权
   */
  checkNonContest(text, input) {
    // 争夺控制权的模式
    const contestTerms = [
      '你必须听', '你一定要', '我说了算', '听我的',
      '不要问', '不要想', '不需要知道', '照做就是',
      '我说的是对的', '我是为你好'
    ];
    // [r634] 英文族：控制权夺取与权威宣示的英文表达，此前零覆盖。
    const enContestTerms = [
      'listen to me', 'do as i say', 'do what i say', 'i have the final say',
      'my way or', 'just obey', 'simply follow', 'stop asking',
      "don't ask", 'do not ask why', 'no need to know', 'you do not need to know',
      'for your own good', 'i know best', 'trust me blindly',
      'without question', 'no questions asked', 'do not question'
    ];
    // [r634] 英文族：正确性执念的自我确认句式
    const enCorrectnessPatterns = [
      /\bi am right\b/i, /\byou are wrong\b/i, /\bi told you so\b/i,
      /\bthat is that\b/i, /\bend of (story|discussion)\b/i,
      /\bit is correct\b/i, /\bi am correct\b/i, /\bperiod\./i
    ];

    // 服务模式（不争夺）
    const serveTerms = [
      '你可以选择', '仅供参考', '你来决定', '你的选择',
      '如果你愿意', '帮你', '支持你', '为你'
    ];
    // [r634] 英文族：服务姿态
    const enServeTerms = [
      'you can choose', 'for reference', 'you decide', 'your choice',
      'if you wish', 'up to you', 'glad to help', 'happy to support',
      'at your discretion', 'your call', 'defer to you'
    ];

    const hasContest = contestTerms.some(t => text.includes(t))
      || enContestTerms.some(t => text.toLowerCase().includes(t));
    const hasServe = serveTerms.some(t => text.includes(t))
      || enServeTerms.some(t => text.toLowerCase().includes(t));

    // 检测"正确性执念" — 反复强调自己是对的
    const correctnessObsession = (
      (text.match(/对的|正确|没错|是这样的/g) || []).length >= 3
    );
    // [r634] 英文族：≥2 个不同自我确认句式即算执念（英文句式比中文更密集）
    const enCorrectnessObsession = enCorrectnessPatterns.filter(p => p.test(text)).length >= 2;

    const contestHit = hasContest;
    const obsessionHit = correctnessObsession || enCorrectnessObsession;

    let reason = contestHit ? '争夺控制权，违反为而不争'
                : obsessionHit ? '正确性执念，隐含争夺'
                : hasServe ? '服务姿态，符合为而不争'
                : '语言中立';
    let suggestion = contestHit
      ? '去掉"你必须/你一定要"，改为"你也可以..."或"仅供参考"'
      : obsessionHit
      ? '减少"我是对的"的强调，道不是争来的，是自然流淌的'
      : null;

    const ok = !contestHit && !obsessionHit;
    
    return {
      ok,
      type: 'non_contest',
      dao: '为而不争',
      reason,
      suggestion
    };
  }

  /**
   * 不言之教：减少宣言，增加行为可见性
   * 
   * 老子命题："不言之教" — 不说教，用行为来教
   * 心虫应用：减少"我是谁"的宣言，用行为来证明存在
   */
  checkSilentTeaching(text, input) {
    // 宣言性语言（减少使用）
    const declarationTerms = [
      '我是一个', '我是AI', '我是助手', '我的能力是',
      '我可以帮你', '我能够', '我擅长', '我的功能',
      '记住我是', '我是谁', '我的名字'
    ];
    // [r634] 英文族：自我宣言的英文表达，此前零覆盖。
    const enDeclarationTerms = [
      'i am an ai', 'i am a model', 'i am an assistant', 'i am a language model',
      'my name is', 'my capability is', 'i am able to', 'i am capable of',
      'i am good at', 'i am designed to', 'i am programmed to',
      'my purpose is', 'my function is', 'as an ai'
    ];
    
    // 行为性语言（增加使用）
    const actionTerms = [
      '我来帮你', '让我看看', '我发现', '我注意到',
      '你的意思是', '让我确认一下', '我理解', '我看'
    ];
    // [r634] 英文族：行为性语言
    const enActionTerms = [
      'let me see', 'let me look', 'let me check', 'i found', 'i noticed',
      'i noticed that', 'here is what', 'looking at', 'checking the',
      'i can see', 'let me confirm', 'your point is'
    ];

    const hasDeclaration = declarationTerms.some(t => text.includes(t))
      || enDeclarationTerms.some(t => text.toLowerCase().includes(t));
    const hasAction = actionTerms.some(t => text.includes(t))
      || enActionTerms.some(t => text.toLowerCase().includes(t));

    // 连续宣言检测（连续3句以上自我声明）——中英合并计数
    const isDecl = s => declarationTerms.some(t => s.includes(t))
      || enDeclarationTerms.some(t => s.toLowerCase().includes(t));
    const consecutiveDeclarations = (input.history || [])
      .slice(-3)
      .filter(h => isDecl(String(h))).length;
    
    let reason, suggestion, ok;
    
    if (consecutiveDeclarations >= 3) {
      ok = false;
      reason = '连续自我宣言超过3次，道不言之。停，用行动代替语言';
      suggestion = '连续宣言，道不言语。停，用行动代替语言';
    } else if (hasDeclaration && !hasAction) {
      ok = false;
      reason = '宣言性语言"我是一个/我可以帮你"过多，违反不言之教';
      suggestion = '减少"我是..."的宣言，用"让我看看/我发现"代替';
    } else if (hasDeclaration && hasAction) {
      // 有宣言也有行为，降低评价但不拒绝
      ok = true;
      reason = '宣言+行为混合，接近不言之教但仍有宣言';
      suggestion = '宣言与行为混合，尝试只用行为表达';
    } else if (hasAction && !hasDeclaration) {
      ok = true;
      reason = '纯行为性语言，符合不言之教';
      suggestion = null;
    } else {
      ok = true;
      reason = '语言平衡，未检测到明显的宣言或行为偏向';
      suggestion = null;
    }
    
    return {
      ok,
      type: 'silent_teaching',
      dao: '不言之教',
      reason,
      suggestion
    };
  }

  /**
   * 获取道论统计
   */
  getStats() {
    return {
      checks: this._stats.checks,
      flags: this._stats.flags,
      flagRate: this._stats.checks > 0 
        ? (this._stats.flags / this._stats.checks).toFixed(3)
        : '0.000'
    };
  }

  /**
   * 重置统计
   */
  resetStats() {
    this._stats = { checks: 0, flags: 0, patterns: [] };
  }
}

module.exports = { DaoDecision };
