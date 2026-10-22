// Structured debug logging — replaces scattered console.log
// Gate: set HEARTFLOW_DEBUG=1 to see debug-level output
const DEBUG = process.env.HEARTFLOW_DEBUG === '1';

// 单行摘要上限：警告行不该变成多屏堆栈
const FIELD_MAX = 200;

function summarize(data) {
  if (!data || typeof data !== 'object') return '';
  const parts = [];
  // errors 数组是重点：engine-lifecycle 的「N 模块初始化失败」就靠它指出是哪个模块
  const errs = Array.isArray(data.errors) ? data.errors : null;
  if (errs && errs.length) {
    parts.push(errs.map(e => `${e.module || '?'}: ${String(e.error || '').slice(0, FIELD_MAX)}`).join(' | '));
  }
  for (const [k, v] of Object.entries(data)) {
    if (k === 'errors' || v === null || v === undefined) continue;
    parts.push(`${k}=${typeof v === 'object' ? JSON.stringify(v).slice(0, FIELD_MAX) : String(v).slice(0, FIELD_MAX)}`);
  }
  return parts.join(' ');
}

module.exports = {
  debug(module, event, data = {}) {
    if (!DEBUG) return;
    console.log(JSON.stringify({ts: new Date().toISOString(), module, event, ...data}));
  },
  info(module, event, data = {}) {
    // info always prints (startup milestones)
    console.log(JSON.stringify({ts: new Date().toISOString(), module, event, ...data}));
  },
  // [2026-10-15 global-fix] 第三参以前被静默丢弃：engine-lifecycle.js 的
  // 「N 模块初始化失败」只报数不报是哪个模块，而那个失败是偶发的
  // （实测约 15 次启动 1 次），看不到模块名就永远定位不了。
  // 现在把 data 摘要成一行附在后面；保持单行以便 grep，两参调用行为不变。
  warn(module, msg, data) {
    const extra = summarize(data);
    console.warn(extra ? `[${module}] ${msg} — ${extra}` : `[${module}] ${msg}`);
  }
};
