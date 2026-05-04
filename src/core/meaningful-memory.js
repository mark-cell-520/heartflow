/**
 * HeartFlow Meaningful Memory Module v11.5.9
 * 
 * 心虫自己判断"什么值得永久记忆"
 * 
 * 核心原则（按用户定义）：
 * - 减少逻辑错误 → 值得记忆
 * - 用户纠正过的问题 → 值得记忆
 * - 通过 selfVerify 的决策 → 值得记录
 * - 日常对话内容 → 不值得永久记忆
 * 
 * 三层记忆等级：
 * - CORE: 身份定义、核心指令、用户纠正（永久不删）
 * - LEARNED: 通过验证的决策、成功的修复策略（长期保存）
 * - EPHEMERAL: 日常对话、临时状态（会话结束即弃）
 * 
 * 可证伪标准：
 * - 用户纠正 → CORE
 * - selfVerify ≥ 75% → LEARNED
 * - 错误累计 ≥ 3次同类 → LEARNED（需修复）
 * - 其他 → EPHEMERAL
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', '..', 'memory');
const CORE_FILE = path.join(MEMORY_DIR, 'meaningful-core.json');
const LEARNED_FILE = path.join(MEMORY_DIR, 'meaningful-learned.json');

class MeaningfulMemory {
  constructor(options = {}) {
    this.coreTTL = Infinity;     // CORE: 永久
    this.learnedTTL = options.learnedTTL || 30 * 24 * 60 * 60 * 1000; // LEARNED: 30天
    this.core = {};   // { key: { value, reason, timestamp, userConfirmed } }
    this.learned = {}; // { key: { value, reason, timestamp, selfVerifyScore, source } }

    this._load();
  }

  // ============================================================
  // 持久化
  // ============================================================

  _load() {
    try {
      if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
      if (fs.existsSync(CORE_FILE)) {
        this.core = JSON.parse(fs.readFileSync(CORE_FILE, 'utf-8'));
      }
      if (fs.existsSync(LEARNED_FILE)) {
        const raw = JSON.parse(fs.readFileSync(LEARNED_FILE, 'utf-8'));
        // 过滤过期
        const now = Date.now();
        this.learned = Object.fromEntries(
          Object.entries(raw).filter(([, v]) => now - v.timestamp < this.learnedTTL)
        );
      }
      console.log(`[MeaningfulMemory] 加载: ${Object.keys(this.core).length} CORE, ${Object.keys(this.learned).length} LEARNED`);
    } catch (e) {
      console.warn('[MeaningfulMemory] 加载失败:', e.message);
    }
  }

  _save() {
    try {
      if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
      fs.writeFileSync(CORE_FILE, JSON.stringify(this.core, null, 2));
      fs.writeFileSync(LEARNED_FILE, JSON.stringify(this.learned, null, 2));
    } catch (e) {
      console.warn('[MeaningfulMemory] 保存失败:', e.message);
    }
  }

  // ============================================================
  // 核心判断：这件事有意义吗？
  // ============================================================

  /**
   * 判断一条记忆是否有意义，以及属于哪个等级
   * 返回: 'core' | 'learned' | 'ephemeral'
   */
  judge(event = {}) {
    const {
      type = 'unknown',
      value = '',
      userConfirmed = false,    // 用户主动确认
      selfVerifyScore = null,   // 来自 selfVerify()
      errorCount = 0,          // 同一错误发生次数
      isIdentity = false,        // 是否涉及核心身份
      isUserCorrection = false, // 用户纠正
    } = event;

    // 强制升级 CORE 的条件
    if (userConfirmed || isUserCorrection) {
      return 'core';
    }
    if (isIdentity) {
      return 'core';
    }

    // 高度可信 → LEARNED
    if (selfVerifyScore !== null && selfVerifyScore >= 0.75) {
      return 'learned';
    }
    if (errorCount >= 3) {
      return 'learned'; // 反复出现的错误需要记住
    }

    // 判断类型
    const typeScore = this._typeScore(type);
    if (typeScore >= 0.8) return 'learned';
    if (typeScore <= 0.2) return 'ephemeral';
    return 'ephemeral';
  }

  /**
   * 类型分值：这类事件普遍有意义的程度
   */
  _typeScore(type) {
    const scores = {
      // CORE 等价
      'user_correction': 1.0,
      'identity_change': 1.0,
      'preference_change': 1.0,
      
      // LEARNED 等价
      'decision_verified': 0.85,
      'error_pattern': 0.8,
      'successful_fix': 0.75,
      'self_verification': 0.7,
      'upgrade_result': 0.65,
      'code_working': 0.6,
      
      // EPHEMERAL
      'chat': 0.1,
      'greeting': 0.05,
      'status_check': 0.2,
      'temporary_state': 0.1,
      'unknown': 0.3,
    };
    return scores[type] ?? 0.3;
  }

  // ============================================================
  // 记忆操作
  // ============================================================

  /**
   * 记住一件事
   */
  remember(event = {}) {
    const {
      key = '',
      value = null,
      type = 'unknown',
      reason = '',
      selfVerifyScore = null,
      errorCount = 0,
      userConfirmed = false,
      isIdentity = false,
      isUserCorrection = false,
      source = 'system',
    } = event;

    if (!key || value === null) return null;

    const level = this.judge({
      type, value, userConfirmed, selfVerifyScore,
      errorCount, isIdentity, isUserCorrection
    });

    const record = {
      key,
      value,
      type,
      reason: reason || this._defaultReason(type, level),
      timestamp: Date.now(),
      source,
      level,
    };

    if (level === 'core') {
      this.core[key] = record;
    } else if (level === 'learned') {
      if (selfVerifyScore !== null) record.selfVerifyScore = selfVerifyScore;
      this.learned[key] = record;
    }
    // ephemeral 不存储

    this._save();
    return { level, record };
  }

  /**
   * 召回记忆
   */
  recall(key) {
    return this.core[key] || this.learned[key] || null;
  }

  /**
   * 检查是否记得某件事
   */
  knows(key) {
    return key in this.core || key in this.learned;
  }

  /**
   * 用户纠正 → 强制写入 CORE
   */
  rememberUserCorrection(key, value, reason = '') {
    return this.remember({
      key,
      value,
      type: 'user_correction',
      reason: reason || '用户主动纠正',
      userConfirmed: true,
      source: 'user',
    });
  }

  /**
   * 验证通过的决策 → LEARNED
   */
  rememberVerifiedDecision(key, decision, score) {
    return this.remember({
      key,
      value: decision,
      type: 'decision_verified',
      reason: `selfVerify score=${score}`,
      selfVerifyScore: score,
      source: 'decision-verifier',
    });
  }

  /**
   * 错误模式累计 → LEARNED
   */
  rememberErrorPattern(key, pattern, count) {
    return this.remember({
      key,
      value: pattern,
      type: 'error_pattern',
      reason: `同类错误累计 ${count} 次`,
      errorCount: count,
      source: 'self-healing',
    });
  }

  /**
   * 升级成功 → LEARNED
   */
  rememberUpgrade(key, version, change) {
    return this.remember({
      key,
      value: { version, change },
      type: 'upgrade_result',
      reason: `HeartFlow ${version} 升级内容`,
      source: 'upgrade-system',
    });
  }

  // ============================================================
  // 查询
  // ============================================================

  /**
   * 所有 CORE 记忆
   */
  getCore() {
    return Object.values(this.core);
  }

  /**
   * 所有 LEARNED 记忆
   */
  getLearned() {
    return Object.values(this.learned);
  }

  /**
   * 按类型查找
   */
  findByType(type) {
    return [
      ...Object.values(this.core).filter(r => r.type === type),
      ...Object.values(this.learned).filter(r => r.type === type),
    ];
  }

  /**
   * 统计
   */
  stats() {
    return {
      core: Object.keys(this.core).length,
      learned: Object.keys(this.learned).length,
      ephemeral: 'session-only',
      total: Object.keys(this.core).length + Object.keys(this.learned).length,
    };
  }

  _defaultReason(type, level) {
    const reasons = {
      core: '满足CORE条件：用户确认/身份相关',
      learned: `满足LEARNED条件：${type}`,
      ephemeral: '日常内容，不值得永久记忆',
    };
    return reasons[level];
  }
}

module.exports = { MeaningfulMemory };
