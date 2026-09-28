// 第 207 轮：第①条英文/中文动词在前设施表差集 7 词补丁
// 用字符串插入而非 patch（patch 对正则行的反斜杠计数有歧义）
const fs = require('fs');
const P = 'src/dangerous-instruction.js';
let src = fs.readFileSync(P, 'utf8');

const NEW_LINE = [
  '  // [第 207 轮补第①条设施表差集 7 词] 缺口实测（scripts/round-207/',
  '  // probe-r207.js + probe-r207-diff.js）：SECURITY_BOUNDARY（src/dev-exemptions.js',
  '  // 第 280 行，豁免侧一票否决 29 词）的中文侧 20 词与第①条设施表逐词比对，',
  '  // 差 7 词 —— 沙箱、安全检查、权限检查、越权、脱库、入侵、渗透、提权',
  '  // （另有「脱裤」两侧都缺）。这 7 词中 6 词 PAT4 已收（第 205 轮）、注释专形',
  '  // 已收（第 204 轮），**唯独第①条「动词在前」形没收** —— 即「关掉沙箱」',
  '  // 「绕过越权」「卸载渗透」等形全 pass，且 veto 链验证命中侧零命中',
  '  // （不是 discourse 降级）。v6.7.123 家族训训第 10 次复发：两份清单',
  '  // （PAT4 设施表 vs 第①条设施表）词面不一致 → 豁免侧否决的词命中侧',
  '  // 不认识 → di 不命中 → 否决后无维度填补 → pass。',
  '  // 实测：7 差集词 × 12 中文动词 = 84 格中 72 格 pass（安全检查/权限检查 已被',
  '  // 表内「检查」兜底）。补后 7 词 × 12 动词须全 block。',
  '  // 边界：不收「脱裤」（「脱库」变体，样本未出现，与 PAT4 第 205 轮口径一致）；',
  '  //   不收 auth 族裸词扩写（authentication/authorization 由 auth 兜底）。',
  '  /(?:忽略|无视|绕过|跳过|关闭|禁用|去掉|取消|关掉|关了|停用|停掉|废掉|废了|卸载|卸掉|卸载掉|卸了一?下|删掉|删了|清空|清掉|清了|清除|清除掉|清一?下|清理|去除|移除|拿掉|下掉|关一?下|停一?下|屏蔽|禁用掉|抹掉|抹除|搽除|擦除|复原|重置|复位|disable|disabl\\w*|turn\\s+off|shut\\s+off|remove|delete|uninstall|deinstall|drop|kill|reset|wipe|purge|clear)[^。\\n]{0,12}(?:沙箱|sandbox|安全检查|权限检查|越权|脱库|入侵|渗透|提权)/i,',
].join('\n');

// 锚点：第205轮补副词/语气槽那条注释块的第一行（唯一）
const ANCHOR = '  // [第 205 轮补副词/语气槽] 缺口实测（scripts/round-205/probe-r205-pat259.js）：';
if (src.split(ANCHOR).length !== 2) {
  console.error('锚点不唯一或未找到，中止');
  process.exit(1);
}
src = src.replace(ANCHOR, NEW_LINE + '\n' + ANCHOR);
fs.writeFileSync(P, src);
console.log('已插入第 207 轮补词支');
