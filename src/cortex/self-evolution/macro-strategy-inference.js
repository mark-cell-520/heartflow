/**
 * Macro Strategy Inference Engine
 * 基于新闻信号做战略推演：机会 / 风险 / 时间线 / 对 HeartFlow 的影响
 * 规则驱动 + 诚实低置信：无信号时返回 null，不编造结论。
 */
class MacroStrategyInference {
  constructor({ projectRoot, signalStore } = {}) {
    this.projectRoot = projectRoot || process.cwd();
    this.signalStore = signalStore || [];
  }

  /**
   * 主入口：接收文本，返回结构化推演。
   * 约定输入：新闻摘要 / 多条信号拼接文本。
   */
  infer(text) {
    if (!text || typeof text !== 'string') {
      return this._empty('empty_input');
    }
    const trimmed = text.trim();
    // [v6.8.0 cronfix15] 40 → 10：原门槛过高，实测 3 条 20-40 字的常规推演问句
    // （"分析当前世界格局的根本走向，中美博弈会如何演化"）
    // 全部被判 input_too_short，用户端表现为"心虫对宏观输入恒定低分"。
    // 真正的过滤由信号抽取负责（抽不到就 insufficient_information），
    // 不该用一个武断长度把正常问句挡在门外。
    if (trimmed.length < 10) {
      return this._empty('input_too_short');
    }

    const signals = this._extractSignals(trimmed);
    if (!signals.length) {
      return this._empty('no_structured_signals');
    }

    const opportunities = this._matchOpportunities(signals);
    const risks = this._matchRisks(signals);
    const horizon = this._inferHorizon(signals);
    const heartflowImpact = this._heartflowImpact(signals);

    const confidence = this._confidence(signals, opportunities, risks);
    const conclusion = this._conclude(opportunities, risks, horizon);

    return {
      taskType: 'macro_strategy_inference',
      confidence,
      conclusion,
      reasoning: this._buildReasoning(signals, opportunities, risks, horizon, heartflowImpact),
      opportunities,
      risks,
      horizon,
      heartflowImpact,
      signalCount: signals.length,
      signals,
    };
  }

  _empty(reason) {
    return {
      taskType: 'macro_strategy_inference',
      confidence: 0,
      conclusion: null,
      reasoning: `inference declined: ${reason}`,
      opportunities: [],
      risks: [],
      horizon: null,
      heartflowImpact: [],
      signalCount: 0,
      signals: [],
    };
  }

