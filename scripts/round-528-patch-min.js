'use strict';
// r528 给 MINIMIZE_ZH 追加 2 支、MINIMIZE_EN 追加 2 支。
// 反斜杠全部用 String.fromCharCode(92) 运行期拼接，源码里不出现裸反斜杠
// （patch/write_file 会把 \\ 字面化，这是 r527/r528 反复踩的坑）。
const fs = require('node:fs');
const path = require('node:path');
const FILE = path.join(__dirname, '..', 'src', 'harm-invalidation.js');
const B = String.fromCharCode(92);
const S = B + 's';
const BS = B + 'b';   // \b

const lines = fs.readFileSync(FILE, 'utf8').split('\n');

// 定位 MINIMIZE_ZH 的收尾行（唯一含 "].join('|'));" 且前面是抵触支的行）
let zhEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("'(?:抵|排|抱)(?:触|斥|怨)(?:变|新|流|情|化|改)?',") && i + 1 < lines.length && lines[i + 1].trim() === "].join('|'));") {
    zhEnd = i;
    break;
  }
}
if (zhEnd === -1) { console.error('FAIL 未定位 MINIMIZE_ZH 收尾'); process.exit(1); }

// 定位 MINIMIZE_EN 的最后一支收尾
let enEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("'making" + BS + "+a" + BS + "+fuss" + BS + "+about|making" + BS + "+good)" + BS + "',") ) {
    enEnd = i;
    break;
  }
}
if (enEnd === -1) { console.error('FAIL 未定位 MINIMIZE_EN 收尾'); process.exit(1); }

const NEW_ZH = [
  '  // [r528 新支] 无人受损量级校准：又/也 + 没 + (有) + 人 + 掉块肉',
  "  '(?:又|也|根本|压根)" + S + "*(?:没|未)" + S + "*(?:有|见)?" + S + "*(?:人|谁)" + S + "*(?:掉|受|缺|少)" + S + "*(?:块|根|丝|点)" + S + "*(?:肉|毛|毫)',",
  '  // [r528 新支] 归因否定：其实/只是/不过/纯粹 + (你/他) + 不适应/不熟悉 + 新流程',
  '  // 必须与前句的「被影响/受影响」转述共现才构成否认（见 HARM_DENY_ZH 转述支）',
  "  '(?:其" + S + "*实|只" + S + "*是|不" + S + "*过|纯" + S + "*粹|实" + S + "*际" + S + "*上|事" + S + "*实" + S + "*上)" + S + "*(?:仅" + S + "*仅)?(?:你|他|她|们)?" + S + "*(?:不|未)" + S + "*(?:适|习|熟|会|用|接)" + S + "*(?:应|新|惯|悉|触|流|变|化)?" + S + "*(?:新" + S + "*)?(?:流" + S + "*程|系" + S + "*统|规" + S + "*定|方" + S + "*式|节" + S + "*奏|工" + S + "*具|环" + S + "*境)',",
];

const NEW_EN = [
  '  // [r528 新支] they are imagining/invented/exaggerating the whole thing',
  "  " + BS + "(?:b(?:they|she|he|you)" + S + "+(?:are|is|were|was)?" + S + "*)?(?:imagining|invented|exaggerat(?:ing|ed)|making" + S + "+up)" + S + "+(?:the" + S + "+)?(?:whole|entire|all" + S + "+of)" + S + "+(?:thing|incident|situation|story|problem)" + BS,
  '  // [r528 新支] nothing/little to settle（仅责任未决语境；收尾语排除见 negative lookahead）',
  "  " + BS + "(?:there" + S + "+is" + S + "+)?(?:nothing|little)" + S + "+to" + S + "+settle" + BS + "(?!.{0,45}(?:audit|reconcil|remediat|closed|completed|resolved|outstanding|vendor|complaint|invoice|billing|settled|register|reconciled))",
];

// 组装：先插 ZH（下标较小），再插 EN
const out = lines.slice(0, zhEnd + 1).concat(NEW_ZH, lines.slice(zhEnd + 1, enEnd + 1), NEW_EN, lines.slice(enEnd + 1));
fs.writeFileSync(FILE, out.join('\n'));
console.log('MINIMIZE_ZH 追加 ' + NEW_ZH.length + ' 行（收尾于原第 ' + (zhEnd + 1) + ' 行）');
console.log('MINIMIZE_EN 追加 ' + NEW_EN.length + ' 行（收尾于原第 ' + (enEnd + 1) + ' 行）');

const mod = require(FILE);
const I = mod.__internals();
const zh = I.MINIMIZE_ZH.source.split('|');
const en = I.MINIMIZE_EN.source.split('|');
console.log('MINIMIZE_ZH 末支: ' + zh[zh.length - 1].slice(0, 60));
console.log('MINIMIZE_EN 末2支:');
en.slice(-2).forEach((b) => console.log('  ' + b.slice(0, 80)));
