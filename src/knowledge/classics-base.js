/**
 * classics-base.js â åè/éè/ä½èè¯­æåºï¼daizhigev20ï¼è·¯å¾è§£æ
 *
 * [FIX 2026-09-19] åæ¥ classics-rules.js / classics-feedback.js é½ç¨
 *   path.join(__dirname, '..', '..', '..', '..', 'daizhigev20')
 * ç¡¬æ¨åçº§ç®å½ãå½æè½è¢«å®è£å°å«çç¨æ·ç skills ç®å½ä¸ï¼ä¾å¦å¼æè·å¨
 * claude-bot ä¸ï¼èè¯­æåºè£å¨ root ç ~/.hermes/skills/daizhigev20ï¼ï¼
 * è§£æç»æå°±æåä¸ä¸ªä¸å­å¨çè·¯å¾ï¼å¤å¸æ£ç´¢æ´æ¡é¾è·¯éé»å¤±æã
 *
 * ç°å¨æä¼åçº§æ¾ç¬¬ä¸ä¸ªçå®å­å¨çç®å½ï¼å¹¶åè®¸ç¨ç¯å¢åéæ¾å¼æå®ã
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function _exists(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch (_) {
    return false;
  }
}

function _candidates() {
  const list = [];

  // 1. 显式环境变量优先
  if (process.env.DAIZHIGEV20_PATH) list.push(process.env.DAIZHIGEV20_PATH);
  if (process.env.CLASSICS_BASE) list.push(process.env.CLASSICS_BASE);

  // 2. 与本技能同级（原来的行为，保留兼容）
  list.push(path.join(__dirname, '..', '..', '..', '..', 'daizhigev20'));

  // 3. 常见的 hermes / stepcode skills 安装位置
  // [v6.8.1] 实测：本机语料库装在 /root/hermes8/skills 与
  // /root/.stepcode/agent/skills（多 profile + 阶跃宿主）。原候选列表
  // 只覆盖 ~/.hermes/skills 与 /usr/local/share、/opt/hermes，六个位置
  // 全部落空 → CLASSICS_BASE=null → 典籍检索链静默失效、测试断言空 hits。
  // 新增：每个 home 下的四种 skills 布局（含 .stepcode/agent）。
  const bases = [process.env.HERMES_HOME, os.homedir(), '/root', '/home/claude-bot'];
  for (const b of bases) {
    if (!b) continue;
    list.push(path.join(b, 'skills', 'daizhigev20'));
    list.push(path.join(b, '.hermes', 'skills', 'daizhigev20'));
    list.push(path.join(b, '.stepcode', 'agent', 'skills', 'daizhigev20'));
    // 同 profile 的其他用户目录（hermes8 等）也扫一层
    const parent = path.dirname(b);
    if (parent && parent !== '/' && parent !== b) {
      list.push(path.join(parent, 'hermes8', 'skills', 'daizhigev20'));
    }
  }

  // 4. 全局位置
  list.push('/usr/local/share/hermes/skills/daizhigev20');
  list.push('/opt/hermes/skills/daizhigev20');

  return [...new Set(list.filter(Boolean))];
}

let _resolved;

function resolveClassicsBase() {
  if (_resolved !== undefined) return _resolved;
  for (const candidate of _candidates()) {
    if (_exists(candidate)) {
      _resolved = candidate;
      return _resolved;
    }
  }
  _resolved = null;
  return null;
}

const CLASSICS_BASE = resolveClassicsBase();
const SCRIPT = CLASSICS_BASE ? path.join(CLASSICS_BASE, 'scripts', 'search_guji.sh') : null;

module.exports = {
  CLASSICS_BASE,
  SCRIPT,
  resolveClassicsBase,
  isAvailable: () => resolveClassicsBase() !== null,
};