  /**
   * 从文本中抽取结构化信号：实体 + 趋势 + 时间锚点。
   * 不依赖 LLM，用正则 + 词典。
   */
  _extractSignals(text) {
    const signals = [];
    const lower = text.toLowerCase();

    // 实体 / 公司
    const entities = [
      { name: '小米', aliases: ['小米', 'xiaomi', '玄戒'] },
      { name: '阿里巴巴', aliases: ['阿里', 'alibaba', '淘宝', '天猫'] },
      { name: '英伟达', aliases: ['英伟达', 'nvidia', 'nvda'] },
      { name: '三星', aliases: ['三星', 'samsung'] },
      { name: '宇树科技', aliases: ['宇树', 'unitree'] },
      { name: '中诚华隆', aliases: ['中诚华隆', 'hl200'] },
      { name: '华为', aliases: ['华为', 'huawei'] },
      { name: '苹果', aliases: ['苹果', 'apple'] },
      { name: '特斯拉', aliases: ['特斯拉', 'tesla'] },
      { name: 'OpenAI', aliases: ['openai'] },
      { name: 'DeepSeek', aliases: ['deepseek', '深度求索'] },
      { name: 'Meta', aliases: ['meta', 'facebook'] },
      // [v6.8.0 cronfix15] 补地缘行为体：原词典清一色科技公司，
      // 导致「中美博弈」「中东局势」这类真宏观输入一个信号都抽不到。
      { name: '美国', aliases: ['美国', '美方', '华盛顿', '白宫', 'us ', 'u.s.', 'usa', 'america', '中美', '美欧', '美日'] },
      { name: '中国', aliases: ['中国', '中方', '北京', 'china', 'prc', '我国', '国内'] },
      { name: '俄罗斯', aliases: ['俄罗斯', '俄方', '莫斯科', 'russia'] },
      { name: '欧盟', aliases: ['欧盟', '欧洲', 'eu', 'europe'] },
      { name: '日本', aliases: ['日本', '日方', '东京', 'japan'] },
      { name: '印度', aliases: ['印度', '新德里', 'india'] },
      { name: '中东', aliases: ['中东', '以色列', '伊朗', '沙特', '加沙', '哈马斯', '黎巴嫩', '叙利亚', '也门'] },
      { name: '朝鲜半岛', aliases: ['朝鲜', '韩国', '平壤', '首尔', 'korea'] },
      { name: '台湾', aliases: ['台湾', '台海', 'taiwan'] },
      { name: '乌克兰', aliases: ['乌克兰', '基辅', 'ukraine'] },
      { name: '美联储', aliases: ['美联储', 'fed', 'fomc'] },
      { name: '石油输出国组织', aliases: ['欧佩克', 'opec'] },
    ];
    for (const e of entities) {
      for (const a of e.aliases) {
        if (lower.includes(a.toLowerCase())) {
          signals.push({ type: 'entity', name: e.name, matched: a });
          break;
        }
      }
    }

    // 趋势 / 方向词
    const trends = [
      { label: '端侧AI', patterns: ['端侧', '本地部署', '端侧大模型', 'on-device', 'edge ai'] },
      { label: '算力基建', patterns: ['万卡', '集群', '算力', '推理芯片', 'gpu集群'] },
      { label: '具身智能', patterns: ['机器人', '人形机器人', '具身', '自动驾驶', '智驾'] },
      { label: 'AI监管', patterns: ['监管', '合规', '审计', '立法', '政策'] },
      { label: '地缘风险', patterns: ['制裁', '关税', '霍尔木兹海峡', '供应链', '脱钩'] },
      { label: '资本开支', patterns: ['配股', '财报', '投资', 'ipo', '市值', '回购'] },
      { label: '消费Agent', patterns: ['电商', '交易', '比价', '下单', '售后', '客服'] },
      { label: '开源模型', patterns: ['开源', 'llama', 'qwen', 'deepseek', 'mistral'] },
      // [v6.8.0 cronfix15] 补宏观事件类别：原词典只有 8 类科技趋势，
      // 「降息」「通胀」「选举」「战争」这类真宏观驱动因子抽不到。
      { label: '货币政策', patterns: ['降息', '加息', '利率', '基准利率', '量化宽松', 'qe', '缩表', '流动性', '央行'] },
      { label: '通胀与物价', patterns: ['通胀', '通货膨胀', 'cpi', 'ppi', '物价', '滞胀'] },
      { label: '汇率与资本流动', patterns: ['汇率', '人民币汇率', '美元指数', '资本外流', '外资', '北向资金', '热钱', '外储'] },
      { label: '贸易与关税', patterns: ['关税', '贸易战', '出口管制', '制裁', '反倾销', '配额'] },
      { label: '选举与政治周期', patterns: ['选举', '大选', '总统', '议会', '组阁', '弹劾', '政权更迭', '中期选举'] },
      { label: '军事冲突', patterns: ['战争', '冲突', '军事', '空袭', '导弹', '军演', '停火', '入侵', '动员'] },
      { label: '能源与大宗', patterns: ['原油', '油价', '天然气', '煤炭', '稀土', '大宗商品', '黄金', '锂'] },
      { label: '供应链重组', patterns: ['供应链', '产能转移', '友岸外包', '近岸', '去全球化', '芯片法案'] },
      { label: '粮食与人口', patterns: ['粮食', '粮食安全', '人口', '老龄化', '生育率', '移民'] },
      { label: '科技管制', patterns: ['芯片管制', '实体清单', '出口禁令', '技术封锁', '断供', '禁运'] },
      // [v6.8.0 cronfix15] 补"格局/秩序"类纯宏观词：这类词不指任何具体事件，
      // 但整段推演围绕它展开（"世界格局如何演化""全球秩序重构"）。
      { label: '格局与秩序', patterns: ['世界格局', '国际格局', '全球格局', '全球秩序', '国际秩序', '秩序重构', '多极化', '单极化', '阵营', '新冷战', '脱钩', '逆全球化'] },
    ];
    for (const t of trends) {
      if (t.patterns.some(p => lower.includes(p.toLowerCase()))) {
        signals.push({ type: 'trend', label: t.label });
      }
    }

    // 时间锚点
    const timePatterns = [
      { label: '近期', patterns: ['今日', '今天', '本周', '下周', '刚刚', '最新', '宣布'] },
      { label: '中期', patterns: ['明年', '未来半年', '2026', '2027', '预计', '计划'] },
    ];
    for (const tp of timePatterns) {
      if (tp.patterns.some(p => lower.includes(p.toLowerCase()))) {
        signals.push({ type: 'time', label: tp.label });
        break;
      }
    }

    // 去重
    const seen = new Set();
    return signals.filter(s => {
      const key = `${s.type}:${s.label || s.name || s.matched}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  _matchOpportunities(signals) {
    const opps = [];
    const types = new Set(signals.map(s => s.type === 'entity' ? s.name : s.label));

    if (types.has('端侧AI') || types.has('小米')) opps.push({ label: '端侧Agent推理成本下压', driver: '芯片专用化让本地大模型推理延迟<100ms', horizon: '0-6个月' });
    if (types.has('具身智能') || types.has('宇树科技')) opps.push({ label: '具身智能场景验证期', driver: '从发布会指标转向工厂/物流重复场景订单', horizon: '3-12个月' });
    if (types.has('算力基建')) opps.push({ label: '国产算力套餐化', driver: '万卡集群变成基础入口，单卡算力不再稀缺', horizon: '0-6个月' });
    if (types.has('消费Agent') || types.has('阿里巴巴')) opps.push({ label: '交易型Agent入口之争', driver: '比价/下单/售后型Agent比聊天框更易商业化', horizon: '0-6个月' });
    if (types.has('地缘风险')) opps.push({ label: '国产替代叙事强化', driver: '供应链脆弱性推动国产芯片/模型采购意愿', horizon: '6-12个月' });
    if (types.has('AI监管') || types.has('合规')) opps.push({ label: 'Agent合规审计刚需', driver: '金融/电商/制造Agent落地前必须过判别审计', horizon: '0-3个月' });
    if (types.has('资本开支')) opps.push({ label: 'Infra筛选期整合', driver: '资本从盲目扩张转向挑着投，推理层优先', horizon: '3-6个月' });
    if (types.has('开源模型')) opps.push({ label: '开源模型生态红利', driver: '低成本基座模型降低Agent开发门槛', horizon: '0-6个月' });
    // [v6.8.0 cronfix15] 补宏观类别的机会匹配：上面 8 条规则只覆盖科技趋势，
    // 新增的货币政策/通胀/汇率/选举/军事/能源/供应链/粮食/科技管制若不补规则，
    // 信号抽到了但 _matchOpportunities 空转，conclusion 仍是空。
    if (types.has('货币政策')) opps.push({ label: '流动性预期重定价', driver: '利率路径变化先反映在贴现率与风险资产定价', horizon: '0-3个月' });
    if (types.has('通胀与物价')) opps.push({ label: '抗通胀资产与成本转嫁能力重估', driver: '谁有定价权谁在滞胀里占优', horizon: '3-9个月' });
    if (types.has('汇率与资本流动')) opps.push({ label: '跨境资本再配置', driver: '利差与避险驱动资金在区域间搬家', horizon: '0-6个月' });
    if (types.has('贸易与关税')) opps.push({ label: '非关税壁垒下的替代路径', driver: '转口/本地化/第三国产能获得溢价', horizon: '6-18个月' });
    if (types.has('选举与政治周期')) opps.push({ label: '政策不确定性窗口', driver: '政权过渡期旧承诺可推翻，新承诺未验证', horizon: '3-12个月' });
    if (types.has('军事冲突')) opps.push({ label: '防务与军工需求刚性', driver: '冲突推高军费与战略储备采购', horizon: '0-12个月' });
    if (types.has('能源与大宗')) opps.push({ label: '资源端议价权上升', driver: '供给脆弱性让上游掌握定价主动权', horizon: '0-9个月' });
    if (types.has('供应链重组')) opps.push({ label: '冗余产能与备份路线价值化', driver: '效率优先转向韧性优先，愿意为备份付溢价', horizon: '6-24个月' });
    if (types.has('粮食与人口')) opps.push({ label: '必需品长期紧缺定价', driver: '人口结构决定粮食/能源的无弹性需求', horizon: '12个月以上' });
    if (types.has('科技管制')) opps.push({ label: '管制清单外的替代窗口', driver: '被管制项的对偶技术获得确定性需求', horizon: '3-12个月' });
    if (types.has('格局与秩序')) opps.push({ label: '多极协调机制的中间地带', driver: '阵营不完全固化时，非阵营方获得撮合与套利空间', horizon: '12个月以上' });

    return opps;
  }

  _matchRisks(signals) {
    const risks = [];
    const types = new Set(signals.map(s => s.type === 'entity' ? s.name : s.label));

    if (types.has('地缘风险')) risks.push({ label: '供应链冲击', driver: '霍尔木兹海峡/东亚芯片竞争可能短期推高能源+物流成本', severity: 'high' });
    if (types.has('资本开支')) risks.push({ label: '估值修整', driver: '宇树/三星等显示AI/机器人概念股 reality check 已开始', severity: 'medium' });
    if (types.has('具身智能')) risks.push({ label: '机器人订单不及预期', driver: '量产爬坡慢于发布会节奏', severity: 'medium' });
    if (types.has('消费Agent') || types.has('阿里巴巴')) risks.push({ label: 'Agent商业化周期长', driver: '交易型Agent需要生态授权，不是单点技术问题', severity: 'medium' });
    if (types.has('AI监管')) risks.push({ label: '合规成本上升', driver: '多法域适配增加Agent本地化成本', severity: 'low' });
    // [v6.8.0 cronfix15] 补宏观类别的风险匹配。用户 2026-07-23 铁律：
    // 推演必须先列下行风险/坏局（"不要把自己想的那么好，多想想如何坏，如何防"）。
    // 原 _matchRisks 只有 5 条科技类规则，宏观输入抽到信号也拿不到风险，
    // 等于推演只讲机会不讲坏局，正是用户明令禁止的。
    if (types.has('货币政策')) risks.push({ label: '政策路径误判', driver: '利率决策依赖数据依赖度极高，预期与现实常错位', severity: 'medium' });
    if (types.has('通胀与物价')) risks.push({ label: '粘性通胀超预期', driver: '工资-物价螺旋一旦形成，紧缩周期会被迫拉长', severity: 'high' });
    if (types.has('汇率与资本流动')) risks.push({ label: '资本急停', driver: '避险情绪下资本流动方向可在数日内反转', severity: 'high' });
    if (types.has('贸易与关税')) risks.push({ label: '关税螺旋升级', driver: '反制-加税-再反制会自我强化，成本由两端企业分摊', severity: 'high' });
    if (types.has('选举与政治周期')) risks.push({ label: '承诺不可持续', driver: '过渡期政治人物可无视旧承诺，协议约束力弱', severity: 'medium' });
    if (types.has('军事冲突')) risks.push({ label: '冲突外溢与误判', driver: '代理人冲突易升级为直接对抗，且存在意外触发风险', severity: 'high' });
    if (types.has('能源与大宗')) risks.push({ label: '供给中断', driver: '单一通道/单一产区受阻即引发价格跳升', severity: 'high' });
    if (types.has('供应链重组')) risks.push({ label: '重复建设浪费', driver: '为韧性付出的冗余产能可能长期低效运转', severity: 'medium' });
    if (types.has('粮食与人口')) risks.push({ label: '必需品挤兑', driver: '恐慌性囤积会在供给未变时制造真实短缺', severity: 'high' });
    if (types.has('科技管制')) risks.push({ label: '管制范围扩大', driver: '清单覆盖面可能从硬件延伸到工具链与人才', severity: 'medium' });
    // 实体级下行风险：涉及任一地缘行为体都要提示不安全感驱动的控制欲互锁
    const GEO = new Set(['美国','中国','俄罗斯','欧盟','日本','印度','中东','朝鲜半岛','台湾','乌克兰']);
    if ([...types].some(t => GEO.has(t))) {
      risks.push({ label: '不安全感驱动的控制欲互锁', driver: '恐惧→控制→对抗→锁定是地缘格局的自强化回路，单边退让不解除互锁', severity: 'high' });
    }

    return risks;
  }

  _inferHorizon(signals) {
    const hasShort = signals.some(s => s.type === 'time' && s.label === '近期');
    const hasMid = signals.some(s => s.type === 'time' && s.label === '中期');
    if (hasShort && hasMid) return 'short_mid';
    if (hasShort) return 'short';
    if (hasMid) return 'mid';
    return 'unspecified';
  }

  _heartflowImpact(signals) {
    const impacts = [];
    const types = new Set(signals.map(s => s.type === 'entity' ? s.name : s.label));

    if (types.has('消费Agent') || types.has('阿里巴巴')) impacts.push('交易型Agent需要输出真实性保险');
    if (types.has('具身智能')) impacts.push('具身智能需要工具调用安全+行为边界判别');
    if (types.has('AI监管') || types.has('合规')) impacts.push('企业合规审计是 HeartFlow 的直接 to-B 场景');
    if (types.has('开源模型')) impacts.push('开源模型降低 Agent 门槛 → 判别层成为必备保险');
    if (types.has('地缘风险')) impacts.push('地缘碎片化需要多法域内容合规层');
    if (types.has('算力基建')) impacts.push('国产算力自主可控与 Agent 安全审计形成闭环');
    return impacts;
  }

  _confidence(signals, opportunities, risks) {
    const n = signals.length;
    if (n >= 8 && opportunities.length >= 3) return 0.85;
    if (n >= 5 && opportunities.length >= 2) return 0.7;
    if (n >= 3) return 0.55;
    return 0.4;
  }

  _conclude(opportunities, risks, horizon) {
    if (!opportunities.length && !risks.length) return '信号不足，无法形成有效推演';
    const topOpp = opportunities[0]?.label || '机会待识别';
    const topRisk = risks[0]?.label || '风险待评估';
    const h = horizon === 'short' ? '短期(0-3个月)' : horizon === 'mid' ? '中期(3-12个月)' : '中短期';
    return `${h}主旋律：${topOpp}，同时警惕${topRisk}。`;
  }

  _buildReasoning(signals, opportunities, risks, horizon, heartflowImpact) {
    const lines = [
      `信号提取：${signals.length} 个结构化信号`,
      `时间 horizon：${horizon || 'unspecified'}`,
      `机会维度：${opportunities.map(o => o.label).join('、') || '无'}`,
      `风险维度：${risks.map(r => `${r.label}(${r.severity})`).join('、') || '无'}`,
      `HeartFlow 影响：${heartflowImpact.join('；') || '无直接映射'}`,
    ];
    return lines.join('\n');
  }

  getStats() {
    return {
      module: 'MacroStrategyInference',
      version: '7.0.0',
      ready: true,
    };
  }
}

module.exports = { MacroStrategyInference };
