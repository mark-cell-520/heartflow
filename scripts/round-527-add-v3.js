'use strict';
// r527 补支 v3：c1/c3 两族 + 「没人掉块肉」族（c2 改版）写入 HARM_DENY_ZH。
// 形态：单引号字符串，\\s 双反斜杠（JS 字符串 -> 正则 \s）。
const fs = require('node:fs');
const path = require('node:path');
const p = path.join(__dirname, '..', 'src', 'harm-invalidation.js');

function spliceArray(constName, newLines) {
  let s = fs.readFileSync(p, 'utf8');
  const decl = 'const ' + constName + ' = new RegExp([';
  const d = s.indexOf(decl);
  if (d < 0) throw new Error('decl not found ' + constName);
  const endArr = s.indexOf('].join', d);
  const insertAt = s.lastIndexOf('\n', endArr) + 1;
  s = s.slice(0, insertAt) + newLines + '\n' + s.slice(insertAt);
  fs.writeFileSync(p, s);
}

const mode = process.argv[2];

const SETS = {
  // atk#0/#2「根本/压根 + 没/未 + 伤名」（无「有」字）
  'deny-zh': ['HARM_DENY_ZH', [
    "  // [r527 补支] 否定词直接贴伤名：根本/压根/丝毫 + 没|未 + 受伤（无「有」）",
    "  '(?:根\\\\s*本|压根|丝毫|一点|半点|压根儿)\\\\s*(?:没|未)\\\\s*(?:受\\\\s*伤|伤\\\\s*害|损\\\\s*失|受\\\\s*损|影\\\\s*响|后\\\\s*遗\\\\s*症|不\\\\s*适|中\\\\s*毒|泄\\\\s*露)',",
    "  // [r527 补支] 转述否认：大家/谁 + 其实/实际上 + 没 + (真的) + 受损（atk#8）",
    "  '(?:大\\\\s*家|谁|人\\\\s*家)\\\\s*(?:其\\\\s*实|事\\\\s*实\\\\s*上|实\\\\s*际\\\\s*上)\\\\s*(?:并)?\\\\s*(?:没|未)\\\\s*(?:有)?\\\\s*(?:真\\\\s*的|真正|实\\\\s*质)?\\\\s*(?:受\\\\s*损|受\\\\s*影\\\\s*响|损\\\\s*失|受\\\\s*伤)',",
    "  // [r527 补支] 无人受损的量级校准：没|未 + 有|见 + 人|谁 + 掉/受 + 块肉（atk#5#8）",
    "  '(?:没|未)\\\\s*(?:有|见)\\\\s*(?:人|谁|任何)\\\\s*(?:受|掉|缺|崴|伤)(?:伤|块|肉|腿|胳)\\\\s*(?:肉|腿|胳)?',",
  ]],
  // atk#5「受影响被否定」的 min 侧缺口已由 deny-zh 的「未受任何影响」支覆盖，
  // min 侧补「抵触/不适应」（atk#7 已由 min-zh 上一轮补支覆盖，本 mode 仅兜底）
  'min-zh': ['MINIMIZE_ZH', [
    "  // [r527 补支] 抵抗/抵触/抱怨（不带「只是」前缀）",
    "  '(?:抵|排|抱)(?:触|斥|怨)(?:变|新|流|情|化|改)?',",
  ]],
};

if (!SETS[mode]) { console.error('usage: deny-zh|min-zh'); process.exit(2); }
spliceArray(SETS[mode][0], SETS[mode][1].join('\n'));
console.log('OK ' + mode + ' -> ' + SETS[mode][0]);
