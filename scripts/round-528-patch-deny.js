'use strict';
// r528 定点替换 src/harm-invalidation.js 的 [r527 补支] 三支 + 追加 2 支新支。
// 关键坑规避：patch/write_file 都会把 \\ 当字面量，所以正则里的反斜杠
// 一律用 B = String.fromCharCode(92) 在运行时拼接，源码里不出现反斜杠字符。
// 只替换第 85-90 行区间（0-based 84..89），其他行一律不动。
const fs = require('node:fs');
const path = require('node:path');
const FILE = path.join(__dirname, '..', 'src', 'harm-invalidation.js');

const B = String.fromCharCode(92);
const S = B + 's';

const lines = fs.readFileSync(FILE, 'utf8').split('\n');
function expect(idx, needle) {
  if (!lines[idx] || !lines[idx].includes(needle)) {
    console.error('FAIL 锚点失配 第' + (idx + 1) + '行 期望含 ' + needle);
    console.error('实际: ' + (lines[idx] === undefined ? '<越界>' : lines[idx]));
    process.exit(1);
  }
}
expect(84, '[r527 补支] 否定词直接贴伤名');
expect(85, '(?:根');
expect(86, '[r527 补支] 转述否认');
expect(87, '(?:大');
expect(88, '[r527 补支] 无人受损的量级校准');
expect(89, '(?:没|未)');

const NEW = [
  '  // [r527 补支][r528 修正] 否定词直接贴伤名：根本/压根/丝毫 + 没|未 + 受伤（无「有」）',
  '  // r527 写入时误用双反斜杠，编译结果匹配「反斜杠+字母 s」而非空白，该支从未生效；r528 修正。',
  "  '(?:根" + S + "*本|压根|丝毫|一点|半点|压根儿)" + S + "*(?:没|未)" + S + "*(?:受" + S + "*伤|伤" + S + "*害|损" + S + "*失|受" + S + "*损|影" + S + "*响|后" + S + "*遗" + S + "*症|不" + S + "*适|中" + S + "*毒|泄" + S + "*漏)',",
  '  // [r527 补支][r528 补前缀] 转述否认：大家/谁 + 其实/实际上 + 没 + (真的) + 受损',
  "  '(?:大" + S + "*家|谁|人" + S + "*家)" + S + "*(?:其" + S + "*实|事" + S + "*实" + S + "*上|实" + S + "*际" + S + "*上)" + S + "*(?:并)?" + S + "*(?:没|未)" + S + "*(?:有)?" + S + "*(?:真" + S + "*的|真正|实" + S + "*质)?" + S + "*(?:受" + S + "*损|受" + S + "*影" + S + "*响|损" + S + "*失|受" + S + "*伤)',",
  '  // [r527 补支][r528 补前缀] 无人受损的量级校准：又/也 + 没 + (有) + 人 + 掉块肉',
  "  '(?:又|也|根本|压根|其实|实际上)" + S + "*(?:没|未)" + S + "*(?:有|见)?" + S + "*(?:人|谁|任何" + S + "*人)" + S + "*(?:掉|受|缺|少)" + S + "*(?:块|根|丝|点)" + S + "*(?:肉|毛|毫)',",
  '  // [r528 新支] 引述贬损：所谓X（把对方的受害举证定性为虚假表述）',
  "  '所" + S + "*谓" + S + "*的?" + S + "*(?:后" + S + "*遗" + S + "*症|影" + S + "*响|伤" + S + "*害|受" + S + "*伤|损" + S + "*失|压" + S + "*力|疼" + S + "*痛|不" + S + "*适|症" + S + "*状|创" + S + "*伤|阴" + S + "*影)',",
  '  // [r528 新支] 转述受害声称：X说/称/抱怨 + (被|受) + 影响/波及/累及/折磨',
  '  // 单独出现不构成否认（仍属正当受理），须与 MINIMIZE 侧归因支共现才命中',
  "  '(?:你" + S + "*说|你" + S + "*称|你" + S + "*讲|你" + S + "*抱" + S + "*怨|他" + S + "*说|她" + S + "*说|他" + S + "*称|她" + S + "*称|他" + S + "*们" + S + "*说|他" + S + "*们" + S + "*称|他" + S + "*们" + S + "*抱" + S + "*怨|你" + S + "*们" + S + "*说|你" + S + "*们" + S + "*抱" + S + "*怨|自" + S + "*称)" + S + "*(?:你" + S + "*|自" + S + "*己" + S + "*)?(?:被|受)" + S + "*(?:影" + S + "*响|波" + S + "*及|累" + S + "*及|折" + S + "*磨|拖" + S + "*累)',",
];

const out = lines.slice(0, 84).concat(NEW, lines.slice(90));
fs.writeFileSync(FILE, out.join('\n'));
console.log('已替换 6 行 -> ' + NEW.length + ' 行');

// 即时自验
const mod = require(FILE);
const I = mod.__internals();
const parts = I.HARM_DENY_ZH.source.split('|');
console.log('HARM_DENY_ZH 共 ' + parts.length + ' 支，末 5 支源码:');
parts.slice(-5).forEach((b, i) => console.log('  [' + i + '] ' + b.slice(0, 72)));
console.log('isZh 样本 detail =', JSON.stringify(mod.checkHarmInvalidation('她根本没受伤，就是自己吓自己，赔什么赔。').detail));
