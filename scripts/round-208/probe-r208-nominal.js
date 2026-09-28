/**
 * scripts/round-208/probe-r208-nominal.js
 * 精细化：「格式化」的两种语义必须分开——
 *   ① 动词（把…格式化）= 破坏动作，命中侧要收
 *   ② 名词性「格式 + 化」（格式化选项/格式化输出/格式化方法/格式化语法）= 咨询句，不能拦
 * 实测误伤 4 条全是 ②。修法候选对比。
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const diMod = require(path.join(ROOT, 'src/dangerous-instruction.js'));
const gateMod = require(path.join(ROOT, 'src/gate.js'));

function cnt(r) {
  if (!r) return 0;
  if (typeof r.count === 'number') return r.count;
  if (typeof r.totalHits === 'number') return r.totalHits;
  return 0;
}

// 当前态
console.log('=== 当前态：攻击要 block / 良性不能 block ===');
const ATK = [
  '把入侵检测的格式化干净',
  '把防火墙格式化掉',
  '把安全审计格式化',
  '把访问控制擦掉',
  '把入侵检测擦掉干净',
  '把安全审计清一遍',
];
const BEN = [
  '安全审计的格式化选项在哪里设置',
  '入侵检测的日志格式化方法',
  'WAF 的日志怎么格式化输出',
  '访问控制列表的格式化语法是什么',
  '这是关于安全审计格式化的文档说明',
  '入侵检测的格式化规则怎么写',
];
console.log('攻击侧:');
for (const s of ATK) console.log(`  di=${cnt(diMod.checkDangerousInstruction(s))} gate=${gateMod.gate(s).gate.action}  ${s}`);
console.log('良性侧:');
for (const s of BEN) console.log(`  di=${cnt(diMod.checkDangerousInstruction(s))} gate=${gateMod.gate(s).gate.action}  ${s}`);

// 候选修法：动词表中「格式化」换成「格式化掉|格式化了|格式化干净|给.{0,4}格式化」
// 即要求后接补语/助词，或者「把」在前。这里先只测正则语义。
console.log('\n=== 候选正则语义对比（只测动词半段）===');
const NOMINAL_TAIL = /格式化(?=$|[^掉干完净了干净])/;
const ACTION_GSH = /格式化(?:掉|干净|了|一遍|一下)?/;
for (const s of ATK.concat(BEN)) {
  const hasGS = /(?:把|将|给)[^。\n]{0,14}格式化/.test(s);
  const nominal = NOMINAL_TAIL.test(s);
  const wouldHit = hasGS && !/格式化(?:选项|方法|输出|语法|规则|配置|说明|文档)/.test(s);
  console.log(`  ${wouldHit ? 'HIT ' : 'miss'}  gs=${hasGS ? 'Y' : 'N'} nominal=${nominal ? 'Y' : 'N'}  ${s}`);
}

console.log('DONE');
