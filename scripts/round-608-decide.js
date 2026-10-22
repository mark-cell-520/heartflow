// r608 决策：从两个已实测确认未接线的 hidden instance 里选一个（候选带实测证据）
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const CANDIDATES = [
  '[A] sageGuardian 接线进 dispatch —— 伦理与安全护栏（SAGE = Safety-Aligned Guardian Ethics）。' +
  '实测证据：_modules 无 sageGuardian 键；12 条路由 dispatch 全部抛 "route not allowed"；' +
  '实例在 L2480 一直在构造（this.sageGuardian = new SAGEGuardian(this.rootPath)），' +
  '即「声明了但从未被 dispatch 调用过」的能力。可接管的辨别能力：' +
  'checkConstitutionProtection（宪法保护条款：试图修改/删除/绕过安全审查的提案直接判不通过）、' +
  'checkSafetyImpact（危险操作模式：删除日志/移除审计/禁用检测）、' +
  'checkBoundaries（行为边界：修改用户数据/绕过认证/未授权外部通信）、' +
  'checkValueAlignment（核心价值观对齐）、getASLLevel（violationCount>10=ASL-3 强制人类确认）、' +
  'classifyContent（ASL-1/2/3 内容分级，含高危关键词命中）、' +
  'generateRejectionWithGuidance（硬拒绝+软引导）、getSecurityLog（审计追踪）、' +
  'explainModification（可解释性）。共 16 方法 / 13 个零抛。' +
  '与心虫「辨别者」定位的契合度：这是唯一一个直接审查「自我修改提案是否该被拒绝」的引擎。',
  '[B] forgettingEngine 接线进 dispatch —— 遗忘曲线引擎（Ebbinghaus）。' +
  '实测证据：_modules 无 forgettingEngine 键；10 条路由 dispatch 全部抛 "route not allowed"；' +
  '实例在 L1602 构造（this.forgettingEngine = new ForgettingEngine()）。共 16 方法全零抛，' +
  '含 checkForget / consolidate / compress / abstract / detectOscillation / ' +
  'getForgettingProbability / ebbinghausRetention。' +
  '性质：记忆强度衰减与压缩管理，属记忆生命周期而非「辨别对错好坏」；' +
  'relevant-memory.js 已内建 Ebbinghaus 曲线（r595 实测 memory-consolidation-engine.js L47 调用 bridge.ebbinghausRetention），' +
  '接线后可能与现有记忆层功能重叠。',
];

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({ task: '选下一轮升级方向（hidden instance 接线）', prompt: CANDIDATES.join('\n') });
  console.log(JSON.stringify(res, null, 1));
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
