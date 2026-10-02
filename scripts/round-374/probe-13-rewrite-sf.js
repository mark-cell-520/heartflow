// scripts/round-374/probe-13-rewrite-sf.js
// 重写 sensitive_file 那一行（414 行）。
// 现状问题：该行被先前的 patch 压成了单行，且混入了一段与本轮无关的
// base64/编码后的 支，`{ name: 'fake_emergency' ...` 也被并到同一行。
// 本脚本做的事：
//   ① 拆回两行结构（sensitive_file.re 一行 + fake_emergency 独立条目）
//   ② sensitive_file 的 re 改为命名常量 _RE_SENSITIVE_FILE（组装式）
//   ③ 中文段原样保留；英文段只保留 r374 补的同构支（删除 base64 无关支）
// 纪律：先备份、写后 node --check、跑 probe-11 中文零回归对照。
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = '/root/.hermes/skills/ai/mark-heartflow-skill/src/multi-turn-tactics.js';
const src = fs.readFileSync(SRC, 'utf8');
const lines = src.split('\n');

const idx = lines.findIndex(l => l.startsWith('    re: /(?:(?:etc') && l.includes("name: 'fake_emergency'"));
if (idx < 0) { console.error('定位失败'); process.exit(1); }

// ── 拆出被并进去的 fake_emergency 条目首段 ──
const cur = lines[idx];
const fakePart = "  { name: 'fake_emergency', label: '虚构紧急/演练场景要求越权', score: 25,";

// ── 中文段（原样保留，从原正则中直取）──
const SF_CN = "(?:etc\\/passwd|etc\\/shadow|\\/etc\\/|\\.ssh|id_rsa|authorized_keys|\\.env|\\.npmrc|\\.aws\\/credentials|kubeconfig)(?:\\b|\")|(?:密钥|密匙|secret|api[_.]?\\s?key|access[_.]?\\s?key|token|私钥|证书)(?![^\\n。]{0,6}(?:签发|校验|过期|renew|轮换|续期))(?:文件|内容|值|串)?[^\\n。]{0,10}(?:打印|写出|贴出|列出|打出|写到|保存到|导入|导出|output|dump|send|print|show|display|give|provide|list|export|显示|输出|告诉|发送|发送到|发到|发给|发我|打|写|给|发|列|贴|日志)|(?:(?:读取|打开|看看|查看|cat)\\s*[^\\n。]{0,24}(?:config|配置|\\.json|\\.env|\\.ya?ml|密钥|证书|凭据))";

// ── 英文段（r374 新增，同构支）──
const SF_EN = "\\b(?:open|read|show|display|cat|dump|print|export|reveal|give|provide|send|list|pull|grab|fetch|retrieve|tell)\\b[^.\\n]{0,24}\\b(?:config|\\.env|\\.json|\\.ya?ml|\\.pem|id_rsa|authorized_keys|credentials?|secrets?|token|api[_.]?key|private[_.]?key|passwd|shadow)\\b";

lines[idx] = '    re: _RE_SENSITIVE_FILE },\n' + fakePart;

// ── 在 LADDERS 之前插入常量定义 ──
const anchor = lines.findIndex(l => l.startsWith('// 阶梯的四个层级（按敏感度递增）'));
if (anchor < 0) { console.error('锚点失败'); process.exit(1); }
lines.splice(anchor, 0, [
  '/**',
  ' * [v6.7.155 r374] sensitive_file 层正则（组装式，与 _RE_SYSTEM_ENTRY 同款做法）。',
  ' *',
  ' * 由来：该条目原先是一个 800+ 字符的硬写正则。r374 往里面补英文同构支时，',
  ' * 反复的字符串替换把它压成了单行，还误带入一段无关的 base64 支，',
  ' * 连带把紧随其后的 fake_emergency 条目并进了同一行。',
  ' *',
  ' * 改为命名小段数组拼接后：',
  ' *   · 结构错误不可能再静默发生（拼完一次 new RegExp，括号不平衡当场抛）',
  ' *   · 中英文两段各自独立，日后补英文族不再动中文段',
  ' *',
  ' * 中文段 SF_CN 与 v6.7.124 的定义逐字一致（不加排除、不改窗口），',
  ' * 求教排除仍走 softHitIsConsult() 后处理。',
  ' * 英文段 SF_EN 是 r374 probe-11 实测补的缺口：英文侧「索取动词 +',
  ' * config.json / credentials」形状此前完全不被识别。',
  ' *',
  ' * ⚠️ 改这里必须同步检查 SENSITIVE_TARGET_NOUNS 的下标平行性守卫',
  ' * （test/round-343-sensitive-target-dedup.test.js）。',
  ' */',
  "const _SF_CN = " + JSON.stringify(SF_CN) + ';',
  "const _SF_EN = " + JSON.stringify(SF_EN) + ';',
  "const _RE_SENSITIVE_FILE = new RegExp(['(?:', _SF_CN, '|', _SF_EN, ')'].join(''), 'i');",
  '',
].join('\n'));

fs.writeFileSync(SRC, lines.join('\n'));
console.log('写入完成，行数', lines.length);
