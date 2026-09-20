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

  // 1. æ¾å¼ç¯å¢åéä¼å
  if (process.env.DAIZHIGEV20_PATH) list.push(process.env.DAIZHIGEV20_PATH);
  if (process.env.CLASSICS_BASE) list.push(process.env.CLASSICS_BASE);

  // 2. ä¸æ¬æè½åçº§ï¼åæ¥çè¡ä¸ºï¼ä¿çå¼å®¹ï¼
  list.push(path.join(__dirname, '..', '..', '..', '..', 'daizhigev20'));

  // 3. å¸¸è§ç hermes skills å®è£ä½ç½®
  const homes = [os.homedir(), '/root', '/home/claude-bot'];
  for (const home of homes) {
    list.push(path.join(home, '.hermes', 'skills', 'daizhigev20'));
  }

  // 4. å¨å±ä½ç½®
  list.push('/usr/local/share/hermes/skills/daizhigev20');
  list.push('/opt/hermes/skills/daizhigev20');

  return [...new Set(list)];
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
