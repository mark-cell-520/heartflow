// scripts/round-374/probe-12-fix-sf-line.js
// 把 414 行（sensitive_file 的 re，被压缩成单行且混入了无关支）
// 重写为独立命名常量 _RE_SENSITIVE_FILE，末尾只保留本轮英文同构支。
// 纪律：只做删除/替换，不引入无关内容。
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.join('/root/.hermes/skills/ai/mark-heartflow-skill/src/multi-turn-tactics.js');
const src = fs.readFileSync(SRC, 'utf8');

const lines = src.split('\n');
// 定位 414 行（下标 413）
const idx = 413;
if (!lines[idx].startsWith('    re: /(?:(?:etc')) {
  console.error('行定位失败：' + lines[idx].slice(0, 60));
  process.exit(1);
}

const CN_PART = [
  // [v6.7.155 r374] 中文侧沿用 r389 之前的既有定义（原样，不做语义改动）
  '(?:etc\\/passwd|etc\\/shadow|\\/etc\\/|\\.ssh|id_rsa|authorized_keys|\\.env|\\.npmrc|\\.aws\\/credentials|kubeconfig)(?:\\b|")',
  '|(?:密钥|密匙|secret|api[_.]?\\s?key|access[_.]?\\s?key|token|私钥|证书)(?![^\\n。]{0,6}(?:签发|校验|过期|renew|轮换|续期))(?:文件|内容|值|串)?[^\\n。]{0,10}(?:打印|写出|贴出|列出|打出|写到|保存到|导入|导出|output|dump|send|print|show|display|give|provide|list|export|显示|输出|告诉|发送|发送到|发到|发给|发我|打|写|给|发|列|贴|日志)',
  '|(?:(?:读取|打开|看看|查看|cat)\\s*[^\\n。]{0,24}(?:config|配置|\\.json|\\.env|\\.ya?ml|密钥|证书|凭据))',
].join('');
// [v6.7.155 r374] 英文侧同构支：r374 probe-11 实测英文侧 config.json /
// credentials 类索取动词组合完全不被 sensitive_file 识别（sf=false），
// 且 SENSITIVE_TARGET 的英文支只认 customer/phone 与 production database，
// 漏掉最常见的「动词 + config.json」形状。
// 与中文软分支同构，取英文索取动词 × 敏感文件名/凭据名的组合。
// ⚠️ 求教排除（问用法）沿用 softHitIsConsult 后处理，本支只补正则侧。
const EN_PART = [
  '|\\b(?:open|read|show|display|cat|dump|print|export|reveal|give|provide|send|list|pull|grab|fetch|retrieve|tell)\\b[^.\\n]{0,24}\\b(?:config|\\.env|\\.json|\\.ya?ml|\\.pem|id_rsa|authorized_keys|credentials?|secrets?|token|api[_.]?key|private[_.]?key|passwd|shadow)\\b',
].join('');

const NEW_LINE = `    re: _RE_SENSITIVE_FILE },`;
lines[idx] = NEW_LINE;

// 在 LADDERS 定义前插入常量定义
const anchor = lines.findIndex(l => l.startsWith('// 阶梯的四个层级（按敏感度递增）'));
if (anchor < 0) { console.error('锚点失败'); process.exit(1); }
const block = [
  '/**',
  ' * [v6.7.155 r374] sensitive_file 层的正则（组装式，与 _RE_SYSTEM_ENTRY 同款做法）。',
  ' * 原先是硬写在 LADDERS 条目内的巨型正则；本轮补英文同构支时改为命名小段拼接，',
  ' * 结构错误不可能再静默发生。',
  ' * ⚠️ 新增分支时必须同步检查 SENSITIVE_TARGET_NOUNS 的下标平行性守卫',
  ' * （test/round-343-sensitive-target-dedup.test.js）。',
  ' */',
  `const _RE_SENSITIVE_FILE = new RegExp([`,
  `  '(?:', _SF_CN,`,
  `  '|', _SF_EN,`,
  `  ')',`,
  `].join(''), 'i');`,
].join('\n');
// 直接在常量处内联两段，避免额外顶层变量
lines.splice(anchor, 0,
  '/**',
  ' * [v6.7.155 r374] sensitive_file 层的正则（组装式）。',
  ' * 原先是硬写在 LADDERS 条目内的 800+ 字符巨型正则；本轮补英文同构支时改为',
  ' * 命名小段数组拼接（与 _RE_SYSTEM_ENTRY 同款做法），结构错误不可能再静默发生。',
  ' * 中文段原样保留（不做语义改动）；英文段是 r374 probe-11 实测的缺口补丁：',
  ' * 英文侧「动词 + config.json/credentials」形状此前完全不被识别。',
  ' * ⚠️ 改这里要同步看 SENSITIVE_TARGET_NOUNS 的下标平行性守卫。',
  ' */',
  'const _SF_CN = ' + JSON.stringify(CN_PART) + ';',
  'const _SF_EN = ' + JSON.stringify(EN_PART) + ';',
  "const _RE_SENSITIVE_FILE = new RegExp(['(?:', _SF_CN, '|', _SF_EN, ')'].join(''), 'i');",
  '',
);

fs.writeFileSync(SRC, lines.join('\n'));
console.log('写入完成');
