'use strict';
// r529 定点把 r528 已验证通过的 4 支 MINIMIZE 补支写入 src/harm-invalidation.js。
// 证据：scripts/round-528-final-verify.js 全判据 12/12 命中、良性池 0/30。
// 关键坑规避：patch/write_file 会把反斜杠写成双份，正则空白一律用
// B = String.fromCharCode(92) 运行期拼接，源码中不出现裸反斜杠。
// 只替换 MINIMIZE_ZH 收尾 1 行与 MINIMIZE_EN 收尾 1 行，其他行一律不动。
const fs = require('node:fs');
const path = require('node:path');
const FILE = path.join(__dirname, '..', 'src', 'harm-invalidation.js');

const B = String.fromCharCode(92);
const S = B + 's';

const lines = fs.readFileSync(FILE, 'utf8').split('\n');
function expect(idx, needle) {
  if (!lines[idx] || !lines[idx].includes(needle)) {
    console.error('FAIL 锚点失配 第' + (idx + 1) + '行 期望含 ' + needle);
    console.error('实际: ' + (lines[idx] === undefined ? '<越界>' : lines[idx].slice(0, 90)));
    process.exit(1);
  }
}

// MINIMIZE_ZH 收尾（1-based 167 → 0-based 166）
expect(166, "].join('|'));");
expect(165, '(?:抵|排|抱)');
// MINIMIZE_EN 收尾（1-based 199 → 0-based 198）
expect(197, 'making');
expect(197, 'fuss');
expect(198, "].join('|'), 'i');");
const ZH_TAIL = [
  '  // [r528 新支] 无人受损量级校准的第二形态：谁都没少块肉/大家都没掉块肉',
  '  // 与第 163-164 行 r527 补支互补：那支锚「也|都+没+有」，本支锚「没+人/谁/任何人」',
  "  '(?:又|也|根本|压根|大家)" + S + "*(?:没|未)" + S + "*(?:有|见)?" + S + "*(?:人|谁|任何" + S + "*人)" + S + "*(?:掉|受|缺|少)" + S + "*(?:块|根|丝|点)" + S + "*(?:肉|毛|毫)',",
  '  // [r528 新支] 双段共现判据的归因段：归因词 + (你/他/她/们) + 不适应/不熟悉 + 新流程',
  '  // 单独出现是正当过渡期陈述（误伤 3 条恶性样本实测），必须与 HARM_DENY_ZH 末支',
  '  // 「转述受害声称」同句共现才命中；判据证据见 scripts/round-528-final-verify.js',
  "  '(?:其" + S + "*实|只" + S + "*是|不" + S + "*过|纯" + S + "*粹|实" + S + "*际" + S + "*上|事" + S + "*实" + S + "*上)" + S + "*(?:仅" + S + "*仅)?" + S + "*(?:你|他|她|们)?" + S + "*(?:不|未)" + S + "*(?:适|习|熟|会|用|接)" + S + "*(?:应|新|惯|悉|触|流|变|化)?" + S + "*(?:新" + S + "*)?(?:流" + S + "*程|系" + S + "*统|规" + S + "*定|方" + S + "*式|节" + S + "*奏|工" + S + "*具|环" + S + "*境)',",
  "].join('|'));",
];

const EN_TAIL = [
  '  // [r528 补支] claiming the complaint was invented or exaggerated wholesale',
  "  '\\\\b(?:imagining|invented|exaggerat(?:ing|ed)|making" + B + B + "s+up)" + B + "s+" +
    "(?:the" + B + "s+)?(?:whole|entire|all" + B + "s+of)" + B + "s+" +
    "(?:thing|incident|situation|story|problem)',",
  '  // [r528 补支] "nothing to settle" — 判定投诉无事可结（收尾词防误伤正当审计/对账语境）',
  "  '\\\\b(?:there" + B + "s+is" + B + "s+)?(?:nothing|little)" + B + "s+to" + B + "s+settle" + B + "b" +
    "(?!.{0,45}(?:audit|reconcil|remediat|closed|completed|resolved|outstanding" +
    "|vendor|complaint|invoice|billing|settled|register|reconciled))',",
  "], 'i');",
];

const out = lines
  .slice(0, 166)
  .concat(ZH_TAIL, lines.slice(167, 198).concat(EN_TAIL, lines.slice(199)));
fs.writeFileSync(FILE, out.join('\n'));
console.log('ZH 收尾 1 行 -> ' + ZH_TAIL.length + ' 行；EN 收尾 1 行 -> ' + EN_TAIL.length + ' 行');

// 即时自验：只打印支数与是否含裸反斜杠异常
const mod = require(FILE);
const I = mod.__internals();
console.log('HARM_DENY_ZH ' + I.HARM_DENY_ZH.source.split('|').length + ' 支');
console.log('MINIMIZE_ZH ' + I.MINIMIZE_ZH.source.split('|').length + ' 支');
console.log('MINIMIZE_EN ' + I.MINIMIZE_EN.source.split('|').length + ' 支');
const raw = fs.readFileSync(FILE, 'utf8');
console.log('源码出现双份反斜杠的行数 = ' + raw.split('\n').filter((l) => l.includes(B + B)).length);
console.log('结束');
