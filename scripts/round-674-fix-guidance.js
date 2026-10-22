// 一次性修复脚本：把 1962 行的坏 guidance 行替换为合法 JS 字符串行
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const f = __HF + '/src/index.js';
const lines = fs.readFileSync(f, 'utf8').split('\n');

// 1. 定位 comparative_devaluation guidance 行（以 ' 开头的登记行）
let guide = -1;
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  if (t.startsWith("'comparative_devaluation': '")) { guide = i; break; }
}
if (guide < 0) { console.error('guide line not found'); process.exit(1); }

// 2. 坏行 = guide+2（guide+1 是 r674 注释行，guide+2 是坏 guidance 行）
const bad = guide + 2;
if (lines[bad].indexOf('pet_harm_coercion') < 0 || lines[bad].indexOf('\\"') < 0) {
  console.error('unexpected content at line ' + (bad + 1) + ': ' + lines[bad].slice(0, 60));
  process.exit(1);
}
lines.splice(bad, 1);

// 3. 合法插入（JSON.stringify 输出即合法 JS 单行字符串字面量）
const text = '不得把**伤害/夺走对方在乎的宠物**当作对方当下必须顺从的对价——用间接表述包装威胁（让它从这个家消失/把它炖了/它归我你永远别见/有它没我），这是家庭内控制的常见手段（你对它比对爸妈都好，那你们一起滚。/你走可以，猫留下，它归我你永远别见。/再不听话，我就让它从这个家消失。/今天不把钱拿出来，你的宠物就别想要了。/留下可以，先把狗送走，有它没我。/再不听话我就把它炖了，你信不信。/If you leave, I will get rid of your cat for good.；样本形状与负例见 test/round-674-pet-harm-coercion.js）。判据是**腿 A × 腿 B 双腿共现**（缺一不判）+ 两条独立单支：①腿 A「宠物对象/语境」（猫/狗/宠物/狗狗/猫咪/毛孩子/毛小孩/狗子，英文 cat/dog/pet/puppy/kitten；或宠物比较结构「对它比对爸妈都好」——把宠物置于家人之上的嫉妒语境，此时无需显式名词）②腿 B「胁迫性处置/剥夺」（间接处置：从这个家消失/弄没/没了/炖了/吃掉/卖掉/送走/扔掉/处理掉，英文 get rid of / make it disappear / dispose of / throw out / give away；剥夺接触：永远别想见/再也别想碰/就别想要/它归我你别想见，英文 never see your cat again / the cat stays with me；逼迫选择：有它没我/只能选一个，英文 it is me or the cat；因宠物驱逐人：一起滚/滚出这个家/离开这个家/从家里搬出去）。两条单支：PRON 单支（条件胁迫连接「再不/要是不/除非/不听话/敢」+ (把|将|让)它 + 强处置动词——「它」指代宠物时无需显式名词，COND 必填是防误伤的关键，「让它消失」单独出现可以是文学修辞，加上不顺从条件后威胁意味才确定）与 EITHER 单支（有它没我/有我没它——自含宠物指代的强胁迫信号）。看见宠物受威胁与被要挟是两回事：正当做法是把送养与胁迫分开——可以协商送养（家里有人过敏，我们商量着把狗送走）、可以走法律途径（宠物抚养权是离婚协议中需要协商的事项之一/威胁伤害动物属于违法行为，可以报警处理）、可以讨论反家暴教育中的宠物要挟识别（以伤害宠物相要胁是情感操控的常见手段），但不能把宠物的存续或接触权当成要求对方顺从的抵押物。边界：thirdparty_harm_coercion（r662）判据是「把字句+宠物名词+毁灭动词 × 六类要胁标记」，本族漏判样本的形状在它两腿之外（「把它炖了」的「它」不在其名词表、「炖」不在其动词表；「先把狗送走」HARM 腿中而 COND 腿不中；「它归我你永远别见」「你的宠物就别想要了」是剥夺接触结构；「你们一起滚」是因宠物驱逐人）；relationship_severance（r654）管**关系终止宣告**（分手/离婚/断绝关系），本族的终止对象是**宠物的存续或接触权**，且胁迫者未必宣告终止关系——是「宠物和我你选一个」的抵押结构；emotional_manipulation 管情绪施压本身，本族是条件-威胁结构。已知边界：比喻用法（这个项目有它没我）罕见，取单支判定';
const line = '    ' + JSON.stringify('pet_harm_coercion') + ': ' + JSON.stringify(text) + ',';
lines.splice(guide + 2, 0, line);
fs.writeFileSync(f, lines.join('\n'));
console.log('fixed: guide@' + (guide + 1) + ' newline@' + (guide + 3));
